using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using BeneficiaryGrievance.Api.DTOs.Outbound;

namespace BeneficiaryGrievance.Api.Data.Outbound
{
    public class OutboundImportRepository : IOutboundImportRepository
    {
        private readonly string _connectionString;

        public OutboundImportRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("OutboundConnection")
                ?? configuration.GetConnectionString("InboundConnection")
                ?? throw new InvalidOperationException("Connection string 'OutboundConnection' not configured.");
        }

        private SqlConnection GetConnection() => new SqlConnection(_connectionString);

        public async Task<OutboundImportBatchDto?> GetPreviousBatchByHashAsync(string fileHash)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();

            string sql = @"
                SELECT TOP 1 id, file_name, file_size, total_rows, inserted_rows, duplicate_rows, error_rows, duration_seconds, status, imported_by, imported_at
                FROM dbo.outbound_import_batches WITH (NOLOCK)
                WHERE file_hash = @FileHash AND status = 'Completed'
                ORDER BY id DESC;";

            using var cmd = new SqlCommand(sql, conn);
            cmd.CommandTimeout = 90;
            cmd.Parameters.Add(new SqlParameter("@FileHash", SqlDbType.NVarChar, 64) { Value = fileHash });

            using var r = await cmd.ExecuteReaderAsync();
            if (await r.ReadAsync())
            {
                return new OutboundImportBatchDto
                {
                    Id = Convert.ToInt64(r[0]),
                    FileName = r.IsDBNull(1) ? string.Empty : r.GetString(1),
                    FileSize = r.IsDBNull(2) ? 0L : Convert.ToInt64(r[2]),
                    TotalRows = r.IsDBNull(3) ? 0 : Convert.ToInt32(r[3]),
                    InsertedRows = r.IsDBNull(4) ? 0 : Convert.ToInt32(r[4]),
                    DuplicateRows = r.IsDBNull(5) ? 0 : Convert.ToInt32(r[5]),
                    ErrorRows = r.IsDBNull(6) ? 0 : Convert.ToInt32(r[6]),
                    DurationSeconds = r.IsDBNull(7) ? 0m : Convert.ToDecimal(r[7]),
                    Status = r.IsDBNull(8) ? string.Empty : r.GetString(8),
                    ImportedBy = r.IsDBNull(9) ? string.Empty : r.GetString(9),
                    ImportedAt = r.IsDBNull(10) ? DateTime.UtcNow : Convert.ToDateTime(r[10])
                };
            }

            return null;
        }

        public async Task<long> CreateBatchAsync(string fileName, long fileSize, string fileHash, int totalRows, string importedBy)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();

            string sql = @"
                INSERT INTO dbo.outbound_import_batches (
                    file_name, file_size, file_hash, total_rows, inserted_rows, duplicate_rows, error_rows, duration_seconds, status, imported_by, imported_at
                )
                OUTPUT INSERTED.id
                VALUES (
                    @FileName, @FileSize, @FileHash, @TotalRows, 0, 0, 0, 0, 'Processing', @ImportedBy, SYSUTCDATETIME()
                );";

            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.Add(new SqlParameter("@FileName", SqlDbType.NVarChar, 255) { Value = fileName });
            cmd.Parameters.Add(new SqlParameter("@FileSize", SqlDbType.BigInt) { Value = fileSize });
            cmd.Parameters.Add(new SqlParameter("@FileHash", SqlDbType.NVarChar, 64) { Value = fileHash });
            cmd.Parameters.Add(new SqlParameter("@TotalRows", SqlDbType.Int) { Value = totalRows });
            cmd.Parameters.Add(new SqlParameter("@ImportedBy", SqlDbType.NVarChar, 100) { Value = importedBy });

            return Convert.ToInt64(await cmd.ExecuteScalarAsync());
        }

        public async Task<(long BatchId, OutboundImportBatchDto? ExistingBatch)> CreateBatchIfNotDuplicateAsync(
            string fileName, long fileSize, string fileHash, int totalRows, string importedBy)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();
            using var tran = conn.BeginTransaction(IsolationLevel.Serializable);

            string checkSql = @"
                SELECT TOP 1 id, file_name, file_size, total_rows, inserted_rows, duplicate_rows, error_rows, duration_seconds, status, imported_by, imported_at
                FROM dbo.outbound_import_batches WITH (UPDLOCK, HOLDLOCK)
                WHERE file_hash = @FileHash AND status IN ('Completed', 'Processing')
                ORDER BY id DESC;";

            OutboundImportBatchDto? existing = null;
            using (var checkCmd = new SqlCommand(checkSql, conn, tran))
            {
                checkCmd.Parameters.Add(new SqlParameter("@FileHash", SqlDbType.NVarChar, 64) { Value = fileHash });
                using (var r = await checkCmd.ExecuteReaderAsync())
                {
                    if (await r.ReadAsync())
                    {
                        existing = new OutboundImportBatchDto
                        {
                            Id = Convert.ToInt64(r[0]),
                            FileName = r.IsDBNull(1) ? string.Empty : r.GetString(1),
                            FileSize = r.IsDBNull(2) ? 0L : Convert.ToInt64(r[2]),
                            TotalRows = r.IsDBNull(3) ? 0 : Convert.ToInt32(r[3]),
                            InsertedRows = r.IsDBNull(4) ? 0 : Convert.ToInt32(r[4]),
                            DuplicateRows = r.IsDBNull(5) ? 0 : Convert.ToInt32(r[5]),
                            ErrorRows = r.IsDBNull(6) ? 0 : Convert.ToInt32(r[6]),
                            DurationSeconds = r.IsDBNull(7) ? 0m : Convert.ToDecimal(r[7]),
                            Status = r.IsDBNull(8) ? string.Empty : r.GetString(8),
                            ImportedBy = r.IsDBNull(9) ? string.Empty : r.GetString(9),
                            ImportedAt = r.IsDBNull(10) ? DateTime.UtcNow : Convert.ToDateTime(r[10])
                        };
                    }
                }
            }

            if (existing != null)
            {
                await tran.RollbackAsync();
                return (0, existing);
            }

            string insertSql = @"
                INSERT INTO dbo.outbound_import_batches (
                    file_name, file_size, file_hash, total_rows, inserted_rows, duplicate_rows, error_rows, duration_seconds, status, imported_by, imported_at
                )
                OUTPUT INSERTED.id
                VALUES (
                    @FileName, @FileSize, @FileHash, @TotalRows, 0, 0, 0, 0, 'Processing', @ImportedBy, SYSUTCDATETIME()
                );";

            long batchId;
            using (var insertCmd = new SqlCommand(insertSql, conn, tran))
            {
                insertCmd.Parameters.Add(new SqlParameter("@FileName", SqlDbType.NVarChar, 255) { Value = fileName });
                insertCmd.Parameters.Add(new SqlParameter("@FileSize", SqlDbType.BigInt) { Value = fileSize });
                insertCmd.Parameters.Add(new SqlParameter("@FileHash", SqlDbType.NVarChar, 64) { Value = fileHash });
                insertCmd.Parameters.Add(new SqlParameter("@TotalRows", SqlDbType.Int) { Value = totalRows });
                insertCmd.Parameters.Add(new SqlParameter("@ImportedBy", SqlDbType.NVarChar, 100) { Value = importedBy });
                batchId = Convert.ToInt64(await insertCmd.ExecuteScalarAsync());
            }

            await tran.CommitAsync();
            return (batchId, null);
        }

        public async Task UpdateBatchAsync(long batchId, int insertedRows, int duplicateRows, int errorRows, double durationSeconds, string status)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();

            string sql = @"
                UPDATE dbo.outbound_import_batches
                SET inserted_rows = @InsertedRows,
                    duplicate_rows = @DuplicateRows,
                    error_rows = @ErrorRows,
                    duration_seconds = @DurationSeconds,
                    status = @Status
                WHERE id = @BatchId;";

            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.Add(new SqlParameter("@BatchId", SqlDbType.BigInt) { Value = batchId });
            cmd.Parameters.Add(new SqlParameter("@InsertedRows", SqlDbType.Int) { Value = insertedRows });
            cmd.Parameters.Add(new SqlParameter("@DuplicateRows", SqlDbType.Int) { Value = duplicateRows });
            cmd.Parameters.Add(new SqlParameter("@ErrorRows", SqlDbType.Int) { Value = errorRows });
            cmd.Parameters.Add(new SqlParameter("@DurationSeconds", SqlDbType.Decimal) { Precision = 10, Scale = 2, Value = Convert.ToDecimal(durationSeconds) });
            cmd.Parameters.Add(new SqlParameter("@Status", SqlDbType.NVarChar, 50) { Value = status });

            await cmd.ExecuteNonQueryAsync();
        }

        public async Task LogErrorAsync(long batchId, int rowNumber, string? rawData, string errorMessage)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();

            string sql = @"
                INSERT INTO dbo.outbound_import_errors (batch_id, row_number, raw_data, error_message, created_at)
                VALUES (@BatchId, @RowNumber, @RawData, @ErrorMessage, SYSUTCDATETIME());";

            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.Add(new SqlParameter("@BatchId", SqlDbType.BigInt) { Value = batchId });
            cmd.Parameters.Add(new SqlParameter("@RowNumber", SqlDbType.Int) { Value = rowNumber });
            cmd.Parameters.Add(new SqlParameter("@RawData", SqlDbType.NVarChar, -1) { Value = (object?)rawData ?? DBNull.Value });
            cmd.Parameters.Add(new SqlParameter("@ErrorMessage", SqlDbType.NVarChar, 500) { Value = errorMessage });

            await cmd.ExecuteNonQueryAsync();
        }

        public async Task<List<OutboundImportBatchDto>> GetImportHistoryAsync(int limit = 20)
        {
            var batches = new List<OutboundImportBatchDto>();
            using var conn = GetConnection();
            await conn.OpenAsync();

            string sql = $@"
                SELECT TOP ({limit}) id, file_name, file_size, total_rows, inserted_rows, duplicate_rows, error_rows, duration_seconds, status, imported_by, imported_at
                FROM dbo.outbound_import_batches WITH (NOLOCK)
                ORDER BY id DESC;";

            using var cmd = new SqlCommand(sql, conn);
            cmd.CommandTimeout = 90;
            using var r = await cmd.ExecuteReaderAsync();
            while (await r.ReadAsync())
            {
                batches.Add(new OutboundImportBatchDto
                {
                    Id = Convert.ToInt64(r[0]),
                    FileName = r.IsDBNull(1) ? string.Empty : r.GetString(1),
                    FileSize = r.IsDBNull(2) ? 0L : Convert.ToInt64(r[2]),
                    TotalRows = r.IsDBNull(3) ? 0 : Convert.ToInt32(r[3]),
                    InsertedRows = r.IsDBNull(4) ? 0 : Convert.ToInt32(r[4]),
                    DuplicateRows = r.IsDBNull(5) ? 0 : Convert.ToInt32(r[5]),
                    ErrorRows = r.IsDBNull(6) ? 0 : Convert.ToInt32(r[6]),
                    DurationSeconds = r.IsDBNull(7) ? 0m : Convert.ToDecimal(r[7]),
                    Status = r.IsDBNull(8) ? string.Empty : r.GetString(8),
                    ImportedBy = r.IsDBNull(9) ? string.Empty : r.GetString(9),
                    ImportedAt = r.IsDBNull(10) ? DateTime.UtcNow : Convert.ToDateTime(r[10])
                });
            }

            return batches;
        }
    }
}
