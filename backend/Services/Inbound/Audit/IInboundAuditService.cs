using System.Collections.Generic;
using System.Threading.Tasks;
using BeneficiaryGrievance.Api.DTOs.Inbound;
using BeneficiaryGrievance.Api.DTOs.Inbound.Audit;

namespace BeneficiaryGrievance.Api.Services.Inbound.Audit
{
    public interface IInboundAuditService
    {
        Task<InboundAuditOverviewResponseDto> GetAuditOverviewAsync(InboundFilterDto filter);
        Task<List<FieldCompletenessItemDto>> GetFieldCompletenessAsync(InboundFilterDto filter);
        Task<List<InboundAuditTrendPointDto>> GetAuditTrendAsync(InboundFilterDto filter);
        Task<InboundStatusConsistencyMatrixDto> GetStatusConsistencyMatrixAsync(InboundFilterDto filter);
        Task<InboundFlaggedCallsPagedResponseDto> GetFlaggedCallRecordsAsync(InboundFlaggedCallsQueryDto query);
        List<InboundAuditRuleDefinitionDto> GetAuditRuleDefinitions();
    }
}
