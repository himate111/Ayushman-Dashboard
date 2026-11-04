using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using BeneficiaryGrievance.Api.Data.Inbound;
using BeneficiaryGrievance.Api.DTOs.Inbound;

namespace BeneficiaryGrievance.Api.Services.Inbound
{
    public class InboundDashboardService : IInboundDashboardService
    {
        private readonly IInboundRepository _repository;
        private readonly IMemoryCache _cache;
        private readonly ILogger<InboundDashboardService> _logger;
        public const string FilterOptionsCacheKey = "InboundFilterOptions";

        public InboundDashboardService(
            IInboundRepository repository,
            IMemoryCache cache,
            ILogger<InboundDashboardService> logger)
        {
            _repository = repository;
            _cache = cache;
            _logger = logger;
        }

        private static bool IsPlaceholder(string? value)
        {
            var normalized = (value ?? "").Trim().ToUpperInvariant();
            return string.IsNullOrEmpty(normalized) || normalized is "-" or "N/A" or "NA" or "UNKNOWN";
        }

        public async Task<InboundDashboardResponseDto> GetDashboardAsync(InboundFilterDto filter)
        {
            var sw = Stopwatch.StartNew();

            // Consolidate redundant queries:
            // 1. Shift metrics query produces shifts, connectedByShift, notConnectedByShift, and summary shift metrics in 1 scan.
            // 2. Single agent query ("all") produces both top 10 and bottom 10 agents in 1 scan.
            var kpisTask = _repository.GetKpisAsync(filter);
            var callEndTask = _repository.GetGroupedChartAsync("call_end", filter);
            var dispositionsTask = _repository.GetGroupedChartAsync("disposition", filter);
            var groupsTask = _repository.GetGroupedChartAsync("group_name", filter);
            var topSubDispositionsTask = _repository.GetGroupedChartAsync("sub_disposition", filter, limit: 5);
            var allAgentsTask = _repository.GetAgentAnalyticsAsync(filter, "all");
            var callsByYearTask = _repository.GetCallsByYearAsync(filter);
            var callsByMonthTask = _repository.GetCallsByMonthAsync(filter);
            var hourlyTask = _repository.GetHourlyAsync(filter);
            var shiftMetricsTask = _repository.GetSummaryShiftMetricsAsync(filter);
            var dataQualityTask = _repository.GetDataQualityMetricsAsync(filter);

            await Task.WhenAll(
                kpisTask, callEndTask, dispositionsTask, groupsTask, topSubDispositionsTask,
                allAgentsTask, callsByYearTask, callsByMonthTask, hourlyTask,
                shiftMetricsTask, dataQualityTask
            );

            var kpis = await kpisTask;
            var callEnd = await callEndTask;
            var dispositions = await dispositionsTask;
            var groups = await groupsTask;
            var topSubDispositions = await topSubDispositionsTask;
            var allAgents = await allAgentsTask;
            var callsByYear = await callsByYearTask;
            var callsByMonth = await callsByMonthTask;
            var hourly = await hourlyTask;
            var shiftMetrics = await shiftMetricsTask;
            var dataQuality = await dataQualityTask;

            // Derive Top 10 and Bottom 10 from the single agent query
            var topAgents = allAgents.Take(10).ToList();
            var bottomAgents = allAgents.OrderBy(a => a.TotalCalls).Take(10).ToList();

            // Derive shifts, connectedByShift, and notConnectedByShift from the single shift query
            // Sorted by name ASC matching original shift chart specification
            var orderedShiftMetrics = shiftMetrics.OrderBy(s => s.Name).ToList();
            var shifts = orderedShiftMetrics
                .Select(s => new ChartNameValueDto { Name = s.Name, Value = s.TotalCalls })
                .ToList();
            var connectedByShift = orderedShiftMetrics
                .Select(s => new ChartNameValueDto { Name = s.Name, Value = s.ConnectedCalls })
                .ToList();
            var notConnectedByShift = orderedShiftMetrics
                .Select(s => new ChartNameValueDto { Name = s.Name, Value = s.AbandonedCalls })
                .ToList();

            var charts = new InboundChartsDto
            {
                CallEnd = callEnd,
                Dispositions = dispositions,
                Groups = groups,
                Shifts = shifts,
                ConnectedByShift = connectedByShift,
                NotConnectedByShift = notConnectedByShift,
                TopSubDispositions = topSubDispositions,
                TopAgents = topAgents.Select(a => new ChartNameValueDto { Name = a.Agent, Value = a.TotalCalls }).ToList(),
                BottomAgents = bottomAgents.Select(a => new ChartNameValueDto { Name = a.Agent, Value = a.TotalCalls }).ToList(),
                Hourly = hourly,
                CallsByYear = callsByYear,
                CallsByMonth = callsByMonth
            };

            sw.Stop();
            _logger.LogInformation("Inbound dashboard telemetry loaded in {ElapsedMs} ms for {TotalCalls} calls",
                sw.ElapsedMilliseconds, kpis.TotalCalls);

            var peakHour = hourly.OrderByDescending(h => h.TotalCalls).FirstOrDefault();
            var peakHourShare = kpis.TotalCalls > 0 && peakHour != null
                ? Math.Round((double)peakHour.TotalCalls / kpis.TotalCalls * 100.0, 2)
                : 0.0;

            var topGroup = groups.FirstOrDefault(g => !IsPlaceholder(g.Name));
            var topGroupShare = kpis.TotalCalls > 0 && topGroup != null
                ? Math.Round((double)topGroup.Value / kpis.TotalCalls * 100.0, 2)
                : 0.0;

            var topSubDisposition = topSubDispositions.FirstOrDefault(s => !IsPlaceholder(s.Name));
            var meaningfulCoverage = 100.0 - dataQuality.InvalidSubDispositionPercentage;
            var highestAbandonmentShift = shiftMetrics.OrderByDescending(s => s.AbandonmentRate).FirstOrDefault();

            var internalMetrics = new InboundSummaryInternalMetrics
            {
                Kpis = kpis,
                PeakHour = peakHour,
                PeakHourShare = peakHourShare,
                TopGroup = topGroup,
                TopGroupShare = topGroupShare,
                TopSubDisposition = topSubDisposition,
                MeaningfulSubDispositionCoverage = meaningfulCoverage,
                HighestAbandonmentRateShift = highestAbandonmentShift,
                DataQuality = dataQuality
            };

            var summary = new InboundSummaryDto
            {
                Executive = BuildInsights(internalMetrics),
                Issues = BuildPerformanceIssues(internalMetrics),
                DataQuality = BuildDataQualityObservations(dataQuality),
                Recommendations = BuildRecommendations(internalMetrics)
            };

            return new InboundDashboardResponseDto
            {
                Success = true,
                Kpis = kpis,
                Charts = charts,
                AgentAnalytics = new AgentAnalyticsDto
                {
                    TopAgents = topAgents,
                    BottomAgents = bottomAgents
                },
                Summary = summary
            };
        }

        public async Task<InboundFiltersResponseDto> GetFilterValuesAsync()
        {
            if (_cache.TryGetValue(FilterOptionsCacheKey, out InboundFiltersResponseDto? cached) && cached != null)
            {
                _logger.LogDebug("Returning cached Inbound filter options");
                return cached;
            }

            var sw = Stopwatch.StartNew();
            var fresh = await _repository.GetFilterValuesAsync();
            sw.Stop();

            _cache.Set(FilterOptionsCacheKey, fresh, TimeSpan.FromHours(1));
            _logger.LogInformation("Fetched and cached Inbound filter options in {ElapsedMs} ms", sw.ElapsedMilliseconds);
            return fresh;
        }

        public Task<InboundKpiDto> GetKpisAsync(InboundFilterDto filter)
        {
            return _repository.GetKpisAsync(filter);
        }

        public Task<List<ChartNameValueDto>> GetCallsByYearAsync(InboundFilterDto filter)
        {
            return _repository.GetCallsByYearAsync(filter);
        }

        public Task<List<MonthlyCallsDto>> GetCallsByMonthAsync(InboundFilterDto filter)
        {
            return _repository.GetCallsByMonthAsync(filter);
        }

        public Task<List<ChartNameValueDto>> GetCallEndAsync(InboundFilterDto filter)
        {
            return _repository.GetGroupedChartAsync("call_end", filter);
        }

        public Task<List<ChartNameValueDto>> GetGroupsAsync(InboundFilterDto filter)
        {
            return _repository.GetGroupedChartAsync("group_name", filter);
        }

        public Task<List<ChartNameValueDto>> GetDispositionsAsync(InboundFilterDto filter)
        {
            return _repository.GetGroupedChartAsync("disposition", filter);
        }

        public Task<List<ChartNameValueDto>> GetTopSubDispositionsAsync(InboundFilterDto filter)
        {
            return _repository.GetGroupedChartAsync("sub_disposition", filter, limit: 5);
        }

        public Task<List<HourlyMetricsDto>> GetHourlyAsync(InboundFilterDto filter)
        {
            return _repository.GetHourlyAsync(filter);
        }

        public Task<List<ChartNameValueDto>> GetShiftsAsync(InboundFilterDto filter)
        {
            return _repository.GetGroupedChartAsync("shift", filter, orderBy: "name ASC");
        }

        public Task<List<ChartNameValueDto>> GetConnectedByShiftAsync(InboundFilterDto filter)
        {
            return _repository.GetShiftMetricChartAsync(filter, InboundRepository.AgentDurationConnectedSql);
        }

        public Task<List<ChartNameValueDto>> GetNotConnectedByShiftAsync(InboundFilterDto filter)
        {
            return _repository.GetShiftMetricChartAsync(filter, InboundRepository.AgentDurationAbandonedSql);
        }

        public async Task<AgentAnalyticsDto> GetAgentAnalyticsAsync(InboundFilterDto filter)
        {
            var allAgents = await _repository.GetAgentAnalyticsAsync(filter, "all");
            return new AgentAnalyticsDto
            {
                TopAgents = allAgents.Take(10).ToList(),
                BottomAgents = allAgents.OrderBy(a => a.TotalCalls).Take(10).ToList()
            };
        }

        public async Task<InboundSummaryDto> GetSummaryAsync(InboundFilterDto filter)
        {
            var dashboard = await GetDashboardAsync(filter);
            return dashboard.Summary;
        }

        private static List<string> BuildInsights(InboundSummaryInternalMetrics metrics)
        {
            var insights = new List<string>();
            var kpis = metrics.Kpis;
            var peakHour = metrics.PeakHour;
            var topGroup = metrics.TopGroup;
            var topSubDisposition = metrics.TopSubDisposition;
            var highestAbandonmentRateShift = metrics.HighestAbandonmentRateShift;

            if (kpis.TotalCalls > 0)
            {
                if (kpis.ConnectionRate >= 95)
                    insights.Add($"{kpis.ConnectionRate:F1}% of {kpis.TotalCalls:N0} customer calls were connected, showing strong service performance.");
                else if (kpis.ConnectionRate >= 90)
                    insights.Add($"{kpis.ConnectionRate:F1}% of customer calls were connected. Performance is healthy, with an opportunity to reduce calls that end early.");
                else
                    insights.Add($"{kpis.ConnectionRate:F1}% of customer calls were connected, highlighting an opportunity to improve call completion.");
            }

            if (peakHour != null && peakHour.TotalCalls > 0)
            {
                insights.Add($"Customer call demand was highest at {peakHour.Label}, with {peakHour.TotalCalls:N0} calls ({metrics.PeakHourShare:F1}% of all calls).");
            }

            if (topGroup != null)
            {
                insights.Add(metrics.TopGroupShare >= 60
                    ? $"{topGroup.Name} handled {metrics.TopGroupShare:F1}% of customer calls, making it the main inbound group for this period."
                    : $"Customer calls were shared across inbound groups, with {topGroup.Name} handling the largest share at {metrics.TopGroupShare:F1}%.");
            }

            if (highestAbandonmentRateShift != null && highestAbandonmentRateShift.TotalCalls > 0 && highestAbandonmentRateShift.AbandonedCalls > 0)
            {
                insights.Add($"{highestAbandonmentRateShift.Name} had the highest rate of calls ending early at {highestAbandonmentRateShift.AbandonmentRate:F1}% ({highestAbandonmentRateShift.AbandonedCalls:N0} calls).");
            }

            if (topSubDisposition != null && metrics.MeaningfulSubDispositionCoverage >= 50)
            {
                var pct = kpis.TotalCalls > 0 ? (double)topSubDisposition.Value / kpis.TotalCalls * 100.0 : 0.0;
                insights.Add($"{topSubDisposition.Name} was the most common recorded reason for contact, representing {pct:F1}% of calls.");
            }

            return insights.Take(5).ToList();
        }

        private static List<string> BuildPerformanceIssues(InboundSummaryInternalMetrics metrics)
        {
            var issues = new List<string>();
            var kpis = metrics.Kpis;
            var highestAbandonmentRateShift = metrics.HighestAbandonmentRateShift;

            if (kpis.NotConnectedPercentage > 5)
                issues.Add($"{kpis.NotConnectedPercentage:F1}% of calls ended early, which is above the preferred service range.");
            else if (kpis.NotConnectedPercentage > 3)
                issues.Add($"{kpis.NotConnectedPercentage:F1}% of calls ended early. This is elevated and should be monitored.");

            if (highestAbandonmentRateShift != null && highestAbandonmentRateShift.AbandonmentRate >= kpis.NotConnectedPercentage + 1)
                issues.Add($"{highestAbandonmentRateShift.Name} had {highestAbandonmentRateShift.AbandonmentRate:F1}% of calls end early, compared with {kpis.NotConnectedPercentage:F1}% overall. This indicates a service issue during that shift.");

            if (kpis.AvgQueueDurationSeconds > 60)
                issues.Add($"Customers waited an average of {kpis.AvgQueueDuration} before reaching an agent, which may affect their experience.");
            else if (kpis.AvgQueueDurationSeconds >= 30)
                issues.Add($"Customers waited an average of {kpis.AvgQueueDuration} before reaching an agent. This is elevated and should be monitored.");

            if (metrics.TopGroupShare >= 60)
                issues.Add($"A large share of customer calls ({metrics.TopGroupShare:F1}%) is handled by a single inbound group. Monitoring this workload can help avoid service disruption.");

            return issues.Take(3).ToList();
        }

        private static List<string> BuildDataQualityObservations(InboundDataQualityMetrics dataQuality)
        {
            var observations = new List<string>();
            var disagreementCount = dataQuality.DurationAbandonedAgentEndCount + dataQuality.DurationConnectedNonAgentEndCount;
            var durationIssueCount = dataQuality.MissingAgentDurationCount + dataQuality.MissingTotalDurationCount +
                                     dataQuality.NegativeAgentDurationCount + dataQuality.NegativeTotalDurationCount +
                                     dataQuality.AgentDurationExceedsTotalCount;

            if (disagreementCount > 0)
                observations.Add($"{disagreementCount:N0} calls contain inconsistent information between call status and agent talk time. Reviewing these records will improve reporting accuracy.");
            if (dataQuality.InvalidDispositionCount > 0)
                observations.Add($"The call outcome has not been recorded clearly for {dataQuality.InvalidDispositionPercentage:F1}% of records, which limits outcome analysis.");
            if (dataQuality.InvalidSubDispositionCount > 0)
                observations.Add($"The reason for the customer contact has not been recorded clearly for {dataQuality.InvalidSubDispositionPercentage:F1}% of calls, limiting insight into customer needs.");
            if (dataQuality.InvalidAgentIdCount > 0)
                observations.Add($"Agent information is missing for {dataQuality.InvalidAgentIdPercentage:F1}% of records, which may affect agent performance reporting.");
            if (dataQuality.InvalidGroupNameCount > 0)
                observations.Add($"Inbound group information is missing for {dataQuality.InvalidGroupNamePercentage:F1}% of records.");
            if (durationIssueCount > 0)
                observations.Add($"{durationIssueCount:N0} records have incomplete or inconsistent call timing information and should be reviewed.");

            return observations.Take(4).ToList();
        }

        private static List<string> BuildRecommendations(InboundSummaryInternalMetrics metrics)
        {
            var recommendations = new List<string>();
            var kpis = metrics.Kpis;
            var peakHour = metrics.PeakHour;
            var dataQuality = metrics.DataQuality;
            var highestAbandonmentRateShift = metrics.HighestAbandonmentRateShift;
            var disagreementCount = dataQuality.DurationAbandonedAgentEndCount + dataQuality.DurationConnectedNonAgentEndCount;

            if (disagreementCount > 0)
                recommendations.Add($"Review the {disagreementCount:N0} calls where call information does not match, so reports accurately reflect customer interactions.");

            if (dataQuality.InvalidSubDispositionPercentage >= 10)
                recommendations.Add($"The reason for many customer calls has not been recorded. Capturing this information consistently will provide more meaningful operational insight for the {dataQuality.InvalidSubDispositionPercentage:F1}% of affected records.");
            else if (dataQuality.InvalidDispositionPercentage >= 10)
                recommendations.Add($"The outcome of many customer calls has not been recorded clearly. Improving this for the {dataQuality.InvalidDispositionPercentage:F1}% of affected records will strengthen performance reporting.");

            if (kpis.NotConnectedPercentage > 3)
                recommendations.Add($"Review staffing and call handling during the periods contributing most to the {kpis.NotConnectedPercentage:F1}% of calls ending early.");

            if (highestAbandonmentRateShift != null && highestAbandonmentRateShift.AbandonmentRate >= kpis.NotConnectedPercentage + 1)
                recommendations.Add($"Prioritise {highestAbandonmentRateShift.Name} for a staffing and call-handling review. {highestAbandonmentRateShift.AbandonmentRate:F1}% of its calls ended early, compared with {kpis.NotConnectedPercentage:F1}% overall.");

            if (metrics.TopGroupShare >= 60)
                recommendations.Add($"Most customer calls are handled by one inbound group. Ensuring this group has adequate staffing will help maintain service levels during busy periods.");

            if (peakHour != null && peakHour.TotalCalls > 0 && metrics.PeakHourShare >= 10)
                recommendations.Add($"Plan staffing around the {peakHour.Label} peak, when {peakHour.TotalCalls:N0} calls were received ({metrics.PeakHourShare:F1}% of all calls).");

            if (recommendations.Count == 0 && kpis.TotalCalls > 0)
                recommendations.Add($"Maintain the current service approach while monitoring the {kpis.NotConnectedPercentage:F1}% of calls ending early and demand around {peakHour?.Label ?? "the busiest hour"}.");

            return recommendations.Take(4).ToList();
        }

        public Task<InboundCallRecordsPagedResponseDto> GetCallRecordsAsync(InboundCallQueryDto query)
        {
            return _repository.GetCallRecordsAsync(query);
        }

        public Task<InboundCallRecordDto?> GetCallRecordByIdAsync(long id)
        {
            return _repository.GetCallRecordByIdAsync(id);
        }
    }
}
