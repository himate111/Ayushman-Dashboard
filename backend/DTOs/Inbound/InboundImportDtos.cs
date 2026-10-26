using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Http;

namespace BeneficiaryGrievance.Api.DTOs.Inbound
{
    public class InboundFileUploadDto
    {
        public IFormFile File { get; set; } = null!;
    }

    public class InboundFileExecuteDto
    {
        public IFormFile File { get; set; } = null!;
        public string? Username { get; set; }
    }

    public class InboundImportPreviewRowDto
    {
        public long? CallId { get; set; }
        public string? DidNo { get; set; }
        public string? GroupName { get; set; }
        public string MaskedCallerNo { get; set; } = string.Empty;
        public string? CallTime { get; set; }
        public string? TotalDuration { get; set; }
        public string? AgentDuration { get; set; }
        public string? QueueDuration { get; set; }
        public string? CallEnd { get; set; }
        public string? AgentId { get; set; }
        public string? Disposition { get; set; }
        public string? SubDisposition { get; set; }
        public string? Shift { get; set; }
        public int? CallHour { get; set; }
        public string ActionType { get; set; } = "New"; // "New", "Duplicate", "Invalid"
        public string? ChangeDescription { get; set; }
    }

    public class InboundImportPreviewResultDto
    {
        public string FileName { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public int TotalRows { get; set; }
        public int NewCount { get; set; }
        public int DuplicateCount { get; set; }
        public int InvalidCount { get; set; }
        public List<string> ValidationErrors { get; set; } = new();
        public List<InboundImportPreviewRowDto> SampleRows { get; set; } = new();
    }

    public class InboundImportExecuteResultDto
    {
        public int BatchId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public int TotalRecords { get; set; }
        public int NewRecordsCount { get; set; }
        public int DuplicateRecordsCount { get; set; }
        public int ErrorRecordsCount { get; set; }
        public string Status { get; set; } = "Completed";
        public long ExecutionTimeMs { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public class InboundImportBatchSummaryDto
    {
        public int Id { get; set; }
        public string FileName { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public int TotalRecords { get; set; }
        public int NewRecordsCount { get; set; }
        public int DuplicateRecordsCount { get; set; }
        public int InvalidRecordsCount { get; set; }
        public string ImportStatus { get; set; } = string.Empty;
        public DateTime ImportDate { get; set; }
        public string ImportedBy { get; set; } = string.Empty;
        public long ExecutionTimeMs { get; set; }
    }

    public class InboundImportErrorDto
    {
        public int Id { get; set; }
        public int ImportBatchId { get; set; }
        public int RowNumber { get; set; }
        public string? CallIdentifier { get; set; }
        public string ErrorMessage { get; set; } = string.Empty;
        public string? RawData { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
