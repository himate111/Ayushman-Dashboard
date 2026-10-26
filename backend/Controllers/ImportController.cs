
using Microsoft.AspNetCore.Mvc;
using BeneficiaryGrievance.Api.DTOs;
using BeneficiaryGrievance.Api.Services;

namespace BeneficiaryGrievance.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ImportController : ControllerBase
    {
        private readonly IImportService _importService;
        private readonly ILogger<ImportController> _logger;

        public ImportController(
            IImportService importService,
            ILogger<ImportController> logger)
        {
            _importService = importService;
            _logger = logger;
        }

        // Preview Excel / CSV before importing
        [HttpPost("preview")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(100_000_000)]
        public async Task<IActionResult> PreviewFile([FromForm] FileUploadDto dto)
        {
            var file = dto?.File;
            if (file == null || file.Length == 0)
            {
                return BadRequest(new
                {
                    message = "No file uploaded or file is empty."
                });
            }

            try
            {
                var preview = await _importService.PreviewImportAsync(file);
                return Ok(preview);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error previewing import file");

                return BadRequest(new
                {
                    message = $"Failed to preview file: {ex.Message}"
                });
            }
        }

        // Execute Excel / CSV import
        [HttpPost("execute")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(100_000_000)]
        public async Task<IActionResult> ExecuteImport([FromForm] FileExecuteDto dto)
        {
            var file = dto?.File;
            var username = dto?.Username;
            if (file == null || file.Length == 0)
            {
                return BadRequest(new
                {
                    message = "No file uploaded or file is empty."
                });
            }

            try
            {
                var user = !string.IsNullOrWhiteSpace(username)
                    ? username
                    : (User.Identity?.Name ?? "Administrator");

                var result = await _importService.ExecuteImportAsync(file, user);

                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Validation failure executing import file");
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing import file");

                return StatusCode(500, new
                {
                    message = $"Failed to import file: {ex.Message}"
                });
            }
        }

        // Retrieve upload history
        [HttpGet("history")]
        public async Task<IActionResult> GetHistory()
        {
            var history = await _importService.GetImportHistoryAsync();
            return Ok(history);
        }

        // Retrieve errors for a specific upload
        [HttpGet("errors/{batchId}")]
        public async Task<IActionResult> GetErrors(int batchId)
        {
            var errors = await _importService.GetBatchErrorsAsync(batchId);
            return Ok(errors);
        }
    }
}
