using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BeneficiaryGrievance.Api.DTOs.Outbound;
using BeneficiaryGrievance.Api.Services.Outbound;

namespace BeneficiaryGrievance.Api.Controllers.Outbound
{
    [ApiController]
    [Route("api/outbound/dashboard")]
    [Authorize]
    public class OutboundDashboardController : ControllerBase
    {
        private readonly IOutboundDashboardService _dashboardService;

        public OutboundDashboardController(IOutboundDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        [HttpGet]
        public async Task<ActionResult<OutboundDashboardResponseDto>> GetDashboard([FromQuery] OutboundFilterDto filter)
        {
            var data = await _dashboardService.GetDashboardAsync(filter);
            return Ok(data);
        }

        [HttpGet("kpis")]
        public async Task<ActionResult<OutboundKpiDto>> GetKpis([FromQuery] OutboundFilterDto filter)
        {
            var data = await _dashboardService.GetKpisAsync(filter);
            return Ok(data);
        }

        [HttpGet("charts")]
        public async Task<ActionResult<OutboundChartsDto>> GetCharts([FromQuery] OutboundFilterDto filter)
        {
            var data = await _dashboardService.GetChartsAsync(filter);
            return Ok(data);
        }

        [HttpGet("summary")]
        [HttpGet("insights")]
        [HttpGet("~/api/outbound/insights")]
        public async Task<ActionResult<OutboundExecutiveSummaryDto>> GetExecutiveSummary([FromQuery] OutboundFilterDto filter)
        {
            var data = await _dashboardService.GetExecutiveSummaryAsync(filter);
            return Ok(data);
        }

        [HttpGet("filter-options")]
        [HttpGet("filters")]
        public async Task<ActionResult<OutboundFiltersResponseDto>> GetFilterOptions()
        {
            var data = await _dashboardService.GetFilterValuesAsync();
            return Ok(data);
        }

        [HttpGet("records")]
        [HttpGet("calls")]
        [HttpGet("~/api/outbound/calls")]
        public async Task<ActionResult<OutboundCallRecordsPagedResponseDto>> GetCallRecords([FromQuery] OutboundCallQueryDto query)
        {
            var data = await _dashboardService.GetCallRecordsAsync(query);
            return Ok(data);
        }

        [HttpGet("records/{id}")]
        [HttpGet("calls/{id}")]
        [HttpGet("~/api/outbound/calls/{id}")]
        public async Task<ActionResult<OutboundCallRecordDto>> GetCallRecordById(long id)
        {
            var data = await _dashboardService.GetCallRecordByIdAsync(id);
            if (data == null) return NotFound(new { message = $"Call record with ID {id} not found." });
            return Ok(data);
        }
    }
}
