using System;
using System.Collections.Generic;

namespace BeneficiaryGrievance.Api.DTOs.Outbound
{
    public class OutboundImportPreviewResultDto
    {
        public string FileName { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public int TotalRows { get; set; }
        public int ValidRows { get; set; }
        public int InvalidRows { get; set; }
        public List<string> RecognizedHeaders { get; set; } = new();
        public List<string> MissingHeaders { get; set; } = new();
        public List<string> ValidationErrors { get; set; } = new();
        public List<Dictionary<string, string>> SampleRows { get; set; } = new();
    }

    public class OutboundImportResultDto
    {
        public long BatchId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public int TotalRows { get; set; }
        public int InsertedRows { get; set; }
        public int DuplicateRows { get; set; }
        public int ErrorRows { get; set; }
        public double DurationSeconds { get; set; }
        public string Status { get; set; } = "Completed";
        public List<string> Errors { get; set; } = new();
    }

    public class OutboundImportBatchDto
    {
        public long Id { get; set; }
        public string FileName { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public int TotalRows { get; set; }
        public int InsertedRows { get; set; }
        public int DuplicateRows { get; set; }
        public int ErrorRows { get; set; }
        public decimal DurationSeconds { get; set; }
        public string Status { get; set; } = string.Empty;
        public string ImportedBy { get; set; } = string.Empty;
        public DateTime ImportedAt { get; set; }
    }

    public class DuplicateImportException : Exception
    {
        public string FileHash { get; }
        public long ExistingBatchId { get; }
        public DateTime ImportedAt { get; }

        public DuplicateImportException(string fileName, string fileHash, long existingBatchId, DateTime importedAt)
            : base($"Duplicate file rejected: An identical file ('{fileName}') was previously imported in Batch #{existingBatchId} on {importedAt:yyyy-MM-dd HH:mm} UTC.")
        {
            FileHash = fileHash;
            ExistingBatchId = existingBatchId;
            ImportedAt = importedAt;
        }
    }

    public class InvalidImportHeaderException : Exception
    {
        public List<string> MissingHeaders { get; }

        public InvalidImportHeaderException(string message, List<string> missingHeaders)
            : base(message)
        {
            MissingHeaders = missingHeaders;
        }
    }
}
