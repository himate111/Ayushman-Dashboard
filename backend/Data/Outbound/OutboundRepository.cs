using System;
using System.Collections.Generic;
using System.Data;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using BeneficiaryGrievance.Api.DTOs.Outbound;

namespace BeneficiaryGrievance.Api.Data.Outbound
{
    public class OutboundRepository : IOutboundRepository
    {
        private readonly string _connectionString;

        private static readonly Dictionary<string, int> MonthMap = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Jan"] = 1, ["January"] = 1, ["1"] = 1, ["01"] = 1,
            ["Feb"] = 2, ["February"] = 2, ["2"] = 2, ["02"] = 2,
            ["Mar"] = 3, ["March"] = 3, ["3"] = 3, ["03"] = 3,
            ["Apr"] = 4, ["April"] = 4, ["4"] = 4, ["04"] = 4,
            ["May"] = 5, ["5"] = 5, ["05"] = 5,
            ["Jun"] = 6, ["June"] = 6, ["6"] = 6, ["06"] = 6,
            ["Jul"] = 7, ["July"] = 7, ["7"] = 7, ["07"] = 7,
            ["Aug"] = 8, ["August"] = 8, ["8"] = 8, ["08"] = 8,
            ["Sep"] = 9, ["September"] = 9, ["9"] = 9, ["09"] = 9,
            ["Oct"] = 10, ["October"] = 10, ["10"] = 10,
            ["Nov"] = 11, ["November"] = 11, ["11"] = 11,
            ["Dec"] = 12, ["December"] = 12, ["12"] = 12
        };

        private static readonly string[] MonthNames = new[]
        {
            "", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        };

        public OutboundRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("OutboundConnection")
                ?? configuration.GetConnectionString("InboundConnection")
                ?? throw new InvalidOperationException("Connection string 'OutboundConnection' not configured.");
        }

        private SqlConnection GetConnection() => new SqlConnection(_connectionString);

        private static string FormatDuration(double seconds)
        {
            if (seconds <= 0) return "0s";
            var ts = TimeSpan.FromSeconds(seconds);
            if (ts.TotalHours >= 1)
                return $"{(int)ts.TotalHours}h {ts.Minutes}m {ts.Seconds}s";
            if (ts.TotalMinutes >= 1)
                return $"{ts.Minutes}m {ts.Seconds}s";
            return $"{ts.Seconds}s";
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

        private (string whereClause, List<SqlParameter> parameters) BuildWhereClause(OutboundFilterDto? filter)
        {
            var clauses = new List<string>();
            var parameters = new List<SqlParameter>();
            int paramIndex = 1;

            if (filter == null)
                return (string.Empty, parameters);

            // 1. Year
            var years = NormalizeList(filter.Year);
            if (years.Count > 0)
            {
                var placeholders = new List<string>();
                foreach (var y in years)
                {
                    if (int.TryParse(y, out int yearVal))
                    {
                        var pName = $"@p_{paramIndex++}";
                        parameters.Add(new SqlParameter(pName, SqlDbType.Int) { Value = yearVal });
                        placeholders.Add(pName);
                    }
                }
                if (placeholders.Count > 0)
                    clauses.Add($"call_year IN ({string.Join(", ", placeholders)})");
            }

            // 2. Month
            var months = NormalizeList(filter.Month);
            if (months.Count > 0)
            {
                var placeholders = new List<string>();
                foreach (var m in months)
                {
                    int monthVal = 0;
                    if (MonthMap.TryGetValue(m, out int mappedVal))
                        monthVal = mappedVal;
                    else if (int.TryParse(m, out int parsedVal))
                        monthVal = parsedVal;

                    if (monthVal >= 1 && monthVal <= 12)
                    {
                        var pName = $"@p_{paramIndex++}";
                        parameters.Add(new SqlParameter(pName, SqlDbType.Int) { Value = monthVal });
                        placeholders.Add(pName);
                    }
                }
                if (placeholders.Count > 0)
                    clauses.Add($"call_month IN ({string.Join(", ", placeholders)})");
            }

            // 3. Start Date
            if (!string.IsNullOrWhiteSpace(filter.StartDate) && DateTime.TryParse(filter.StartDate, out DateTime startDate))
            {
                var pName = $"@p_{paramIndex++}";
                parameters.Add(new SqlParameter(pName, SqlDbType.Date) { Value = startDate.Date });
                clauses.Add($"call_date >= {pName}");
            }

            // 4. End Date
            if (!string.IsNullOrWhiteSpace(filter.EndDate) && DateTime.TryParse(filter.EndDate, out DateTime endDate))
            {
                var pName = $"@p_{paramIndex++}";
                parameters.Add(new SqlParameter(pName, SqlDbType.Date) { Value = endDate.Date });
                clauses.Add($"call_date <= {pName}");
            }

            // 5. Group / Campaign
            var groups = NormalizeList(filter.GroupName);
            if (groups.Count > 0)
            {
                var placeholders = new List<string>();
                foreach (var g in groups)
                {
                    var pName = $"@p_{paramIndex++}";
                    parameters.Add(new SqlParameter(pName, SqlDbType.NVarChar, 255) { Value = g });
                    placeholders.Add(pName);
                }
                clauses.Add($"group_name IN ({string.Join(", ", placeholders)})");
            }

            // 6. Agent
            var agents = NormalizeList(filter.Agent);
            if (agents.Count > 0)
            {
                var placeholders = new List<string>();
                foreach (var a in agents)
                {
                    var pName = $"@p_{paramIndex++}";
                    parameters.Add(new SqlParameter(pName, SqlDbType.NVarChar, 50) { Value = a });
                    placeholders.Add(pName);
                }
                clauses.Add($"agent_id IN ({string.Join(", ", placeholders)})");
            }

            // 7. Disposition
            var disps = NormalizeList(filter.Disposition);
            if (disps.Count > 0)
            {
                var placeholders = new List<string>();
                foreach (var d in disps)
                {
                    var pName = $"@p_{paramIndex++}";
                    parameters.Add(new SqlParameter(pName, SqlDbType.NVarChar, 100) { Value = d });
                    placeholders.Add(pName);
                }
                clauses.Add($"disposition IN ({string.Join(", ", placeholders)})");
            }

            // 8. Sub-Disposition
            var subDisps = NormalizeList(filter.SubDisposition);
            if (subDisps.Count > 0)
            {
                var placeholders = new List<string>();
                foreach (var s in subDisps)
                {
                    var pName = $"@p_{paramIndex++}";
                    parameters.Add(new SqlParameter(pName, SqlDbType.NVarChar, 255) { Value = s });
                    placeholders.Add(pName);
                }
                clauses.Add($"sub_disposition IN ({string.Join(", ", placeholders)})");
            }

            // 9. Shift
            var shifts = NormalizeList(filter.Shift);
            if (shifts.Count > 0)
            {
                var shiftClauses = new List<string>();
                foreach (var s in shifts)
                {
                    string lower = s.ToLowerInvariant();
                    if (lower.Contains("morning"))
                        shiftClauses.Add("(call_hour >= 7 AND call_hour < 15)");
                    else if (lower.Contains("evening"))
                        shiftClauses.Add("(call_hour >= 15 AND call_hour < 23)");
                    else if (lower.Contains("night"))
                        shiftClauses.Add("(call_hour >= 23 OR call_hour < 7)");
                }
                if (shiftClauses.Count > 0)
                    clauses.Add($"({string.Join(" OR ", shiftClauses)})");
            }

            // 10. Call Type
            var callTypes = NormalizeList(filter.CallType);
            if (callTypes.Count > 0)
            {
                var placeholders = new List<string>();
                foreach (var ct in callTypes)
                {
                    var pName = $"@p_{paramIndex++}";
                    parameters.Add(new SqlParameter(pName, SqlDbType.NVarChar, 50) { Value = ct });
                    placeholders.Add(pName);
                }
                clauses.Add($"call_type IN ({string.Join(", ", placeholders)})");
            }

            // 11. ACD
            var acds = NormalizeList(filter.Acd);
            if (acds.Count > 0)
            {
                var placeholders = new List<string>();
                foreach (var a in acds)
                {
                    var pName = $"@p_{paramIndex++}";
                    parameters.Add(new SqlParameter(pName, SqlDbType.NVarChar, 50) { Value = a });
                    placeholders.Add(pName);
                }
                clauses.Add($"acd IN ({string.Join(", ", placeholders)})");
            }

            // 12. Call Mode
            var modes = NormalizeList(filter.CallMode);
            if (modes.Count > 0)
            {
                var placeholders = new List<string>();
                foreach (var m in modes)
                {
                    var pName = $"@p_{paramIndex++}";
                    parameters.Add(new SqlParameter(pName, SqlDbType.NVarChar, 20) { Value = m });
                    placeholders.Add(pName);
                }
                clauses.Add($"call_mode IN ({string.Join(", ", placeholders)})");
            }

            string where = clauses.Count > 0 ? "WHERE " + string.Join(" AND ", clauses) : string.Empty;
            return (where, parameters);
        }

        private static void CloneParameters(SqlCommand cmd, IEnumerable<SqlParameter> parameters)
        {
            cmd.CommandTimeout = 90;
            cmd.Parameters.Clear();
            foreach (var p in parameters)
            {
                var clone = new SqlParameter
                {
                    ParameterName = p.ParameterName,
                    SqlDbType = p.SqlDbType,
                    Value = p.Value ?? DBNull.Value
                };
                if (p.Size > 0)
                {
                    clone.Size = p.Size;
                }
                cmd.Parameters.Add(clone);
            }
        }

        public async Task<OutboundKpiDto> GetKpisAsync(OutboundFilterDto filter)
        {
            var (where, parameters) = BuildWhereClause(filter);
            string sql = $@"
                SELECT 
                    COUNT(*) AS total_calls,
                    SUM(CASE WHEN is_connected = 1 THEN 1 ELSE 0 END) AS connected_calls,
                    SUM(CASE WHEN is_connected = 0 THEN 1 ELSE 0 END) AS not_connected_calls,
                    AVG(CAST(total_seconds AS FLOAT)) AS avg_total_duration_sec,
                    AVG(CAST(agent_seconds AS FLOAT)) AS avg_agent_duration_sec,
                    SUM(CAST(agent_seconds AS BIGINT)) / 3600.0 AS total_talk_time_hours,
                    SUM(CASE WHEN (total_seconds > 0 AND (agent_seconds = 0 OR agent_seconds IS NULL)) THEN 1 ELSE 0 END) AS wasted_attempts_count
                FROM dbo.outbound_cdr_calls WITH (NOLOCK)
                {where};";

            using var conn = GetConnection();
            await conn.OpenAsync();
            using var cmd = new SqlCommand(sql, conn);
            cmd.CommandTimeout = 90;
            CloneParameters(cmd, parameters);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                long total = reader.IsDBNull(0) ? 0 : Convert.ToInt64(reader[0]);
                long connected = reader.IsDBNull(1) ? 0 : Convert.ToInt64(reader[1]);
                long notConnected = reader.IsDBNull(2) ? 0 : Convert.ToInt64(reader[2]);
                double avgTotal = reader.IsDBNull(3) ? 0 : Convert.ToDouble(reader[3]);
                double avgAgent = reader.IsDBNull(4) ? 0 : Convert.ToDouble(reader[4]);
                double talkTimeHours = reader.IsDBNull(5) ? 0 : Convert.ToDouble(reader[5]);
                long wasted = reader.IsDBNull(6) ? 0 : Convert.ToInt64(reader[6]);

                double rate = total > 0 ? Math.Round((double)connected / total * 100, 2) : 0;
                double notConnectedPct = total > 0 ? Math.Round((double)notConnected / total * 100, 2) : 0;

                return new OutboundKpiDto
                {
                    TotalCalls = total,
                    ConnectedCalls = connected,
                    NotConnectedCalls = notConnected,
                    ConnectionRate = rate,
                    NotConnectedPercentage = notConnectedPct,
                    AvgCallDurationSeconds = Math.Round(avgTotal, 1),
                    AvgAgentDurationSeconds = Math.Round(avgAgent, 1),
                    AvgCallDuration = FormatDuration(avgTotal),
                    AvgAgentDuration = FormatDuration(avgAgent),
                    TotalTalkTimeHours = Math.Round(talkTimeHours, 1),
                    WastedAttemptsCount = wasted
                };
            }

            return new OutboundKpiDto();
        }

        public async Task<OutboundChartsDto> GetChartsAsync(OutboundFilterDto filter)
        {
            var charts = new OutboundChartsDto();
            var (where, parameters) = BuildWhereClause(filter);

            using var conn = GetConnection();
            await conn.OpenAsync();

            // 1. Outcome Mix
            string outcomeSql = $@"
                SELECT 
                    CASE 
                        WHEN disposition = 'Connected' THEN 'Connected'
                        WHEN disposition = 'Not Connected' THEN 'Not Connected'
                        WHEN LOWER(LTRIM(RTRIM(ISNULL(disposition, '')))) IN ('autosave', 'auto save') THEN 'Autosave'
                        WHEN LOWER(REPLACE(LTRIM(RTRIM(ISNULL(disposition, ''))), ' ', '')) IN ('callback', 'call-back') THEN 'Call Back'
                        ELSE 'Blank / Unknown'
                    END AS Name,
                    COUNT(*) AS Value
                FROM dbo.outbound_cdr_calls WITH (NOLOCK)
                {where}
                GROUP BY 
                    CASE 
                        WHEN disposition = 'Connected' THEN 'Connected'
                        WHEN disposition = 'Not Connected' THEN 'Not Connected'
                        WHEN LOWER(LTRIM(RTRIM(ISNULL(disposition, '')))) IN ('autosave', 'auto save') THEN 'Autosave'
                        WHEN LOWER(REPLACE(LTRIM(RTRIM(ISNULL(disposition, ''))), ' ', '')) IN ('callback', 'call-back') THEN 'Call Back'
                        ELSE 'Blank / Unknown'
                    END
                ORDER BY Value DESC;";

            using (var cmd = new SqlCommand(outcomeSql, conn))
            {
                CloneParameters(cmd, parameters);
                using var r = await cmd.ExecuteReaderAsync();
                long total = 0;
                while (await r.ReadAsync())
                {
                    long val = r.IsDBNull(1) ? 0 : Convert.ToInt64(r[1]);
                    total += val;
                    charts.OutcomeMix.Add(new OutboundChartNameValueDto
                    {
                        Name = r.IsDBNull(0) ? "Unknown" : r.GetString(0),
                        Value = val
                    });
                }
                if (total > 0)
                {
                    foreach (var item in charts.OutcomeMix)
                    {
                        item.Percentage = Math.Round((double)item.Value / total * 100, 2);
                    }
                }
            }

            // 2. Dispositions (Top 10)
            string dispSql = $@"
                SELECT TOP 10
                    ISNULL(NULLIF(LTRIM(RTRIM(disposition)), ''), 'Unknown') AS Name,
                    COUNT(*) AS Value
                FROM dbo.outbound_cdr_calls WITH (NOLOCK)
                {where}
                GROUP BY ISNULL(NULLIF(LTRIM(RTRIM(disposition)), ''), 'Unknown')
                ORDER BY Value DESC;";

            using (var cmd = new SqlCommand(dispSql, conn))
            {
                CloneParameters(cmd, parameters);
                using var r = await cmd.ExecuteReaderAsync();
                while (await r.ReadAsync())
                {
                    charts.Dispositions.Add(new OutboundChartNameValueDto
                    {
                        Name = r.GetString(0),
                        Value = Convert.ToInt64(r[1])
                    });
                }
            }

            // 3a. Top 5 Connected Sub-Dispositions
            string topSubDispSql = $@"
                SELECT TOP 5
                    ISNULL(NULLIF(LTRIM(RTRIM(sub_disposition)), ''), 'Blank / Unknown') AS Name,
                    COUNT(*) AS Value
                FROM dbo.outbound_cdr_calls WITH (NOLOCK)
                {where} {(string.IsNullOrEmpty(where) ? "WHERE" : "AND")} disposition = 'Connected'
                GROUP BY ISNULL(NULLIF(LTRIM(RTRIM(sub_disposition)), ''), 'Blank / Unknown')
                ORDER BY Value DESC;";

            using (var cmd = new SqlCommand(topSubDispSql, conn))
            {
                CloneParameters(cmd, parameters);
                using var r = await cmd.ExecuteReaderAsync();
                long topSubTotal = 0;
                while (await r.ReadAsync())
                {
                    long val = Convert.ToInt64(r[1]);
                    topSubTotal += val;
                    charts.TopSubDispositions.Add(new OutboundChartNameValueDto
                    {
                        Name = r.GetString(0),
                        Value = val
                    });
                }
                if (topSubTotal > 0)
                {
                    foreach (var item in charts.TopSubDispositions)
                    {
                        item.Percentage = Math.Round((double)item.Value / topSubTotal * 100, 2);
                    }
                }
            }

            // 3b. Bottom 5 Connected Sub-Dispositions
            string bottomSubDispSql = $@"
                SELECT TOP 5
                    ISNULL(NULLIF(LTRIM(RTRIM(sub_disposition)), ''), 'Blank / Unknown') AS Name,
                    COUNT(*) AS Value
                FROM dbo.outbound_cdr_calls WITH (NOLOCK)
                {where} {(string.IsNullOrEmpty(where) ? "WHERE" : "AND")} disposition = 'Connected'
                GROUP BY ISNULL(NULLIF(LTRIM(RTRIM(sub_disposition)), ''), 'Blank / Unknown')
                ORDER BY Value ASC;";

            using (var cmd = new SqlCommand(bottomSubDispSql, conn))
            {
                CloneParameters(cmd, parameters);
                using var r = await cmd.ExecuteReaderAsync();
                long bottomSubTotal = 0;
                while (await r.ReadAsync())
                {
                    long val = Convert.ToInt64(r[1]);
                    bottomSubTotal += val;
                    charts.BottomSubDispositions.Add(new OutboundChartNameValueDto
                    {
                        Name = r.GetString(0),
                        Value = val
                    });
                }
                if (bottomSubTotal > 0)
                {
                    foreach (var item in charts.BottomSubDispositions)
                    {
                        item.Percentage = Math.Round((double)item.Value / bottomSubTotal * 100, 2);
                    }
                }
            }

            // 4. Outbound Call Name Distribution (Top 5 Groups)
            string groupSql = $@"
                SELECT TOP 5
                    ISNULL(NULLIF(LTRIM(RTRIM(group_name)), ''), 'Blank / Unknown') AS Name,
                    COUNT(*) AS Value
                FROM dbo.outbound_cdr_calls WITH (NOLOCK)
                {where}
                GROUP BY ISNULL(NULLIF(LTRIM(RTRIM(group_name)), ''), 'Blank / Unknown')
                ORDER BY Value DESC;";

            using (var cmd = new SqlCommand(groupSql, conn))
            {
                CloneParameters(cmd, parameters);
                using var r = await cmd.ExecuteReaderAsync();
                long groupTotal = 0;
                while (await r.ReadAsync())
                {
                    long val = Convert.ToInt64(r[1]);
                    groupTotal += val;
                    charts.Groups.Add(new OutboundChartNameValueDto
                    {
                        Name = r.GetString(0),
                        Value = val
                    });
                }
                if (groupTotal > 0)
                {
                    foreach (var item in charts.Groups)
                    {
                        item.Percentage = Math.Round((double)item.Value / groupTotal * 100, 2);
                    }
                }
            }

            // 5. Calls by Shift (Outbound Standard: 07-15 Morning, 15-23 Evening, 23-07 Night)
            string shiftSql = $@"
                SELECT 
                    CASE 
                        WHEN call_hour >= 7 AND call_hour < 15 THEN 'Morning Shift'
                        WHEN call_hour >= 15 AND call_hour < 23 THEN 'Evening Shift'
                        ELSE 'Night Shift'
                    END AS Shift,
                    COUNT(*) AS TotalCalls,
                    SUM(CASE WHEN is_connected = 1 THEN 1 ELSE 0 END) AS ConnectedCalls,
                    SUM(CASE WHEN is_connected = 0 THEN 1 ELSE 0 END) AS NotConnectedCalls
                FROM dbo.outbound_cdr_calls WITH (NOLOCK)
                {where} {(string.IsNullOrEmpty(where) ? "WHERE" : "AND")} call_time IS NOT NULL
                GROUP BY 
                    CASE 
                        WHEN call_hour >= 7 AND call_hour < 15 THEN 'Morning Shift'
                        WHEN call_hour >= 15 AND call_hour < 23 THEN 'Evening Shift'
                        ELSE 'Night Shift'
                    END
                ORDER BY 
                    CASE 
                        WHEN CASE WHEN call_hour >= 7 AND call_hour < 15 THEN 'Morning Shift' WHEN call_hour >= 15 AND call_hour < 23 THEN 'Evening Shift' ELSE 'Night Shift' END = 'Morning Shift' THEN 1
                        WHEN CASE WHEN call_hour >= 7 AND call_hour < 15 THEN 'Morning Shift' WHEN call_hour >= 15 AND call_hour < 23 THEN 'Evening Shift' ELSE 'Night Shift' END = 'Evening Shift' THEN 2
                        ELSE 3
                    END;";

            using (var cmd = new SqlCommand(shiftSql, conn))
            {
                CloneParameters(cmd, parameters);
                using var r = await cmd.ExecuteReaderAsync();
                while (await r.ReadAsync())
                {
                    long t = Convert.ToInt64(r[1]);
                    long c = Convert.ToInt64(r[2]);
                    long nc = Convert.ToInt64(r[3]);
                    charts.Shifts.Add(new OutboundShiftMetricDto
                    {
                        Shift = r.GetString(0),
                        TotalCalls = t,
                        ConnectedCalls = c,
                        NotConnectedCalls = nc,
                        ConnectionRate = t > 0 ? Math.Round((double)c / t * 100, 1) : 0
                    });
                }
            }

            // 6a. Top 5 Agents
            string topAgentSql = $@"
                SELECT TOP 5
                    ISNULL(NULLIF(LTRIM(RTRIM(agent_id)), ''), 'Unassigned') AS AgentId,
                    COUNT(*) AS TotalCalls,
                    SUM(CASE WHEN is_connected = 1 THEN 1 ELSE 0 END) AS ConnectedCalls,
                    SUM(CASE WHEN is_connected = 0 THEN 1 ELSE 0 END) AS NotConnectedCalls,
                    AVG(CAST(agent_seconds AS FLOAT)) AS AvgDurationSeconds
                FROM dbo.outbound_cdr_calls WITH (NOLOCK)
                {where} {(string.IsNullOrEmpty(where) ? "WHERE" : "AND")} agent_id IS NOT NULL AND agent_id != '' AND agent_id != '-'
                GROUP BY ISNULL(NULLIF(LTRIM(RTRIM(agent_id)), ''), 'Unassigned')
                ORDER BY TotalCalls DESC;";

            using (var cmd = new SqlCommand(topAgentSql, conn))
            {
                CloneParameters(cmd, parameters);
                using var r = await cmd.ExecuteReaderAsync();
                while (await r.ReadAsync())
                {
                    long t = Convert.ToInt64(r[1]);
                    long c = Convert.ToInt64(r[2]);
                    long nc = Convert.ToInt64(r[3]);
                    double avgDur = r.IsDBNull(4) ? 0 : Convert.ToDouble(r[4]);
                    charts.TopAgents.Add(new OutboundAgentPerformanceDto
                    {
                        AgentId = r.GetString(0),
                        TotalCalls = t,
                        ConnectedCalls = c,
                        NotConnectedCalls = nc,
                        ConnectionRate = t > 0 ? Math.Round((double)c / t * 100, 1) : 0,
                        AvgDurationSeconds = Math.Round(avgDur, 1),
                        AvgDuration = FormatDuration(avgDur)
                    });
                }
            }

            // 6b. Bottom 5 Agents by Connection Rate (Minimum 100 Calls)
            string bottomAgentSql = $@"
                SELECT TOP 5
                    ISNULL(NULLIF(LTRIM(RTRIM(agent_id)), ''), 'Unassigned') AS AgentId,
                    COUNT(*) AS TotalCalls,
                    SUM(CASE WHEN is_connected = 1 THEN 1 ELSE 0 END) AS ConnectedCalls,
                    SUM(CASE WHEN is_connected = 0 THEN 1 ELSE 0 END) AS NotConnectedCalls,
                    AVG(CAST(agent_seconds AS FLOAT)) AS AvgDurationSeconds,
                    CAST(SUM(CASE WHEN is_connected = 1 THEN 1 ELSE 0 END) AS FLOAT) * 100.0 / COUNT(*) AS ConnectionRate
                FROM dbo.outbound_cdr_calls WITH (NOLOCK)
                {where} {(string.IsNullOrEmpty(where) ? "WHERE" : "AND")} agent_id IS NOT NULL AND agent_id != '' AND agent_id != '-'
                GROUP BY ISNULL(NULLIF(LTRIM(RTRIM(agent_id)), ''), 'Unassigned')
                HAVING COUNT(*) >= 100
                ORDER BY ConnectionRate ASC, TotalCalls DESC;";

            using (var cmd = new SqlCommand(bottomAgentSql, conn))
            {
                CloneParameters(cmd, parameters);
                using var r = await cmd.ExecuteReaderAsync();
                while (await r.ReadAsync())
                {
                    long t = Convert.ToInt64(r[1]);
                    long c = Convert.ToInt64(r[2]);
                    long nc = Convert.ToInt64(r[3]);
                    double avgDur = r.IsDBNull(4) ? 0 : Convert.ToDouble(r[4]);
                    charts.BottomAgents.Add(new OutboundAgentPerformanceDto
                    {
                        AgentId = r.GetString(0),
                        TotalCalls = t,
                        ConnectedCalls = c,
                        NotConnectedCalls = nc,
                        ConnectionRate = t > 0 ? Math.Round((double)c / t * 100, 1) : 0,
                        AvgDurationSeconds = Math.Round(avgDur, 1),
                        AvgDuration = FormatDuration(avgDur)
                    });
                }
            }

            // 7. Hourly
            string hourlySql = $@"
                SELECT 
                    call_hour AS Hour,
                    COUNT(*) AS TotalCalls,
                    SUM(CASE WHEN is_connected = 1 THEN 1 ELSE 0 END) AS ConnectedCalls,
                    SUM(CASE WHEN is_connected = 0 THEN 1 ELSE 0 END) AS NotConnectedCalls
                FROM dbo.outbound_cdr_calls WITH (NOLOCK)
                {where} {(string.IsNullOrEmpty(where) ? "WHERE" : "AND")} call_hour IS NOT NULL
                GROUP BY call_hour
                ORDER BY call_hour;";

            using (var cmd = new SqlCommand(hourlySql, conn))
            {
                CloneParameters(cmd, parameters);
                using var r = await cmd.ExecuteReaderAsync();
                var hourlyDict = new Dictionary<int, OutboundHourlyMetricsDto>();
                for (int h = 0; h < 24; h++)
                {
                    hourlyDict[h] = new OutboundHourlyMetricsDto
                    {
                        Hour = h,
                        Label = $"{h:D2}:00",
                        TotalCalls = 0,
                        ConnectedCalls = 0,
                        NotConnectedCalls = 0,
                        ConnectionRate = 0
                    };
                }

                while (await r.ReadAsync())
                {
                    int h = r.GetInt32(0);
                    long t = Convert.ToInt64(r[1]);
                    long c = Convert.ToInt64(r[2]);
                    long nc = Convert.ToInt64(r[3]);
                    if (hourlyDict.ContainsKey(h))
                    {
                        hourlyDict[h].TotalCalls = t;
                        hourlyDict[h].ConnectedCalls = c;
                        hourlyDict[h].NotConnectedCalls = nc;
                        hourlyDict[h].ConnectionRate = t > 0 ? Math.Round((double)c / t * 100, 1) : 0;
                    }
                }
                charts.Hourly = hourlyDict.Values.OrderBy(x => x.Hour).ToList();
            }

            // 8. Calls By Year
            string yearSql = $@"
                SELECT 
                    CAST(call_year AS VARCHAR(10)) AS Name,
                    COUNT(*) AS Value
                FROM dbo.outbound_cdr_calls WITH (NOLOCK)
                {where} {(string.IsNullOrEmpty(where) ? "WHERE" : "AND")} call_year IS NOT NULL
                GROUP BY call_year
                ORDER BY call_year;";

            using (var cmd = new SqlCommand(yearSql, conn))
            {
                CloneParameters(cmd, parameters);
                using var r = await cmd.ExecuteReaderAsync();
                long yearTotal = 0;
                while (await r.ReadAsync())
                {
                    long val = Convert.ToInt64(r[1]);
                    yearTotal += val;
                    charts.CallsByYear.Add(new OutboundChartNameValueDto
                    {
                        Name = r.GetString(0),
                        Value = val
                    });
                }
                if (yearTotal > 0)
                {
                    foreach (var item in charts.CallsByYear)
                    {
                        item.Percentage = Math.Round((double)item.Value / yearTotal * 100, 2);
                    }
                }
            }

            // 9. Calls By Month (Includes Year, Month, Total, Connected, Not Connected, and Percentages)
            string monthSql = $@"
                SELECT 
                    call_year AS CallYear,
                    call_month AS MonthNumber,
                    COUNT(*) AS TotalCalls,
                    SUM(CASE WHEN is_connected = 1 THEN 1 ELSE 0 END) AS ConnectedCalls,
                    SUM(CASE WHEN is_connected = 0 THEN 1 ELSE 0 END) AS NotConnectedCalls
                FROM dbo.outbound_cdr_calls WITH (NOLOCK)
                {where} {(string.IsNullOrEmpty(where) ? "WHERE" : "AND")} call_time IS NOT NULL AND call_year IS NOT NULL AND call_month IS NOT NULL
                GROUP BY call_year, call_month
                ORDER BY call_year, call_month;";

            using (var cmd = new SqlCommand(monthSql, conn))
            {
                CloneParameters(cmd, parameters);
                using var r = await cmd.ExecuteReaderAsync();
                while (await r.ReadAsync())
                {
                    int y = r.GetInt32(0);
                    int m = r.GetInt32(1);
                    long t = Convert.ToInt64(r[2]);
                    long c = Convert.ToInt64(r[3]);
                    long nc = Convert.ToInt64(r[4]);
                    charts.CallsByMonth.Add(new OutboundMonthlyCallsDto
                    {
                        Year = y,
                        MonthNumber = m,
                        Month = (m >= 1 && m <= 12) ? MonthNames[m] : m.ToString(),
                        TotalCalls = t,
                        ConnectedCalls = c,
                        NotConnectedCalls = nc,
                        ConnectionRate = t > 0 ? Math.Round((double)c / t * 100, 1) : 0,
                        ConnectedPercentage = t > 0 ? Math.Round((double)c / t * 100, 1) : 0,
                        NotConnectedPercentage = t > 0 ? Math.Round((double)nc / t * 100, 1) : 0
                    });
                }
            }

            // 10. Wasted Attempts (Top 5 Sub-Dispositions for is_connected = 0)
            string wastedSql = $@"
                SELECT TOP 5
                    ISNULL(NULLIF(LTRIM(RTRIM(sub_disposition)), ''), 'Blank / Unknown') AS Name,
                    COUNT(*) AS Value
                FROM dbo.outbound_cdr_calls WITH (NOLOCK)
                {where} {(string.IsNullOrEmpty(where) ? "WHERE" : "AND")} is_connected = 0
                GROUP BY ISNULL(NULLIF(LTRIM(RTRIM(sub_disposition)), ''), 'Blank / Unknown')
                ORDER BY Value DESC;";

            using (var cmd = new SqlCommand(wastedSql, conn))
            {
                CloneParameters(cmd, parameters);
                using var r = await cmd.ExecuteReaderAsync();
                long wastedTotal = 0;
                while (await r.ReadAsync())
                {
                    long val = Convert.ToInt64(r[1]);
                    wastedTotal += val;
                    charts.WastedAttempts.Add(new OutboundChartNameValueDto
                    {
                        Name = r.GetString(0),
                        Value = val
                    });
                }
                if (wastedTotal > 0)
                {
                    foreach (var item in charts.WastedAttempts)
                    {
                        item.Percentage = Math.Round((double)item.Value / wastedTotal * 100, 2);
                    }
                }
            }

            return charts;
        }

        public async Task<OutboundExecutiveSummaryDto> GetExecutiveSummaryAsync(OutboundFilterDto filter)
        {
            var kpis = await GetKpisAsync(filter);
            var summary = new OutboundExecutiveSummaryDto();

            if (kpis.TotalCalls == 0)
            {
                summary.Status = "Attention";
                summary.HealthScore = 50;
                summary.Summary = "No outbound telephony records match the selected filter criteria.";
                summary.Highlights.Add("No calls match the selected filters.");
                return summary;
            }

            var (where, parameters) = BuildWhereClause(filter);
            using var conn = GetConnection();
            await conn.OpenAsync();

            // 1. Data Quality Audit Checks
            string dqSql = $@"
                SELECT
                    SUM(CASE WHEN group_name IS NULL OR LTRIM(RTRIM(group_name)) = '' THEN 1 ELSE 0 END) AS MissingGroup,
                    SUM(CASE WHEN called_no IS NULL OR LTRIM(RTRIM(called_no)) = '' THEN 1 ELSE 0 END) AS MissingCalledNo,
                    SUM(CASE WHEN called_no IS NOT NULL AND LEN(LTRIM(RTRIM(called_no))) < 7 THEN 1 ELSE 0 END) AS InvalidCalledNo,
                    SUM(CASE WHEN agent_id IS NULL OR LTRIM(RTRIM(agent_id)) IN ('', '-') THEN 1 ELSE 0 END) AS MissingAgent,
                    SUM(CASE WHEN disposition IS NULL OR LTRIM(RTRIM(disposition)) IN ('', '-', 'NA', 'N/A', 'Unknown') THEN 1 ELSE 0 END) AS MissingDisposition,
                    SUM(CASE WHEN sub_disposition IS NULL OR LTRIM(RTRIM(sub_disposition)) IN ('', '-', 'NA', 'N/A', 'Unknown') THEN 1 ELSE 0 END) AS MissingSubDisposition,
                    SUM(CASE WHEN call_time IS NULL THEN 1 ELSE 0 END) AS MissingCallTime,
                    SUM(CASE WHEN total_seconds < 0 OR agent_seconds < 0 THEN 1 ELSE 0 END) AS NegativeDuration,
                    SUM(CASE WHEN agent_seconds > total_seconds THEN 1 ELSE 0 END) AS AgentExceedsTotal,
                    SUM(CASE WHEN (is_connected = 1 AND disposition = 'Not Connected') OR (is_connected = 0 AND disposition = 'Connected') THEN 1 ELSE 0 END) AS DurationDispositionConflict,
                    SUM(CASE WHEN group_name IN ('-', 'NA', 'N/A', 'Unknown') OR disposition IN ('-', 'NA', 'N/A', 'Unknown') OR sub_disposition IN ('-', 'NA', 'N/A', 'Unknown') THEN 1 ELSE 0 END) AS PlaceholderValues
                FROM dbo.outbound_cdr_calls WITH (NOLOCK)
                {where};";

            using (var cmd = new SqlCommand(dqSql, conn))
            {
                CloneParameters(cmd, parameters);
                using var r = await cmd.ExecuteReaderAsync();
                if (await r.ReadAsync())
                {
                    void AddCheck(string name, int idx, string severity, string impact, string action)
                    {
                        long count = r.IsDBNull(idx) ? 0 : Convert.ToInt64(r[idx]);
                        summary.DataQuality.Add(new OutboundDataQualityObservationDto
                        {
                            Name = name,
                            Count = count,
                            Severity = severity,
                            Impact = impact,
                            Action = action,
                            IsIssue = count > 0
                        });
                    }

                    AddCheck("Missing Group Assignment", 0, "High", "Campaign reporting cannot assign these calls to a group.", "Populate Group Name before export.");
                    AddCheck("Missing Called Number", 1, "High", "Contact-level traceability and number-quality analysis are incomplete.", "Populate the dialled number before export.");
                    AddCheck("Invalid Called Number", 2, "High", "Malformed phone values reduce the reliability of contact analysis.", "Use a numeric phone value with 7 to 15 digits.");
                    AddCheck("Missing Agent ID", 3, "Medium", "These calls cannot be attributed to individual agent performance.", "Assign the correct Agent ID before importing.");
                    AddCheck("Missing Disposition", 4, "Critical", "These calls cannot be reliably classified as Connected or Not Connected.", "Ensure every call has a valid Disposition.");
                    AddCheck("Missing Sub-Disposition", 5, "High", "Customer intent and campaign-outcome analysis become unreliable.", "Capture a valid Sub-Disposition before closing.");
                    AddCheck("Missing Call Start Time", 6, "Critical", "These calls cannot be assigned to a reporting period or shift.", "Populate Call Start Time before export.");
                    AddCheck("Negative Duration Values", 7, "High", "Negative call-stage durations are not valid operational measurements.", "Correct negative duration values.");
                    AddCheck("Agent Duration Exceeds Total Duration", 8, "High", "Call-stage durations are internally inconsistent.", "Correct the duration values so Total >= Agent Duration.");
                    AddCheck("Duration / Disposition Mismatch", 9, "High", "The recorded call outcome does not match the actual talk time.", "Review these calls and correct the Disposition.");
                    AddCheck("Unexpected Placeholder Values", 10, "Medium", "Placeholder values prevent reliable source-field analysis.", "Replace -, NA, N/A with the actual source value.");
                }
            }

            // 2. Query Leading Campaign and Leading Shift
            string contextSql = $@"
                SELECT TOP 1 group_name, COUNT(*) AS GroupCalls
                FROM dbo.outbound_cdr_calls WITH (NOLOCK)
                {where} {(string.IsNullOrEmpty(where) ? "WHERE" : "AND")} group_name IS NOT NULL AND group_name != ''
                GROUP BY group_name
                ORDER BY GroupCalls DESC;

                SELECT TOP 1
                    CASE 
                        WHEN call_hour >= 7 AND call_hour < 15 THEN 'Morning Shift'
                        WHEN call_hour >= 15 AND call_hour < 23 THEN 'Evening Shift'
                        ELSE 'Night Shift'
                    END AS ShiftName,
                    COUNT(*) AS ShiftCalls,
                    SUM(CASE WHEN is_connected = 1 THEN 1 ELSE 0 END) AS ShiftConnected
                FROM dbo.outbound_cdr_calls WITH (NOLOCK)
                {where} {(string.IsNullOrEmpty(where) ? "WHERE" : "AND")} call_time IS NOT NULL
                GROUP BY 
                    CASE 
                        WHEN call_hour >= 7 AND call_hour < 15 THEN 'Morning Shift'
                        WHEN call_hour >= 15 AND call_hour < 23 THEN 'Evening Shift'
                        ELSE 'Night Shift'
                    END
                ORDER BY ShiftCalls DESC;

                SELECT TOP 1 call_hour, COUNT(*) AS PeakCalls
                FROM dbo.outbound_cdr_calls WITH (NOLOCK)
                {where} {(string.IsNullOrEmpty(where) ? "WHERE" : "AND")} call_hour IS NOT NULL
                GROUP BY call_hour
                ORDER BY PeakCalls DESC;
            ";

            string leadingGroup = "Ayushman Project";
            long leadingGroupCalls = 0;
            string leadingShift = "Morning Shift";
            long leadingShiftCalls = 0;
            int peakHour = 11;
            long peakCalls = 0;

            using (var cmd = new SqlCommand(contextSql, conn))
            {
                CloneParameters(cmd, parameters);
                using var r = await cmd.ExecuteReaderAsync();
                if (await r.ReadAsync())
                {
                    leadingGroup = r.IsDBNull(0) ? "General Campaign" : r.GetString(0);
                    leadingGroupCalls = r.IsDBNull(1) ? 0 : Convert.ToInt64(r[1]);
                }
                if (await r.NextResultAsync() && await r.ReadAsync())
                {
                    leadingShift = r.IsDBNull(0) ? "Morning Shift" : r.GetString(0);
                    leadingShiftCalls = r.IsDBNull(1) ? 0 : Convert.ToInt64(r[1]);
                }
                if (await r.NextResultAsync() && await r.ReadAsync())
                {
                    peakHour = r.IsDBNull(0) ? 11 : r.GetInt32(0);
                    peakCalls = r.IsDBNull(1) ? 0 : Convert.ToInt64(r[1]);
                }
            }

            // 3. Compose Section 8 Narrative Elements
            double groupPct = kpis.TotalCalls > 0 ? (double)leadingGroupCalls / kpis.TotalCalls * 100 : 0;
            double shiftPct = kpis.TotalCalls > 0 ? (double)leadingShiftCalls / kpis.TotalCalls * 100 : 0;

            // Highlights
            summary.Highlights.Add($"Connection performance reached {kpis.ConnectionRate:F1}% across {kpis.TotalCalls:N0} outbound calls.");
            if (peakCalls > 0)
            {
                int nextHour = (peakHour + 1) % 24;
                summary.Highlights.Add($"Peak calling activity occurred at {peakHour:D2}:00 with {peakCalls:N0} calls.");
            }
            if (leadingShiftCalls > 0)
            {
                summary.Highlights.Add($"{leadingShift} handled {shiftPct:F1}% of outbound activity.");
            }
            if (leadingGroupCalls > 0)
            {
                summary.Highlights.Add($"{leadingGroup} accounted for {groupPct:F1}% of outbound calls.");
            }
            if (kpis.AvgAgentDurationSeconds > 0)
            {
                summary.Highlights.Add($"Average talk time was {Math.Round(kpis.AvgAgentDurationSeconds)} seconds ({kpis.AvgAgentDuration}).");
            }

            // Risks
            if (kpis.NotConnectedPercentage >= 50)
            {
                summary.Risks.Add($"{kpis.NotConnectedCalls:N0} calls did not reach a customer, representing {kpis.NotConnectedPercentage:F1}% of outbound calls.");
            }
            if (groupPct >= 60)
            {
                summary.Risks.Add($"{leadingGroup} accounted for {groupPct:F1}% of outbound calls, increasing operational reliance on a single campaign.");
            }
            if (kpis.ConnectionRate < 35)
            {
                summary.Risks.Add($"Overall connection rate ({kpis.ConnectionRate:F1}%) is below the operational benchmark of 40%.");
            }

            // Recommendations
            if (peakCalls > 0)
            {
                int nextHour = (peakHour + 1) % 24;
                summary.Recommendations.Add($"Call demand is highest between {peakHour:D2}:00 and {nextHour:D2}:00. Review agent shift allocations during this peak interval to ensure sufficient outbound dialing capacity.");
            }
            if (kpis.NotConnectedPercentage >= 50)
            {
                summary.Recommendations.Add($"Focus on reducing unsuccessful attempts because {kpis.NotConnectedCalls:N0} calls ({kpis.NotConnectedPercentage:F1}%) did not reach a beneficiary. Schedule retries during peak response windows.");
            }
            if (groupPct >= 60)
            {
                summary.Recommendations.Add($"Review campaign planning and resource distribution because {leadingGroup} accounts for {groupPct:F1}% of overall outbound activity.");
            }
            summary.Recommendations.Add("Target high-volume non-connected dispositions (Busy, Not Reachable) for automated callback retries.");

            // Health Score & Status
            summary.HealthScore = 100;
            if (kpis.ConnectionRate < 30) summary.HealthScore -= 30;
            else if (kpis.ConnectionRate < 40) summary.HealthScore -= 15;
            if (kpis.NotConnectedPercentage >= 60) summary.HealthScore -= 20;

            if (summary.HealthScore >= 80)
            {
                summary.Status = "Healthy";
                summary.Summary = $"Outbound call performance is strong with an overall {kpis.ConnectionRate:F1}% connection rate across {kpis.TotalCalls:N0} attempts.";
            }
            else if (summary.HealthScore >= 60)
            {
                summary.Status = "Attention";
                summary.Summary = $"Outbound operational metrics indicate moderate dialing inefficiencies with {kpis.NotConnectedPercentage:F1}% unreached attempts.";
            }
            else
            {
                summary.Status = "Critical";
                summary.Summary = $"Outbound call success requires immediate operational focus: connection rate is at {kpis.ConnectionRate:F1}%.";
            }

            // Sync legacy fields
            summary.KeyFindings.AddRange(summary.Highlights);
            summary.Anomalies.AddRange(summary.Risks);
            summary.Observations.Add($"Total talk time across connected calls: {kpis.TotalTalkTimeHours:F1} hours.");

            return summary;
        }

        public async Task<OutboundFiltersResponseDto> GetFilterValuesAsync()
        {
            var result = new OutboundFiltersResponseDto();
            result.Months = new List<string>
            {
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            };
            result.Shifts = new List<string> { "Morning Shift", "Evening Shift", "Night Shift" };
            result.CallTypes = new List<string> { "Outgoing", "Internal", "Transfer" };

            using var conn = GetConnection();
            await conn.OpenAsync();

            string multiSql = @"
                SELECT DISTINCT CAST(call_year AS VARCHAR(10)) FROM dbo.outbound_cdr_calls WITH (NOLOCK) WHERE call_year IS NOT NULL ORDER BY 1 DESC;
                SELECT DISTINCT group_name FROM dbo.outbound_cdr_calls WITH (NOLOCK) WHERE group_name IS NOT NULL AND group_name != '' ORDER BY group_name;
                SELECT DISTINCT disposition FROM dbo.outbound_cdr_calls WITH (NOLOCK) WHERE disposition IS NOT NULL AND disposition != '' ORDER BY disposition;
                SELECT DISTINCT TOP 50 sub_disposition FROM dbo.outbound_cdr_calls WITH (NOLOCK) WHERE sub_disposition IS NOT NULL AND sub_disposition != '' ORDER BY sub_disposition;
                SELECT DISTINCT TOP 50 agent_id FROM dbo.outbound_cdr_calls WITH (NOLOCK) WHERE agent_id IS NOT NULL AND agent_id != '' AND agent_id != '-' ORDER BY agent_id;
            ";

            using var cmd = new SqlCommand(multiSql, conn);
            cmd.CommandTimeout = 90;
            using var r = await cmd.ExecuteReaderAsync();

            // 1. Years
            while (await r.ReadAsync())
            {
                if (!r.IsDBNull(0)) result.Years.Add(r.GetString(0));
            }

            // 2. Groups
            if (await r.NextResultAsync())
            {
                while (await r.ReadAsync())
                {
                    if (!r.IsDBNull(0)) result.GroupNames.Add(r.GetString(0));
                }
            }

            // 3. Dispositions
            if (await r.NextResultAsync())
            {
                while (await r.ReadAsync())
                {
                    if (!r.IsDBNull(0)) result.Dispositions.Add(r.GetString(0));
                }
            }

            // 4. Sub-Dispositions
            if (await r.NextResultAsync())
            {
                while (await r.ReadAsync())
                {
                    if (!r.IsDBNull(0)) result.SubDispositions.Add(r.GetString(0));
                }
            }

            // 5. Agents
            if (await r.NextResultAsync())
            {
                while (await r.ReadAsync())
                {
                    if (!r.IsDBNull(0)) result.Agents.Add(r.GetString(0));
                }
            }

            return result;
        }

        public async Task<OutboundCallRecordsPagedResponseDto> GetCallRecordsAsync(OutboundCallQueryDto query)
        {
            var (where, parameters) = BuildWhereClause(query);
            var searchParams = new List<SqlParameter>();

            string searchClause = string.Empty;
            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                searchClause = string.IsNullOrEmpty(where) ? "WHERE " : " AND ";
                searchClause += "(called_no LIKE @Search OR agent_id LIKE @Search OR group_name LIKE @Search OR disposition LIKE @Search)";
                searchParams.Add(new SqlParameter("@Search", SqlDbType.NVarChar, 100) { Value = $"%{query.Search.Trim()}%" });
            }

            string fullWhere = where + searchClause;

            using var conn = GetConnection();
            await conn.OpenAsync();

            string countSql = $"SELECT COUNT(*) FROM dbo.outbound_cdr_calls WITH (NOLOCK) {fullWhere};";
            int totalCount = 0;
            using (var cmd = new SqlCommand(countSql, conn))
            {
                CloneParameters(cmd, parameters.Concat(searchParams));
                totalCount = Convert.ToInt32(await cmd.ExecuteScalarAsync());
            }

            int offset = Math.Max(0, (query.Page - 1) * query.PageSize);
            string sortColumn = query.SortBy?.ToLowerInvariant() switch
            {
                "srno" => "sr_no",
                "calledno" => "called_no",
                "agentid" => "agent_id",
                "groupname" => "group_name",
                "duration" => "total_seconds",
                "agentduration" => "agent_seconds",
                _ => "call_time"
            };
            string sortDir = query.SortDirection?.Equals("ASC", StringComparison.OrdinalIgnoreCase) == true ? "ASC" : "DESC";

            string pagedSql = $@"
                SELECT 
                    id, batch_id, sr_no, did_no, group_name, called_no, call_time,
                    ring_durn, ring_seconds, ivr_dur, ivr_seconds, queue_durn, queue_seconds,
                    agent_durn, agent_seconds, hold_durn, hold_seconds, total_durn, total_seconds,
                    call_mode, agent_id, call_type, acd, disposition, sub_disposition, report_month,
                    is_connected
                FROM dbo.outbound_cdr_calls WITH (NOLOCK)
                {fullWhere}
                ORDER BY {sortColumn} {sortDir}, id {sortDir}
                OFFSET {offset} ROWS FETCH NEXT {query.PageSize} ROWS ONLY;";

            var items = new List<OutboundCallRecordDto>();
            using (var cmd = new SqlCommand(pagedSql, conn))
            {
                CloneParameters(cmd, parameters.Concat(searchParams));

                using var r = await cmd.ExecuteReaderAsync();
                while (await r.ReadAsync())
                {
                    items.Add(new OutboundCallRecordDto
                    {
                        Id = Convert.ToInt64(r[0]),
                        BatchId = r.IsDBNull(1) ? null : Convert.ToInt64(r[1]),
                        SrNo = r.IsDBNull(2) ? null : Convert.ToInt64(r[2]),
                        DidNo = r.IsDBNull(3) ? null : r.GetString(3),
                        GroupName = r.IsDBNull(4) ? null : r.GetString(4),
                        CalledNo = r.IsDBNull(5) ? null : r.GetString(5),
                        CallTime = r.IsDBNull(6) ? null : Convert.ToDateTime(r[6]),
                        RingDuration = r.IsDBNull(7) ? null : r.GetString(7),
                        RingSeconds = r.IsDBNull(8) ? null : Convert.ToInt32(r[8]),
                        IvrDuration = r.IsDBNull(9) ? null : r.GetString(9),
                        IvrSeconds = r.IsDBNull(10) ? null : Convert.ToInt32(r[10]),
                        QueueDuration = r.IsDBNull(11) ? null : r.GetString(11),
                        QueueSeconds = r.IsDBNull(12) ? null : Convert.ToInt32(r[12]),
                        AgentDuration = r.IsDBNull(13) ? null : r.GetString(13),
                        AgentSeconds = r.IsDBNull(14) ? null : Convert.ToInt32(r[14]),
                        HoldDuration = r.IsDBNull(15) ? null : r.GetString(15),
                        HoldSeconds = r.IsDBNull(16) ? null : Convert.ToInt32(r[16]),
                        TotalDuration = r.IsDBNull(17) ? null : r.GetString(17),
                        TotalSeconds = r.IsDBNull(18) ? null : Convert.ToInt32(r[18]),
                        CallMode = r.IsDBNull(19) ? null : r.GetString(19),
                        AgentId = r.IsDBNull(20) ? null : r.GetString(20),
                        CallType = r.IsDBNull(21) ? null : r.GetString(21),
                        Acd = r.IsDBNull(22) ? null : r.GetString(22),
                        Disposition = r.IsDBNull(23) ? null : r.GetString(23),
                        SubDisposition = r.IsDBNull(24) ? null : r.GetString(24),
                        ReportMonth = r.IsDBNull(25) ? null : r.GetString(25),
                        IsConnected = !r.IsDBNull(26) && Convert.ToInt32(r[26]) == 1
                    });
                }
            }

            return new OutboundCallRecordsPagedResponseDto
            {
                Items = items,
                Page = query.Page,
                PageSize = query.PageSize,
                TotalCount = totalCount
            };
        }

        public async Task<OutboundCallRecordDto?> GetCallRecordByIdAsync(long id)
        {
            using var conn = GetConnection();
            await conn.OpenAsync();

            string sql = @"
                SELECT 
                    id, batch_id, sr_no, did_no, group_name, called_no, call_time,
                    ring_durn, ring_seconds, ivr_dur, ivr_seconds, queue_durn, queue_seconds,
                    agent_durn, agent_seconds, hold_durn, hold_seconds, total_durn, total_seconds,
                    call_mode, agent_id, call_type, acd, disposition, sub_disposition, report_month,
                    is_connected
                FROM dbo.outbound_cdr_calls WITH (NOLOCK)
                WHERE id = @Id;";

            using var cmd = new SqlCommand(sql, conn);
            cmd.CommandTimeout = 90;
            cmd.Parameters.Add(new SqlParameter("@Id", SqlDbType.BigInt) { Value = id });

            using var r = await cmd.ExecuteReaderAsync();
            if (await r.ReadAsync())
            {
                return new OutboundCallRecordDto
                {
                    Id = Convert.ToInt64(r[0]),
                    BatchId = r.IsDBNull(1) ? null : Convert.ToInt64(r[1]),
                    SrNo = r.IsDBNull(2) ? null : Convert.ToInt64(r[2]),
                    DidNo = r.IsDBNull(3) ? null : r.GetString(3),
                    GroupName = r.IsDBNull(4) ? null : r.GetString(4),
                    CalledNo = r.IsDBNull(5) ? null : r.GetString(5),
                    CallTime = r.IsDBNull(6) ? null : Convert.ToDateTime(r[6]),
                    RingDuration = r.IsDBNull(7) ? null : r.GetString(7),
                    RingSeconds = r.IsDBNull(8) ? null : Convert.ToInt32(r[8]),
                    IvrDuration = r.IsDBNull(9) ? null : r.GetString(9),
                    IvrSeconds = r.IsDBNull(10) ? null : Convert.ToInt32(r[10]),
                    QueueDuration = r.IsDBNull(11) ? null : r.GetString(11),
                    QueueSeconds = r.IsDBNull(12) ? null : Convert.ToInt32(r[12]),
                    AgentDuration = r.IsDBNull(13) ? null : r.GetString(13),
                    AgentSeconds = r.IsDBNull(14) ? null : Convert.ToInt32(r[14]),
                    HoldDuration = r.IsDBNull(15) ? null : r.GetString(15),
                    HoldSeconds = r.IsDBNull(16) ? null : Convert.ToInt32(r[16]),
                    TotalDuration = r.IsDBNull(17) ? null : r.GetString(17),
                    TotalSeconds = r.IsDBNull(18) ? null : Convert.ToInt32(r[18]),
                    CallMode = r.IsDBNull(19) ? null : r.GetString(19),
                    AgentId = r.IsDBNull(20) ? null : r.GetString(20),
                    CallType = r.IsDBNull(21) ? null : r.GetString(21),
                    Acd = r.IsDBNull(22) ? null : r.GetString(22),
                    Disposition = r.IsDBNull(23) ? null : r.GetString(23),
                    SubDisposition = r.IsDBNull(24) ? null : r.GetString(24),
                    ReportMonth = r.IsDBNull(25) ? null : r.GetString(25),
                    IsConnected = !r.IsDBNull(26) && Convert.ToInt32(r[26]) == 1
                };
            }

            return null;
        }
    }
}
