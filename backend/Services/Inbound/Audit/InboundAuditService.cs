using System.Collections.Generic;
using System.Threading.Tasks;
using BeneficiaryGrievance.Api.Data.Inbound;
using BeneficiaryGrievance.Api.DTOs.Inbound;
using BeneficiaryGrievance.Api.DTOs.Inbound.Audit;

namespace BeneficiaryGrievance.Api.Services.Inbound.Audit
{
    public class InboundAuditService : IInboundAuditService
    {
        private readonly IInboundRepository _repository;

        public InboundAuditService(IInboundRepository repository)
        {
            _repository = repository;
        }

        public Task<InboundAuditOverviewResponseDto> GetAuditOverviewAsync(InboundFilterDto filter) =>
            _repository.GetAuditOverviewAsync(filter);

        public Task<List<FieldCompletenessItemDto>> GetFieldCompletenessAsync(InboundFilterDto filter) =>
            _repository.GetFieldCompletenessAsync(filter);

        public Task<List<InboundAuditTrendPointDto>> GetAuditTrendAsync(InboundFilterDto filter) =>
            _repository.GetAuditTrendAsync(filter);

        public Task<InboundStatusConsistencyMatrixDto> GetStatusConsistencyMatrixAsync(InboundFilterDto filter) =>
            _repository.GetStatusConsistencyMatrixAsync(filter);

        public Task<InboundFlaggedCallsPagedResponseDto> GetFlaggedCallRecordsAsync(InboundFlaggedCallsQueryDto query) =>
            _repository.GetFlaggedCallRecordsAsync(query);

        public List<InboundAuditRuleDefinitionDto> GetAuditRuleDefinitions() =>
            _repository.GetAuditRuleDefinitions();
    }
}
