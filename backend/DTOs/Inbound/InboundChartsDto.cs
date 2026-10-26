using System.Collections.Generic;

namespace BeneficiaryGrievance.Api.DTOs.Inbound
{
    public class ChartNameValueDto
    {
        public string Name { get; set; } = "Unknown";
        public long Value { get; set; }
    }

    public class HourlyMetricsDto
    {
        public int Hour { get; set; }
        public string Label { get; set; } = string.Empty;
        public long TotalCalls { get; set; }
        public long ConnectedCalls { get; set; }
        public long NotConnectedCalls { get; set; }
        public double DropRate { get; set; }
    }

    public class MonthlyCallsDto
    {
        public string Month { get; set; } = string.Empty;
        public double Connected { get; set; }
        public double Abandoned { get; set; }
        public double Others { get; set; }
    }

    public class InboundChartsDto
    {
        public List<ChartNameValueDto> CallEnd { get; set; } = new();
        public List<ChartNameValueDto> Dispositions { get; set; } = new();
        public List<ChartNameValueDto> Groups { get; set; } = new();
        public List<ChartNameValueDto> Shifts { get; set; } = new();
        public List<ChartNameValueDto> ConnectedByShift { get; set; } = new();
        public List<ChartNameValueDto> NotConnectedByShift { get; set; } = new();
        public List<ChartNameValueDto> TopSubDispositions { get; set; } = new();
        public List<ChartNameValueDto> TopAgents { get; set; } = new();
        public List<ChartNameValueDto> BottomAgents { get; set; } = new();
        public List<HourlyMetricsDto> Hourly { get; set; } = new();
        public List<ChartNameValueDto> CallsByYear { get; set; } = new();
        public List<MonthlyCallsDto> CallsByMonth { get; set; } = new();
    }
}
