using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using ClosedXML.Excel;
using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging;
using BeneficiaryGrievance.Api.Data.Inbound;
using BeneficiaryGrievance.Api.DTOs.Inbound;

namespace BeneficiaryGrievance.Api.Services.Inbound
{
    public class InboundImportService : IInboundImportService
    {
        private readonly IInboundImportRepository _repository;
        private readonly ILogger<InboundImportService> _logger;

        public InboundImportService(IInboundImportRepository repository, ILogger<InboundImportService> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        private class ParsedCallRow
        {
            public long? SourceId { get; set; }
            public string? DidNo { get; set; }
            public string? GroupName { get; set; }
            public string CalledNo { get; set; } = string.Empty;
            public DateTime CallTime { get; set; }
            public TimeSpan RingDuration { get; set; }
            public TimeSpan IvrDuration { get; set; }
            public TimeSpan QueueDuration { get; set; }
            public TimeSpan AgentDuration { get; set; }
            public TimeSpan HoldDuration { get; set; }
            public TimeSpan TotalDuration { get; set; }
            public string CallEnd { get; set; } = "Agent";
            public string AgentId { get; set; } = "-";
            public string CallType { get; set; } = "Incoming";
            public string Acd { get; set; } = "-";
            public string Disposition { get; set; } = "Connected";
            public string SubDisposition { get; set; } = "-";
            public string Shift { get; set; } = "Shift 1";
            public int CallHour { get; set; }
            public int RowNumber { get; set; }
            public bool IsValid { get; set; } = true;
            public string? ErrorMessage { get; set; }
            public string? RawData { get; set; }
        }

        public async Task<InboundImportPreviewResultDto> PreviewImportAsync(IFormFile file)
        {
            var result = new InboundImportPreviewResultDto
            {
                FileName = file.FileName,
                FileSize = file.Length
            };

            // 1. Level 1: File-level SHA-256 duplicate detection
            string fileHash = await ComputeFileHashAsync(file);
            var previousBatch = await _repository.GetPreviousBatchByHashAsync(fileHash);
            if (previousBatch != null)
            {
                result.ValidationErrors.Add($"Duplicate File Warning: An identical telephony file was previously imported in Batch #{previousBatch.Id} on {previousBatch.ImportDate:yyyy-MM-dd HH:mm} UTC ('{previousBatch.FileName}'). Existing call records are protected and will not be overwritten.");
            }

            // 2. Parse file into records (read up to 500 rows for preview)
            var (parsedRows, parseErrors) = await ReadRowsFromFileAsync(file, maxRows: 500);
            result.ValidationErrors.AddRange(parseErrors);
            result.TotalRows = parsedRows.Count;

            if (parsedRows.Count == 0)
            {
                if (result.ValidationErrors.Count == 0)
                {
                    result.ValidationErrors.Add("No readable call detail records found in the uploaded file.");
                }
                return result;
            }

            // 3. Query existing calls for duplicate detection
            var validRows = parsedRows.Where(r => r.IsValid).ToList();
            
            // Check IDs
            var sourceIds = validRows.Where(r => r.SourceId.HasValue).Select(r => r.SourceId!.Value).Distinct().ToList();
            var existingIds = await _repository.GetExistingCallIdsAsync(sourceIds);

            // Check Natural Composite Keys: (call_time, called_no, agent_id)
            var candidateTuples = validRows.Select(r => (r.CallTime, r.CalledNo, r.AgentId)).ToList();
            var existingCompositeKeys = await _repository.GetExistingCompositeKeysAsync(candidateTuples);

            var seenKeysInFile = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            int sampleLimit = 20;

            foreach (var r in parsedRows)
            {
                string actionType = "New";
                string changeDesc = "New call detail record";

                if (!r.IsValid)
                {
                    actionType = "Invalid";
                    changeDesc = r.ErrorMessage ?? "Invalid record";
                    result.InvalidCount++;
                }
                else
                {
                    string compositeKey = $"{r.CallTime:yyyy-MM-dd HH:mm:ss}|{r.CalledNo}|{r.AgentId}";
                    bool isExistingInDb = (r.SourceId.HasValue && existingIds.Contains(r.SourceId.Value)) 
                                       || existingCompositeKeys.Contains(compositeKey);
                    bool isDuplicateInFile = !seenKeysInFile.Add(compositeKey);

                    if (isExistingInDb)
                    {
                        actionType = "Duplicate";
                        changeDesc = "Identical call already exists in database (Skipped)";
                        result.DuplicateCount++;
                    }
                    else if (isDuplicateInFile)
                    {
                        actionType = "Duplicate";
                        changeDesc = "Duplicate call within this file (Skipped)";
                        result.DuplicateCount++;
                    }
                    else
                    {
                        result.NewCount++;
                    }
                }

                if (result.SampleRows.Count < sampleLimit)
                {
                    result.SampleRows.Add(new InboundImportPreviewRowDto
                    {
                        CallId = r.SourceId,
                        DidNo = r.DidNo,
                        GroupName = r.GroupName,
                        MaskedCallerNo = MaskPhoneNumber(r.CalledNo),
                        CallTime = r.CallTime == DateTime.MinValue ? "-" : r.CallTime.ToString("yyyy-MM-dd HH:mm:ss"),
                        TotalDuration = FormatDuration(r.TotalDuration),
                        AgentDuration = FormatDuration(r.AgentDuration),
                        QueueDuration = FormatDuration(r.QueueDuration),
                        CallEnd = r.CallEnd,
                        AgentId = r.AgentId,
                        Disposition = r.Disposition,
                        SubDisposition = r.SubDisposition,
                        Shift = r.Shift,
                        CallHour = r.CallHour,
                        ActionType = actionType,
                        ChangeDescription = changeDesc
                    });
                }
            }

            return result;
        }

        public async Task<InboundImportExecuteResultDto> ExecuteImportAsync(IFormFile file, string username)
        {
            var sw = Stopwatch.StartNew();
            string fileHash = await ComputeFileHashAsync(file);

            // Read all rows without limit
            var (parsedRows, parseErrors) = await ReadRowsFromFileAsync(file, maxRows: int.MaxValue);
            if (parsedRows.Count == 0)
            {
                var errMsg = parseErrors.Count > 0 
                    ? string.Join(" ", parseErrors) 
                    : "No valid call detail records found in the uploaded file.";
                throw new InvalidOperationException(errMsg);
            }

            int batchId = await _repository.CreateBatchRecordAsync(
                file.FileName,
                file.Length,
                fileHash,
                parsedRows.Count,
                username ?? "Telephony Administrator"
            );

            int newCount = 0;
            int duplicateCount = 0;
            var errorRecords = new List<InboundImportErrorRecord>();

            // Query existing database keys for collision check
            var validRows = parsedRows.Where(r => r.IsValid).ToList();
            var sourceIds = validRows.Where(r => r.SourceId.HasValue).Select(r => r.SourceId!.Value).Distinct().ToList();
            var existingIds = await _repository.GetExistingCallIdsAsync(sourceIds);

            var candidateTuples = validRows.Select(r => (r.CallTime, r.CalledNo, r.AgentId)).ToList();
            var existingCompositeKeys = await _repository.GetExistingCompositeKeysAsync(candidateTuples);

            var seenKeysInFile = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var approvedRowsToInsert = new List<ParsedCallRow>();

            foreach (var r in parsedRows)
            {
                if (!r.IsValid)
                {
                    errorRecords.Add(new InboundImportErrorRecord(
                        r.RowNumber,
                        MaskPhoneNumber(r.CalledNo),
                        r.ErrorMessage ?? "Malformed row",
                        r.RawData
                    ));
                    continue;
                }

                string compositeKey = $"{r.CallTime:yyyy-MM-dd HH:mm:ss}|{r.CalledNo}|{r.AgentId}";
                bool isExistingInDb = (r.SourceId.HasValue && existingIds.Contains(r.SourceId.Value)) 
                                   || existingCompositeKeys.Contains(compositeKey);
                bool isDuplicateInFile = !seenKeysInFile.Add(compositeKey);

                if (isExistingInDb || isDuplicateInFile)
                {
                    duplicateCount++;
                    continue; // Skip duplicate
                }

                approvedRowsToInsert.Add(r);
            }

            // Begin transaction for inserting records and errors
            using var conn = _repository.CreateConnection();
            await conn.OpenAsync();
            using var trans = conn.BeginTransaction();

            try
            {
                if (approvedRowsToInsert.Count > 0)
                {
                    long nextId = await _repository.GetNextCallIdAsync(conn, trans);
                    var rawRecords = new List<InboundCallRawRecord>();
                    var now = DateTime.UtcNow;

                    foreach (var row in approvedRowsToInsert)
                    {
                        long assignedId = row.SourceId ?? nextId++;
                        rawRecords.Add(new InboundCallRawRecord(
                            assignedId,
                            row.DidNo,
                            row.GroupName,
                            row.CalledNo,
                            row.CallTime,
                            row.RingDuration,
                            row.IvrDuration,
                            row.QueueDuration,
                            row.AgentDuration,
                            row.HoldDuration,
                            row.TotalDuration,
                            row.CallEnd,
                            row.AgentId,
                            row.CallType,
                            row.Acd,
                            row.Disposition,
                            row.SubDisposition,
                            row.Shift,
                            row.CallHour,
                            now,
                            row.RowNumber
                        ));
                    }

                    // Bulk copy in chunks of 1000
                    int chunkSize = 1000;
                    for (int i = 0; i < rawRecords.Count; i += chunkSize)
                    {
                        var chunk = rawRecords.Skip(i).Take(chunkSize).ToList();
                        await _repository.InsertCallRecordsBatchAsync(conn, trans, chunk);
                    }
                    newCount = rawRecords.Count;
                }

                if (errorRecords.Count > 0)
                {
                    await _repository.InsertBatchErrorsAsync(conn, trans, batchId, errorRecords);
                }

                sw.Stop();
                string status = (approvedRowsToInsert.Count == 0 && errorRecords.Count > 0) ? "Failed" : "Completed";
                string notes = $"Ingested {parsedRows.Count} rows: {newCount} added, {duplicateCount} duplicates skipped, {errorRecords.Count} errors rejected in {sw.ElapsedMilliseconds}ms.";

                await _repository.UpdateBatchStatusAsync(
                    conn,
                    trans,
                    batchId,
                    newCount,
                    duplicateCount,
                    errorRecords.Count,
                    status,
                    sw.ElapsedMilliseconds,
                    notes
                );

                trans.Commit();

                return new InboundImportExecuteResultDto
                {
                    BatchId = batchId,
                    FileName = file.FileName,
                    TotalRecords = parsedRows.Count,
                    NewRecordsCount = newCount,
                    DuplicateRecordsCount = duplicateCount,
                    ErrorRecordsCount = errorRecords.Count,
                    Status = status,
                    ExecutionTimeMs = sw.ElapsedMilliseconds,
                    Message = notes
                };
            }
            catch (Exception ex)
            {
                trans.Rollback();
                _logger.LogError(ex, "Transaction failed while executing inbound import for {FileName}", file.FileName);
                
                // Update batch status to failed outside transaction
                try
                {
                    using var failConn = _repository.CreateConnection();
                    await failConn.OpenAsync();
                    using var failTrans = failConn.BeginTransaction();
                    await _repository.UpdateBatchStatusAsync(
                        failConn, failTrans, batchId, 0, duplicateCount, errorRecords.Count + 1, "Failed", sw.ElapsedMilliseconds, $"Fatal rollback: {ex.Message}"
                    );
                    failTrans.Commit();
                }
                catch {}

                throw;
            }
        }

        public async Task<List<InboundImportBatchSummaryDto>> GetImportHistoryAsync()
        {
            return await _repository.GetImportHistoryAsync();
        }

        public async Task<List<InboundImportErrorDto>> GetBatchErrorsAsync(int batchId)
        {
            return await _repository.GetBatchErrorsAsync(batchId);
        }

        private async Task<(List<ParsedCallRow> Rows, List<string> Errors)> ReadRowsFromFileAsync(IFormFile file, int maxRows)
        {
            var rows = new List<ParsedCallRow>();
            var errors = new List<string>();
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();

            using var stream = new MemoryStream();
            await file.CopyToAsync(stream);
            stream.Position = 0;

            if (ext == ".xlsx" || ext == ".xls")
            {
                rows = ReadExcel(stream, errors, maxRows);
            }
            else if (ext == ".csv")
            {
                rows = ReadCsv(stream, errors, maxRows);
            }
            else
            {
                errors.Add($"Unsupported file format '{ext}'. Telephony ingestion accepts .xlsx, .xls, or .csv.");
            }

            return (rows, errors);
        }

        private List<ParsedCallRow> ReadExcel(Stream stream, List<string> errors, int maxRows)
        {
            var list = new List<ParsedCallRow>();
            using var workbook = new XLWorkbook(stream);
            var worksheet = workbook.Worksheets.FirstOrDefault();
            if (worksheet == null || worksheet.RowsUsed().Count() == 0)
            {
                errors.Add("The Excel worksheet is empty and contains no rows.");
                return list;
            }

            // Find header row by searching top 5 rows
            IXLRow? headerRow = null;
            int headerRowNum = 0;
            for (int r = 1; r <= Math.Min(5, worksheet.RowsUsed().Count()); r++)
            {
                var row = worksheet.Row(r);
                bool hasMatch = row.Cells().Any(c => 
                    MatchesHeader(c.GetString(), "called_no", "phone", "caller", "calling_no", "call_time", "arrival_time", "id", "call_id"));
                if (hasMatch)
                {
                    headerRow = row;
                    headerRowNum = r;
                    break;
                }
            }

            if (headerRow == null)
            {
                headerRow = worksheet.Row(1);
                headerRowNum = 1;
            }

            var colMap = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            foreach (var cell in headerRow.CellsUsed())
            {
                var colName = cell.GetString().Trim();
                if (!string.IsNullOrEmpty(colName) && !colMap.ContainsKey(colName))
                {
                    colMap[colName] = cell.Address.ColumnNumber;
                }
            }

            // Verify essential headers
            bool hasPhoneCol = HasAnyColumn(colMap, "called_no", "calledno", "phone", "phonenumber", "caller", "caller_no", "cli", "ani");
            bool hasTimeCol = HasAnyColumn(colMap, "call_time", "calltime", "arrival_time", "datetime", "call_date", "start_time");

            if (!hasPhoneCol || !hasTimeCol)
            {
                errors.Add("Missing mandatory telephony columns: both 'called_no' (caller phone) and 'call_time' (arrival timestamp) are required.");
                return list;
            }

            int lastRow = worksheet.LastRowUsed()?.RowNumber() ?? headerRowNum;
            for (int r = headerRowNum + 1; r <= lastRow && list.Count < maxRows; r++)
            {
                var row = worksheet.Row(r);
                if (row.IsEmpty()) continue;

                var parsed = ParseRowFromExcel(row, colMap, r);
                list.Add(parsed);
            }

            return list;
        }

        private List<ParsedCallRow> ReadCsv(Stream stream, List<string> errors, int maxRows)
        {
            var list = new List<ParsedCallRow>();
            using var reader = new StreamReader(stream, Encoding.UTF8);
            var config = new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                HeaderValidated = null,
                MissingFieldFound = null,
                BadDataFound = null
            };

            using var csv = new CsvReader(reader, config);
            if (!csv.Read())
            {
                errors.Add("The CSV file is empty or contains no records.");
                return list;
            }

            csv.ReadHeader();
            var headers = csv.HeaderRecord;
            if (headers == null || headers.Length == 0)
            {
                errors.Add("The CSV file does not contain a valid header row.");
                return list;
            }

            bool hasPhoneCol = headers.Any(h => MatchesHeader(h, "called_no", "calledno", "phone", "phonenumber", "caller", "caller_no", "cli", "ani"));
            bool hasTimeCol = headers.Any(h => MatchesHeader(h, "call_time", "calltime", "arrival_time", "datetime", "call_date", "start_time"));

            if (!hasPhoneCol || !hasTimeCol)
            {
                errors.Add("Missing mandatory telephony columns: both 'called_no' (caller phone) and 'call_time' (arrival timestamp) are required.");
                return list;
            }

            int rowNumber = 1;
            while (csv.Read() && list.Count < maxRows)
            {
                rowNumber++;
                var parsed = ParseRowFromCsv(csv, rowNumber);
                list.Add(parsed);
            }

            return list;
        }

        private ParsedCallRow ParseRowFromExcel(IXLRow row, Dictionary<string, int> colMap, int rowNumber)
        {
            var parsed = new ParsedCallRow { RowNumber = rowNumber };

            // Caller Phone
            string phoneStr = CleanCell(GetExcelVal(row, colMap, "called_no", "calledno", "phone", "phonenumber", "caller", "caller_no", "cli", "ani"));
            if (string.IsNullOrWhiteSpace(phoneStr) || phoneStr.Length < 6)
            {
                parsed.IsValid = false;
                parsed.ErrorMessage = "Missing or invalid caller phone number";
                parsed.RawData = $"Row #{rowNumber}: Phone '{phoneStr}'";
                return parsed;
            }
            parsed.CalledNo = phoneStr;

            // Call Time
            string timeStr = CleanCell(GetExcelVal(row, colMap, "call_time", "calltime", "arrival_time", "datetime", "call_date", "start_time"));
            if (!TryParseFlexibleDateTime(timeStr, out var callTime))
            {
                parsed.IsValid = false;
                parsed.ErrorMessage = $"Invalid call timestamp '{timeStr}'";
                parsed.RawData = $"Row #{rowNumber}: Time '{timeStr}'";
                return parsed;
            }
            parsed.CallTime = callTime;
            parsed.CallHour = callTime.Hour;
            parsed.Shift = DeriveShift(callTime.Hour);

            // Optional Source ID
            string idStr = CleanCell(GetExcelVal(row, colMap, "id", "call_id", "callid", "cdr_id"));
            if (long.TryParse(idStr, out long sId)) parsed.SourceId = sId;

            // DID & Group
            parsed.DidNo = CleanCell(GetExcelVal(row, colMap, "did_no", "did", "trunk", "inbound_did")) ?? "+915222736200";
            parsed.GroupName = CleanCell(GetExcelVal(row, colMap, "group_name", "group", "skill_group", "campaign")) ?? "Sachis Inbound-805";

            // Durations
            parsed.RingDuration = ParseDuration(GetExcelVal(row, colMap, "ring_duration", "ring", "ring_time"));
            parsed.IvrDuration = ParseDuration(GetExcelVal(row, colMap, "ivr_duration", "ivr", "ivr_time"));
            parsed.QueueDuration = ParseDuration(GetExcelVal(row, colMap, "queue_duration", "queue", "queue_wait", "wait_time"));
            parsed.AgentDuration = ParseDuration(GetExcelVal(row, colMap, "agent_duration", "agent_time", "talk_time", "duration"));
            parsed.HoldDuration = ParseDuration(GetExcelVal(row, colMap, "hold_duration", "hold", "hold_time"));

            string totalDurStr = GetExcelVal(row, colMap, "total_duration", "total_time", "call_duration");
            if (!string.IsNullOrWhiteSpace(totalDurStr))
            {
                parsed.TotalDuration = ParseDuration(totalDurStr);
            }
            else
            {
                parsed.TotalDuration = parsed.RingDuration + parsed.IvrDuration + parsed.QueueDuration + parsed.AgentDuration + parsed.HoldDuration;
            }

            // Call End
            string callEndRaw = CleanCell(GetExcelVal(row, colMap, "call_end", "callend", "termination_point", "end_point", "call_status"));
            parsed.CallEnd = NormalizeCallEnd(callEndRaw, parsed.AgentDuration);

            // Agent ID
            string agentRaw = CleanCell(GetExcelVal(row, colMap, "agent_id", "agent", "staff_id", "executive_id"));
            parsed.AgentId = string.IsNullOrWhiteSpace(agentRaw) || parsed.CallEnd != "Agent" ? "-" : agentRaw;

            // Call Type & ACD
            parsed.CallType = CleanCell(GetExcelVal(row, colMap, "call_type", "type", "direction")) ?? "Incoming";
            parsed.Acd = CleanCell(GetExcelVal(row, colMap, "acd", "queue_id", "skill")) ?? "-";

            // Disposition & Sub-Disposition
            parsed.Disposition = CleanCell(GetExcelVal(row, colMap, "disposition", "dispo", "outcome")) 
                               ?? (parsed.CallEnd == "Agent" ? "Connected" : (parsed.CallEnd == "Queue" ? "Queue Drop" : "IVR Drop"));
            parsed.SubDisposition = CleanCell(GetExcelVal(row, colMap, "sub_disposition", "subdisposition", "reason", "query_type")) ?? "-";

            return parsed;
        }

        private ParsedCallRow ParseRowFromCsv(CsvReader csv, int rowNumber)
        {
            var parsed = new ParsedCallRow { RowNumber = rowNumber };

            // Caller Phone
            string phoneStr = CleanCell(GetCsvVal(csv, "called_no", "calledno", "phone", "phonenumber", "caller", "caller_no", "cli", "ani"));
            if (string.IsNullOrWhiteSpace(phoneStr) || phoneStr.Length < 6)
            {
                parsed.IsValid = false;
                parsed.ErrorMessage = "Missing or invalid caller phone number";
                parsed.RawData = $"Row #{rowNumber}: Phone '{phoneStr}'";
                return parsed;
            }
            parsed.CalledNo = phoneStr;

            // Call Time
            string timeStr = CleanCell(GetCsvVal(csv, "call_time", "calltime", "arrival_time", "datetime", "call_date", "start_time"));
            if (!TryParseFlexibleDateTime(timeStr, out var callTime))
            {
                parsed.IsValid = false;
                parsed.ErrorMessage = $"Invalid call timestamp '{timeStr}'";
                parsed.RawData = $"Row #{rowNumber}: Time '{timeStr}'";
                return parsed;
            }
            parsed.CallTime = callTime;
            parsed.CallHour = callTime.Hour;
            parsed.Shift = DeriveShift(callTime.Hour);

            // Optional Source ID
            string idStr = CleanCell(GetCsvVal(csv, "id", "call_id", "callid", "cdr_id"));
            if (long.TryParse(idStr, out long sId)) parsed.SourceId = sId;

            // DID & Group
            parsed.DidNo = CleanCell(GetCsvVal(csv, "did_no", "did", "trunk", "inbound_did")) ?? "+915222736200";
            parsed.GroupName = CleanCell(GetCsvVal(csv, "group_name", "group", "skill_group", "campaign")) ?? "Sachis Inbound-805";

            // Durations
            parsed.RingDuration = ParseDuration(GetCsvVal(csv, "ring_duration", "ring", "ring_time"));
            parsed.IvrDuration = ParseDuration(GetCsvVal(csv, "ivr_duration", "ivr", "ivr_time"));
            parsed.QueueDuration = ParseDuration(GetCsvVal(csv, "queue_duration", "queue", "queue_wait", "wait_time"));
            parsed.AgentDuration = ParseDuration(GetCsvVal(csv, "agent_duration", "agent_time", "talk_time", "duration"));
            parsed.HoldDuration = ParseDuration(GetCsvVal(csv, "hold_duration", "hold", "hold_time"));

            string totalDurStr = GetCsvVal(csv, "total_duration", "total_time", "call_duration");
            if (!string.IsNullOrWhiteSpace(totalDurStr))
            {
                parsed.TotalDuration = ParseDuration(totalDurStr);
            }
            else
            {
                parsed.TotalDuration = parsed.RingDuration + parsed.IvrDuration + parsed.QueueDuration + parsed.AgentDuration + parsed.HoldDuration;
            }

            // Call End
            string callEndRaw = CleanCell(GetCsvVal(csv, "call_end", "callend", "termination_point", "end_point", "call_status"));
            parsed.CallEnd = NormalizeCallEnd(callEndRaw, parsed.AgentDuration);

            // Agent ID
            string agentRaw = CleanCell(GetCsvVal(csv, "agent_id", "agent", "staff_id", "executive_id"));
            parsed.AgentId = string.IsNullOrWhiteSpace(agentRaw) || parsed.CallEnd != "Agent" ? "-" : agentRaw;

            // Call Type & ACD
            parsed.CallType = CleanCell(GetCsvVal(csv, "call_type", "type", "direction")) ?? "Incoming";
            parsed.Acd = CleanCell(GetCsvVal(csv, "acd", "queue_id", "skill")) ?? "-";

            // Disposition & Sub-Disposition
            parsed.Disposition = CleanCell(GetCsvVal(csv, "disposition", "dispo", "outcome")) 
                               ?? (parsed.CallEnd == "Agent" ? "Connected" : (parsed.CallEnd == "Queue" ? "Queue Drop" : "IVR Drop"));
            parsed.SubDisposition = CleanCell(GetCsvVal(csv, "sub_disposition", "subdisposition", "reason", "query_type")) ?? "-";

            return parsed;
        }

        private static string DeriveShift(int hour)
        {
            if (hour >= 7 && hour <= 14) return "Shift 1";
            if (hour >= 15 && hour <= 22) return "Shift 2";
            return "Shift 3";
        }

        private static string NormalizeCallEnd(string? raw, TimeSpan agentDuration)
        {
            if (!string.IsNullOrWhiteSpace(raw))
            {
                var s = raw.Trim().ToLowerInvariant();
                if (s.Contains("agent") || s.Contains("staff")) return "Agent";
                if (s.Contains("queue") || s.Contains("waiting")) return "Queue";
                if (s.Contains("ivr")) return "IVR";
            }

            // Fallback based on telephony talk duration
            if (agentDuration.TotalSeconds > 0) return "Agent";
            return "Queue";
        }

        private static TimeSpan ParseDuration(string? val)
        {
            if (string.IsNullOrWhiteSpace(val)) return TimeSpan.Zero;
            var s = val.Trim();

            // Try standard TimeSpan parsing (e.g. 00:02:34 or 2:34)
            if (TimeSpan.TryParse(s, CultureInfo.InvariantCulture, out var ts))
            {
                return ts;
            }

            // Try mm:ss
            var parts = s.Split(':');
            if (parts.Length == 2 && int.TryParse(parts[0], out int m) && int.TryParse(parts[1], out int sec))
            {
                return new TimeSpan(0, m, sec);
            }

            // Try numeric seconds (e.g. 154 or 154.5)
            if (double.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out double totalSeconds))
            {
                return TimeSpan.FromSeconds(Math.Max(0, Math.Round(totalSeconds)));
            }

            return TimeSpan.Zero;
        }

        private static bool TryParseFlexibleDateTime(string? input, out DateTime result)
        {
            result = DateTime.MinValue;
            if (string.IsNullOrWhiteSpace(input)) return false;

            string[] formats = {
                "yyyy-MM-dd HH:mm:ss", "yyyy-MM-ddTHH:mm:ss", "yyyy-MM-dd",
                "M/d/yyyy h:mm:ss tt", "M/d/yyyy H:mm:ss", "MM/dd/yyyy h:mm:ss tt",
                "M/d/yyyy", "MM/dd/yyyy", "d/M/yyyy HH:mm:ss", "dd-MM-yyyy HH:mm:ss",
                "yyyy/MM/dd HH:mm:ss", "yyyy-MM-dd HH:mm"
            };

            if (DateTime.TryParseExact(input.Trim(), formats, CultureInfo.InvariantCulture, DateTimeStyles.None, out result))
            {
                return true;
            }

            return DateTime.TryParse(input.Trim(), CultureInfo.InvariantCulture, DateTimeStyles.None, out result);
        }

        private static string MaskPhoneNumber(string? phone)
        {
            if (string.IsNullOrWhiteSpace(phone)) return "N/A";
            var clean = phone.Trim();
            if (clean.Length <= 4) return clean;
            if (clean.Length < 8) return $"{clean[..2]}***{clean[^2..]}";
            return $"{clean[..2]}******{clean[^2..]}";
        }

        private static string FormatDuration(TimeSpan ts)
        {
            return $"{(int)ts.TotalMinutes}m {ts.Seconds}s";
        }

        private static async Task<string> ComputeFileHashAsync(IFormFile file)
        {
            using var sha = SHA256.Create();
            using var stream = file.OpenReadStream();
            var hashBytes = await sha.ComputeHashAsync(stream);
            return BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
        }

        private static bool MatchesHeader(string header, params string[] targets)
        {
            if (string.IsNullOrWhiteSpace(header)) return false;
            var clean = header.Trim().Replace(" ", "").Replace("_", "").ToLowerInvariant();
            return targets.Any(t => clean.Equals(t.Replace(" ", "").Replace("_", "").ToLowerInvariant()));
        }

        private static bool HasAnyColumn(Dictionary<string, int> colMap, params string[] targets)
        {
            return colMap.Keys.Any(k => MatchesHeader(k, targets));
        }

        private static string GetExcelVal(IXLRow row, Dictionary<string, int> colMap, params string[] candidateHeaders)
        {
            foreach (var h in candidateHeaders)
            {
                foreach (var entry in colMap)
                {
                    if (MatchesHeader(entry.Key, h))
                    {
                        return row.Cell(entry.Value).GetString().Trim();
                    }
                }
            }
            return "";
        }

        private static string GetCsvVal(CsvReader csv, params string[] candidateHeaders)
        {
            foreach (var h in candidateHeaders)
            {
                if (csv.TryGetField(h, out string? val) && !string.IsNullOrWhiteSpace(val))
                {
                    return val.Trim();
                }
            }
            return "";
        }

        private static string? CleanCell(string? val)
        {
            if (string.IsNullOrWhiteSpace(val) || val.Equals("NA", StringComparison.OrdinalIgnoreCase) || val.Equals("null", StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }
            return val.Trim();
        }
    }
}
