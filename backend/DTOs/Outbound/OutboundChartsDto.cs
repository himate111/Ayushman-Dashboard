using System.Collections.Generic;

namespace BeneficiaryGrievance.Api.DTOs.Outbound
{
    public class OutboundChartNameValueDto
    {
        public string Name { get; set; } = "Unknown";
        public long Value { get; set; }
        public double? Percentage { get; set; }
    }

    public class OutboundHourlyMetricsDto
    {
        public int Hour { get; set; }
        public string Label { get; set; } = string.Empty;
        public long TotalCalls { get; set; }
        public long ConnectedCalls { get; set; }
        public long NotConnectedCalls { get; set; }
        public double ConnectionRate { get; set; }
    }

    public class OutboundMonthlyCallsDto
    {
        public int Year { get; set; }
        public string Month { get; set; } = string.Empty;
        public int MonthNumber { get; set; }
        public long TotalCalls { get; set; }
        public long ConnectedCalls { get; set; }
        public long NotConnectedCalls { get; set; }
        public double ConnectionRate { get; set; }
        public double ConnectedPercentage { get; set; }
        public double NotConnectedPercentage { get; set; }
    }

    public class OutboundAgentPerformanceDto
    {
        public string AgentId { get; set; } = string.Empty;
        public long TotalCalls { get; set; }
        public long ConnectedCalls { get; set; }
        public long NotConnectedCalls { get; set; }
        public double ConnectionRate { get; set; }
        public double AvgDurationSeconds { get; set; }
        public string AvgDuration { get; set; } = "0s";
    }

    public class OutboundShiftMetricDto
    {
        public string Shift { get; set; } = string.Empty;
        public long TotalCalls { get; set; }
        public long ConnectedCalls { get; set; }
        public long NotConnectedCalls { get; set; }
        public double ConnectionRate { get; set; }
    }

    public class OutboundChartsDto
    {
        public List<OutboundChartNameValueDto> OutcomeMix { get; set; } = new();
        public List<OutboundChartNameValueDto> Dispositions { get; set; } = new();
        public List<OutboundChartNameValueDto> TopSubDispositions { get; set; } = new();
        public List<OutboundChartNameValueDto> BottomSubDispositions { get; set; } = new();
        public List<OutboundChartNameValueDto> Groups { get; set; } = new();
        public List<OutboundShiftMetricDto> Shifts { get; set; } = new();
        public List<OutboundAgentPerformanceDto> TopAgents { get; set; } = new();
        public List<OutboundAgentPerformanceDto> BottomAgents { get; set; } = new();
        public List<OutboundHourlyMetricsDto> Hourly { get; set; } = new();
        public List<OutboundChartNameValueDto> CallsByYear { get; set; } = new();
        public List<OutboundMonthlyCallsDto> CallsByMonth { get; set; } = new();
        public List<OutboundChartNameValueDto> WastedAttempts { get; set; } = new();
    }
}
