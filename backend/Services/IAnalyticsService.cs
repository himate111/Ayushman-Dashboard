using BeneficiaryGrievance.Api.DTOs;

namespace BeneficiaryGrievance.Api.Services
{
    public interface IAnalyticsService
    {
        Task<DashboardAnalyticsResponseDto> GetDashboardAnalyticsAsync(GlobalFilterDto filter);
        Task<FilterLookupOptionsDto> GetFilterOptionsAsync();
        Task<DataQualityStatsDto> GetDataQualityStatsAsync();
    }
}
