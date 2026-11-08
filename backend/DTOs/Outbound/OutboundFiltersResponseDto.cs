using System.Collections.Generic;

namespace BeneficiaryGrievance.Api.DTOs.Outbound
{
    public class OutboundFiltersResponseDto
    {
        public List<string> Years { get; set; } = new();
        public List<string> Months { get; set; } = new();
        public List<string> GroupNames { get; set; } = new();
        public List<string> Dispositions { get; set; } = new();
        public List<string> SubDispositions { get; set; } = new();
        public List<string> Agents { get; set; } = new();
        public List<string> Shifts { get; set; } = new();
        public List<string> CallTypes { get; set; } = new();
    }
}
