using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using BeneficiaryGrievance.Api.DTOs.Inbound;
using BeneficiaryGrievance.Api.DTOs.Inbound.Audit;
using BeneficiaryGrievance.Api.Services.Inbound.Audit;

namespace BeneficiaryGrievance.Api.Controllers.Inbound
{
    [ApiController]
    [Route("api/inbound/audit")]
    public class InboundAuditController : ControllerBase
    {
        private readonly IInboundAuditService _auditService;

        public InboundAuditController(IInboundAuditService auditService)
        {
            _auditService = auditService;
        }

        [HttpGet("overview")]
        public async Task<IActionResult> GetOverview([FromQuery] InboundFilterDto filter)
        {
            var data = await _auditService.GetAuditOverviewAsync(filter);
            return Ok(data);
        }

        [HttpGet("field-completeness")]
        public async Task<IActionResult> GetFieldCompleteness([FromQuery] InboundFilterDto filter)
        {
            var data = await _auditService.GetFieldCompletenessAsync(filter);
            return Ok(data);
        }

        [HttpGet("trend")]
        public async Task<IActionResult> GetTrend([FromQuery] InboundFilterDto filter)
        {
            var data = await _auditService.GetAuditTrendAsync(filter);
            return Ok(data);
        }

        [HttpGet("consistency")]
        public async Task<IActionResult> GetConsistencyMatrix([FromQuery] InboundFilterDto filter)
        {
            var data = await _auditService.GetStatusConsistencyMatrixAsync(filter);
            return Ok(data);
        }

        [HttpGet("flagged-calls")]
        public async Task<IActionResult> GetFlaggedCalls([FromQuery] InboundFlaggedCallsQueryDto query)
        {
            var data = await _auditService.GetFlaggedCallRecordsAsync(query);
            return Ok(data);
        }

        [HttpGet("rules")]
        public IActionResult GetRules()
        {
            var data = _auditService.GetAuditRuleDefinitions();
            return Ok(data);
        }
    }
}
