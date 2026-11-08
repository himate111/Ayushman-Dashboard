using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using BeneficiaryGrievance.Api.DTOs.Outbound;
using BeneficiaryGrievance.Api.Services.Outbound;

namespace BeneficiaryGrievance.Api.Controllers.Outbound
{
    [ApiController]
    [Route("api/outbound/import")]
    [Authorize]
    public class OutboundImportController : ControllerBase
    {
        private readonly IOutboundImportService _importService;

        public OutboundImportController(IOutboundImportService importService)
        {
            _importService = importService;
        }

        [HttpPost("preview")]
        public async Task<ActionResult<OutboundImportPreviewResultDto>> Preview([FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Please select a valid CSV file." });

            var result = await _importService.PreviewImportAsync(file);
            return Ok(result);
        }

        [HttpPost("upload")]
        public async Task<ActionResult<OutboundImportResultDto>> Upload([FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Please select a valid CSV file." });

            string username = User.FindFirstValue(ClaimTypes.Name) ?? User.Identity?.Name ?? "User";
            try
            {
                var result = await _importService.ProcessImportAsync(file, username);
                return Ok(result);
            }
            catch (DuplicateImportException ex)
            {
                return StatusCode(StatusCodes.Status409Conflict, new
                {
                    message = ex.Message,
                    fileHash = ex.FileHash,
                    existingBatchId = ex.ExistingBatchId,
                    importedAt = ex.ImportedAt
                });
            }
            catch (InvalidImportHeaderException ex)
            {
                return BadRequest(new
                {
                    message = ex.Message,
                    missingHeaders = ex.MissingHeaders
                });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = $"Import processing error: {ex.Message}" });
            }
        }

        [HttpGet("history")]
        public async Task<ActionResult<List<OutboundImportBatchDto>>> GetHistory([FromQuery] int limit = 20)
        {
            var batches = await _importService.GetImportHistoryAsync(limit);
            return Ok(batches);
        }
    }
}
