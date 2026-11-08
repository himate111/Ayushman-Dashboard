namespace BeneficiaryGrievance.Api.DTOs.Outbound
{
    public class OutboundDashboardResponseDto
    {
        public OutboundKpiDto Kpis { get; set; } = new();
        public OutboundChartsDto Charts { get; set; } = new();
        public OutboundExecutiveSummaryDto ExecutiveSummary { get; set; } = new();
    }
}
