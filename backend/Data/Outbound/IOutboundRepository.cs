using System.Collections.Generic;
using System.Threading.Tasks;
using BeneficiaryGrievance.Api.DTOs.Outbound;

namespace BeneficiaryGrievance.Api.Data.Outbound
{
    public interface IOutboundRepository
    {
        Task<OutboundKpiDto> GetKpisAsync(OutboundFilterDto filter);
        Task<OutboundChartsDto> GetChartsAsync(OutboundFilterDto filter);
        Task<OutboundExecutiveSummaryDto> GetExecutiveSummaryAsync(OutboundFilterDto filter);
        Task<OutboundFiltersResponseDto> GetFilterValuesAsync();
        Task<OutboundCallRecordsPagedResponseDto> GetCallRecordsAsync(OutboundCallQueryDto query);
        Task<OutboundCallRecordDto?> GetCallRecordByIdAsync(long id);
    }
}
