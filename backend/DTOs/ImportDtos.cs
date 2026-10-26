using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Http;

namespace BeneficiaryGrievance.Api.DTOs
{
    public class FileUploadDto
    {
        public IFormFile File { get; set; } = null!;
    }

    public class FileExecuteDto
    {
        public IFormFile File { get; set; } = null!;
        public string? Username { get; set; }
    }

    public class ImportPreviewRowDto
    {
        public long CompId { get; set; }
        public string? CompDate { get; set; }
        public string? Status { get; set; }
        public string? District { get; set; }
        public string? Category { get; set; }
        public string? GrievanceType { get; set; }
        public string? OfficerName { get; set; }
        public string ActionType { get; set; } = "New"; // "New", "Update", "Unchanged", "Invalid"
        public string? ChangeDescription { get; set; }
    }

    public class ImportPreviewResultDto
    {
        public string FileName { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public int TotalRows { get; set; }
        public int NewCount { get; set; }
        public int UpdateCount { get; set; }
        public int UnchangedCount { get; set; }
        public int InvalidCount { get; set; }
        public List<string> ValidationErrors { get; set; } = new();
        public List<ImportPreviewRowDto> SampleRows { get; set; } = new();
    }

    public class ImportExecuteResultDto
    {
        public int BatchId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public int TotalRecords { get; set; }
        public int NewRecordsCount { get; set; }
        public int UpdatedRecordsCount { get; set; }
        public int UnchangedRecordsCount { get; set; }
        public int ErrorRecordsCount { get; set; }
        public string Status { get; set; } = "Completed";
        public long ExecutionTimeMs { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class ImportBatchSummaryDto
    {
        public int Id { get; set; }
        public string FileName { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public int TotalRecords { get; set; }
        public int NewRecordsCount { get; set; }
        public int UpdatedRecordsCount { get; set; }
        public int UnchangedRecordsCount { get; set; }
        public int ErrorRecordsCount { get; set; }
        public string ImportStatus { get; set; } = string.Empty;
        public DateTime ImportDate { get; set; }
        public string ImportedBy { get; set; } = string.Empty;
        public long ExecutionTimeMs { get; set; }
    }

    public class ImportErrorDto
    {
        public int Id { get; set; }
        public int ImportBatchId { get; set; }
        public int RowNumber { get; set; }
        public string? CompId { get; set; }
        public string ErrorMessage { get; set; } = string.Empty;
        public string? RawData { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
