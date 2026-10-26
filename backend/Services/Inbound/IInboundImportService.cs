using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using BeneficiaryGrievance.Api.DTOs.Inbound;

namespace BeneficiaryGrievance.Api.Services.Inbound
{
    public interface IInboundImportService
    {
        Task<InboundImportPreviewResultDto> PreviewImportAsync(IFormFile file);
        Task<InboundImportExecuteResultDto> ExecuteImportAsync(IFormFile file, string username);
        Task<List<InboundImportBatchSummaryDto>> GetImportHistoryAsync();
        Task<List<InboundImportErrorDto>> GetBatchErrorsAsync(int batchId);
    }
}
