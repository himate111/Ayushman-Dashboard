using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BeneficiaryGrievance.Api.Models
{
    [Table("GrievanceCategories")]
    public class GrievanceCategory
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string CategoryName { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        [Required]
        [MaxLength(50)]
        public string DefaultPriority { get; set; } = "Normal";

        public bool IsHighRisk { get; set; } = false;

        [MaxLength(500)]
        public string? RiskKeywordRule { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
