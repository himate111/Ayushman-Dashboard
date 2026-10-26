using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using BeneficiaryGrievance.Api.DTOs.Inbound;

namespace BeneficiaryGrievance.Api.Data.Inbound
{
    public class InboundImportRepository : IInboundImportRepository
    {
        private readonly string _connectionString;

        public InboundImportRepository(IConfiguration configuration)
        {
            bool useTestDb = configuration.GetValue<bool>("UseInboundTestDb");
            string? connStr = useTestDb
                ? configuration.GetConnectionString("InboundTestConnection")
                : configuration.GetConnectionString("InboundConnection");

            _connectionString = connStr
                ?? "Server=localhost;Database=call_center;Integrated Security=True;TrustServerCertificate=True;";
        }

        public InboundImportRepository(string explicitConnectionString)
        {
            _connectionString = explicitConnectionString;
        }

        public string ConnectionString => _connectionString;

        public SqlConnection CreateConnection() => new(_connectionString);

        public async Task<InboundImportBatchSummaryDto?> GetPreviousBatchByHashAsync(string fileHash)
        {
            if (string.IsNullOrWhiteSpace(fileHash)) return null;

            using var conn = CreateConnection();
            await conn.OpenAsync();

            const string sql = @"
                SELECT TOP 1 id, file_name, file_size, total_records, new_records_count, 
                             duplicate_records_count, invalid_records_count, import_status, 
                             import_date, imported_by, execution_time_ms
                FROM dbo.inbound_import_batches
                WHERE file_hash = @fileHash AND import_status = 'Completed'
                ORDER BY import_date DESC;";

            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@fileHash", fileHash);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return new InboundImportBatchSummaryDto
                {
                    Id = reader.GetInt32(0),
                    FileName = reader.GetString(1),
                    FileSize = reader.GetInt64(2),
                    TotalRecords = reader.GetInt32(3),
                    NewRecordsCount = reader.GetInt32(4),
                    DuplicateRecordsCount = reader.GetInt32(5),
                    InvalidRecordsCount = reader.GetInt32(6),
                    ImportStatus = reader.GetString(7),
                    ImportDate = reader.GetDateTime(8),
                    ImportedBy = reader.GetString(9),
                    ExecutionTimeMs = reader.GetInt64(10)
                };
            }

            return null;
        }

        public async Task<HashSet<long>> GetExistingCallIdsAsync(IEnumerable<long> candidateIds)
        {
            var result = new HashSet<long>();
            var ids = candidateIds.Distinct().ToList();
            if (ids.Count == 0) return result;

            using var conn = CreateConnection();
            await conn.OpenAsync();

            // Query in chunks of 1000 to respect SQL parameter limits
            int chunkSize = 1000;
            for (int i = 0; i < ids.Count; i += chunkSize)
            {
                var chunk = ids.Skip(i).Take(chunkSize).ToList();
                var paramNames = chunk.Select((id, idx) => $"@id{idx}").ToList();
                string sql = $"SELECT id FROM dbo.inbound_calls WHERE id IN ({string.Join(",", paramNames)})";

                using var cmd = new SqlCommand(sql, conn);
                for (int j = 0; j < chunk.Count; j++)
                {
                    cmd.Parameters.AddWithValue(paramNames[j], chunk[j]);
                }

                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    result.Add(reader.GetInt64(0));
                }
            }

            return result;
        }

        public async Task<HashSet<string>> GetExistingCompositeKeysAsync(IEnumerable<(DateTime CallTime, string CalledNo, string AgentId)> candidates)
        {
            var existingKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var list = candidates.ToList();
            if (list.Count == 0) return existingKeys;

            using var conn = CreateConnection();
            await conn.OpenAsync();

            var minTime = list.Min(c => c.CallTime).AddSeconds(-1);
            var maxTime = list.Max(c => c.CallTime).AddSeconds(1);

            const string sql = @"
                SELECT call_time, called_no, ISNULL(agent_id, '') AS agent_id
                FROM dbo.inbound_calls
                WHERE call_time >= @minTime AND call_time <= @maxTime;";

            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@minTime", minTime);
            cmd.Parameters.AddWithValue("@maxTime", maxTime);

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                var ct = reader.GetDateTime(0);
                var cn = reader.GetString(1).Trim();
                var ag = reader.IsDBNull(2) ? "" : reader.GetString(2).Trim();

                string key = $"{ct:yyyy-MM-dd HH:mm:ss}|{cn}|{ag}";
                existingKeys.Add(key);
            }

            return existingKeys;
        }

        public async Task<long> GetNextCallIdAsync(SqlConnection conn, SqlTransaction trans)
        {
            const string sql = "SELECT ISNULL(MAX(id), 0) + 1 FROM dbo.inbound_calls WITH (UPDLOCK, HOLDLOCK);";
            using var cmd = new SqlCommand(sql, conn, trans);
            var result = await cmd.ExecuteScalarAsync();
            return Convert.ToInt64(result);
        }

        public async Task<int> CreateBatchRecordAsync(string fileName, long fileSize, string fileHash, int totalRecords, string importedBy)
        {
            using var conn = CreateConnection();
            await conn.OpenAsync();

            const string sql = @"
                INSERT INTO dbo.inbound_import_batches 
                    (file_name, file_size, file_hash, total_records, import_status, import_date, imported_by, execution_time_ms)
                VALUES 
                    (@fileName, @fileSize, @fileHash, @totalRecords, 'Processing', GETUTCDATE(), @importedBy, 0);
                SELECT SCOPE_IDENTITY();";

            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@fileName", fileName);
            cmd.Parameters.AddWithValue("@fileSize", fileSize);
            cmd.Parameters.AddWithValue("@fileHash", (object?)fileHash ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@totalRecords", totalRecords);
            cmd.Parameters.AddWithValue("@importedBy", importedBy ?? "System");

            var batchId = Convert.ToInt32(await cmd.ExecuteScalarAsync());
            return batchId;
        }

        public async Task InsertCallRecordsBatchAsync(SqlConnection conn, SqlTransaction trans, List<InboundCallRawRecord> records)
        {
            if (records.Count == 0) return;

            var table = new DataTable();
            table.Columns.Add("id", typeof(long));
            table.Columns.Add("did_no", typeof(string));
            table.Columns.Add("group_name", typeof(string));
            table.Columns.Add("called_no", typeof(string));
            table.Columns.Add("call_time", typeof(DateTime));
            table.Columns.Add("ring_duration", typeof(TimeSpan));
            table.Columns.Add("ivr_duration", typeof(TimeSpan));
            table.Columns.Add("queue_duration", typeof(TimeSpan));
            table.Columns.Add("agent_duration", typeof(TimeSpan));
            table.Columns.Add("hold_duration", typeof(TimeSpan));
            table.Columns.Add("total_duration", typeof(TimeSpan));
            table.Columns.Add("call_end", typeof(string));
            table.Columns.Add("agent_id", typeof(string));
            table.Columns.Add("call_type", typeof(string));
            table.Columns.Add("acd", typeof(string));
            table.Columns.Add("disposition", typeof(string));
            table.Columns.Add("sub_disposition", typeof(string));
            table.Columns.Add("shift", typeof(string));
            table.Columns.Add("call_hour", typeof(int));
            table.Columns.Add("created_at", typeof(DateTime));

            foreach (var r in records)
            {
                table.Rows.Add(
                    r.Id,
                    (object?)r.DidNo ?? DBNull.Value,
                    (object?)r.GroupName ?? DBNull.Value,
                    r.CalledNo,
                    r.CallTime,
                    r.RingDuration,
                    r.IvrDuration,
                    r.QueueDuration,
                    r.AgentDuration,
                    r.HoldDuration,
                    r.TotalDuration,
                    r.CallEnd,
                    r.AgentId,
                    r.CallType,
                    r.Acd,
                    r.Disposition,
                    r.SubDisposition,
                    r.Shift,
                    r.CallHour,
                    r.CreatedAt
                );
            }

            using var bulkCopy = new SqlBulkCopy(conn, SqlBulkCopyOptions.Default, trans)
            {
                DestinationTableName = "dbo.inbound_calls",
                BulkCopyTimeout = 120
            };

            foreach (DataColumn col in table.Columns)
            {
                bulkCopy.ColumnMappings.Add(col.ColumnName, col.ColumnName);
            }

            await bulkCopy.WriteToServerAsync(table);
        }

        public async Task InsertBatchErrorsAsync(SqlConnection conn, SqlTransaction trans, int batchId, List<InboundImportErrorRecord> errors)
        {
            if (errors.Count == 0) return;

            var table = new DataTable();
            table.Columns.Add("import_batch_id", typeof(int));
            table.Columns.Add("row_number", typeof(int));
            table.Columns.Add("call_identifier", typeof(string));
            table.Columns.Add("error_message", typeof(string));
            table.Columns.Add("raw_data", typeof(string));
            table.Columns.Add("created_at", typeof(DateTime));

            var now = DateTime.UtcNow;
            foreach (var err in errors)
            {
                table.Rows.Add(
                    batchId,
                    err.RowNumber,
                    (object?)err.CallIdentifier ?? DBNull.Value,
                    err.ErrorMessage,
                    (object?)err.RawData ?? DBNull.Value,
                    now
                );
            }

            using var bulkCopy = new SqlBulkCopy(conn, SqlBulkCopyOptions.Default, trans)
            {
                DestinationTableName = "dbo.inbound_import_errors",
                BulkCopyTimeout = 60
            };

            foreach (DataColumn col in table.Columns)
            {
                bulkCopy.ColumnMappings.Add(col.ColumnName, col.ColumnName);
            }

            await bulkCopy.WriteToServerAsync(table);
        }

        public async Task UpdateBatchStatusAsync(SqlConnection conn, SqlTransaction trans, int batchId, int newCount, int duplicateCount, int errorCount, string status, long executionTimeMs, string notes)
        {
            const string sql = @"
                UPDATE dbo.inbound_import_batches
                SET new_records_count = @newCount,
                    duplicate_records_count = @duplicateCount,
                    invalid_records_count = @errorCount,
                    import_status = @status,
                    execution_time_ms = @executionTimeMs,
                    summary_notes = @notes
                WHERE id = @batchId;";

            using var cmd = new SqlCommand(sql, conn, trans);
            cmd.Parameters.AddWithValue("@newCount", newCount);
            cmd.Parameters.AddWithValue("@duplicateCount", duplicateCount);
            cmd.Parameters.AddWithValue("@errorCount", errorCount);
            cmd.Parameters.AddWithValue("@status", status);
            cmd.Parameters.AddWithValue("@executionTimeMs", executionTimeMs);
            cmd.Parameters.AddWithValue("@notes", (object?)notes ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@batchId", batchId);

            await cmd.ExecuteNonQueryAsync();
        }

        public async Task<List<InboundImportBatchSummaryDto>> GetImportHistoryAsync()
        {
            var list = new List<InboundImportBatchSummaryDto>();
            using var conn = CreateConnection();
            await conn.OpenAsync();

            const string sql = @"
                SELECT id, file_name, file_size, total_records, new_records_count, 
                       duplicate_records_count, invalid_records_count, import_status, 
                       import_date, imported_by, execution_time_ms
                FROM dbo.inbound_import_batches
                ORDER BY import_date DESC;";

            using var cmd = new SqlCommand(sql, conn);
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                list.Add(new InboundImportBatchSummaryDto
                {
                    Id = reader.GetInt32(0),
                    FileName = reader.GetString(1),
                    FileSize = reader.GetInt64(2),
                    TotalRecords = reader.GetInt32(3),
                    NewRecordsCount = reader.GetInt32(4),
                    DuplicateRecordsCount = reader.GetInt32(5),
                    InvalidRecordsCount = reader.GetInt32(6),
                    ImportStatus = reader.GetString(7),
                    ImportDate = reader.GetDateTime(8),
                    ImportedBy = reader.GetString(9),
                    ExecutionTimeMs = reader.GetInt64(10)
                });
            }

            return list;
        }

        public async Task<List<InboundImportErrorDto>> GetBatchErrorsAsync(int batchId)
        {
            var list = new List<InboundImportErrorDto>();
            using var conn = CreateConnection();
            await conn.OpenAsync();

            const string sql = @"
                SELECT id, import_batch_id, row_number, call_identifier, error_message, raw_data, created_at
                FROM dbo.inbound_import_errors
                WHERE import_batch_id = @batchId
                ORDER BY row_number ASC;";

            using var cmd = new SqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@batchId", batchId);

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                list.Add(new InboundImportErrorDto
                {
                    Id = reader.GetInt32(0),
                    ImportBatchId = reader.GetInt32(1),
                    RowNumber = reader.GetInt32(2),
                    CallIdentifier = reader.IsDBNull(3) ? null : reader.GetString(3),
                    ErrorMessage = reader.GetString(4),
                    RawData = reader.IsDBNull(5) ? null : reader.GetString(5),
                    CreatedAt = reader.GetDateTime(6)
                });
            }

            return list;
        }
    }
}
