using System.Diagnostics;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using ClosedXML.Excel;
using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.EntityFrameworkCore;
using BeneficiaryGrievance.Api.Data;
using BeneficiaryGrievance.Api.DTOs;
using BeneficiaryGrievance.Api.Models;

namespace BeneficiaryGrievance.Api.Services
{
    public class ImportService : IImportService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ImportService> _logger;

        public ImportService(ApplicationDbContext context, ILogger<ImportService> logger)
        {
            _context = context;
            _logger = logger;
        }

        private record RawRecord(
            long CompId,
            string? CompType,
            DateTime CompDate,
            string? CompTime,
            string Status,
            string Priority,
            DateTime? DateOfIncident,
            string? CitizenName,
            string? CitizenMobileNo,
            string? CitizenAadharNo,
            string? CitizenEmailId,
            string? CitizenDOB,
            string? CitizenGender,
            string? CaseNo,
            string? PMJAYId,
            string? HospitalName,
            string? Department,
            string? BeneficiaryState,
            string? BeneficiaryDistrict,
            string? HospitalState,
            string? HospitalDistrict,
            string? ComplaintFor,
            string? GrievanceCategory,
            string? GrievanceType,
            string? Address,
            string? CompRemarks,
            string? CSolution,
            DateTime? ResolutionDate,
            string? ResolutionTime,
            string? OfficerName,
            string? OfficerLevel,
            string? OfficerRemarks,
            int RowNumber
        );

        private static int GetStatusRank(string? status) => status?.Trim().ToUpperInvariant() switch
        {
            "OPEN" => 1,
            "WIP" => 2,
            "CLOSED" => 3,
            _ => 0
        };

        public async Task<ImportPreviewResultDto> PreviewImportAsync(IFormFile file)
        {
            var sw = Stopwatch.StartNew();
            var result = new ImportPreviewResultDto
            {
                FileName = file.FileName,
                FileSize = file.Length
            };

            // Duplicate upload detection by SHA256
            string previewFileHash = "";
            using (var sha = SHA256.Create())
            {
                using var stream = file.OpenReadStream();
                var hashBytes = await sha.ComputeHashAsync(stream);
                previewFileHash = BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
            }

            var previousBatch = await _context.ImportBatches
                .Where(b => b.FileHash == previewFileHash && (b.ImportStatus == "Completed" || b.ImportStatus == "Success"))
                .OrderByDescending(b => b.ImportDate)
                .FirstOrDefaultAsync();

            if (previousBatch != null)
            {
                result.ValidationErrors.Add($"Duplicate File Warning: An identical file was already imported in Batch #{previousBatch.Id} on {previousBatch.ImportDate:yyyy-MM-dd HH:mm} UTC ('{previousBatch.FileName}'). Existing grievance history and newer statuses will be protected.");
            }

            var records = await ReadRecordsFromFileAsync(file, result.ValidationErrors, maxRows: 500);
            result.TotalRows = records.Count;

            if (records.Count == 0)
            {
                result.ValidationErrors.Add("No valid grievance records could be extracted from the file.");
                return result;
            }

            var compIds = records.Select(r => r.CompId).Distinct().ToList();
            var existingGrievances = await _context.Grievances
                .Where(g => compIds.Contains(g.CompId))
                .ToDictionaryAsync(g => g.CompId, g => g);

            int sampleLimit = 20;
            foreach (var r in records)
            {
                string actionType = "New";
                string changeDesc = "New grievance registration";

                if (existingGrievances.TryGetValue(r.CompId, out var existing))
                {
                    int existingRank = GetStatusRank(existing.Status);
                    int incomingRank = GetStatusRank(r.Status);
                    bool isRegressive = incomingRank < existingRank;
                    bool isStatusChanged = !isRegressive && !string.Equals(existing.Status, r.Status, StringComparison.OrdinalIgnoreCase);
                    bool isOfficerChanged = !string.IsNullOrWhiteSpace(r.OfficerName) && !string.Equals(existing.OfficerName ?? "", r.OfficerName, StringComparison.OrdinalIgnoreCase);
                    bool isSolutionChanged = !string.IsNullOrWhiteSpace(r.CSolution) && !string.Equals(existing.CSolution ?? "", r.CSolution, StringComparison.OrdinalIgnoreCase);
                    bool isResolutionChanged = r.ResolutionDate.HasValue && (!existing.ResolutionDate.HasValue || r.ResolutionDate.Value != existing.ResolutionDate.Value);

                    if (isStatusChanged || isOfficerChanged || isSolutionChanged || isResolutionChanged)
                    {
                        actionType = "Update";
                        changeDesc = isStatusChanged 
                            ? $"Status progression: {existing.Status} -> {r.Status}"
                            : isOfficerChanged 
                                ? $"Officer reassignment: {existing.OfficerName} -> {r.OfficerName}"
                                : "Resolution/solution update";
                        result.UpdateCount++;
                    }
                    else
                    {
                        actionType = "Unchanged";
                        changeDesc = isRegressive
                            ? $"Retained newer status '{existing.Status}' (older report showed '{r.Status}')"
                            : "Record already up-to-date";
                        result.UnchangedCount++;
                    }
                }
                else
                {
                    result.NewCount++;
                }

                if (result.SampleRows.Count < sampleLimit)
                {
                    result.SampleRows.Add(new ImportPreviewRowDto
                    {
                        CompId = r.CompId,
                        CompDate = r.CompDate.ToString("yyyy-MM-dd"),
                        Status = r.Status,
                        District = r.BeneficiaryDistrict,
                        Category = r.GrievanceCategory,
                        GrievanceType = r.GrievanceType,
                        OfficerName = r.OfficerName,
                        ActionType = actionType,
                        ChangeDescription = changeDesc
                    });
                }
            }

            return result;
        }

        public async Task<ImportExecuteResultDto> ExecuteImportAsync(IFormFile file, string username)
        {
            var sw = Stopwatch.StartNew();
            var errors = new List<string>();
            var errorEntities = new List<ImportError>();

            string fileHash = "";
            using (var md5 = SHA256.Create())
            {
                using var stream = file.OpenReadStream();
                var hashBytes = await md5.ComputeHashAsync(stream);
                fileHash = BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
            }

            var allRecords = await ReadRecordsFromFileAsync(file, errors);

            if (allRecords.Count == 0)
            {
                var errMsg = errors.Count > 0 
                    ? string.Join(" ", errors) 
                    : "No valid grievance records could be extracted from the file.";
                throw new InvalidOperationException(errMsg);
            }

            var batch = new ImportBatch
            {
                FileName = file.FileName,
                FileSize = file.Length,
                FileHash = fileHash,
                TotalRecords = allRecords.Count,
                ImportDate = DateTime.UtcNow,
                ImportedBy = username ?? "System",
                ImportStatus = "Processing"
            };

            _context.ImportBatches.Add(batch);
            await _context.SaveChangesAsync();

            int newCount = 0;
            int updatedCount = 0;
            int unchangedCount = 0;

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Process in chunks of 500 for high memory efficiency and optimal MSSQL batch performance
                int chunkSize = 500;
                for (int i = 0; i < allRecords.Count; i += chunkSize)
                {
                    var chunk = allRecords.Skip(i).Take(chunkSize).ToList();
                    var chunkCompIds = chunk.Select(c => c.CompId).Distinct().ToList();

                    var existingMap = await _context.Grievances
                        .Include(g => g.StatusHistory)
                        .Where(g => chunkCompIds.Contains(g.CompId))
                        .ToDictionaryAsync(g => g.CompId, g => g);

                    var newEntities = new List<Grievance>();
                    var statusHistories = new List<GrievanceStatusHistory>();

                    foreach (var rec in chunk)
                    {
                        try
                        {
                            var (ageInDays, ageBucket) = ComputeAge(rec.CompDate, rec.ResolutionDate, rec.Status);
                            var (isRisk, riskCategory, riskReason) = DetectRisk(rec.GrievanceCategory, rec.GrievanceType, rec.CompRemarks);

                            if (existingMap.TryGetValue(rec.CompId, out var existing))
                            {
                                int existingRank = GetStatusRank(existing.Status);
                                int incomingRank = GetStatusRank(rec.Status);
                                bool isRegressive = incomingRank < existingRank;
                                bool isStatusChanged = !isRegressive && !string.Equals(existing.Status, rec.Status, StringComparison.OrdinalIgnoreCase);
                                bool isOfficerChanged = !string.IsNullOrWhiteSpace(rec.OfficerName) && !string.Equals(existing.OfficerName ?? "", rec.OfficerName, StringComparison.OrdinalIgnoreCase);
                                bool isSolutionChanged = !string.IsNullOrWhiteSpace(rec.CSolution) && !string.Equals(existing.CSolution ?? "", rec.CSolution, StringComparison.OrdinalIgnoreCase);
                                bool isResolutionChanged = rec.ResolutionDate.HasValue && (!existing.ResolutionDate.HasValue || rec.ResolutionDate.Value != existing.ResolutionDate.Value);

                                if (isStatusChanged || isOfficerChanged || isSolutionChanged || isResolutionChanged)
                                {
                                    if (isStatusChanged || isOfficerChanged)
                                    {
                                        statusHistories.Add(new GrievanceStatusHistory
                                        {
                                            Grievance = existing,
                                            CompId = existing.CompId,
                                            PreviousStatus = existing.Status,
                                            NewStatus = isStatusChanged ? rec.Status : existing.Status,
                                            PreviousOfficer = existing.OfficerName,
                                            NewOfficer = isOfficerChanged ? rec.OfficerName : existing.OfficerName,
                                            Remarks = isStatusChanged 
                                                ? (rec.OfficerRemarks ?? rec.CSolution) 
                                                : $"Preserved newer status '{existing.Status}'; updated officer/resolution details",
                                            ImportBatchId = batch.Id,
                                            ChangedAt = DateTime.UtcNow
                                        });
                                    }

                                    // Update grievance fields - preserve status if older report had regressive status
                                    if (isStatusChanged)
                                    {
                                        existing.Status = rec.Status;
                                    }
                                    existing.Priority = rec.Priority;
                                    if (!string.IsNullOrWhiteSpace(rec.OfficerName)) existing.OfficerName = rec.OfficerName;
                                    if (!string.IsNullOrWhiteSpace(rec.OfficerLevel)) existing.OfficerLevel = rec.OfficerLevel;
                                    if (!string.IsNullOrWhiteSpace(rec.OfficerRemarks)) existing.OfficerRemarks = rec.OfficerRemarks;
                                    if (!string.IsNullOrWhiteSpace(rec.CSolution)) existing.CSolution = rec.CSolution;
                                    if (rec.ResolutionDate.HasValue) existing.ResolutionDate = rec.ResolutionDate;
                                    if (!string.IsNullOrWhiteSpace(rec.ResolutionTime)) existing.ResolutionTime = rec.ResolutionTime;
                                    
                                    existing.AgeInDays = ageInDays;
                                    existing.AgeBucket = ageBucket;
                                    existing.IsRiskFlagged = isRisk;
                                    if (isRisk)
                                    {
                                        existing.RiskCategory = riskCategory;
                                        existing.RiskReason = riskReason;
                                    }
                                    existing.LastImportBatchId = batch.Id;
                                    existing.UpdatedAt = DateTime.UtcNow;

                                    updatedCount++;
                                }
                                else
                                {
                                    unchangedCount++;
                                }
                            }
                            else
                            {
                                var grievance = new Grievance
                                {
                                    CompId = rec.CompId,
                                    CompType = rec.CompType ?? "Beneficiary",
                                    CompDate = rec.CompDate,
                                    CompTime = rec.CompTime,
                                    Status = rec.Status,
                                    Priority = rec.Priority,
                                    DateOfIncident = rec.DateOfIncident,
                                    CitizenName = rec.CitizenName,
                                    CitizenMobileNo = rec.CitizenMobileNo,
                                    CitizenAadharNo = rec.CitizenAadharNo,
                                    CitizenEmailId = rec.CitizenEmailId,
                                    CitizenDOB = rec.CitizenDOB,
                                    CitizenGender = rec.CitizenGender,
                                    CaseNo = rec.CaseNo,
                                    PMJAYId = rec.PMJAYId,
                                    HospitalName = rec.HospitalName,
                                    Department = rec.Department,
                                    BeneficiaryState = rec.BeneficiaryState,
                                    BeneficiaryDistrict = rec.BeneficiaryDistrict,
                                    HospitalState = rec.HospitalState,
                                    HospitalDistrict = rec.HospitalDistrict,
                                    ComplaintFor = rec.ComplaintFor ?? "PMJAY",
                                    GrievanceCategory = rec.GrievanceCategory,
                                    GrievanceType = rec.GrievanceType,
                                    Address = rec.Address,
                                    CompRemarks = rec.CompRemarks,
                                    CSolution = rec.CSolution,
                                    ResolutionDate = rec.ResolutionDate,
                                    ResolutionTime = rec.ResolutionTime,
                                    OfficerName = rec.OfficerName,
                                    OfficerLevel = rec.OfficerLevel,
                                    OfficerRemarks = rec.OfficerRemarks,
                                    AgeInDays = ageInDays,
                                    AgeBucket = ageBucket,
                                    IsRiskFlagged = isRisk,
                                    RiskCategory = riskCategory,
                                    RiskReason = riskReason,
                                    FirstImportBatchId = batch.Id,
                                    LastImportBatchId = batch.Id,
                                    CreatedAt = DateTime.UtcNow,
                                    UpdatedAt = DateTime.UtcNow
                                };

                                newEntities.Add(grievance);
                                newCount++;
                            }
                        }
                        catch (Exception ex)
                        {
                            errorEntities.Add(new ImportError
                            {
                                ImportBatchId = batch.Id,
                                RowNumber = rec.RowNumber,
                                CompId = rec.CompId.ToString(),
                                ErrorMessage = ex.Message,
                                RawData = $"Row #{rec.RowNumber}"
                            });
                        }
                    }

                    if (newEntities.Count > 0)
                    {
                        await _context.Grievances.AddRangeAsync(newEntities);
                    }
                    if (statusHistories.Count > 0)
                    {
                        await _context.GrievanceStatusHistory.AddRangeAsync(statusHistories);
                    }

                    await _context.SaveChangesAsync();
                }

                if (errorEntities.Count > 0)
                {
                    await _context.ImportErrors.AddRangeAsync(errorEntities);
                }

                sw.Stop();
                batch.NewRecordsCount = newCount;
                batch.UpdatedRecordsCount = updatedCount;
                batch.UnchangedRecordsCount = unchangedCount;
                batch.ErrorRecordsCount = errorEntities.Count;
                batch.ExecutionTimeMs = sw.ElapsedMilliseconds;
                batch.ImportStatus = errorEntities.Count > 0 && newCount == 0 && updatedCount == 0 ? "Failed" : "Completed";
                var previousDuplicate = await _context.ImportBatches
                    .Where(b => b.FileHash == fileHash && b.Id != batch.Id && (b.ImportStatus == "Completed" || b.ImportStatus == "Success"))
                    .OrderByDescending(b => b.ImportDate)
                    .FirstOrDefaultAsync();

                if (previousDuplicate != null && newCount == 0 && updatedCount == 0)
                {
                    batch.SummaryNotes = $"Duplicate upload detected. Identical file previously imported in Batch #{previousDuplicate.Id}. Zero records duplicated; all {unchangedCount} existing records and current statuses preserved.";
                }
                else
                {
                    batch.SummaryNotes = $"Processed {allRecords.Count} records: {newCount} new, {updatedCount} updated, {unchangedCount} unchanged, {errorEntities.Count} errors in {sw.ElapsedMilliseconds}ms.";
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return new ImportExecuteResultDto
                {
                    BatchId = batch.Id,
                    FileName = file.FileName,
                    TotalRecords = allRecords.Count,
                    NewRecordsCount = newCount,
                    UpdatedRecordsCount = updatedCount,
                    UnchangedRecordsCount = unchangedCount,
                    ErrorRecordsCount = errorEntities.Count,
                    Status = batch.ImportStatus,
                    ExecutionTimeMs = sw.ElapsedMilliseconds,
                    Message = batch.SummaryNotes
                };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Failed to execute import for {FileName}", file.FileName);
                batch.ImportStatus = "Failed";
                batch.SummaryNotes = $"Failed: {ex.Message}";
                await _context.SaveChangesAsync();
                throw;
            }
        }

        public async Task<List<ImportBatchSummaryDto>> GetImportHistoryAsync()
        {
            return await _context.ImportBatches
                .OrderByDescending(b => b.ImportDate)
                .Select(b => new ImportBatchSummaryDto
                {
                    Id = b.Id,
                    FileName = b.FileName,
                    FileSize = b.FileSize,
                    TotalRecords = b.TotalRecords,
                    NewRecordsCount = b.NewRecordsCount,
                    UpdatedRecordsCount = b.UpdatedRecordsCount,
                    UnchangedRecordsCount = b.UnchangedRecordsCount,
                    ErrorRecordsCount = b.ErrorRecordsCount,
                    ImportStatus = b.ImportStatus,
                    ImportDate = b.ImportDate,
                    ImportedBy = b.ImportedBy,
                    ExecutionTimeMs = b.ExecutionTimeMs
                })
                .ToListAsync();
        }

        public async Task<List<ImportErrorDto>> GetBatchErrorsAsync(int batchId)
        {
            return await _context.ImportErrors
                .Where(e => e.ImportBatchId == batchId)
                .OrderBy(e => e.RowNumber)
                .Select(e => new ImportErrorDto
                {
                    Id = e.Id,
                    ImportBatchId = e.ImportBatchId,
                    RowNumber = e.RowNumber,
                    CompId = e.CompId,
                    ErrorMessage = e.ErrorMessage,
                    RawData = e.RawData,
                    CreatedAt = e.CreatedAt
                })
                .ToListAsync();
        }

        private async Task<List<RawRecord>> ReadRecordsFromFileAsync(IFormFile file, List<string> errors, int maxRows = int.MaxValue)
        {
            var records = new List<RawRecord>();
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();

            using var stream = new MemoryStream();
            await file.CopyToAsync(stream);
            stream.Position = 0;

            if (ext == ".xlsx" || ext == ".xls")
            {
                records = ReadExcel(stream, errors, maxRows);
            }
            else if (ext == ".csv")
            {
                records = ReadCsv(stream, errors, maxRows);
            }
            else
            {
                errors.Add($"Unsupported file format '{ext}'. Please upload .xlsx, .xls, or .csv.");
            }

            return records;
        }

        private List<RawRecord> ReadExcel(Stream stream, List<string> errors, int maxRows)
        {
            var list = new List<RawRecord>();
            using var workbook = new XLWorkbook(stream);
            var worksheet = workbook.Worksheets.FirstOrDefault();
            if (worksheet == null)
            {
                errors.Add("The Excel workbook contains no worksheets.");
                return list;
            }

            if (worksheet.RowsUsed().Count() == 0)
            {
                errors.Add("The Excel worksheet is empty and contains no rows.");
                return list;
            }

            // Find header row: Scan first 5 rows to locate the one containing 'CompId'
            IXLRow? headerRow = null;
            int headerRowNum = 0;
            for (int r = 1; r <= Math.Min(5, worksheet.RowsUsed().Count()); r++)
            {
                var row = worksheet.Row(r);
                bool hasCompId = row.Cells().Any(c => c.GetString().Trim().Equals("CompId", StringComparison.OrdinalIgnoreCase)
                                                   || c.GetString().Trim().Equals("Complaint Id", StringComparison.OrdinalIgnoreCase));
                if (hasCompId)
                {
                    headerRow = row;
                    headerRowNum = r;
                    break;
                }
            }

            if (headerRow == null)
            {
                // Fallback to row 1
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

            bool hasCompIdCol = colMap.ContainsKey("CompId") || colMap.ContainsKey("Complaint Id") || colMap.ContainsKey("ComplaintId");
            if (!hasCompIdCol)
            {
                errors.Add("Missing mandatory column 'CompId' (or 'Complaint Id'). The report must contain unique grievance identifiers.");
                return list;
            }

            int lastRow = worksheet.LastRowUsed()?.RowNumber() ?? headerRowNum;
            for (int r = headerRowNum + 1; r <= lastRow && list.Count < maxRows; r++)
            {
                var row = worksheet.Row(r);
                if (row.IsEmpty()) continue;

                string compIdStr = GetCellString(row, colMap, "CompId", "Complaint Id", "ComplaintId");
                if (string.IsNullOrWhiteSpace(compIdStr) || !long.TryParse(compIdStr.Replace(",", ""), out long compId))
                {
                    continue; // Skip empty/invalid id row
                }

                string statusStr = GetCellString(row, colMap, "StatusRemarks", "Status", "GrievanceStatus");
                if (string.IsNullOrWhiteSpace(statusStr)) statusStr = "Open";

                string compDateStr = GetCellString(row, colMap, "CompDate", "Complaint Date", "RegistrationDate");
                DateTime compDate = ParseFlexibleDate(compDateStr, DateTime.UtcNow.Date);

                string resDateStr = GetCellString(row, colMap, "ResolutionDate", "ClosedDate", "Resolution Date");
                DateTime? resolutionDate = null;
                if (!string.IsNullOrWhiteSpace(resDateStr) && !resDateStr.Equals("NA", StringComparison.OrdinalIgnoreCase))
                {
                    resolutionDate = ParseFlexibleDate(resDateStr, DateTime.MinValue);
                    if (resolutionDate == DateTime.MinValue) resolutionDate = null;
                }

                string incidentDateStr = GetCellString(row, colMap, "DateofIncident", "Incident Date");
                DateTime? incidentDate = null;
                if (!string.IsNullOrWhiteSpace(incidentDateStr) && !incidentDateStr.Equals("NA", StringComparison.OrdinalIgnoreCase))
                {
                    incidentDate = ParseFlexibleDate(incidentDateStr, DateTime.MinValue);
                    if (incidentDate == DateTime.MinValue) incidentDate = null;
                }

                list.Add(new RawRecord(
                    CompId: compId,
                    CompType: GetCellString(row, colMap, "CompType", "Type"),
                    CompDate: compDate,
                    CompTime: GetCellString(row, colMap, "CompTime", "Time"),
                    Status: NormalizeStatus(statusStr),
                    Priority: NormalizePriority(GetCellString(row, colMap, "Priority")),
                    DateOfIncident: incidentDate,
                    CitizenName: CleanString(GetCellString(row, colMap, "CitizenName", "BeneficiaryName")),
                    CitizenMobileNo: CleanString(GetCellString(row, colMap, "CitizenMobileNo", "MobileNo")),
                    CitizenAadharNo: CleanString(GetCellString(row, colMap, "CitizenAadharNo", "AadharNo")),
                    CitizenEmailId: CleanString(GetCellString(row, colMap, "CitizenEmailId", "Email")),
                    CitizenDOB: CleanString(GetCellString(row, colMap, "CitizenDOB", "DOB")),
                    CitizenGender: CleanString(GetCellString(row, colMap, "CitizenGender", "Gender")),
                    CaseNo: CleanString(GetCellString(row, colMap, "CaseNo")),
                    PMJAYId: CleanString(GetCellString(row, colMap, "PMJAYId", "PMJAY ID")),
                    HospitalName: CleanString(GetCellString(row, colMap, "HospitalName", "Hospital")),
                    Department: CleanString(GetCellString(row, colMap, "Department")),
                    BeneficiaryState: CleanString(GetCellString(row, colMap, "BeneficieryState", "BeneficiaryState", "State")),
                    BeneficiaryDistrict: CleanString(GetCellString(row, colMap, "BeneficieryDistrict", "BeneficiaryDistrict", "District")),
                    HospitalState: CleanString(GetCellString(row, colMap, "HospitalState")),
                    HospitalDistrict: CleanString(GetCellString(row, colMap, "HospitalDistrict")),
                    ComplaintFor: CleanString(GetCellString(row, colMap, "ComplaintFor", "Scheme")),
                    GrievanceCategory: CleanString(GetCellString(row, colMap, "GrievanceCategory", "Category")),
                    GrievanceType: CleanString(GetCellString(row, colMap, "GrievanceType", "SubCategory", "Reason")),
                    Address: CleanString(GetCellString(row, colMap, "Address")),
                    CompRemarks: CleanString(GetCellString(row, colMap, "CompRemarks", "Description", "Remarks")),
                    CSolution: CleanString(GetCellString(row, colMap, "CSolution", "Solution", "ResolutionDetails")),
                    ResolutionDate: resolutionDate,
                    ResolutionTime: CleanString(GetCellString(row, colMap, "ResolutionTime")),
                    OfficerName: CleanString(GetCellString(row, colMap, "OfficerName", "AssignedOfficer")),
                    OfficerLevel: CleanString(GetCellString(row, colMap, "OfficerLevel", "Level")),
                    OfficerRemarks: CleanString(GetCellString(row, colMap, "OfficerRemarks")),
                    RowNumber: r
                ));
            }

            return list;
        }

        private List<RawRecord> ReadCsv(Stream stream, List<string> errors, int maxRows)
        {
            var list = new List<RawRecord>();
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

            bool hasCompIdCol = headers != null && headers.Any(h => h.Trim().Equals("CompId", StringComparison.OrdinalIgnoreCase) 
                                                                 || h.Trim().Equals("Complaint Id", StringComparison.OrdinalIgnoreCase) 
                                                                 || h.Trim().Equals("ComplaintId", StringComparison.OrdinalIgnoreCase));
            if (!hasCompIdCol)
            {
                errors.Add("Missing mandatory column 'CompId' (or 'Complaint Id'). The report must contain unique grievance identifiers.");
                return list;
            }

            int rowNumber = 1;
            while (csv.Read() && list.Count < maxRows)
            {
                rowNumber++;
                string? compIdStr = GetCsvField(csv, "CompId", "Complaint Id", "ComplaintId");
                if (string.IsNullOrWhiteSpace(compIdStr) || !long.TryParse(compIdStr.Replace(",", ""), out long compId))
                {
                    continue;
                }

                string statusStr = GetCsvField(csv, "StatusRemarks", "Status", "GrievanceStatus") ?? "Open";
                string compDateStr = GetCsvField(csv, "CompDate", "Complaint Date", "RegistrationDate") ?? "";
                DateTime compDate = ParseFlexibleDate(compDateStr, DateTime.UtcNow.Date);

                string resDateStr = GetCsvField(csv, "ResolutionDate", "ClosedDate", "Resolution Date") ?? "";
                DateTime? resolutionDate = null;
                if (!string.IsNullOrWhiteSpace(resDateStr) && !resDateStr.Equals("NA", StringComparison.OrdinalIgnoreCase))
                {
                    resolutionDate = ParseFlexibleDate(resDateStr, DateTime.MinValue);
                    if (resolutionDate == DateTime.MinValue) resolutionDate = null;
                }

                list.Add(new RawRecord(
                    CompId: compId,
                    CompType: GetCsvField(csv, "CompType", "Type"),
                    CompDate: compDate,
                    CompTime: GetCsvField(csv, "CompTime", "Time"),
                    Status: NormalizeStatus(statusStr),
                    Priority: NormalizePriority(GetCsvField(csv, "Priority")),
                    DateOfIncident: null,
                    CitizenName: CleanString(GetCsvField(csv, "CitizenName")),
                    CitizenMobileNo: CleanString(GetCsvField(csv, "CitizenMobileNo")),
                    CitizenAadharNo: CleanString(GetCsvField(csv, "CitizenAadharNo")),
                    CitizenEmailId: CleanString(GetCsvField(csv, "CitizenEmailId")),
                    CitizenDOB: CleanString(GetCsvField(csv, "CitizenDOB")),
                    CitizenGender: CleanString(GetCsvField(csv, "CitizenGender")),
                    CaseNo: CleanString(GetCsvField(csv, "CaseNo")),
                    PMJAYId: CleanString(GetCsvField(csv, "PMJAYId")),
                    HospitalName: CleanString(GetCsvField(csv, "HospitalName")),
                    Department: CleanString(GetCsvField(csv, "Department")),
                    BeneficiaryState: CleanString(GetCsvField(csv, "BeneficieryState", "BeneficiaryState")),
                    BeneficiaryDistrict: CleanString(GetCsvField(csv, "BeneficieryDistrict", "BeneficiaryDistrict")),
                    HospitalState: CleanString(GetCsvField(csv, "HospitalState")),
                    HospitalDistrict: CleanString(GetCsvField(csv, "HospitalDistrict")),
                    ComplaintFor: CleanString(GetCsvField(csv, "ComplaintFor")),
                    GrievanceCategory: CleanString(GetCsvField(csv, "GrievanceCategory")),
                    GrievanceType: CleanString(GetCsvField(csv, "GrievanceType")),
                    Address: CleanString(GetCsvField(csv, "Address")),
                    CompRemarks: CleanString(GetCsvField(csv, "CompRemarks")),
                    CSolution: CleanString(GetCsvField(csv, "CSolution")),
                    ResolutionDate: resolutionDate,
                    ResolutionTime: CleanString(GetCsvField(csv, "ResolutionTime")),
                    OfficerName: CleanString(GetCsvField(csv, "OfficerName")),
                    OfficerLevel: CleanString(GetCsvField(csv, "OfficerLevel")),
                    OfficerRemarks: CleanString(GetCsvField(csv, "OfficerRemarks")),
                    RowNumber: rowNumber
                ));
            }

            return list;
        }

        private static string GetCellString(IXLRow row, Dictionary<string, int> colMap, params string[] candidateNames)
        {
            foreach (var name in candidateNames)
            {
                if (colMap.TryGetValue(name, out int colIdx))
                {
                    return row.Cell(colIdx).GetString().Trim();
                }
            }
            return "";
        }

        private static string? GetCsvField(CsvReader csv, params string[] candidateNames)
        {
            foreach (var name in candidateNames)
            {
                if (csv.TryGetField(name, out string? val) && !string.IsNullOrWhiteSpace(val))
                {
                    return val.Trim();
                }
            }
            return null;
        }

        private static string? CleanString(string? input)
        {
            if (string.IsNullOrWhiteSpace(input) || input.Equals("NA", StringComparison.OrdinalIgnoreCase) || input.Equals("null", StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }
            return input.Trim();
        }

        private static string NormalizeStatus(string? status)
        {
            if (string.IsNullOrWhiteSpace(status)) return "Open";
            var s = status.Trim().ToLowerInvariant();
            if (s.Contains("close") || s.Contains("resolved")) return "Closed";
            if (s.Contains("wip") || s.Contains("progress") || s.Contains("pending")) return "WIP";
            return "Open";
        }

        private static string NormalizePriority(string? priority)
        {
            if (string.IsNullOrWhiteSpace(priority)) return "Normal";
            var p = priority.Trim().ToLowerInvariant();
            if (p.Contains("urgent") || p.Contains("critical")) return "Urgent";
            if (p.Contains("high")) return "High";
            return "Normal";
        }

        private static DateTime ParseFlexibleDate(string? dateStr, DateTime fallback)
        {
            if (string.IsNullOrWhiteSpace(dateStr)) return fallback;

            string[] formats = {
                "M/d/yyyy", "d/M/yyyy", "yyyy-MM-dd", "MM/dd/yyyy", "dd-MM-yyyy",
                "M/d/yyyy h:mm:ss tt", "d/M/yyyy h:mm:ss tt", "yyyy-MM-ddTHH:mm:ss"
            };

            if (DateTime.TryParseExact(dateStr.Trim(), formats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt))
            {
                return dt;
            }

            if (DateTime.TryParse(dateStr.Trim(), CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt2))
            {
                return dt2;
            }

            return fallback;
        }

        private static (int AgeInDays, string AgeBucket) ComputeAge(DateTime compDate, DateTime? resolutionDate, string status)
        {
            DateTime refDate = (status == "Closed" && resolutionDate.HasValue) ? resolutionDate.Value : DateTime.UtcNow;
            int days = Math.Max(0, (int)(refDate.Date - compDate.Date).TotalDays);

            string bucket;
            if (days <= 7) bucket = "0-7 days";
            else if (days <= 15) bucket = "8-15 days";
            else if (days <= 30) bucket = "16-30 days";
            else if (days <= 60) bucket = "31-60 days";
            else bucket = "> 60 days";

            return (days, bucket);
        }

        private static (bool IsRisk, string? RiskCategory, string? RiskReason) DetectRisk(string? category, string? subcategory, string? remarks)
        {
            var text = $"{category} {subcategory} {remarks}".ToLowerInvariant();

            // 1. Money demand / Extortion / Bribes
            if (text.Contains("पैसा") || text.Contains("रुपये") || text.Contains("money") || text.Contains("bribe") ||
                text.Contains("charge") || text.Contains("cash") || text.Contains("उगाही") || text.Contains("फीस") ||
                (category?.Contains("Monetary", StringComparison.OrdinalIgnoreCase) ?? false))
            {
                return (true, "Money Demand / Extortion", "Beneficiary reported monetary demand, cash charge, or bribe request");
            }

            // 2. Treatment Denial
            if (text.Contains("मना कर दिया") || text.Contains("treatment denial") || text.Contains("refused treatment") ||
                text.Contains("इलाज नहीं") || text.Contains("उपचार नहीं") || text.Contains("denied"))
            {
                return (true, "Treatment Denial", "Hospital or provider denied medical treatment covered under PMJAY");
            }

            // 3. Admission Refusal
            if (text.Contains("भर्ती नहीं") || text.Contains("एडमिट नहीं") || text.Contains("admission refusal") ||
                text.Contains("bed refusal") || text.Contains("bed not available"))
            {
                return (true, "Admission Refusal", "Hospital refused admission or inpatient bed allocation to beneficiary");
            }

            // 4. Card Refusal
            if (text.Contains("कार्ड नहीं माना") || text.Contains("कार्ड रिजेक्ट") || text.Contains("card refusal") ||
                text.Contains("card invalid") || text.Contains("कार्ड अमान्य"))
            {
                return (true, "Card Refusal", "Empanelled hospital refused to honor active Ayushman Golden Card");
            }

            // 5. Approval Delays
            if (text.Contains("pre-auth") || text.Contains("अप्रूवल") || text.Contains("delay") || text.Contains("approval delay") ||
                text.Contains("लंबित") || text.Contains("delayed"))
            {
                return (true, "Approval Delay", "Delays in TMS pre-authorization approval preventing prompt intervention");
            }

            return (false, null, null);
        }
    }
}
