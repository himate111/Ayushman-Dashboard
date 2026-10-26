using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BeneficiaryGrievance.Api.Models
{
    [Table("Grievances")]
    public class Grievance
    {
        [Key]
        public long Id { get; set; }

        public long CompId { get; set; } // Source unique identifier

        [MaxLength(100)]
        public string? CompType { get; set; } = "Beneficiary";

        public DateTime CompDate { get; set; } // Registration Date

        [MaxLength(50)]
        public string? CompTime { get; set; }

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Open"; // Closed, WIP, Open

        [MaxLength(50)]
        public string Priority { get; set; } = "Normal";

        public DateTime? DateOfIncident { get; set; }

        // Citizen Details
        [MaxLength(200)]
        public string? CitizenName { get; set; }

        [MaxLength(50)]
        public string? CitizenMobileNo { get; set; }

        [MaxLength(50)]
        public string? CitizenAadharNo { get; set; }

        [MaxLength(200)]
        public string? CitizenEmailId { get; set; }

        [MaxLength(50)]
        public string? CitizenDOB { get; set; }

        [MaxLength(20)]
        public string? CitizenGender { get; set; }

        // Scheme Details
        [MaxLength(100)]
        public string? CaseNo { get; set; }

        [MaxLength(100)]
        public string? PMJAYId { get; set; }

        [MaxLength(100)]
        public string? ComplaintFor { get; set; } = "PMJAY";

        [MaxLength(150)]
        public string? Department { get; set; }

        // Geography
        [MaxLength(100)]
        public string? BeneficiaryState { get; set; }

        [MaxLength(100)]
        public string? BeneficiaryDistrict { get; set; }

        [MaxLength(300)]
        public string? HospitalName { get; set; }

        [MaxLength(100)]
        public string? HospitalState { get; set; }

        [MaxLength(100)]
        public string? HospitalDistrict { get; set; }

        public string? Address { get; set; }

        // Grievance Details
        [MaxLength(200)]
        public string? GrievanceCategory { get; set; }

        [MaxLength(300)]
        public string? GrievanceType { get; set; }

        public string? CompRemarks { get; set; }

        public string? CSolution { get; set; }

        // Resolution & Assignment
        public DateTime? ResolutionDate { get; set; }

        [MaxLength(50)]
        public string? ResolutionTime { get; set; }

        [MaxLength(200)]
        public string? OfficerName { get; set; }

        [MaxLength(50)]
        public string? OfficerLevel { get; set; }

        public string? OfficerRemarks { get; set; }

        // Intelligence Computed Fields
        public int AgeInDays { get; set; } = 0;

        [MaxLength(50)]
        public string AgeBucket { get; set; } = "0-7 days"; // '0-7 days', '8-15 days', '16-30 days', '31-60 days', '> 60 days'

        public bool IsRiskFlagged { get; set; } = false;

        [MaxLength(100)]
        public string? RiskCategory { get; set; } // Treatment Denial, Money Demand / Extortion, Card Refusal, Approval Delay, Admission Refusal, Other

        [MaxLength(500)]
        public string? RiskReason { get; set; }

        // Audit Tracking
        public int? FirstImportBatchId { get; set; }
        public int? LastImportBatchId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("FirstImportBatchId")]
        public virtual ImportBatch? FirstImportBatch { get; set; }

        [ForeignKey("LastImportBatchId")]
        public virtual ImportBatch? LastImportBatch { get; set; }

        public virtual ICollection<GrievanceStatusHistory> StatusHistory { get; set; } = new List<GrievanceStatusHistory>();
    }
}
