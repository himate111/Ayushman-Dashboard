using System;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using BeneficiaryGrievance.Api.Data.Outbound;
using BeneficiaryGrievance.Api.DTOs.Outbound;

namespace BeneficiaryGrievance.Api.Services.Outbound
{
    public class OutboundImportService : IOutboundImportService
    {
        private readonly IOutboundImportRepository _repository;
        private readonly IOutboundDashboardService _dashboardService;
        private readonly string _connectionString;
        private readonly ILogger<OutboundImportService> _logger;

        private static readonly Dictionary<string, string> HeaderAliases = new(StringComparer.OrdinalIgnoreCase)
        {
            ["sr_no"] = "sr_no",
            ["sl_no"] = "sr_no",
            ["serial_no"] = "sr_no",
            ["serial_number"] = "sr_no",
            ["did_no"] = "did_no",
            ["did_number"] = "did_no",
            ["group_name"] = "group_name",
            ["called_no"] = "called_no",
            ["called_number"] = "called_no",
            ["call_time"] = "call_time",
            ["call_datetime"] = "call_time",
            ["call_start_time"] = "call_time",
            ["start_time"] = "call_time",
            ["ring_durn"] = "ring_durn",
            ["ring_duration"] = "ring_durn",
            ["ivr_dur"] = "ivr_dur",
            ["ivr_duration"] = "ivr_dur",
            ["queue_durn"] = "queue_durn",
            ["queue_duration"] = "queue_durn",
            ["agent_durn"] = "agent_durn",
            ["agent_duration"] = "agent_durn",
            ["hold_durn"] = "hold_durn",
            ["hold_duration"] = "hold_durn",
            ["total_durn"] = "total_durn",
            ["total_duration"] = "total_durn",
            ["durn"] = "total_durn",
            ["call_mode"] = "call_mode",
            ["c_m"] = "call_mode",
            ["agent_id"] = "agent_id",
            ["call_type"] = "call_type",
            ["acd"] = "acd",
            ["disposition"] = "disposition",
            ["sub_disposition"] = "sub_disposition",
            ["report_month"] = "report_month"
        };

        private static readonly HashSet<string> MandatoryFields = new(StringComparer.OrdinalIgnoreCase)
        {
            "call_time",
            "called_no",
            "disposition"
        };

        public OutboundImportService(
            IOutboundImportRepository repository,
            IOutboundDashboardService dashboardService,
            IConfiguration configuration,
            ILogger<OutboundImportService> logger)
        {
            _repository = repository;
            _dashboardService = dashboardService;
            _connectionString = configuration.GetConnectionString("OutboundConnection")
                ?? configuration.GetConnectionString("InboundConnection")
                ?? throw new InvalidOperationException("Connection string 'OutboundConnection' not configured.");
            _logger = logger;
        }

        private static string NormalizeHeader(string header)
        {
            if (string.IsNullOrWhiteSpace(header)) return string.Empty;
            return header.Trim().Trim('\uFEFF')
                .ToLowerInvariant()
                .Replace(' ', '_')
                .Replace('-', '_')
                .Replace('.', '_');
        }

        private static async Task<string> ComputeFileHashAsync(IFormFile file)
        {
            using var stream = file.OpenReadStream();
            using var sha = SHA256.Create();
            byte[] hash = await sha.ComputeHashAsync(stream);
            return BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
        }

        private static int? ParseDurationSeconds(string? str)
        {
            if (string.IsNullOrWhiteSpace(str)) return null;
            string s = str.Trim();
            if (int.TryParse(s, out int sec)) return sec;
            var parts = s.Split(':');
            if (parts.Length == 3 &&
                int.TryParse(parts[0], out int h) &&
                int.TryParse(parts[1], out int m) &&
                int.TryParse(parts[2], out int sec3))
            {
                return (h * 3600) + (m * 60) + sec3;
            }
            if (parts.Length == 2 &&
                int.TryParse(parts[0], out int m2) &&
                int.TryParse(parts[1], out int sec2))
            {
                return (m2 * 60) + sec2;
            }
            return null;
        }

        private static readonly string[] CallTimeExactFormats = new[]
        {
            // ISO 8601 Formats
            "yyyy-MM-dd HH:mm:ss",
            "yyyy-MM-dd HH:mm",
            "yyyy-MM-ddTHH:mm:ss",
            "yyyy/MM/dd HH:mm:ss",
            "yyyy/MM/dd HH:mm",

            // Indian / UK Standard DD/MM/YYYY with AM/PM (12-hour)
            "dd/MM/yyyy hh:mm:ss tt",
            "dd/MM/yyyy h:mm:ss tt",
            "d/M/yyyy hh:mm:ss tt",
            "d/M/yyyy h:mm:ss tt",
            "dd/MM/yyyy hh:mm tt",
            "d/M/yyyy h:mm tt",

            // Indian / UK Standard DD/MM/YYYY 24-hour
            "dd/MM/yyyy HH:mm:ss",
            "dd/MM/yyyy HH:mm",
            "d/M/yyyy HH:mm:ss",
            "d/M/yyyy HH:mm",

            // Hyphenated DD-MM-YYYY
            "dd-MM-yyyy hh:mm:ss tt",
            "dd-MM-yyyy h:mm:ss tt",
            "d-M-yyyy hh:mm:ss tt",
            "d-M-yyyy h:mm:ss tt",
            "dd-MM-yyyy HH:mm:ss",
            "dd-MM-yyyy HH:mm",
            "d-M-yyyy HH:mm:ss",
            "d-M-yyyy HH:mm",

            // Fallback US MM/DD/YYYY (only if DD/MM fails)
            "MM/dd/yyyy hh:mm:ss tt",
            "M/d/yyyy h:mm:ss tt",
            "MM/dd/yyyy HH:mm:ss",
            "M/d/yyyy HH:mm:ss"
        };

        private static DateTime? ParseCallTime(string? str, string? reportMonth = null)
        {
            if (string.IsNullOrWhiteSpace(str)) return null;
            string s = str.Trim();

            DateTime? parsed = null;
            if (DateTime.TryParseExact(s, CallTimeExactFormats, CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime dtExact))
            {
                parsed = dtExact;
            }
            else if (DateTime.TryParse(s, CultureInfo.GetCultureInfo("en-IN"), DateTimeStyles.None, out DateTime dtIndian))
            {
                parsed = dtIndian;
            }
            else if (DateTime.TryParse(s, CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime dtFallback))
            {
                parsed = dtFallback;
            }

            if (parsed.HasValue && !string.IsNullOrWhiteSpace(reportMonth))
            {
                int expectedMonth = GetMonthNumber(reportMonth);
                if (expectedMonth > 0 && parsed.Value.Month != expectedMonth)
                {
                    // Check if day and month were inverted
                    int dayAsMonth = parsed.Value.Day;
                    int monthAsDay = parsed.Value.Month;
                    if (dayAsMonth == expectedMonth && monthAsDay >= 1 && monthAsDay <= DateTime.DaysInMonth(parsed.Value.Year, expectedMonth))
                    {
                        try
                        {
                            parsed = new DateTime(parsed.Value.Year, dayAsMonth, monthAsDay, parsed.Value.Hour, parsed.Value.Minute, parsed.Value.Second);
                        }
                        catch
                        {
                            // Keep original parsed if swap fails
                        }
                    }
                }
            }

            return parsed;
        }

        private static int GetMonthNumber(string monthStr)
        {
            string clean = monthStr.Trim().ToLowerInvariant();
            if (int.TryParse(clean, out int m) && m >= 1 && m <= 12) return m;
            return clean switch
            {
                "jan" or "january" => 1,
                "feb" or "february" => 2,
                "mar" or "march" => 3,
                "apr" or "april" => 4,
                "may" => 5,
                "jun" or "june" => 6,
                "jul" or "july" => 7,
                "aug" or "august" => 8,
                "sep" or "sept" or "september" => 9,
                "oct" or "october" => 10,
                "nov" or "november" => 11,
                "dec" or "december" => 12,
                _ => 0
            };
        }

        public async Task<OutboundImportPreviewResultDto> PreviewImportAsync(IFormFile file)
        {
            var result = new OutboundImportPreviewResultDto
            {
                FileName = file.FileName,
                FileSize = file.Length
            };

            string hash = await ComputeFileHashAsync(file);
            var previous = await _repository.GetPreviousBatchByHashAsync(hash);
            if (previous != null)
            {
                result.ValidationErrors.Add($"Duplicate File Warning: An identical file was previously imported in Batch #{previous.Id} on {previous.ImportedAt:yyyy-MM-dd HH:mm} UTC.");
            }

            using var reader = new StreamReader(file.OpenReadStream());
            using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                MissingFieldFound = null,
                BadDataFound = null,
                HeaderValidated = null
            });

            if (!await csv.ReadAsync() || !csv.ReadHeader() || csv.HeaderRecord == null)
            {
                result.ValidationErrors.Add("Empty or invalid CSV file.");
                return result;
            }

            var headerMap = new Dictionary<int, string>();
            var recognized = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            for (int i = 0; i < csv.HeaderRecord.Length; i++)
            {
                string norm = NormalizeHeader(csv.HeaderRecord[i]);
                if (HeaderAliases.TryGetValue(norm, out string? destField))
                {
                    headerMap[i] = destField;
                    recognized.Add(destField);
                    result.RecognizedHeaders.Add($"{csv.HeaderRecord[i]} -> {destField}");
                }
            }

            var missing = MandatoryFields.Where(m => !recognized.Contains(m)).ToList();
            if (missing.Count > 0)
            {
                result.MissingHeaders = missing;
                result.ValidationErrors.Add($"Missing required columns: {string.Join(", ", missing)}");
            }

            int count = 0;
            while (await csv.ReadAsync())
            {
                count++;
                if (result.SampleRows.Count < 10)
                {
                    var rowDict = new Dictionary<string, string>();
                    for (int i = 0; i < csv.HeaderRecord.Length; i++)
                    {
                        rowDict[csv.HeaderRecord[i]] = csv.GetField(i) ?? string.Empty;
                    }
                    result.SampleRows.Add(rowDict);
                }
            }

            result.TotalRows = count;
            result.ValidRows = missing.Count == 0 ? count : 0;
            result.InvalidRows = missing.Count > 0 ? count : 0;

            return result;
        }

        public async Task<OutboundImportResultDto> ProcessImportAsync(IFormFile file, string username)
        {
            var sw = Stopwatch.StartNew();

            // 1. First inspect the CSV header and validate mandatory columns BEFORE creating any database batch
            using (var headerReader = new StreamReader(file.OpenReadStream()))
            using (var headerCsv = new CsvReader(headerReader, new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                MissingFieldFound = null,
                BadDataFound = null,
                HeaderValidated = null
            }))
            {
                if (!await headerCsv.ReadAsync() || !headerCsv.ReadHeader() || headerCsv.HeaderRecord == null || headerCsv.HeaderRecord.Length == 0)
                {
                    throw new InvalidImportHeaderException("CSV has no headers or is empty.", new List<string> { "Empty or unreadable file" });
                }

                var recognizedFields = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                for (int i = 0; i < headerCsv.HeaderRecord.Length; i++)
                {
                    string norm = NormalizeHeader(headerCsv.HeaderRecord[i]);
                    if (HeaderAliases.TryGetValue(norm, out string? destField))
                    {
                        recognizedFields.Add(destField);
                    }
                }

                var missing = MandatoryFields.Where(m => !recognizedFields.Contains(m)).ToList();
                if (missing.Count > 0)
                {
                    throw new InvalidImportHeaderException(
                        $"Missing required CSV columns: {string.Join(", ", missing)}. Required columns: call_time, called_no, disposition.",
                        missing);
                }
            }

            // 2. Atomic duplicate check & batch creation with database-backed lock
            string hash = await ComputeFileHashAsync(file);
            var (batchId, existingBatch) = await _repository.CreateBatchIfNotDuplicateAsync(file.FileName, file.Length, hash, 0, username);

            if (existingBatch != null)
            {
                throw new DuplicateImportException(file.FileName, hash, existingBatch.Id, existingBatch.ImportedAt);
            }

            var result = new OutboundImportResultDto
            {
                BatchId = batchId,
                FileName = file.FileName
            };

            using var reader = new StreamReader(file.OpenReadStream());
            using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                MissingFieldFound = null,
                BadDataFound = null,
                HeaderValidated = null
            });

            if (!await csv.ReadAsync() || !csv.ReadHeader() || csv.HeaderRecord == null)
            {
                await _repository.UpdateBatchAsync(batchId, 0, 0, 1, sw.Elapsed.TotalSeconds, "Failed");
                result.Status = "Failed";
                result.Errors.Add("CSV has no headers or is empty.");
                return result;
            }

            var colMap = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            for (int i = 0; i < csv.HeaderRecord.Length; i++)
            {
                string norm = NormalizeHeader(csv.HeaderRecord[i]);
                if (HeaderAliases.TryGetValue(norm, out string? destField) && !colMap.ContainsKey(destField))
                {
                    colMap[destField] = i;
                }
            }

            string GetCol(string destField) =>
                colMap.TryGetValue(destField, out int idx) ? csv.GetField(idx) ?? string.Empty : string.Empty;

            var table = new DataTable();
            table.Columns.Add("batch_id", typeof(long));
            table.Columns.Add("sr_no", typeof(long));
            table.Columns.Add("did_no", typeof(string));
            table.Columns.Add("group_name", typeof(string));
            table.Columns.Add("called_no", typeof(string));
            table.Columns.Add("call_time", typeof(DateTime));
            table.Columns.Add("ring_durn", typeof(string));
            table.Columns.Add("ring_seconds", typeof(int));
            table.Columns.Add("ivr_dur", typeof(string));
            table.Columns.Add("ivr_seconds", typeof(int));
            table.Columns.Add("queue_durn", typeof(string));
            table.Columns.Add("queue_seconds", typeof(int));
            table.Columns.Add("agent_durn", typeof(string));
            table.Columns.Add("agent_seconds", typeof(int));
            table.Columns.Add("hold_durn", typeof(string));
            table.Columns.Add("hold_seconds", typeof(int));
            table.Columns.Add("total_durn", typeof(string));
            table.Columns.Add("total_seconds", typeof(int));
            table.Columns.Add("call_mode", typeof(string));
            table.Columns.Add("agent_id", typeof(string));
            table.Columns.Add("call_type", typeof(string));
            table.Columns.Add("acd", typeof(string));
            table.Columns.Add("disposition", typeof(string));
            table.Columns.Add("sub_disposition", typeof(string));
            table.Columns.Add("report_month", typeof(string));

            int totalRows = 0;
            while (await csv.ReadAsync())
            {
                totalRows++;
                var row = table.NewRow();
                row["batch_id"] = batchId;

                string srNoRaw = GetCol("sr_no");
                row["sr_no"] = long.TryParse(srNoRaw, out long srNo) ? srNo : DBNull.Value;
                row["did_no"] = (object?)GetCol("did_no") ?? DBNull.Value;
                row["group_name"] = (object?)GetCol("group_name") ?? DBNull.Value;
                row["called_no"] = (object?)GetCol("called_no") ?? DBNull.Value;

                var dt = ParseCallTime(GetCol("call_time"), GetCol("report_month"));
                row["call_time"] = dt.HasValue ? (object)dt.Value : DBNull.Value;

                string ringDurn = GetCol("ring_durn");
                row["ring_durn"] = (object?)ringDurn ?? DBNull.Value;
                row["ring_seconds"] = (object?)ParseDurationSeconds(ringDurn) ?? DBNull.Value;

                string ivrDur = GetCol("ivr_dur");
                row["ivr_dur"] = (object?)ivrDur ?? DBNull.Value;
                row["ivr_seconds"] = (object?)ParseDurationSeconds(ivrDur) ?? DBNull.Value;

                string queueDurn = GetCol("queue_durn");
                row["queue_durn"] = (object?)queueDurn ?? DBNull.Value;
                row["queue_seconds"] = (object?)ParseDurationSeconds(queueDurn) ?? DBNull.Value;

                string agentDurn = GetCol("agent_durn");
                row["agent_durn"] = (object?)agentDurn ?? DBNull.Value;
                row["agent_seconds"] = (object?)ParseDurationSeconds(agentDurn) ?? DBNull.Value;

                string holdDurn = GetCol("hold_durn");
                row["hold_durn"] = (object?)holdDurn ?? DBNull.Value;
                row["hold_seconds"] = (object?)ParseDurationSeconds(holdDurn) ?? DBNull.Value;

                string totalDurn = GetCol("total_durn");
                row["total_durn"] = (object?)totalDurn ?? DBNull.Value;
                row["total_seconds"] = (object?)ParseDurationSeconds(totalDurn) ?? DBNull.Value;

                row["call_mode"] = (object?)GetCol("call_mode") ?? DBNull.Value;
                row["agent_id"] = (object?)GetCol("agent_id") ?? DBNull.Value;
                row["call_type"] = (object?)GetCol("call_type") ?? DBNull.Value;
                row["acd"] = (object?)GetCol("acd") ?? DBNull.Value;
                row["disposition"] = (object?)GetCol("disposition") ?? DBNull.Value;
                row["sub_disposition"] = (object?)GetCol("sub_disposition") ?? DBNull.Value;
                row["report_month"] = (object?)GetCol("report_month") ?? DBNull.Value;

                table.Rows.Add(row);
            }

            using var conn = new SqlConnection(_connectionString);
            await conn.OpenAsync();
            using var bulk = new SqlBulkCopy(conn)
            {
                DestinationTableName = "dbo.outbound_cdr_calls",
                BatchSize = 10000,
                BulkCopyTimeout = 300
            };

            foreach (DataColumn c in table.Columns)
            {
                bulk.ColumnMappings.Add(c.ColumnName, c.ColumnName);
            }

            await bulk.WriteToServerAsync(table);
            sw.Stop();

            await _repository.UpdateBatchAsync(batchId, totalRows, 0, 0, sw.Elapsed.TotalSeconds, "Completed");
            _dashboardService.InvalidateCache();

            result.TotalRows = totalRows;
            result.InsertedRows = totalRows;
            result.DurationSeconds = Math.Round(sw.Elapsed.TotalSeconds, 2);
            result.Status = "Completed";

            return result;
        }

        public Task<List<OutboundImportBatchDto>> GetImportHistoryAsync(int limit = 20)
        {
            return _repository.GetImportHistoryAsync(limit);
        }
    }
}
