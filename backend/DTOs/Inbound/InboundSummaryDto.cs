using System.Collections.Generic;

namespace BeneficiaryGrievance.Api.DTOs.Inbound
{
    public class InboundSummaryDto
    {
        public List<string> Executive { get; set; } = new();
        public List<string> Issues { get; set; } = new();
        public List<string> DataQuality { get; set; } = new();
        public List<string> Recommendations { get; set; } = new();
    }
}
