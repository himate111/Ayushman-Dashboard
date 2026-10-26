using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BeneficiaryGrievance.Api.Models
{
    [Table("ImportBatches")]
    public class ImportBatch
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(300)]
        public string FileName { get; set; } = string.Empty;

        public long FileSize { get; set; }

        [MaxLength(64)]
        public string? FileHash { get; set; }

        public int TotalRecords { get; set; }
        public int NewRecordsCount { get; set; }
        public int UpdatedRecordsCount { get; set; }
        public int UnchangedRecordsCount { get; set; }
        public int ErrorRecordsCount { get; set; }

        [Required]
        [MaxLength(50)]
        public string ImportStatus { get; set; } = "Completed";

        public DateTime ImportDate { get; set; } = DateTime.UtcNow;

        [Required]
        [MaxLength(100)]
        public string ImportedBy { get; set; } = "System";

        public long ExecutionTimeMs { get; set; }

        public string? SummaryNotes { get; set; }

        public virtual ICollection<ImportError> Errors { get; set; } = new List<ImportError>();
    }

    [Table("ImportErrors")]
    public class ImportError
    {
        [Key]
        public int Id { get; set; }

        public int ImportBatchId { get; set; }

        public int RowNumber { get; set; }

        [MaxLength(50)]
        public string? CompId { get; set; }

        [Required]
        public string ErrorMessage { get; set; } = string.Empty;

        public string? RawData { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("ImportBatchId")]
        public virtual ImportBatch? Batch { get; set; }
    }
}
