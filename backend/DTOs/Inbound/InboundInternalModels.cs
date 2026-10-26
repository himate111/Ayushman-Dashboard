using System.Collections.Generic;

namespace BeneficiaryGrievance.Api.DTOs.Inbound
{
    public class InboundDataQualityMetrics
    {
        public long TotalCalls { get; set; }
        public long InvalidDispositionCount { get; set; }
        public long InvalidSubDispositionCount { get; set; }
        public long InvalidAgentIdCount { get; set; }
        public long InvalidGroupNameCount { get; set; }
        public long MissingAgentDurationCount { get; set; }
        public long MissingTotalDurationCount { get; set; }
        public long NegativeAgentDurationCount { get; set; }
        public long NegativeTotalDurationCount { get; set; }
        public long AgentDurationExceedsTotalCount { get; set; }
        public long DurationAbandonedAgentEndCount { get; set; }
        public long DurationConnectedNonAgentEndCount { get; set; }

        public double InvalidDispositionPercentage { get; set; }
        public double InvalidSubDispositionPercentage { get; set; }
        public double InvalidAgentIdPercentage { get; set; }
        public double InvalidGroupNamePercentage { get; set; }
    }

    public class SummaryShiftMetric
    {
        public string Name { get; set; } = "Unknown";
        public long TotalCalls { get; set; }
        public long ConnectedCalls { get; set; }
        public long AbandonedCalls { get; set; }
        public long UnclassifiedCalls { get; set; }
        public double AbandonmentRate { get; set; }
    }

    public class InboundSummaryInternalMetrics
    {
        public InboundKpiDto Kpis { get; set; } = new();
        public HourlyMetricsDto? PeakHour { get; set; }
        public double PeakHourShare { get; set; }
        public ChartNameValueDto? TopGroup { get; set; }
        public double TopGroupShare { get; set; }
        public ChartNameValueDto? TopSubDisposition { get; set; }
        public double MeaningfulSubDispositionCoverage { get; set; }
        public SummaryShiftMetric? HighestAbandonmentRateShift { get; set; }
        public InboundDataQualityMetrics DataQuality { get; set; } = new();
    }
}
