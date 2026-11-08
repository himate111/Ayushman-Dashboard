using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using BeneficiaryGrievance.Api.DTOs.Outbound;

namespace BeneficiaryGrievance.Api.Services.Outbound
{
    public interface IOutboundImportService
    {
        Task<OutboundImportPreviewResultDto> PreviewImportAsync(IFormFile file);
        Task<OutboundImportResultDto> ProcessImportAsync(IFormFile file, string username);
        Task<List<OutboundImportBatchDto>> GetImportHistoryAsync(int limit = 20);
    }
}
