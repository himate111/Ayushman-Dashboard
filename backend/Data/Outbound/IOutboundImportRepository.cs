using System.Collections.Generic;
using System.Threading.Tasks;
using BeneficiaryGrievance.Api.DTOs.Outbound;

namespace BeneficiaryGrievance.Api.Data.Outbound
{
    public interface IOutboundImportRepository
    {
        Task<OutboundImportBatchDto?> GetPreviousBatchByHashAsync(string fileHash);
        Task<long> CreateBatchAsync(string fileName, long fileSize, string fileHash, int totalRows, string importedBy);
        Task<(long BatchId, OutboundImportBatchDto? ExistingBatch)> CreateBatchIfNotDuplicateAsync(string fileName, long fileSize, string fileHash, int totalRows, string importedBy);
        Task UpdateBatchAsync(long batchId, int insertedRows, int duplicateRows, int errorRows, double durationSeconds, string status);
        Task LogErrorAsync(long batchId, int rowNumber, string? rawData, string errorMessage);
        Task<List<OutboundImportBatchDto>> GetImportHistoryAsync(int limit = 20);
    }
}
