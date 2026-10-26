using Microsoft.AspNetCore.Http;
using BeneficiaryGrievance.Api.DTOs;

namespace BeneficiaryGrievance.Api.Services
{
    public interface IImportService
    {
        Task<ImportPreviewResultDto> PreviewImportAsync(IFormFile file);
        Task<ImportExecuteResultDto> ExecuteImportAsync(IFormFile file, string username);
        Task<List<ImportBatchSummaryDto>> GetImportHistoryAsync();
        Task<List<ImportErrorDto>> GetBatchErrorsAsync(int batchId);
    }
}
