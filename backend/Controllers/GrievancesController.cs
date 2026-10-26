using Microsoft.AspNetCore.Mvc;
using BeneficiaryGrievance.Api.DTOs;
using BeneficiaryGrievance.Api.Services;

namespace BeneficiaryGrievance.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GrievancesController : ControllerBase
    {
        private readonly IGrievanceService _grievanceService;

        public GrievancesController(IGrievanceService grievanceService)
        {
            _grievanceService = grievanceService;
        }

        [HttpPost("search")]
        public async Task<IActionResult> SearchGrievances([FromBody] GrievanceQueryDto query)
        {
            var result = await _grievanceService.GetGrievancesPagedAsync(query);
            return Ok(result);
        }

        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetById(long id)
        {
            var result = await _grievanceService.GetGrievanceByIdAsync(id);
            if (result == null) return NotFound(new { message = $"Grievance #{id} not found." });
            return Ok(result);
        }

        [HttpGet("by-comp-id/{compId:long}")]
        public async Task<IActionResult> GetByCompId(long compId)
        {
            var result = await _grievanceService.GetGrievanceByCompIdAsync(compId);
            if (result == null) return NotFound(new { message = $"Grievance with CompId {compId} not found." });
            return Ok(result);
        }
    }
}
