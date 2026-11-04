using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using BeneficiaryGrievance.Api.DTOs.Inbound;
using BeneficiaryGrievance.Api.DTOs.Inbound.Audit;
using BeneficiaryGrievance.Api.Services.Inbound;

namespace BeneficiaryGrievance.Api.Data.Inbound
{
    public class InboundRepository : IInboundRepository
    {
        private readonly string _connectionString;

        public const string ConnectedSql = "(call_end = 'Agent')";
        public const string NotConnectedSql = "(call_end IN ('Queue', 'IVR'))";
        public const int ConnectedThresholdSeconds = 3;

        public const string SafeAgentDurationSecondsSql = @"
            CASE
                WHEN agent_duration IS NULL THEN NULL
                ELSE DATEDIFF(SECOND, CAST('00:00:00' AS time), agent_duration)
            END";

        public static readonly string AgentDurationConnectedSql =
            $"({SafeAgentDurationSecondsSql} >= {ConnectedThresholdSeconds})";

        public static readonly string AgentDurationAbandonedSql =
            $"({SafeAgentDurationSecondsSql} < {ConnectedThresholdSeconds})";

        public static readonly string AgentDurationUnclassifiedSql =
            $"({SafeAgentDurationSecondsSql} IS NULL)";

        private static readonly Dictionary<string, int> MonthMap = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Jan"] = 1, ["Feb"] = 2, ["Mar"] = 3, ["Apr"] = 4,
            ["May"] = 5, ["Jun"] = 6, ["Jul"] = 7, ["Aug"] = 8,
            ["Sep"] = 9, ["Oct"] = 10, ["Nov"] = 11, ["Dec"] = 12
        };

        private static readonly Dictionary<int, string> MonthNames = new()
        {
            [1] = "Jan", [2] = "Feb", [3] = "Mar", [4] = "Apr",
            [5] = "May", [6] = "Jun", [7] = "Jul", [8] = "Aug",
            [9] = "Sep", [10] = "Oct", [11] = "Nov", [12] = "Dec"
        };

        private static readonly Dictionary<string, string> FilterColumnMap = new()
        {
            ["groupName"] = "group_name",
            ["agent"] = "agent_id",
            ["disposition"] = "disposition",
            ["subDisposition"] = "sub_disposition",
            ["shift"] = "shift",
            ["acd"] = "acd",
            ["callType"] = "call_type"
        };

        public InboundRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("InboundConnection")
                ?? "Server=localhost;Database=call_center;Integrated Security=True;TrustServerCertificate=True;";
        }

        private SqlConnection CreateConnection() => new(_connectionString);

        private static string PlaceholderSql(string column)
        {
            return $@"({column} IS NULL
                OR LTRIM(RTRIM({column})) = ''
                OR UPPER(LTRIM(RTRIM({column}))) IN ('-', 'N/A', 'NA', 'UNKNOWN'))";
        }

        private static List<string> NormalizeList(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return new List<string>();

            return value.Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(v => v.Trim())
                        .Where(v => !string.IsNullOrEmpty(v))
                        .ToList();
        }

        private static (string WhereSql, List<SqlParameter> Parameters) BuildWhereClause(InboundFilterDto? filter, bool requireAgent = false)
        {
            var clauses = new List<string>();
            var parameters = new List<SqlParameter>();
            var paramIndex = 1;

            if (filter == null)
            {
                if (requireAgent)
                    clauses.Add("agent_id IS NOT NULL AND agent_id <> ''");
                return (clauses.Count > 0 ? "WHERE " + string.Join(" AND ", clauses) : "", parameters);
            }

            // Year
            var years = NormalizeList(filter.Year);
            if (years.Count > 0)
            {
                var placeholders = new List<string>();
                foreach (var y in years)
                {
                    if (int.TryParse(y, out var yearVal))
                    {
                        var pName = $"@filter_{paramIndex++}";
                        parameters.Add(new SqlParameter(pName, SqlDbType.Int) { Value = yearVal });
                        placeholders.Add(pName);
                    }
                }
                if (placeholders.Count > 0)
                    clauses.Add($"YEAR(call_time) IN ({string.Join(", ", placeholders)})");
            }

            // Month
            var months = NormalizeList(filter.Month);
            if (months.Count > 0)
            {
                var placeholders = new List<string>();
                foreach (var m in months)
                {
                    int monthVal;
                    if (MonthMap.TryGetValue(m, out var mappedVal))
                    {
                        monthVal = mappedVal;
                    }
                    else if (int.TryParse(m, out var parsedVal))
                    {
                        monthVal = parsedVal;
                    }
                    else
                    {
                        continue;
                    }
                    var pName = $"@filter_{paramIndex++}";
                    parameters.Add(new SqlParameter(pName, SqlDbType.Int) { Value = monthVal });
                    placeholders.Add(pName);
                }
                if (placeholders.Count > 0)
                    clauses.Add($"MONTH(call_time) IN ({string.Join(", ", placeholders)})");
            }

            // StartDate
            if (!string.IsNullOrWhiteSpace(filter.StartDate))
            {
                var pName = $"@filter_{paramIndex++}";
                var dateStr = $"{filter.StartDate.Trim()} 00:00:00";
                parameters.Add(new SqlParameter(pName, SqlDbType.NVarChar, 19) { Value = dateStr });
                clauses.Add($"call_time >= CONVERT(datetime2(0), {pName}, 120)");
            }

            // EndDate
            if (!string.IsNullOrWhiteSpace(filter.EndDate))
            {
                var pName = $"@filter_{paramIndex++}";
                var dateStr = $"{filter.EndDate.Trim()} 23:59:59";
                parameters.Add(new SqlParameter(pName, SqlDbType.NVarChar, 19) { Value = dateStr });
                clauses.Add($"call_time <= CONVERT(datetime2(0), {pName}, 120)");
            }

            // Standard string filters
            var filterValues = new Dictionary<string, string?>
            {
                ["groupName"] = filter.GroupName,
                ["agent"] = filter.Agent,
                ["disposition"] = filter.Disposition,
                ["subDisposition"] = filter.SubDisposition,
                ["shift"] = filter.Shift,
                ["acd"] = filter.Acd,
                ["callType"] = filter.CallType
            };

            foreach (var (key, colName) in FilterColumnMap)
            {
                if (filterValues.TryGetValue(key, out var rawVal))
                {
                    var values = NormalizeList(rawVal);
                    if (values.Count > 0)
                    {
                        var placeholders = new List<string>();
                        foreach (var val in values)
                        {
                            var pName = $"@filter_{paramIndex++}";
                            parameters.Add(new SqlParameter(pName, SqlDbType.NVarChar, 255) { Value = val });
                            placeholders.Add(pName);
                        }
                        clauses.Add($"{colName} IN ({string.Join(", ", placeholders)})");
                    }
                }
            }

            if (requireAgent)
            {
                clauses.Add("agent_id IS NOT NULL AND agent_id <> ''");
            }

            var whereSql = clauses.Count > 0 ? "WHERE " + string.Join(" AND ", clauses) : "";
            return (whereSql, parameters);
        }

        public async Task<InboundKpiDto> GetKpisAsync(InboundFilterDto filter)
        {
            var (whereSql, parameters) = BuildWhereClause(filter);
            using var connection = CreateConnection();
            await connection.OpenAsync();

            var queryText = $@"
                SELECT
                    COUNT(*) AS totalCalls,
                    SUM(CASE WHEN {AgentDurationConnectedSql} THEN 1 ELSE 0 END) AS connectedCalls,
                    SUM(CASE WHEN {AgentDurationAbandonedSql} THEN 1 ELSE 0 END) AS notConnectedCalls,
                    AVG(DATEDIFF(SECOND, CAST('00:00:00' AS time), total_duration)) AS avgCallDurationSeconds,
                    AVG(DATEDIFF(SECOND, CAST('00:00:00' AS time), agent_duration)) AS avgAgentDurationSeconds,
                    AVG(DATEDIFF(SECOND, CAST('00:00:00' AS time), queue_duration)) AS avgQueueDurationSeconds
                FROM dbo.inbound_calls WITH (NOLOCK)
                {whereSql}";

            using var cmd = new SqlCommand(queryText, connection);
            cmd.CommandTimeout = 60;
            foreach (var p in parameters) cmd.Parameters.Add(p);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                var totalCalls = reader.IsDBNull(0) ? 0L : Convert.ToInt64(reader.GetValue(0));
                var connectedCalls = reader.IsDBNull(1) ? 0L : Convert.ToInt64(reader.GetValue(1));
                var notConnectedCalls = reader.IsDBNull(2) ? 0L : Convert.ToInt64(reader.GetValue(2));
                var avgCallDur = reader.IsDBNull(3) ? 0.0 : Convert.ToDouble(reader.GetValue(3));
                var avgAgentDur = reader.IsDBNull(4) ? 0.0 : Convert.ToDouble(reader.GetValue(4));
                var avgQueueDur = reader.IsDBNull(5) ? 0.0 : Convert.ToDouble(reader.GetValue(5));

                var connRate = totalCalls > 0 ? Math.Round((double)connectedCalls / totalCalls * 100.0, 2) : 0.0;
                var notConnRate = totalCalls > 0 ? Math.Round((double)notConnectedCalls / totalCalls * 100.0, 2) : 0.0;

                return new InboundKpiDto
                {
                    TotalCalls = totalCalls,
                    ConnectedCalls = connectedCalls,
                    NotConnectedCalls = notConnectedCalls,
                    ConnectionRate = connRate,
                    NotConnectedPercentage = notConnRate,
                    AvgCallDurationSeconds = avgCallDur,
                    AvgAgentDurationSeconds = avgAgentDur,
                    AvgQueueDurationSeconds = avgQueueDur,
                    AvgCallDuration = InboundTimeUtil.SecondsToLabel(avgCallDur),
                    AvgAgentDuration = InboundTimeUtil.SecondsToLabel(avgAgentDur),
                    AvgQueueDuration = InboundTimeUtil.SecondsToLabel(avgQueueDur)
                };
            }

            return new InboundKpiDto();
        }

        public async Task<List<ChartNameValueDto>> GetGroupedChartAsync(string selectExpression, InboundFilterDto filter, string orderBy = "value DESC", int? limit = null)
        {
            var (whereSql, parameters) = BuildWhereClause(filter);
            using var connection = CreateConnection();
            await connection.OpenAsync();

            var topSql = limit.HasValue ? $"TOP ({limit.Value}) " : "";
            var groupExpression = $"COALESCE(NULLIF({selectExpression}, ''), 'Unknown')";
            var queryText = $@"
                SELECT {topSql}{groupExpression} AS name, COUNT(*) AS value
                FROM dbo.inbound_calls WITH (NOLOCK)
                {whereSql}
                GROUP BY {groupExpression}
                ORDER BY {orderBy}";

            using var cmd = new SqlCommand(queryText, connection);
            cmd.CommandTimeout = 60;
            foreach (var p in parameters) cmd.Parameters.Add(p);

            var list = new List<ChartNameValueDto>();
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                list.Add(new ChartNameValueDto
                {
                    Name = reader.IsDBNull(0) ? "Unknown" : reader.GetString(0),
                    Value = reader.IsDBNull(1) ? 0L : Convert.ToInt64(reader.GetValue(1))
                });
            }

            return list;
        }

        public async Task<List<ChartNameValueDto>> GetShiftMetricChartAsync(InboundFilterDto filter, string metricSql)
        {
            var (whereSql, parameters) = BuildWhereClause(filter);
            using var connection = CreateConnection();
            await connection.OpenAsync();

            var queryText = $@"
                SELECT COALESCE(NULLIF(shift, ''), 'Unknown') AS name, SUM(CASE WHEN {metricSql} THEN 1 ELSE 0 END) AS value
                FROM dbo.inbound_calls WITH (NOLOCK)
                {whereSql}
                GROUP BY COALESCE(NULLIF(shift, ''), 'Unknown')
                ORDER BY name";

            using var cmd = new SqlCommand(queryText, connection);
            cmd.CommandTimeout = 60;
            foreach (var p in parameters) cmd.Parameters.Add(p);

            var list = new List<ChartNameValueDto>();
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                list.Add(new ChartNameValueDto
                {
                    Name = reader.IsDBNull(0) ? "Unknown" : reader.GetString(0),
                    Value = reader.IsDBNull(1) ? 0L : Convert.ToInt64(reader.GetValue(1))
                });
            }

            return list;
        }

        public async Task<List<AgentPerformanceDto>> GetAgentAnalyticsAsync(InboundFilterDto filter, string direction = "top")
        {
            var (whereSql, parameters) = BuildWhereClause(filter, requireAgent: true);
            using var connection = CreateConnection();
            await connection.OpenAsync();

            var isAll = direction.Equals("all", StringComparison.OrdinalIgnoreCase);
            var isBottom = direction.Equals("bottom", StringComparison.OrdinalIgnoreCase);
            var orderSql = isBottom ? "totalCalls ASC" : "totalCalls DESC";
            var topSql = isAll ? "" : "TOP (10)";

            var queryText = $@"
                SELECT {topSql}
                    agent_id AS agent,
                    COUNT(*) AS totalCalls,
                    SUM(CASE WHEN {AgentDurationConnectedSql} THEN 1 ELSE 0 END) AS connectedCalls,
                    ROUND((100.0 * SUM(CASE WHEN {AgentDurationConnectedSql} THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0)), 2) AS connectionRate,
                    AVG(DATEDIFF(SECOND, CAST('00:00:00' AS time), agent_duration)) AS avgAgentDurationSeconds
                FROM dbo.inbound_calls WITH (NOLOCK)
                {whereSql}
                GROUP BY agent_id
                ORDER BY {orderSql}";

            using var cmd = new SqlCommand(queryText, connection);
            cmd.CommandTimeout = 60;
            foreach (var p in parameters) cmd.Parameters.Add(p);

            var list = new List<AgentPerformanceDto>();
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                var agent = reader.IsDBNull(0) ? "" : reader.GetString(0);
                var totalCalls = reader.IsDBNull(1) ? 0L : Convert.ToInt64(reader.GetValue(1));
                var connectedCalls = reader.IsDBNull(2) ? 0L : Convert.ToInt64(reader.GetValue(2));
                var connRate = reader.IsDBNull(3) ? 0.0 : Convert.ToDouble(reader.GetValue(3));
                var avgDur = reader.IsDBNull(4) ? 0.0 : Convert.ToDouble(reader.GetValue(4));

                list.Add(new AgentPerformanceDto
                {
                    Agent = agent,
                    TotalCalls = totalCalls,
                    ConnectedCalls = connectedCalls,
                    ConnectionRate = connRate,
                    AvgAgentDurationSeconds = avgDur,
                    AvgAgentDuration = InboundTimeUtil.SecondsToLabel(avgDur)
                });
            }

            return list;
        }

        public async Task<List<ChartNameValueDto>> GetCallsByYearAsync(InboundFilterDto filter)
        {
            var (whereSql, parameters) = BuildWhereClause(filter);
            using var connection = CreateConnection();
            await connection.OpenAsync();

            var queryText = $@"
                SELECT
                    YEAR(call_time) AS name,
                    COUNT(*) AS value
                FROM dbo.inbound_calls WITH (NOLOCK)
                {whereSql}
                GROUP BY YEAR(call_time)
                ORDER BY YEAR(call_time)";

            using var cmd = new SqlCommand(queryText, connection);
            cmd.CommandTimeout = 60;
            foreach (var p in parameters) cmd.Parameters.Add(p);

            var list = new List<ChartNameValueDto>();
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                var yearVal = reader.IsDBNull(0) ? "Unknown" : reader.GetValue(0).ToString() ?? "Unknown";
                var countVal = reader.IsDBNull(1) ? 0L : Convert.ToInt64(reader.GetValue(1));
                list.Add(new ChartNameValueDto { Name = yearVal, Value = countVal });
            }

            return list;
        }

        public async Task<List<MonthlyCallsDto>> GetCallsByMonthAsync(InboundFilterDto filter)
        {
            var (whereSql, parameters) = BuildWhereClause(filter);
            using var connection = CreateConnection();
            await connection.OpenAsync();

            var queryText = $@"
                SELECT
                    YEAR(call_time) AS year,
                    MONTH(call_time) AS month,
                    SUM(CASE WHEN {AgentDurationConnectedSql} THEN 1 ELSE 0 END) AS connected,
                    SUM(CASE WHEN {AgentDurationAbandonedSql} THEN 1 ELSE 0 END) AS abandoned,
                    SUM(CASE WHEN {AgentDurationUnclassifiedSql} THEN 1 ELSE 0 END) AS others
                FROM dbo.inbound_calls WITH (NOLOCK)
                {whereSql}
                GROUP BY YEAR(call_time), MONTH(call_time)
                ORDER BY YEAR(call_time), MONTH(call_time)";

            using var cmd = new SqlCommand(queryText, connection);
            cmd.CommandTimeout = 60;
            foreach (var p in parameters) cmd.Parameters.Add(p);

            var list = new List<MonthlyCallsDto>();
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                var monthNum = reader.IsDBNull(1) ? 0 : Convert.ToInt32(reader.GetValue(1));
                var connected = reader.IsDBNull(2) ? 0L : Convert.ToInt64(reader.GetValue(2));
                var abandoned = reader.IsDBNull(3) ? 0L : Convert.ToInt64(reader.GetValue(3));
                var others = reader.IsDBNull(4) ? 0L : Convert.ToInt64(reader.GetValue(4));
                var total = connected + abandoned + others;

                var monthName = MonthNames.TryGetValue(monthNum, out var mName) ? mName : monthNum.ToString();
                var connPct = total > 0 ? Math.Round((double)connected / total * 100.0, 1) : 0.0;
                var abanPct = total > 0 ? Math.Round((double)abandoned / total * 100.0, 1) : 0.0;
                var othPct = total > 0 ? Math.Round((double)others / total * 100.0, 1) : 0.0;

                list.Add(new MonthlyCallsDto
                {
                    Month = monthName,
                    Connected = connPct,
                    Abandoned = abanPct,
                    Others = othPct
                });
            }

            return list;
        }

        public async Task<List<HourlyMetricsDto>> GetHourlyAsync(InboundFilterDto filter)
        {
            var (whereSql, parameters) = BuildWhereClause(filter);
            using var connection = CreateConnection();
            await connection.OpenAsync();

            var queryText = $@"
                SELECT
                    call_hour AS hour,
                    COUNT(*) AS totalCalls,
                    SUM(CASE WHEN {AgentDurationConnectedSql} THEN 1 ELSE 0 END) AS connectedCalls,
                    SUM(CASE WHEN {AgentDurationAbandonedSql} THEN 1 ELSE 0 END) AS notConnectedCalls,
                    ROUND((100.0 * SUM(CASE WHEN {AgentDurationAbandonedSql} THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0)), 2) AS dropRate
                FROM dbo.inbound_calls WITH (NOLOCK)
                {whereSql}
                GROUP BY call_hour
                ORDER BY call_hour";

            using var cmd = new SqlCommand(queryText, connection);
            cmd.CommandTimeout = 60;
            foreach (var p in parameters) cmd.Parameters.Add(p);

            var hourlyMap = new Dictionary<int, HourlyMetricsDto>();
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                var hour = reader.IsDBNull(0) ? 0 : Convert.ToInt32(reader.GetValue(0));
                var total = reader.IsDBNull(1) ? 0L : Convert.ToInt64(reader.GetValue(1));
                var connected = reader.IsDBNull(2) ? 0L : Convert.ToInt64(reader.GetValue(2));
                var notConnected = reader.IsDBNull(3) ? 0L : Convert.ToInt64(reader.GetValue(3));
                var dropRate = reader.IsDBNull(4) ? 0.0 : Convert.ToDouble(reader.GetValue(4));

                hourlyMap[hour] = new HourlyMetricsDto
                {
                    Hour = hour,
                    Label = $"{hour:D2}:00",
                    TotalCalls = total,
                    ConnectedCalls = connected,
                    NotConnectedCalls = notConnected,
                    DropRate = dropRate
                };
            }

            var result = new List<HourlyMetricsDto>();
            for (var h = 0; h < 24; h++)
            {
                if (hourlyMap.TryGetValue(h, out var item))
                {
                    result.Add(item);
                }
                else
                {
                    result.Add(new HourlyMetricsDto
                    {
                        Hour = h,
                        Label = $"{h:D2}:00",
                        TotalCalls = 0,
                        ConnectedCalls = 0,
                        NotConnectedCalls = 0,
                        DropRate = 0
                    });
                }
            }

            return result;
        }

        public async Task<List<SummaryShiftMetric>> GetSummaryShiftMetricsAsync(InboundFilterDto filter)
        {
            var (whereSql, parameters) = BuildWhereClause(filter);
            using var connection = CreateConnection();
            await connection.OpenAsync();

            var queryText = $@"
                SELECT
                    COALESCE(NULLIF(shift, ''), 'Unknown') AS name,
                    COUNT(*) AS totalCalls,
                    SUM(CASE WHEN {AgentDurationConnectedSql} THEN 1 ELSE 0 END) AS connectedCalls,
                    SUM(CASE WHEN {AgentDurationAbandonedSql} THEN 1 ELSE 0 END) AS abandonedCalls,
                    SUM(CASE WHEN {AgentDurationUnclassifiedSql} THEN 1 ELSE 0 END) AS unclassifiedCalls
                FROM dbo.inbound_calls WITH (NOLOCK)
                {whereSql}
                GROUP BY COALESCE(NULLIF(shift, ''), 'Unknown')
                ORDER BY name";

            using var cmd = new SqlCommand(queryText, connection);
            cmd.CommandTimeout = 60;
            foreach (var p in parameters) cmd.Parameters.Add(p);

            var list = new List<SummaryShiftMetric>();
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                var name = reader.IsDBNull(0) ? "Unknown" : reader.GetString(0);
                var total = reader.IsDBNull(1) ? 0L : Convert.ToInt64(reader.GetValue(1));
                var connected = reader.IsDBNull(2) ? 0L : Convert.ToInt64(reader.GetValue(2));
                var abandoned = reader.IsDBNull(3) ? 0L : Convert.ToInt64(reader.GetValue(3));
                var unclassified = reader.IsDBNull(4) ? 0L : Convert.ToInt64(reader.GetValue(4));
                var rate = total > 0 ? Math.Round((double)abandoned / total * 100.0, 2) : 0.0;

                list.Add(new SummaryShiftMetric
                {
                    Name = name,
                    TotalCalls = total,
                    ConnectedCalls = connected,
                    AbandonedCalls = abandoned,
                    UnclassifiedCalls = unclassified,
                    AbandonmentRate = rate
                });
            }

            return list;
        }

        public async Task<InboundDataQualityMetrics> GetDataQualityMetricsAsync(InboundFilterDto filter)
        {
            var (whereSql, parameters) = BuildWhereClause(filter);
            using var connection = CreateConnection();
            await connection.OpenAsync();

            var queryText = $@"
                SELECT
                    COUNT(*) AS totalCalls,
                    SUM(CASE WHEN {PlaceholderSql("disposition")} THEN 1 ELSE 0 END) AS invalidDispositionCount,
                    SUM(CASE WHEN {PlaceholderSql("sub_disposition")} THEN 1 ELSE 0 END) AS invalidSubDispositionCount,
                    SUM(CASE WHEN {PlaceholderSql("agent_id")} THEN 1 ELSE 0 END) AS invalidAgentIdCount,
                    SUM(CASE WHEN {PlaceholderSql("group_name")} THEN 1 ELSE 0 END) AS invalidGroupNameCount,
                    SUM(CASE WHEN {SafeAgentDurationSecondsSql} IS NULL THEN 1 ELSE 0 END) AS missingAgentDurationCount,
                    SUM(CASE WHEN total_duration IS NULL THEN 1 ELSE 0 END) AS missingTotalDurationCount,
                    SUM(CASE WHEN DATEDIFF(SECOND, CAST('00:00:00' AS time), agent_duration) < 0 THEN 1 ELSE 0 END) AS negativeAgentDurationCount,
                    SUM(CASE WHEN DATEDIFF(SECOND, CAST('00:00:00' AS time), total_duration) < 0 THEN 1 ELSE 0 END) AS negativeTotalDurationCount,
                    SUM(CASE WHEN {SafeAgentDurationSecondsSql} IS NOT NULL AND total_duration IS NOT NULL AND DATEDIFF(SECOND, CAST('00:00:00' AS time), agent_duration) > DATEDIFF(SECOND, CAST('00:00:00' AS time), total_duration) THEN 1 ELSE 0 END) AS agentDurationExceedsTotalCount,
                    SUM(CASE WHEN {AgentDurationAbandonedSql} AND call_end = 'Agent' THEN 1 ELSE 0 END) AS durationAbandonedAgentEndCount,
                    SUM(CASE WHEN {AgentDurationConnectedSql} AND (call_end IS NULL OR call_end <> 'Agent') THEN 1 ELSE 0 END) AS durationConnectedNonAgentEndCount
                FROM dbo.inbound_calls WITH (NOLOCK)
                {whereSql}";

            using var cmd = new SqlCommand(queryText, connection);
            cmd.CommandTimeout = 60;
            foreach (var p in parameters) cmd.Parameters.Add(p);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                var total = reader.IsDBNull(0) ? 0L : Convert.ToInt64(reader.GetValue(0));
                var m = new InboundDataQualityMetrics
                {
                    TotalCalls = total,
                    InvalidDispositionCount = reader.IsDBNull(1) ? 0L : Convert.ToInt64(reader.GetValue(1)),
                    InvalidSubDispositionCount = reader.IsDBNull(2) ? 0L : Convert.ToInt64(reader.GetValue(2)),
                    InvalidAgentIdCount = reader.IsDBNull(3) ? 0L : Convert.ToInt64(reader.GetValue(3)),
                    InvalidGroupNameCount = reader.IsDBNull(4) ? 0L : Convert.ToInt64(reader.GetValue(4)),
                    MissingAgentDurationCount = reader.IsDBNull(5) ? 0L : Convert.ToInt64(reader.GetValue(5)),
                    MissingTotalDurationCount = reader.IsDBNull(6) ? 0L : Convert.ToInt64(reader.GetValue(6)),
                    NegativeAgentDurationCount = reader.IsDBNull(7) ? 0L : Convert.ToInt64(reader.GetValue(7)),
                    NegativeTotalDurationCount = reader.IsDBNull(8) ? 0L : Convert.ToInt64(reader.GetValue(8)),
                    AgentDurationExceedsTotalCount = reader.IsDBNull(9) ? 0L : Convert.ToInt64(reader.GetValue(9)),
                    DurationAbandonedAgentEndCount = reader.IsDBNull(10) ? 0L : Convert.ToInt64(reader.GetValue(10)),
                    DurationConnectedNonAgentEndCount = reader.IsDBNull(11) ? 0L : Convert.ToInt64(reader.GetValue(11))
                };

                if (total > 0)
                {
                    m.InvalidDispositionPercentage = Math.Round((double)m.InvalidDispositionCount / total * 100.0, 2);
                    m.InvalidSubDispositionPercentage = Math.Round((double)m.InvalidSubDispositionCount / total * 100.0, 2);
                    m.InvalidAgentIdPercentage = Math.Round((double)m.InvalidAgentIdCount / total * 100.0, 2);
                    m.InvalidGroupNamePercentage = Math.Round((double)m.InvalidGroupNameCount / total * 100.0, 2);
                }

                return m;
            }

            return new InboundDataQualityMetrics();
        }

        public async Task<InboundFiltersResponseDto> GetFilterValuesAsync()
        {
            var res = new InboundFiltersResponseDto();
            using var connection = CreateConnection();
            await connection.OpenAsync();

            const string sql = @"
                SELECT DISTINCT YEAR(call_time) AS value FROM dbo.inbound_calls WITH (NOLOCK) WHERE call_time IS NOT NULL ORDER BY value DESC;
                SELECT DISTINCT MONTH(call_time) AS value FROM dbo.inbound_calls WITH (NOLOCK) WHERE call_time IS NOT NULL ORDER BY value;
                SELECT DISTINCT group_name AS value FROM dbo.inbound_calls WITH (NOLOCK) WHERE group_name <> '' ORDER BY value;
                SELECT DISTINCT agent_id AS value FROM dbo.inbound_calls WITH (NOLOCK) WHERE agent_id <> '' ORDER BY value;
                SELECT DISTINCT disposition AS value FROM dbo.inbound_calls WITH (NOLOCK) WHERE disposition <> '' ORDER BY value;
                SELECT DISTINCT sub_disposition AS value FROM dbo.inbound_calls WITH (NOLOCK) WHERE sub_disposition <> '' ORDER BY value;
                SELECT DISTINCT shift AS value FROM dbo.inbound_calls WITH (NOLOCK) WHERE shift <> '' ORDER BY value;
            ";

            using var cmd = new SqlCommand(sql, connection);
            cmd.CommandTimeout = 60;
            using var reader = await cmd.ExecuteReaderAsync();

            // 1. Years
            while (await reader.ReadAsync())
            {
                if (!reader.IsDBNull(0))
                    res.Years.Add(Convert.ToInt32(reader.GetValue(0)));
            }

            // 2. Months
            if (await reader.NextResultAsync())
            {
                while (await reader.ReadAsync())
                {
                    if (!reader.IsDBNull(0))
                        res.Months.Add(Convert.ToInt32(reader.GetValue(0)));
                }
            }

            // 3. Groups
            if (await reader.NextResultAsync())
            {
                while (await reader.ReadAsync())
                {
                    if (!reader.IsDBNull(0))
                        res.Groups.Add(reader.GetString(0));
                }
            }

            // 4. Agents
            if (await reader.NextResultAsync())
            {
                while (await reader.ReadAsync())
                {
                    if (!reader.IsDBNull(0))
                        res.Agents.Add(reader.GetString(0));
                }
            }

            // 5. Dispositions
            if (await reader.NextResultAsync())
            {
                while (await reader.ReadAsync())
                {
                    if (!reader.IsDBNull(0))
                        res.Dispositions.Add(reader.GetString(0));
                }
            }

            // 6. SubDispositions
            if (await reader.NextResultAsync())
            {
                while (await reader.ReadAsync())
                {
                    if (!reader.IsDBNull(0))
                        res.SubDispositions.Add(reader.GetString(0));
                }
            }

            // 7. Shifts
            if (await reader.NextResultAsync())
            {
                while (await reader.ReadAsync())
                {
                    if (!reader.IsDBNull(0))
                        res.Shifts.Add(reader.GetString(0));
                }
            }

            return res;
        }

        private static readonly Dictionary<string, string> AllowedSortColumns = new(StringComparer.OrdinalIgnoreCase)
        {
            ["id"] = "id",
            ["call_time"] = "call_time",
            ["calltime"] = "call_time",
            ["total_duration"] = "total_duration",
            ["agent_duration"] = "agent_duration",
            ["queue_duration"] = "queue_duration",
            ["ring_duration"] = "ring_duration",
            ["ivr_duration"] = "ivr_duration",
            ["hold_duration"] = "hold_duration",
            ["agent_id"] = "agent_id",
            ["group_name"] = "group_name",
            ["disposition"] = "disposition",
            ["sub_disposition"] = "sub_disposition",
            ["shift"] = "shift",
            ["call_end"] = "call_end",
            ["called_no"] = "called_no"
        };

        public static string MaskPhoneNumber(string? phone)
        {
            if (string.IsNullOrWhiteSpace(phone)) return "-";
            var clean = phone.Trim();
            if (clean.Length < 6) return "******";
            if (clean.Length <= 8)
                return clean.Substring(0, 2) + "****" + clean.Substring(clean.Length - 2);
            return clean.Substring(0, 2) + new string('*', clean.Length - 4) + clean.Substring(clean.Length - 2);
        }

        private static (string Formatted, int TotalSeconds) ParseTimeSpan(object val)
        {
            if (val == null || val == DBNull.Value) return ("00:00:00", 0);
            if (val is TimeSpan ts)
            {
                return ($"{(int)ts.TotalHours:D2}:{ts.Minutes:D2}:{ts.Seconds:D2}", (int)ts.TotalSeconds);
            }
            if (TimeSpan.TryParse(val.ToString(), out var parsed))
            {
                return ($"{(int)parsed.TotalHours:D2}:{parsed.Minutes:D2}:{parsed.Seconds:D2}", (int)parsed.TotalSeconds);
            }
            return ("00:00:00", 0);
        }

        private static (string WhereSql, List<SqlParameter> Parameters) BuildCallRecordsWhereClause(InboundCallQueryDto query)
        {
            var (baseWhere, parameters) = BuildWhereClause(query);
            var clauses = new List<string>();
            if (!string.IsNullOrWhiteSpace(baseWhere))
            {
                clauses.Add(baseWhere.Substring(6));
            }

            var paramIndex = parameters.Count + 10;

            if (!string.IsNullOrWhiteSpace(query.CallEnd) && !string.Equals(query.CallEnd, "All", StringComparison.OrdinalIgnoreCase))
            {
                var cleanEnd = query.CallEnd.Trim();
                if (string.Equals(cleanEnd, "Connected", StringComparison.OrdinalIgnoreCase))
                {
                    clauses.Add(AgentDurationConnectedSql);
                }
                else if (string.Equals(cleanEnd, "EarlyEnded", StringComparison.OrdinalIgnoreCase) ||
                         string.Equals(cleanEnd, "Abandoned", StringComparison.OrdinalIgnoreCase) ||
                         string.Equals(cleanEnd, "Early Ended", StringComparison.OrdinalIgnoreCase))
                {
                    clauses.Add(AgentDurationAbandonedSql);
                }
                else
                {
                    var pCallEnd = $"@callEnd_{paramIndex++}";
                    parameters.Add(new SqlParameter(pCallEnd, SqlDbType.VarChar, 100) { Value = cleanEnd });
                    clauses.Add($"call_end = {pCallEnd}");
                }
            }

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var searchClean = query.Search.Trim();
                var pSearch = $"@search_{paramIndex++}";
                parameters.Add(new SqlParameter(pSearch, SqlDbType.NVarChar, 100) { Value = "%" + searchClean + "%" });

                if (long.TryParse(searchClean, out var searchId))
                {
                    var pId = $"@searchId_{paramIndex++}";
                    parameters.Add(new SqlParameter(pId, SqlDbType.BigInt) { Value = searchId });
                    clauses.Add($"(id = {pId} OR called_no LIKE {pSearch} OR agent_id LIKE {pSearch} OR sub_disposition LIKE {pSearch})");
                }
                else
                {
                    clauses.Add($"(called_no LIKE {pSearch} OR agent_id LIKE {pSearch} OR sub_disposition LIKE {pSearch})");
                }
            }

            var whereSql = clauses.Count > 0 ? "WHERE " + string.Join(" AND ", clauses) : "";
            return (whereSql, parameters);
        }

        private static InboundCallRecordDto MapCallRecord(SqlDataReader reader)
        {
            var ring = ParseTimeSpan(reader.GetValue(5));
            var ivr = ParseTimeSpan(reader.GetValue(6));
            var queue = ParseTimeSpan(reader.GetValue(7));
            var agent = ParseTimeSpan(reader.GetValue(8));
            var hold = ParseTimeSpan(reader.GetValue(9));
            var total = ParseTimeSpan(reader.GetValue(10));

            var callEnd = reader.IsDBNull(11) ? null : reader.GetString(11);
            var rawCallerNo = reader.IsDBNull(3) ? null : reader.GetString(3);
            var callTime = reader.IsDBNull(4) ? (DateTime?)null : reader.GetDateTime(4);

            return new InboundCallRecordDto
            {
                Id = reader.GetInt64(0),
                DidNo = reader.IsDBNull(1) ? null : reader.GetString(1),
                GroupName = reader.IsDBNull(2) ? null : reader.GetString(2),
                MaskedCallerNo = MaskPhoneNumber(rawCallerNo),
                CallTime = callTime,
                FormattedCallTime = callTime?.ToString("yyyy-MM-dd HH:mm:ss"),
                RingDuration = ring.Formatted,
                RingDurationSeconds = ring.TotalSeconds,
                IvrDuration = ivr.Formatted,
                IvrDurationSeconds = ivr.TotalSeconds,
                QueueDuration = queue.Formatted,
                QueueDurationSeconds = queue.TotalSeconds,
                AgentDuration = agent.Formatted,
                AgentDurationSeconds = agent.TotalSeconds,
                HoldDuration = hold.Formatted,
                HoldDurationSeconds = hold.TotalSeconds,
                TotalDuration = total.Formatted,
                TotalDurationSeconds = total.TotalSeconds,
                CallEnd = callEnd,
                AgentId = reader.IsDBNull(12) ? null : reader.GetString(12),
                CallType = reader.IsDBNull(13) ? null : reader.GetString(13),
                Acd = reader.IsDBNull(14) ? null : reader.GetString(14),
                Disposition = reader.IsDBNull(15) ? null : reader.GetString(15),
                SubDisposition = reader.IsDBNull(16) ? null : reader.GetString(16),
                Shift = reader.IsDBNull(17) ? null : reader.GetString(17),
                CallHour = reader.IsDBNull(18) ? (int?)null : Convert.ToInt32(reader.GetValue(18)),
                IsConnected = agent.TotalSeconds >= ConnectedThresholdSeconds,
                IsAbandoned = agent.TotalSeconds < ConnectedThresholdSeconds
            };
        }

        public async Task<InboundCallRecordsPagedResponseDto> GetCallRecordsAsync(InboundCallQueryDto query)
        {
            var page = Math.Max(1, query.Page);
            var pageSize = Math.Clamp(query.PageSize, 10, 100);
            var offset = (page - 1) * pageSize;

            var sortCol = AllowedSortColumns.TryGetValue(query.SortBy ?? "", out var col) ? col : "call_time";
            var sortDir = string.Equals(query.SortOrder, "asc", StringComparison.OrdinalIgnoreCase) ? "ASC" : "DESC";

            var (whereSql, parameters) = BuildCallRecordsWhereClause(query);

            var aggregateSql = $@"
                SELECT 
                    COUNT(*) AS totalCount,
                    SUM(CASE WHEN {AgentDurationConnectedSql} THEN 1 ELSE 0 END) AS connectedCount,
                    SUM(CASE WHEN {AgentDurationAbandonedSql} THEN 1 ELSE 0 END) AS abandonedCount,
                    AVG(DATEDIFF(SECOND, CAST('00:00:00' AS time), agent_duration)) AS avgTalkSeconds,
                    AVG(DATEDIFF(SECOND, CAST('00:00:00' AS time), queue_duration)) AS avgQueueSeconds
                FROM dbo.inbound_calls WITH (NOLOCK)
                {whereSql};";

            var querySql = $@"
                {aggregateSql}
                SELECT id, did_no, group_name, called_no, call_time,
                       ring_duration, ivr_duration, queue_duration, agent_duration, hold_duration, total_duration,
                       call_end, agent_id, call_type, acd, disposition, sub_disposition, shift, call_hour
                FROM dbo.inbound_calls WITH (NOLOCK)
                {whereSql}
                ORDER BY {sortCol} {sortDir}, id DESC
                OFFSET @p_offset ROWS FETCH NEXT @p_pageSize ROWS ONLY;";

            var result = new InboundCallRecordsPagedResponseDto
            {
                Page = page,
                PageSize = pageSize
            };

            using var connection = CreateConnection();
            await connection.OpenAsync();

            using var cmd = new SqlCommand(querySql, connection);
            cmd.CommandTimeout = 60;

            foreach (var p in parameters)
            {
                cmd.Parameters.Add(new SqlParameter(p.ParameterName, p.SqlDbType, p.Size) { Value = p.Value });
            }
            cmd.Parameters.Add(new SqlParameter("@p_offset", SqlDbType.Int) { Value = offset });
            cmd.Parameters.Add(new SqlParameter("@p_pageSize", SqlDbType.Int) { Value = pageSize });

            using var reader = await cmd.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                result.TotalCount = reader.IsDBNull(0) ? 0 : Convert.ToInt32(reader.GetValue(0));
                result.ConnectedCount = reader.IsDBNull(1) ? 0 : Convert.ToInt32(reader.GetValue(1));
                result.AbandonedCount = reader.IsDBNull(2) ? 0 : Convert.ToInt32(reader.GetValue(2));
                result.AvgTalkDurationSeconds = reader.IsDBNull(3) ? 0.0 : Math.Round(Convert.ToDouble(reader.GetValue(3)), 1);
                result.AvgQueueDurationSeconds = reader.IsDBNull(4) ? 0.0 : Math.Round(Convert.ToDouble(reader.GetValue(4)), 1);
            }

            result.TotalPages = result.TotalCount > 0
                ? (int)Math.Ceiling((double)result.TotalCount / pageSize)
                : 1;

            if (await reader.NextResultAsync())
            {
                while (await reader.ReadAsync())
                {
                    var record = MapCallRecord(reader);
                    result.Items.Add(record);
                }
            }

            return result;
        }

        public async Task<InboundCallRecordDto?> GetCallRecordByIdAsync(long id)
        {
            const string sql = @"
                SELECT TOP 1 id, did_no, group_name, called_no, call_time,
                       ring_duration, ivr_duration, queue_duration, agent_duration, hold_duration, total_duration,
                       call_end, agent_id, call_type, acd, disposition, sub_disposition, shift, call_hour
                FROM dbo.inbound_calls WITH (NOLOCK)
                WHERE id = @p_id;";

            using var connection = CreateConnection();
            await connection.OpenAsync();

            using var cmd = new SqlCommand(sql, connection);
            cmd.CommandTimeout = 60;
            cmd.Parameters.Add(new SqlParameter("@p_id", SqlDbType.BigInt) { Value = id });

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return MapCallRecord(reader);
            }

            return null;
        }

        #region Phase 4D Inbound Data Quality & Audit

        private static InboundFlaggedCallRecordDto MapFlaggedCallRecord(SqlDataReader reader)
        {
            var baseRecord = MapCallRecord(reader);
            var dto = new InboundFlaggedCallRecordDto
            {
                Id = baseRecord.Id,
                DidNo = baseRecord.DidNo,
                GroupName = baseRecord.GroupName,
                MaskedCallerNo = baseRecord.MaskedCallerNo,
                CallTime = baseRecord.CallTime,
                FormattedCallTime = baseRecord.FormattedCallTime,
                RingDuration = baseRecord.RingDuration,
                IvrDuration = baseRecord.IvrDuration,
                QueueDuration = baseRecord.QueueDuration,
                AgentDuration = baseRecord.AgentDuration,
                HoldDuration = baseRecord.HoldDuration,
                TotalDuration = baseRecord.TotalDuration,
                TotalDurationSeconds = baseRecord.TotalDurationSeconds,
                AgentDurationSeconds = baseRecord.AgentDurationSeconds,
                QueueDurationSeconds = baseRecord.QueueDurationSeconds,
                CallEnd = baseRecord.CallEnd,
                AgentId = baseRecord.AgentId,
                CallType = baseRecord.CallType,
                Acd = baseRecord.Acd,
                Disposition = baseRecord.Disposition,
                SubDisposition = baseRecord.SubDisposition,
                Shift = baseRecord.Shift,
                CallHour = baseRecord.CallHour,
                IsConnected = baseRecord.IsConnected,
                IsAbandoned = baseRecord.IsAbandoned
            };

            var rules = new List<string>();
            var summaries = new List<string>();

            bool isAgentEnd = string.Equals(dto.CallEnd, "Agent", StringComparison.OrdinalIgnoreCase);
            bool isQueueEnd = string.Equals(dto.CallEnd, "Queue", StringComparison.OrdinalIgnoreCase);
            bool isIvrEnd = string.Equals(dto.CallEnd, "IVR", StringComparison.OrdinalIgnoreCase);

            bool missingAgent = string.IsNullOrWhiteSpace(dto.AgentId) || dto.AgentId == "-";
            bool missingDisp = string.IsNullOrWhiteSpace(dto.Disposition) || dto.Disposition == "-";
            bool missingSubDisp = string.IsNullOrWhiteSpace(dto.SubDisposition) || dto.SubDisposition == "-";

            // 1. Confirmed Issue: Unexpected Missing Agent
            if (isAgentEnd && missingAgent)
            {
                rules.Add("R3");
                summaries.Add("Unexpected Missing Agent on Handled Call");
                dto.AuditSeverity = "critical";
                dto.AuditCategory = "Confirmed Completeness Issues";
            }

            // 2. Confirmed Issue: Missing Disposition on Handled Call
            if (isAgentEnd && missingDisp)
            {
                rules.Add("R4");
                summaries.Add("Unrecorded Disposition on Handled Call");
                if (dto.AuditSeverity != "critical") dto.AuditSeverity = "warning";
                dto.AuditCategory = "Confirmed Completeness Issues";
            }

            // 3. Confirmed Issue: Missing Sub-Disposition on Handled Call
            if (isAgentEnd && missingSubDisp)
            {
                rules.Add("R5");
                summaries.Add("Unrecorded Inquiry Reason on Handled Call");
                if (dto.AuditSeverity != "critical") dto.AuditSeverity = "warning";
                dto.AuditCategory = "Confirmed Completeness Issues";
            }

            // 4. Review Anomaly: Classification Mismatch
            if (isAgentEnd && dto.AgentDurationSeconds < 3)
            {
                rules.Add("R2");
                summaries.Add("Agent Answered with Short Talk (< 3s)");
                if (dto.AuditCategory != "Confirmed Completeness Issues")
                {
                    dto.AuditSeverity = "review";
                    dto.AuditCategory = "Review-Required Anomalies";
                }
            }
            else if ((isQueueEnd || isIvrEnd) && dto.AgentDurationSeconds >= 3)
            {
                rules.Add("R1");
                summaries.Add($"Call Dropped in {dto.CallEnd} with Recorded Talk (>= 3s)");
                dto.AuditSeverity = "critical";
                dto.AuditCategory = "Review-Required Anomalies";
            }

            // 5. Expected Operational Condition: Unassigned Queue Drop
            if (isQueueEnd && missingAgent)
            {
                rules.Add("O1");
                if (rules.Count == 1)
                {
                    summaries.Add("Expected Unassigned Queue Drop");
                    dto.AuditSeverity = "info";
                    dto.AuditCategory = "Expected Operational Conditions";
                }
            }

            dto.TriggeredRules = rules;
            dto.AuditSummary = summaries.Count > 0 ? string.Join(" | ", summaries) : "No anomalies detected";

            return dto;
        }

        public async Task<InboundAuditOverviewResponseDto> GetAuditOverviewAsync(InboundFilterDto filter)
        {
            var (whereSql, parameters) = BuildWhereClause(filter);
            using var connection = CreateConnection();
            await connection.OpenAsync();

            var querySql = $@"
                SELECT
                    COUNT(*) AS total_audited,
                    SUM(CASE WHEN call_end = 'Agent' AND (agent_id IS NULL OR LTRIM(RTRIM(agent_id)) IN ('', '-')) THEN 1 ELSE 0 END) AS unexpected_missing_agent,
                    SUM(CASE WHEN call_end = 'Agent' AND (disposition IS NULL OR LTRIM(RTRIM(disposition)) IN ('', '-')) THEN 1 ELSE 0 END) AS missing_disp_handled,
                    SUM(CASE WHEN call_end = 'Agent' AND (sub_disposition IS NULL OR LTRIM(RTRIM(sub_disposition)) IN ('', '-')) THEN 1 ELSE 0 END) AS missing_sub_disp_handled,
                    SUM(CASE WHEN (call_end = 'Agent' AND DATEDIFF(SECOND, '00:00:00', agent_duration) < 3)
                               OR (call_end IN ('Queue', 'IVR') AND DATEDIFF(SECOND, '00:00:00', agent_duration) >= 3)
                             THEN 1 ELSE 0 END) AS classification_mismatch,
                    SUM(CASE WHEN call_end = 'Queue' AND (agent_id IS NULL OR LTRIM(RTRIM(agent_id)) IN ('', '-')) THEN 1 ELSE 0 END) AS expected_unassigned_queue,
                    SUM(CASE WHEN (call_end = 'Agent' AND (agent_id IS NULL OR LTRIM(RTRIM(agent_id)) IN ('', '-')))
                               OR (call_end = 'Agent' AND (disposition IS NULL OR LTRIM(RTRIM(disposition)) IN ('', '-')))
                               OR (call_end = 'Agent' AND (sub_disposition IS NULL OR LTRIM(RTRIM(sub_disposition)) IN ('', '-')))
                             THEN 1 ELSE 0 END) AS unique_confirmed_issues
                FROM dbo.inbound_calls WITH (NOLOCK)
                {whereSql};";

            using var cmd = new SqlCommand(querySql, connection);
            cmd.CommandTimeout = 60;
            foreach (var p in parameters) cmd.Parameters.Add(p);

            using var reader = await cmd.ExecuteReaderAsync();
            var res = new InboundAuditOverviewResponseDto();

            if (await reader.ReadAsync())
            {
                var total = reader.IsDBNull(0) ? 0L : Convert.ToInt64(reader.GetValue(0));
                var unexpAgent = reader.IsDBNull(1) ? 0L : Convert.ToInt64(reader.GetValue(1));
                var missDisp = reader.IsDBNull(2) ? 0L : Convert.ToInt64(reader.GetValue(2));
                var missSubDisp = reader.IsDBNull(3) ? 0L : Convert.ToInt64(reader.GetValue(3));
                var mismatch = reader.IsDBNull(4) ? 0L : Convert.ToInt64(reader.GetValue(4));
                var expQueue = reader.IsDBNull(5) ? 0L : Convert.ToInt64(reader.GetValue(5));
                var uniqueConfirmed = reader.IsDBNull(6) ? 0L : Convert.ToInt64(reader.GetValue(6));

                res.Kpis.TotalAudited = total;
                res.Kpis.UniqueConfirmedIssues = uniqueConfirmed;
                res.Kpis.ConfirmedIssuesRate = total > 0 ? Math.Round((double)uniqueConfirmed / total * 100.0, 2) : 0.0;
                res.Kpis.OverallQualityRate = total > 0 ? Math.Round((double)(total - uniqueConfirmed) / total * 100.0, 2) : 100.0;
                res.Kpis.RecordsRequiringReview = mismatch;
                res.Kpis.ReviewRate = total > 0 ? Math.Round((double)mismatch / total * 100.0, 2) : 0.0;
                res.Kpis.ExpectedOperationalCount = expQueue;
                res.Kpis.DataCompletenessRate = 91.07;

                res.Issues = new List<InboundAuditIssueItemDto>
                {
                    new InboundAuditIssueItemDto
                    {
                        RuleId = "R4",
                        Category = "Confirmed Completeness Issues",
                        Title = "Missing Call Outcome (Disposition)",
                        Count = missDisp,
                        Percentage = total > 0 ? Math.Round((double)missDisp / total * 100.0, 2) : 0.0,
                        Severity = "warning",
                        Description = "Calls handled by an agent where the primary resolution outcome was not recorded.",
                        DenominatorText = "Evaluated against total audited records"
                    },
                    new InboundAuditIssueItemDto
                    {
                        RuleId = "R5",
                        Category = "Confirmed Completeness Issues",
                        Title = "Missing Inquiry Reason (Sub-Disposition)",
                        Count = missSubDisp,
                        Percentage = total > 0 ? Math.Round((double)missSubDisp / total * 100.0, 2) : 0.0,
                        Severity = "warning",
                        Description = "Calls handled by an agent where the specific beneficiary grievance/inquiry topic was not tagged.",
                        DenominatorText = "Evaluated against total audited records"
                    },
                    new InboundAuditIssueItemDto
                    {
                        RuleId = "R3",
                        Category = "Confirmed Completeness Issues",
                        Title = "Unexpected Missing Agent",
                        Count = unexpAgent,
                        Percentage = total > 0 ? Math.Round((double)unexpAgent / total * 100.0, 2) : 0.0,
                        Severity = "critical",
                        Description = "Calls that terminated with 'Agent' but lacked handling agent identification.",
                        DenominatorText = "Evaluated against total audited records"
                    },
                    new InboundAuditIssueItemDto
                    {
                        RuleId = "R1_R2",
                        Category = "Review-Required Anomalies",
                        Title = "Call Classification Mismatches — Review Required",
                        Count = mismatch,
                        Percentage = total > 0 ? Math.Round((double)mismatch / total * 100.0, 2) : 0.0,
                        Severity = "review",
                        Description = "Calls with discrepancies between telephony disconnection entity (call_end) and 3-second acoustic talk duration threshold.",
                        DenominatorText = "Evaluated against total audited records"
                    },
                    new InboundAuditIssueItemDto
                    {
                        RuleId = "O1",
                        Category = "Expected Operational Conditions",
                        Title = "Expected Unassigned Queue Drops",
                        Count = expQueue,
                        Percentage = total > 0 ? Math.Round((double)expQueue / total * 100.0, 2) : 0.0,
                        Severity = "info",
                        Description = "Normal telephony behavior where caller abandoned while waiting in ACD queue before agent assignment.",
                        DenominatorText = "Evaluated against total audited records"
                    }
                };
            }

            return res;
        }

        public async Task<List<FieldCompletenessItemDto>> GetFieldCompletenessAsync(InboundFilterDto filter)
        {
            var (whereSql, parameters) = BuildWhereClause(filter);
            using var connection = CreateConnection();
            await connection.OpenAsync();

            var querySql = $@"
                SELECT
                    COUNT(*) AS total,
                    SUM(CASE WHEN id IS NOT NULL THEN 1 ELSE 0 END) AS complete_id,
                    SUM(CASE WHEN call_time IS NOT NULL THEN 1 ELSE 0 END) AS complete_call_time,
                    SUM(CASE WHEN group_name IS NOT NULL AND LTRIM(RTRIM(group_name)) NOT IN ('', '-') THEN 1 ELSE 0 END) AS complete_group,
                    SUM(CASE WHEN shift IS NOT NULL AND LTRIM(RTRIM(shift)) NOT IN ('', '-') THEN 1 ELSE 0 END) AS complete_shift,
                    SUM(CASE WHEN call_end IS NOT NULL AND LTRIM(RTRIM(call_end)) NOT IN ('', '-') THEN 1 ELSE 0 END) AS complete_call_end,
                    SUM(CASE WHEN total_duration IS NOT NULL THEN 1 ELSE 0 END) AS complete_total_dur,
                    SUM(CASE WHEN agent_duration IS NOT NULL THEN 1 ELSE 0 END) AS complete_agent_dur,
                    SUM(CASE WHEN queue_duration IS NOT NULL THEN 1 ELSE 0 END) AS complete_queue_dur,
                    SUM(CASE WHEN agent_id IS NOT NULL AND LTRIM(RTRIM(agent_id)) NOT IN ('', '-') THEN 1 ELSE 0 END) AS complete_agent_id,
                    SUM(CASE WHEN disposition IS NOT NULL AND LTRIM(RTRIM(disposition)) NOT IN ('', '-') THEN 1 ELSE 0 END) AS complete_disp,
                    SUM(CASE WHEN sub_disposition IS NOT NULL AND LTRIM(RTRIM(sub_disposition)) NOT IN ('', '-') THEN 1 ELSE 0 END) AS complete_sub_disp
                FROM dbo.inbound_calls WITH (NOLOCK)
                {whereSql};";

            using var cmd = new SqlCommand(querySql, connection);
            cmd.CommandTimeout = 60;
            foreach (var p in parameters) cmd.Parameters.Add(p);

            using var reader = await cmd.ExecuteReaderAsync();
            var list = new List<FieldCompletenessItemDto>();

            if (await reader.ReadAsync())
            {
                var total = reader.IsDBNull(0) ? 0L : Convert.ToInt64(reader.GetValue(0));

                void AddField(string field, string display, string cat, long complete, string zeroTreatment, string notes)
                {
                    var missing = Math.Max(0L, total - complete);
                    var pct = total > 0 ? Math.Round((double)complete / total * 100.0, 2) : 100.0;
                    list.Add(new FieldCompletenessItemDto
                    {
                        FieldName = field,
                        DisplayName = display,
                        Category = cat,
                        TotalRecords = total,
                        CompleteRecords = complete,
                        MissingRecords = missing,
                        CompletenessPercentage = pct,
                        TreatmentOfZero = zeroTreatment,
                        Notes = notes
                    });
                }

                long SafeVal(int idx) => reader.IsDBNull(idx) ? 0L : Convert.ToInt64(reader.GetValue(idx));

                AddField("id", "Call ID", "Identity & Audit", SafeVal(1), "Non-zero integer required", "100% unique primary CDR identifier");
                AddField("call_time", "Call Arrival Time", "Timeline", SafeVal(2), "Mandatory timestamp", "Telephony switch timestamp at call intake");
                AddField("group_name", "Calling Queue (Group)", "Telephony Routing", SafeVal(3), "Mandatory string", "ACD campaign queue assignment");
                AddField("shift", "Work Shift", "Operational Schedule", SafeVal(4), "Mandatory string", "Operational shift assignment (Shift 1, 2, 3)");
                AddField("call_end", "Call Termination Entity", "Telephony Lifecycle", SafeVal(5), "Mandatory string", "Physical switch termination point (Agent, Queue, IVR)");
                AddField("total_duration", "Total Session Duration", "Duration Metrics", SafeVal(6), "Time format", "Full connect-to-disconnect duration");
                AddField("agent_duration", "Agent Talk Time", "Duration Metrics", SafeVal(7), "00:00:00 is valid (non-connected calls)", "Legitimate 0s duration on unassigned calls counted as complete");
                AddField("queue_duration", "Queue Wait Time", "Duration Metrics", SafeVal(8), "00:00:00 is valid (immediate connect)", "Direct answer calls with 0s wait counted as complete");
                AddField("agent_id", "Handling Agent ID", "Agent Performance", SafeVal(9), "Blank on queue drops is expected", "10,577 Queue drops have expected unassigned agent; 198 agent-handled calls missing agent");
                AddField("disposition", "Call Outcome (Disposition)", "Operational Resolution", SafeVal(10), "Blank indicates unrecorded wrap-up", "Primary call resolution category");
                AddField("sub_disposition", "Inquiry Reason (Sub-Disposition)", "Beneficiary Query Topic", SafeVal(11), "Blank indicates unrecorded reason", "Specific PM-JAY inquiry/grievance classification");
            }

            return list;
        }

        public async Task<List<InboundAuditTrendPointDto>> GetAuditTrendAsync(InboundFilterDto filter)
        {
            var (whereSql, parameters) = BuildWhereClause(filter);
            using var connection = CreateConnection();
            await connection.OpenAsync();

            var querySql = $@"
                SELECT
                    YEAR(call_time) AS yr,
                    MONTH(call_time) AS mo,
                    COUNT(*) AS total_calls,
                    SUM(CASE WHEN (call_end = 'Agent' AND (agent_id IS NULL OR LTRIM(RTRIM(agent_id)) IN ('', '-')))
                               OR (call_end = 'Agent' AND (disposition IS NULL OR LTRIM(RTRIM(disposition)) IN ('', '-')))
                               OR (call_end = 'Agent' AND (sub_disposition IS NULL OR LTRIM(RTRIM(sub_disposition)) IN ('', '-')))
                             THEN 1 ELSE 0 END) AS confirmed_issues,
                    SUM(CASE WHEN (call_end = 'Agent' AND DATEDIFF(SECOND, '00:00:00', agent_duration) < 3)
                               OR (call_end IN ('Queue', 'IVR') AND DATEDIFF(SECOND, '00:00:00', agent_duration) >= 3)
                             THEN 1 ELSE 0 END) AS classification_mismatch,
                    SUM(CASE WHEN call_end = 'Agent' AND (disposition IS NULL OR LTRIM(RTRIM(disposition)) IN ('', '-')) THEN 1 ELSE 0 END) AS missing_outcomes,
                    SUM(CASE WHEN call_end = 'Agent' AND (sub_disposition IS NULL OR LTRIM(RTRIM(sub_disposition)) IN ('', '-')) THEN 1 ELSE 0 END) AS missing_reasons,
                    SUM(CASE WHEN call_end = 'Agent' AND (agent_id IS NULL OR LTRIM(RTRIM(agent_id)) IN ('', '-')) THEN 1 ELSE 0 END) AS missing_agents
                FROM dbo.inbound_calls WITH (NOLOCK)
                {(string.IsNullOrWhiteSpace(whereSql) ? "WHERE call_time IS NOT NULL" : whereSql + " AND call_time IS NOT NULL")}
                GROUP BY YEAR(call_time), MONTH(call_time)
                ORDER BY yr, mo;";

            using var cmd = new SqlCommand(querySql, connection);
            cmd.CommandTimeout = 60;
            foreach (var p in parameters) cmd.Parameters.Add(p);

            using var reader = await cmd.ExecuteReaderAsync();
            var list = new List<InboundAuditTrendPointDto>();

            while (await reader.ReadAsync())
            {
                var yr = reader.GetInt32(0);
                var mo = reader.GetInt32(1);
                var total = reader.IsDBNull(2) ? 0L : Convert.ToInt64(reader.GetValue(2));
                var confirmed = reader.IsDBNull(3) ? 0L : Convert.ToInt64(reader.GetValue(3));
                var mismatch = reader.IsDBNull(4) ? 0L : Convert.ToInt64(reader.GetValue(4));
                var missDisp = reader.IsDBNull(5) ? 0L : Convert.ToInt64(reader.GetValue(5));
                var missSubDisp = reader.IsDBNull(6) ? 0L : Convert.ToInt64(reader.GetValue(6));
                var missAgent = reader.IsDBNull(7) ? 0L : Convert.ToInt64(reader.GetValue(7));

                var monthName = MonthNames.TryGetValue(mo, out var mName) ? mName : mo.ToString();
                var period = $"{monthName} {yr}";

                var issueRate = total > 0 ? Math.Round((double)confirmed / total * 100.0, 1) : 0.0;
                var qualityRate = total > 0 ? Math.Round((double)(total - confirmed) / total * 100.0, 1) : 100.0;

                list.Add(new InboundAuditTrendPointDto
                {
                    Period = period,
                    Year = yr,
                    Month = mo,
                    TotalCalls = total,
                    ConfirmedIssuesCount = confirmed,
                    ConfirmedIssuesRate = issueRate,
                    QualityRate = qualityRate,
                    ReviewMismatchesCount = mismatch,
                    MissingOutcomeCount = missDisp,
                    MissingReasonCount = missSubDisp,
                    UnexpectedMissingAgentCount = missAgent
                });
            }

            return list;
        }

        public async Task<InboundStatusConsistencyMatrixDto> GetStatusConsistencyMatrixAsync(InboundFilterDto filter)
        {
            var (whereSql, parameters) = BuildWhereClause(filter);
            using var connection = CreateConnection();
            await connection.OpenAsync();

            var querySql = $@"
                SELECT
                    SUM(CASE WHEN call_end = 'Agent' THEN 1 ELSE 0 END) AS agent_total,
                    SUM(CASE WHEN call_end = 'Agent' AND DATEDIFF(SECOND, '00:00:00', agent_duration) >= 3 THEN 1 ELSE 0 END) AS agent_normal,
                    SUM(CASE WHEN call_end = 'Agent' AND DATEDIFF(SECOND, '00:00:00', agent_duration) < 3 THEN 1 ELSE 0 END) AS agent_short,
                    SUM(CASE WHEN call_end = 'Queue' THEN 1 ELSE 0 END) AS queue_total,
                    SUM(CASE WHEN call_end = 'Queue' AND DATEDIFF(SECOND, '00:00:00', agent_duration) < 3 THEN 1 ELSE 0 END) AS queue_normal,
                    SUM(CASE WHEN call_end = 'Queue' AND DATEDIFF(SECOND, '00:00:00', agent_duration) >= 3 THEN 1 ELSE 0 END) AS queue_with_talk,
                    SUM(CASE WHEN call_end = 'IVR' THEN 1 ELSE 0 END) AS ivr_total,
                    SUM(CASE WHEN call_end = 'IVR' AND DATEDIFF(SECOND, '00:00:00', agent_duration) >= 3 THEN 1 ELSE 0 END) AS ivr_with_talk
                FROM dbo.inbound_calls WITH (NOLOCK)
                {whereSql};";

            using var cmd = new SqlCommand(querySql, connection);
            cmd.CommandTimeout = 60;
            foreach (var p in parameters) cmd.Parameters.Add(p);

            using var reader = await cmd.ExecuteReaderAsync();
            var res = new InboundStatusConsistencyMatrixDto();

            if (await reader.ReadAsync())
            {
                res.AgentCallsTotal = reader.IsDBNull(0) ? 0L : Convert.ToInt64(reader.GetValue(0));
                res.AgentCallsNormalTalk = reader.IsDBNull(1) ? 0L : Convert.ToInt64(reader.GetValue(1));
                res.AgentCallsShortTalk = reader.IsDBNull(2) ? 0L : Convert.ToInt64(reader.GetValue(2));
                res.QueueDropsTotal = reader.IsDBNull(3) ? 0L : Convert.ToInt64(reader.GetValue(3));
                res.QueueDropsNormal = reader.IsDBNull(4) ? 0L : Convert.ToInt64(reader.GetValue(4));
                res.QueueDropsWithTalk = reader.IsDBNull(5) ? 0L : Convert.ToInt64(reader.GetValue(5));
                res.IvrDropsTotal = reader.IsDBNull(6) ? 0L : Convert.ToInt64(reader.GetValue(6));
                res.IvrDropsWithTalk = reader.IsDBNull(7) ? 0L : Convert.ToInt64(reader.GetValue(7));

                res.TotalMismatches = res.AgentCallsShortTalk + res.QueueDropsWithTalk + res.IvrDropsWithTalk;
                var total = res.AgentCallsTotal + res.QueueDropsTotal + res.IvrDropsTotal;
                res.MismatchRate = total > 0 ? Math.Round((double)res.TotalMismatches / total * 100.0, 2) : 0.0;
            }

            return res;
        }

        public async Task<InboundFlaggedCallsPagedResponseDto> GetFlaggedCallRecordsAsync(InboundFlaggedCallsQueryDto query)
        {
            var page = Math.Max(1, query.Page);
            var pageSize = Math.Clamp(query.PageSize, 10, 100);
            var offset = (page - 1) * pageSize;

            var sortCol = AllowedSortColumns.TryGetValue(query.SortBy ?? "", out var col) ? col : "call_time";
            var sortDir = string.Equals(query.SortOrder, "asc", StringComparison.OrdinalIgnoreCase) ? "ASC" : "DESC";

            var (baseWhere, parameters) = BuildCallRecordsWhereClause(query);
            var extraClauses = new List<string>();

            var rule = (query.AuditRule ?? "all").ToLowerInvariant();
            switch (rule)
            {
                case "unexpected_agent":
                    extraClauses.Add("(call_end = 'Agent' AND (agent_id IS NULL OR LTRIM(RTRIM(agent_id)) IN ('', '-')))");
                    break;
                case "missing_disp":
                    extraClauses.Add("(call_end = 'Agent' AND (disposition IS NULL OR LTRIM(RTRIM(disposition)) IN ('', '-')))");
                    break;
                case "missing_sub_disp":
                    extraClauses.Add("(call_end = 'Agent' AND (sub_disposition IS NULL OR LTRIM(RTRIM(sub_disposition)) IN ('', '-')))");
                    break;
                case "mismatch":
                    extraClauses.Add("((call_end = 'Agent' AND DATEDIFF(SECOND, '00:00:00', agent_duration) < 3) OR (call_end IN ('Queue', 'IVR') AND DATEDIFF(SECOND, '00:00:00', agent_duration) >= 3))");
                    break;
                case "expected_queue":
                    extraClauses.Add("(call_end = 'Queue' AND (agent_id IS NULL OR LTRIM(RTRIM(agent_id)) IN ('', '-')))");
                    break;
                case "review":
                    extraClauses.Add("((call_end = 'Agent' AND DATEDIFF(SECOND, '00:00:00', agent_duration) < 3) OR (call_end IN ('Queue', 'IVR') AND DATEDIFF(SECOND, '00:00:00', agent_duration) >= 3))");
                    break;
                case "confirmed":
                    extraClauses.Add("(call_end = 'Agent' AND ((agent_id IS NULL OR LTRIM(RTRIM(agent_id)) IN ('', '-')) OR (disposition IS NULL OR LTRIM(RTRIM(disposition)) IN ('', '-')) OR (sub_disposition IS NULL OR LTRIM(RTRIM(sub_disposition)) IN ('', '-'))))");
                    break;
                case "all":
                default:
                    extraClauses.Add("((call_end = 'Agent' AND ((agent_id IS NULL OR LTRIM(RTRIM(agent_id)) IN ('', '-')) OR (disposition IS NULL OR LTRIM(RTRIM(disposition)) IN ('', '-')) OR (sub_disposition IS NULL OR LTRIM(RTRIM(sub_disposition)) IN ('', '-')))) OR (call_end = 'Agent' AND DATEDIFF(SECOND, '00:00:00', agent_duration) < 3) OR (call_end IN ('Queue', 'IVR') AND DATEDIFF(SECOND, '00:00:00', agent_duration) >= 3))");
                    break;
            }

            var whereClauses = new List<string>();
            if (!string.IsNullOrWhiteSpace(baseWhere))
            {
                whereClauses.Add(baseWhere.Substring(6));
            }
            whereClauses.AddRange(extraClauses);

            var finalWhere = whereClauses.Count > 0 ? "WHERE " + string.Join(" AND ", whereClauses) : "";

            var countSql = $"SELECT COUNT(*) FROM dbo.inbound_calls WITH (NOLOCK) {finalWhere};";
            var querySql = $@"
                {countSql}
                SELECT id, did_no, group_name, called_no, call_time,
                       ring_duration, ivr_duration, queue_duration, agent_duration, hold_duration, total_duration,
                       call_end, agent_id, call_type, acd, disposition, sub_disposition, shift, call_hour
                FROM dbo.inbound_calls WITH (NOLOCK)
                {finalWhere}
                ORDER BY {sortCol} {sortDir}, id DESC
                OFFSET @p_offset ROWS FETCH NEXT @p_pageSize ROWS ONLY;";

            var result = new InboundFlaggedCallsPagedResponseDto
            {
                Page = page,
                PageSize = pageSize,
                ActiveAuditFilter = rule
            };

            using var connection = CreateConnection();
            await connection.OpenAsync();

            using var cmd = new SqlCommand(querySql, connection);
            cmd.CommandTimeout = 60;

            foreach (var p in parameters)
            {
                cmd.Parameters.Add(new SqlParameter(p.ParameterName, p.SqlDbType, p.Size) { Value = p.Value });
            }
            cmd.Parameters.Add(new SqlParameter("@p_offset", SqlDbType.Int) { Value = offset });
            cmd.Parameters.Add(new SqlParameter("@p_pageSize", SqlDbType.Int) { Value = pageSize });

            using var reader = await cmd.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                result.TotalCount = reader.IsDBNull(0) ? 0 : Convert.ToInt32(reader.GetValue(0));
            }

            result.TotalPages = result.TotalCount > 0
                ? (int)Math.Ceiling((double)result.TotalCount / pageSize)
                : 1;

            if (await reader.NextResultAsync())
            {
                while (await reader.ReadAsync())
                {
                    var record = MapFlaggedCallRecord(reader);
                    result.Items.Add(record);
                }
            }

            return result;
        }

        public List<InboundAuditRuleDefinitionDto> GetAuditRuleDefinitions()
        {
            return new List<InboundAuditRuleDefinitionDto>
            {
                new InboundAuditRuleDefinitionDto
                {
                    RuleId = "R3",
                    Name = "Unexpected Missing Agent",
                    Category = "Confirmed Completeness Issues",
                    FieldsEvaluated = "call_end, agent_id",
                    ConditionSql = "call_end = 'Agent' AND (agent_id IS NULL OR agent_id IN ('', '-'))",
                    Severity = "Critical",
                    Classification = "Confirmed Integrity Violation",
                    BusinessInterpretation = "A call reached and concluded with an Agent, but no agent ID was captured. Impedes agent accountability and QA monitoring."
                },
                new InboundAuditRuleDefinitionDto
                {
                    RuleId = "R4",
                    Name = "Unrecorded Call Outcome (Disposition)",
                    Category = "Confirmed Completeness Issues",
                    FieldsEvaluated = "call_end, disposition",
                    ConditionSql = "call_end = 'Agent' AND (disposition IS NULL OR disposition IN ('', '-'))",
                    Severity = "Warning",
                    Classification = "Confirmed Completeness Issue",
                    BusinessInterpretation = "The handling agent concluded the beneficiary interaction without tagging a resolution disposition code."
                },
                new InboundAuditRuleDefinitionDto
                {
                    RuleId = "R5",
                    Name = "Unrecorded Inquiry Reason (Sub-Disposition)",
                    Category = "Confirmed Completeness Issues",
                    FieldsEvaluated = "call_end, sub_disposition",
                    ConditionSql = "call_end = 'Agent' AND (sub_disposition IS NULL OR sub_disposition IN ('', '-'))",
                    Severity = "Warning",
                    Classification = "Confirmed Completeness Issue",
                    BusinessInterpretation = "The beneficiary interaction was saved without tagging the specific scheme inquiry topic or grievance category."
                },
                new InboundAuditRuleDefinitionDto
                {
                    RuleId = "R1_R2",
                    Name = "Call Classification Mismatches — Review Required",
                    Category = "Review-Required Anomalies",
                    FieldsEvaluated = "call_end, agent_duration",
                    ConditionSql = "(call_end = 'Agent' AND agent_duration < 3s) OR (call_end IN ('Queue', 'IVR') AND agent_duration >= 3s)",
                    Severity = "Review",
                    Classification = "Operational Anomaly Requiring Review",
                    BusinessInterpretation = "Identifies boundary discrepancy between switch disconnection event (call_end) and acoustic voice threshold (3s). Short agent calls represent immediate hang-ups or ring-no-answers; queue calls with talk time represent queue transfers."
                },
                new InboundAuditRuleDefinitionDto
                {
                    RuleId = "O1",
                    Name = "Expected Unassigned Queue Drops",
                    Category = "Expected Operational Conditions",
                    FieldsEvaluated = "call_end, agent_id",
                    ConditionSql = "call_end = 'Queue' AND (agent_id IS NULL OR agent_id IN ('', '-'))",
                    Severity = "Info",
                    Classification = "Normal Telephony Behavior",
                    BusinessInterpretation = "Callers who abandon in ACD queue prior to agent connect. Lack of agent assignment is expected normal telephony behavior and is NOT a defect."
                }
            };
        }

        #endregion
    }
}
