using Microsoft.AspNetCore.Mvc;
using BeneficiaryGrievance.Api.DTOs;
using BeneficiaryGrievance.Api.Services;

namespace BeneficiaryGrievance.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnalyticsController : ControllerBase
    {
        private readonly IAnalyticsService _analyticsService;

        public AnalyticsController(IAnalyticsService analyticsService)
        {
            _analyticsService = analyticsService;
        }

        [HttpPost("dashboard")]
        public async Task<IActionResult> GetDashboardAnalytics([FromBody] GlobalFilterDto filter)
        {
            var data = await _analyticsService.GetDashboardAnalyticsAsync(filter);
            return Ok(data);
        }

        [HttpGet("filter-options")]
        public async Task<IActionResult> GetFilterOptions()
        {
            var options = await _analyticsService.GetFilterOptionsAsync();
            return Ok(options);
        }

        [HttpGet("data-quality")]
        public async Task<IActionResult> GetDataQuality()
        {
            var stats = await _analyticsService.GetDataQualityStatsAsync();
            return Ok(stats);
        }
    }
}
