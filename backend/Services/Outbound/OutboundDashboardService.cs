using System;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using BeneficiaryGrievance.Api.Data.Outbound;
using BeneficiaryGrievance.Api.DTOs.Outbound;

namespace BeneficiaryGrievance.Api.Services.Outbound
{
    public class OutboundDashboardService : IOutboundDashboardService
    {
        private readonly IOutboundRepository _repository;
        private readonly IMemoryCache? _cache;
        private readonly ILogger<OutboundDashboardService> _logger;
        private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);

        public OutboundDashboardService(
            IOutboundRepository repository,
            ILogger<OutboundDashboardService> logger,
            IMemoryCache? cache = null)
        {
            _repository = repository;
            _logger = logger;
            _cache = cache;
        }

        private static string GenerateCacheKey(string prefix, OutboundFilterDto filter)
        {
            var sb = new StringBuilder(prefix);
            sb.Append(':').Append(filter.Year ?? string.Empty);
            sb.Append(':').Append(filter.Month ?? string.Empty);
            sb.Append(':').Append(filter.StartDate ?? string.Empty);
            sb.Append(':').Append(filter.EndDate ?? string.Empty);
            sb.Append(':').Append(filter.GroupName ?? string.Empty);
            sb.Append(':').Append(filter.Agent ?? string.Empty);
            sb.Append(':').Append(filter.Disposition ?? string.Empty);
            sb.Append(':').Append(filter.SubDisposition ?? string.Empty);
            sb.Append(':').Append(filter.Shift ?? string.Empty);
            sb.Append(':').Append(filter.Acd ?? string.Empty);
            sb.Append(':').Append(filter.CallType ?? string.Empty);
            sb.Append(':').Append(filter.CallMode ?? string.Empty);
            return sb.ToString();
        }

        public async Task<OutboundDashboardResponseDto> GetDashboardAsync(OutboundFilterDto filter)
        {
            string cacheKey = GenerateCacheKey("outbound_dashboard", filter);
            if (_cache != null && _cache.TryGetValue(cacheKey, out OutboundDashboardResponseDto? cached) && cached != null)
            {
                return cached;
            }

            // Fetch KPIs first
            var kpis = await _repository.GetKpisAsync(filter);
            
            // Fetch Charts
            var charts = await _repository.GetChartsAsync(filter);

            // Fetch Executive Summary from repository
            var summary = await _repository.GetExecutiveSummaryAsync(filter);

            var result = new OutboundDashboardResponseDto
            {
                Kpis = kpis,
                Charts = charts,
                ExecutiveSummary = summary
            };

            _cache?.Set(cacheKey, result, CacheDuration);
            return result;
        }

        public async Task<OutboundKpiDto> GetKpisAsync(OutboundFilterDto filter)
        {
            string cacheKey = GenerateCacheKey("outbound_kpis", filter);
            if (_cache != null && _cache.TryGetValue(cacheKey, out OutboundKpiDto? cached) && cached != null)
            {
                return cached;
            }

            var kpis = await _repository.GetKpisAsync(filter);
            _cache?.Set(cacheKey, kpis, CacheDuration);
            return kpis;
        }

        public async Task<OutboundChartsDto> GetChartsAsync(OutboundFilterDto filter)
        {
            string cacheKey = GenerateCacheKey("outbound_charts", filter);
            if (_cache != null && _cache.TryGetValue(cacheKey, out OutboundChartsDto? cached) && cached != null)
            {
                return cached;
            }

            var charts = await _repository.GetChartsAsync(filter);
            _cache?.Set(cacheKey, charts, CacheDuration);
            return charts;
        }

        public async Task<OutboundExecutiveSummaryDto> GetExecutiveSummaryAsync(OutboundFilterDto filter)
        {
            string cacheKey = GenerateCacheKey("outbound_summary", filter);
            if (_cache != null && _cache.TryGetValue(cacheKey, out OutboundExecutiveSummaryDto? cached) && cached != null)
            {
                return cached;
            }

            var summary = await _repository.GetExecutiveSummaryAsync(filter);
            _cache?.Set(cacheKey, summary, CacheDuration);
            return summary;
        }

        private static OutboundExecutiveSummaryDto DeriveExecutiveSummary(OutboundKpiDto kpis)
        {
            var summary = new OutboundExecutiveSummaryDto();

            if (kpis.TotalCalls == 0)
            {
                summary.Status = "Attention";
                summary.HealthScore = 50;
                summary.Summary = "No outbound telephony records match the selected filter criteria.";
                return summary;
            }

            summary.HealthScore = 100;
            if (kpis.ConnectionRate < 30)
            {
                summary.HealthScore -= 30;
                summary.Anomalies.Add($"Low Connection Rate: Only {kpis.ConnectionRate}% of calls connected with a beneficiary.");
            }
            else if (kpis.ConnectionRate < 45)
            {
                summary.HealthScore -= 15;
                summary.Observations.Add($"Moderate Connection Rate: {kpis.ConnectionRate}% answered rate across selected timeframe.");
            }

            if (kpis.WastedAttemptsCount > (kpis.TotalCalls * 0.4))
            {
                summary.HealthScore -= 20;
                summary.Anomalies.Add($"High Wasted Attempts: {kpis.WastedAttemptsCount:N0} calls ({(double)kpis.WastedAttemptsCount / kpis.TotalCalls * 100:F1}%) consumed dial duration without agent engagement.");
            }

            summary.KeyFindings.Add($"Total call volume analyzed: {kpis.TotalCalls:N0} calls.");
            summary.KeyFindings.Add($"Connected beneficiary engagements: {kpis.ConnectedCalls:N0} ({kpis.ConnectionRate}%).");
            summary.KeyFindings.Add($"Average agent talk duration: {kpis.AvgAgentDuration} (total talk time: {kpis.TotalTalkTimeHours:N1} hours).");

            if (summary.HealthScore >= 80)
            {
                summary.Status = "Healthy";
                summary.Summary = $"Outbound call performance is strong with an overall {kpis.ConnectionRate}% connection rate across {kpis.TotalCalls:N0} attempts.";
            }
            else if (summary.HealthScore >= 60)
            {
                summary.Status = "Attention";
                summary.Summary = $"Outbound operational metrics indicate potential dialing inefficiencies with {kpis.NotConnectedPercentage}% unreached attempts.";
            }
            else
            {
                summary.Status = "Critical";
                summary.Summary = $"Outbound call success requires immediate operational focus: connection rate is at {kpis.ConnectionRate}%.";
            }

            summary.Recommendations.Add("Optimize dialing schedules toward peak beneficiary response hours (10:00 to 14:00).");
            summary.Recommendations.Add("Target high-volume non-connected dispositions (Busy, Not Reachable) for automated callback retries.");

            return summary;
        }

        public async Task<OutboundFiltersResponseDto> GetFilterValuesAsync()
        {
            const string cacheKey = "outbound_filter_options";
            if (_cache != null && _cache.TryGetValue(cacheKey, out OutboundFiltersResponseDto? cached) && cached != null)
            {
                return cached;
            }

            var filters = await _repository.GetFilterValuesAsync();
            _cache?.Set(cacheKey, filters, TimeSpan.FromHours(1));
            return filters;
        }

        public Task<OutboundCallRecordsPagedResponseDto> GetCallRecordsAsync(OutboundCallQueryDto query)
        {
            return _repository.GetCallRecordsAsync(query);
        }

        public Task<OutboundCallRecordDto?> GetCallRecordByIdAsync(long id)
        {
            return _repository.GetCallRecordByIdAsync(id);
        }

        public void InvalidateCache()
        {
            _logger.LogInformation("Invalidating Outbound dashboard memory cache after import.");
            if (_cache is MemoryCache mc)
            {
                mc.Compact(1.0); // Clear entries
            }
        }
    }
}
