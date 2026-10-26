using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BeneficiaryGrievance.Api.Models
{
    [Table("GrievanceStatusHistory")]
    public class GrievanceStatusHistory
    {
        [Key]
        public long Id { get; set; }

        public long GrievanceId { get; set; }

        public long CompId { get; set; }

        [MaxLength(50)]
        public string? PreviousStatus { get; set; }

        [Required]
        [MaxLength(50)]
        public string NewStatus { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? PreviousOfficer { get; set; }

        [MaxLength(200)]
        public string? NewOfficer { get; set; }

        public string? Remarks { get; set; }

        public int? ImportBatchId { get; set; }

        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("GrievanceId")]
        public virtual Grievance? Grievance { get; set; }

        [ForeignKey("ImportBatchId")]
        public virtual ImportBatch? Batch { get; set; }
    }
}
