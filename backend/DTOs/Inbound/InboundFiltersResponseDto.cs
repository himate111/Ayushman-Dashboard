using System.Collections.Generic;

namespace BeneficiaryGrievance.Api.DTOs.Inbound
{
    public class InboundFiltersResponseDto
    {
        public bool Success { get; set; } = true;
        public List<int> Years { get; set; } = new();
        public List<int> Months { get; set; } = new();
        public List<string> Groups { get; set; } = new();
        public List<string> Agents { get; set; } = new();
        public List<string> Dispositions { get; set; } = new();
        public List<string> SubDispositions { get; set; } = new();
        public List<string> Shifts { get; set; } = new();
    }
}
