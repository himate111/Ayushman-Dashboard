using System.Collections.Generic;
using System.Threading.Tasks;
using BeneficiaryGrievance.Api.DTOs.Inbound;

namespace BeneficiaryGrievance.Api.Services.Inbound
{
    public interface IInboundDashboardService
    {
        Task<InboundDashboardResponseDto> GetDashboardAsync(InboundFilterDto filter);
        Task<InboundFiltersResponseDto> GetFilterValuesAsync();
        Task<InboundKpiDto> GetKpisAsync(InboundFilterDto filter);
        Task<List<ChartNameValueDto>> GetCallsByYearAsync(InboundFilterDto filter);
        Task<List<MonthlyCallsDto>> GetCallsByMonthAsync(InboundFilterDto filter);
        Task<List<ChartNameValueDto>> GetCallEndAsync(InboundFilterDto filter);
        Task<List<ChartNameValueDto>> GetGroupsAsync(InboundFilterDto filter);
        Task<List<ChartNameValueDto>> GetDispositionsAsync(InboundFilterDto filter);
        Task<List<ChartNameValueDto>> GetTopSubDispositionsAsync(InboundFilterDto filter);
        Task<List<HourlyMetricsDto>> GetHourlyAsync(InboundFilterDto filter);
        Task<List<ChartNameValueDto>> GetShiftsAsync(InboundFilterDto filter);
        Task<List<ChartNameValueDto>> GetConnectedByShiftAsync(InboundFilterDto filter);
        Task<List<ChartNameValueDto>> GetNotConnectedByShiftAsync(InboundFilterDto filter);
        Task<AgentAnalyticsDto> GetAgentAnalyticsAsync(InboundFilterDto filter);
        Task<InboundSummaryDto> GetSummaryAsync(InboundFilterDto filter);
        Task<InboundCallRecordsPagedResponseDto> GetCallRecordsAsync(InboundCallQueryDto query);
        Task<InboundCallRecordDto?> GetCallRecordByIdAsync(long id);
    }
}
