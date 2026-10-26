using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using BeneficiaryGrievance.Api.DTOs.Inbound;
using BeneficiaryGrievance.Api.Services.Inbound;

namespace BeneficiaryGrievance.Api.Controllers.Inbound
{
    [ApiController]
    [Route("api/inbound")]
    public class InboundDashboardController : ControllerBase
    {
        private readonly IInboundDashboardService _dashboardService;

        public InboundDashboardController(IInboundDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard([FromQuery] InboundFilterDto filter)
        {
            var data = await _dashboardService.GetDashboardAsync(filter);
            return Ok(data);
        }

        [HttpGet("filters")]
        public async Task<IActionResult> GetFilterValues()
        {
            var data = await _dashboardService.GetFilterValuesAsync();
            return Ok(data);
        }

        [HttpGet("kpis")]
        public async Task<IActionResult> GetKpis([FromQuery] InboundFilterDto filter)
        {
            var data = await _dashboardService.GetKpisAsync(filter);
            return Ok(data);
        }

        [HttpGet("charts/by-year")]
        public async Task<IActionResult> GetCallsByYear([FromQuery] InboundFilterDto filter)
        {
            var data = await _dashboardService.GetCallsByYearAsync(filter);
            return Ok(data);
        }

        [HttpGet("charts/by-month")]
        public async Task<IActionResult> GetCallsByMonth([FromQuery] InboundFilterDto filter)
        {
            var data = await _dashboardService.GetCallsByMonthAsync(filter);
            return Ok(data);
        }

        [HttpGet("charts/call-end")]
        public async Task<IActionResult> GetCallEnd([FromQuery] InboundFilterDto filter)
        {
            var data = await _dashboardService.GetCallEndAsync(filter);
            return Ok(data);
        }

        [HttpGet("charts/groups")]
        public async Task<IActionResult> GetGroups([FromQuery] InboundFilterDto filter)
        {
            var data = await _dashboardService.GetGroupsAsync(filter);
            return Ok(data);
        }

        [HttpGet("charts/dispositions")]
        public async Task<IActionResult> GetDispositions([FromQuery] InboundFilterDto filter)
        {
            var data = await _dashboardService.GetDispositionsAsync(filter);
            return Ok(data);
        }

        [HttpGet("charts/top-sub-dispositions")]
        public async Task<IActionResult> GetTopSubDispositions([FromQuery] InboundFilterDto filter)
        {
            var data = await _dashboardService.GetTopSubDispositionsAsync(filter);
            return Ok(data);
        }

        [HttpGet("charts/hourly")]
        public async Task<IActionResult> GetHourly([FromQuery] InboundFilterDto filter)
        {
            var data = await _dashboardService.GetHourlyAsync(filter);
            return Ok(data);
        }

        [HttpGet("charts/shifts")]
        public async Task<IActionResult> GetShifts([FromQuery] InboundFilterDto filter)
        {
            var data = await _dashboardService.GetShiftsAsync(filter);
            return Ok(data);
        }

        [HttpGet("charts/connected-by-shift")]
        public async Task<IActionResult> GetConnectedByShift([FromQuery] InboundFilterDto filter)
        {
            var data = await _dashboardService.GetConnectedByShiftAsync(filter);
            return Ok(data);
        }

        [HttpGet("charts/not-connected-by-shift")]
        public async Task<IActionResult> GetNotConnectedByShift([FromQuery] InboundFilterDto filter)
        {
            var data = await _dashboardService.GetNotConnectedByShiftAsync(filter);
            return Ok(data);
        }

        [HttpGet("agents")]
        public async Task<IActionResult> GetAgents([FromQuery] InboundFilterDto filter)
        {
            var data = await _dashboardService.GetAgentAnalyticsAsync(filter);
            return Ok(data);
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary([FromQuery] InboundFilterDto filter)
        {
            var data = await _dashboardService.GetSummaryAsync(filter);
            return Ok(data);
        }

        [HttpGet("calls")]
        public async Task<IActionResult> GetCalls([FromQuery] InboundCallQueryDto query)
        {
            var data = await _dashboardService.GetCallRecordsAsync(query);
            return Ok(data);
        }

        [HttpGet("calls/{id:long}")]
        public async Task<IActionResult> GetCallById(long id)
        {
            var data = await _dashboardService.GetCallRecordByIdAsync(id);
            if (data == null)
            {
                return NotFound(new { message = $"Call record with ID {id} was not found." });
            }
            return Ok(data);
        }
    }
}
