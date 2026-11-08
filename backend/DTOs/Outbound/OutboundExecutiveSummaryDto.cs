using System.Collections.Generic;

namespace BeneficiaryGrievance.Api.DTOs.Outbound
{
    public class OutboundDataQualityObservationDto
    {
        public string Name { get; set; } = string.Empty;
        public long Count { get; set; }
        public string Severity { get; set; } = "Minor";
        public string Impact { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public bool IsIssue { get; set; } = true;
    }

    public class OutboundExecutiveSummaryDto
    {
        public string Summary { get; set; } = string.Empty;
        public string Status { get; set; } = "Healthy"; // Healthy, Attention, Critical
        public int HealthScore { get; set; } = 100;
        public List<string> Highlights { get; set; } = new();
        public List<string> Risks { get; set; } = new();
        public List<OutboundDataQualityObservationDto> DataQuality { get; set; } = new();
        public List<string> Recommendations { get; set; } = new();

        // Compatibility properties
        public List<string> KeyFindings { get; set; } = new();
        public List<string> Observations { get; set; } = new();
        public List<string> Anomalies { get; set; } = new();
    }
}
