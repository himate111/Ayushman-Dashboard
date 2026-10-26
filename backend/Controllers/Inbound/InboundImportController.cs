using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using BeneficiaryGrievance.Api.DTOs.Inbound;
using BeneficiaryGrievance.Api.Services.Inbound;

namespace BeneficiaryGrievance.Api.Controllers.Inbound
{
    [ApiController]
    [Route("api/inbound/import")]
    public class InboundImportController : ControllerBase
    {
        private readonly IInboundImportService _importService;
        private readonly ILogger<InboundImportController> _logger;

        public InboundImportController(IInboundImportService importService, ILogger<InboundImportController> logger)
        {
            _importService = importService;
            _logger = logger;
        }

        // Preview telephony Excel / CSV before importing
        [HttpPost("preview")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(100_000_000)]
        public async Task<IActionResult> PreviewFile([FromForm] InboundFileUploadDto dto)
        {
            var file = dto?.File;
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "No file uploaded or file is empty." });
            }

            try
            {
                var preview = await _importService.PreviewImportAsync(file);
                return Ok(preview);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error previewing inbound import file {FileName}", file.FileName);
                return BadRequest(new { message = $"Failed to preview telephony file: {ex.Message}" });
            }
        }

        // Execute telephony Excel / CSV import into SQL Server
        [HttpPost("execute")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(100_000_000)]
        public async Task<IActionResult> ExecuteImport([FromForm] InboundFileExecuteDto dto)
        {
            var file = dto?.File;
            var username = dto?.Username;
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "No file uploaded or file is empty." });
            }

            try
            {
                var user = !string.IsNullOrWhiteSpace(username)
                    ? username
                    : (User.Identity?.Name ?? "Telephony Administrator");

                var result = await _importService.ExecuteImportAsync(file, user);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Validation failure executing inbound import for {FileName}", file.FileName);
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing inbound import file {FileName}", file.FileName);
                return StatusCode(500, new { message = $"Failed to import telephony file: {ex.Message}" });
            }
        }

        // Retrieve inbound upload history
        [HttpGet("history")]
        public async Task<IActionResult> GetHistory()
        {
            var history = await _importService.GetImportHistoryAsync();
            return Ok(history);
        }

        // Retrieve validation errors for a specific upload batch
        [HttpGet("errors/{batchId}")]
        public async Task<IActionResult> GetErrors(int batchId)
        {
            var errors = await _importService.GetBatchErrorsAsync(batchId);
            return Ok(errors);
        }
    }
}
