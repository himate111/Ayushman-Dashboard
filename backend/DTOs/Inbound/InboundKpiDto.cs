namespace BeneficiaryGrievance.Api.DTOs.Inbound
{
    public class InboundKpiDto
    {
        public long TotalCalls { get; set; }
        public long ConnectedCalls { get; set; }
        public long NotConnectedCalls { get; set; }
        public double ConnectionRate { get; set; }
        public double NotConnectedPercentage { get; set; }
        public double AvgCallDurationSeconds { get; set; }
        public double AvgAgentDurationSeconds { get; set; }
        public double AvgQueueDurationSeconds { get; set; }
        public string AvgCallDuration { get; set; } = "0s";
        public string AvgAgentDuration { get; set; } = "0s";
        public string AvgQueueDuration { get; set; } = "0s";
    }
}
