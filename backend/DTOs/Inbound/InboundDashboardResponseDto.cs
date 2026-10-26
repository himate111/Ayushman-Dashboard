namespace BeneficiaryGrievance.Api.DTOs.Inbound
{
    public class InboundDashboardResponseDto
    {
        public bool Success { get; set; } = true;
        public InboundKpiDto Kpis { get; set; } = new();
        public InboundChartsDto Charts { get; set; } = new();
        public AgentAnalyticsDto AgentAnalytics { get; set; } = new();
        public InboundSummaryDto Summary { get; set; } = new();
    }
}
