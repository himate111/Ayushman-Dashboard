using System.Threading.Tasks;
using BeneficiaryGrievance.Api.DTOs.Outbound;

namespace BeneficiaryGrievance.Api.Services.Outbound
{
    public interface IOutboundDashboardService
    {
        Task<OutboundDashboardResponseDto> GetDashboardAsync(OutboundFilterDto filter);
        Task<OutboundKpiDto> GetKpisAsync(OutboundFilterDto filter);
        Task<OutboundChartsDto> GetChartsAsync(OutboundFilterDto filter);
        Task<OutboundExecutiveSummaryDto> GetExecutiveSummaryAsync(OutboundFilterDto filter);
        Task<OutboundFiltersResponseDto> GetFilterValuesAsync();
        Task<OutboundCallRecordsPagedResponseDto> GetCallRecordsAsync(OutboundCallQueryDto query);
        Task<OutboundCallRecordDto?> GetCallRecordByIdAsync(long id);
        void InvalidateCache();
    }
}
