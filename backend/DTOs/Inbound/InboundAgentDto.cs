using System.Collections.Generic;

namespace BeneficiaryGrievance.Api.DTOs.Inbound
{
    public class AgentPerformanceDto
    {
        public string Agent { get; set; } = string.Empty;
        public long TotalCalls { get; set; }
        public long ConnectedCalls { get; set; }
        public double ConnectionRate { get; set; }
        public double AvgAgentDurationSeconds { get; set; }
        public string AvgAgentDuration { get; set; } = "0s";
    }

    public class AgentAnalyticsDto
    {
        public List<AgentPerformanceDto> TopAgents { get; set; } = new();
        public List<AgentPerformanceDto> BottomAgents { get; set; } = new();
    }
}
