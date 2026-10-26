using System.Collections.Generic;
using System.Threading.Tasks;
using BeneficiaryGrievance.Api.DTOs.Inbound;
using BeneficiaryGrievance.Api.DTOs.Inbound.Audit;

namespace BeneficiaryGrievance.Api.Data.Inbound
{
    public interface IInboundRepository
    {
        Task<InboundKpiDto> GetKpisAsync(InboundFilterDto filter);
        Task<List<ChartNameValueDto>> GetGroupedChartAsync(string selectExpression, InboundFilterDto filter, string orderBy = "value DESC", int? limit = null);
        Task<List<ChartNameValueDto>> GetShiftMetricChartAsync(InboundFilterDto filter, string metricSql);
        Task<List<AgentPerformanceDto>> GetAgentAnalyticsAsync(InboundFilterDto filter, string direction = "top");
        Task<List<ChartNameValueDto>> GetCallsByYearAsync(InboundFilterDto filter);
        Task<List<MonthlyCallsDto>> GetCallsByMonthAsync(InboundFilterDto filter);
        Task<List<HourlyMetricsDto>> GetHourlyAsync(InboundFilterDto filter);
        Task<List<SummaryShiftMetric>> GetSummaryShiftMetricsAsync(InboundFilterDto filter);
        Task<InboundDataQualityMetrics> GetDataQualityMetricsAsync(InboundFilterDto filter);
        Task<InboundFiltersResponseDto> GetFilterValuesAsync();
        Task<InboundCallRecordsPagedResponseDto> GetCallRecordsAsync(InboundCallQueryDto query);
        Task<InboundCallRecordDto?> GetCallRecordByIdAsync(long id);

        // Phase 4D Inbound Data Quality & Audit
        Task<InboundAuditOverviewResponseDto> GetAuditOverviewAsync(InboundFilterDto filter);
        Task<List<FieldCompletenessItemDto>> GetFieldCompletenessAsync(InboundFilterDto filter);
        Task<List<InboundAuditTrendPointDto>> GetAuditTrendAsync(InboundFilterDto filter);
        Task<InboundStatusConsistencyMatrixDto> GetStatusConsistencyMatrixAsync(InboundFilterDto filter);
        Task<InboundFlaggedCallsPagedResponseDto> GetFlaggedCallRecordsAsync(InboundFlaggedCallsQueryDto query);
        List<InboundAuditRuleDefinitionDto> GetAuditRuleDefinitions();
    }
}
