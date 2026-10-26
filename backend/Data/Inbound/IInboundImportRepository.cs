using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Data.SqlClient;
using BeneficiaryGrievance.Api.DTOs.Inbound;

namespace BeneficiaryGrievance.Api.Data.Inbound
{
    public record InboundCallRawRecord(
        long Id,
        string? DidNo,
        string? GroupName,
        string CalledNo,
        DateTime CallTime,
        TimeSpan RingDuration,
        TimeSpan IvrDuration,
        TimeSpan QueueDuration,
        TimeSpan AgentDuration,
        TimeSpan HoldDuration,
        TimeSpan TotalDuration,
        string CallEnd,
        string AgentId,
        string CallType,
        string Acd,
        string Disposition,
        string SubDisposition,
        string Shift,
        int CallHour,
        DateTime CreatedAt,
        int RowNumber
    );

    public record InboundImportErrorRecord(
        int RowNumber,
        string? CallIdentifier,
        string ErrorMessage,
        string? RawData
    );

    public interface IInboundImportRepository
    {
        string ConnectionString { get; }
        SqlConnection CreateConnection();

        Task<InboundImportBatchSummaryDto?> GetPreviousBatchByHashAsync(string fileHash);
        Task<HashSet<long>> GetExistingCallIdsAsync(IEnumerable<long> candidateIds);
        Task<HashSet<string>> GetExistingCompositeKeysAsync(IEnumerable<(DateTime CallTime, string CalledNo, string AgentId)> candidates);
        
        Task<long> GetNextCallIdAsync(SqlConnection conn, SqlTransaction trans);
        Task<int> CreateBatchRecordAsync(string fileName, long fileSize, string fileHash, int totalRecords, string importedBy);
        Task InsertCallRecordsBatchAsync(SqlConnection conn, SqlTransaction trans, List<InboundCallRawRecord> records);
        Task InsertBatchErrorsAsync(SqlConnection conn, SqlTransaction trans, int batchId, List<InboundImportErrorRecord> errors);
        Task UpdateBatchStatusAsync(SqlConnection conn, SqlTransaction trans, int batchId, int newCount, int duplicateCount, int errorCount, string status, long executionTimeMs, string notes);
        
        Task<List<InboundImportBatchSummaryDto>> GetImportHistoryAsync();
        Task<List<InboundImportErrorDto>> GetBatchErrorsAsync(int batchId);
    }
}
