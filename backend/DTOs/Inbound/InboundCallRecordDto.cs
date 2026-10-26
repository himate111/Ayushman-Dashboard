using System;

namespace BeneficiaryGrievance.Api.DTOs.Inbound
{
    public class InboundCallRecordDto
    {
        public long Id { get; set; }
        public string? DidNo { get; set; }
        public string? GroupName { get; set; }
        
        /// <summary>
        /// Strictly masked caller phone number (e.g. 88******20). Raw phone number is never exposed.
        /// </summary>
        public string MaskedCallerNo { get; set; } = string.Empty;
        
        /// <summary>
        /// Convenience alias pointing to the masked phone number for frontend consistency.
        /// </summary>
        public string CalledNo => MaskedCallerNo;

        public DateTime? CallTime { get; set; }
        public string? FormattedCallTime { get; set; }
        
        public string? RingDuration { get; set; }
        public string? IvrDuration { get; set; }
        public string? QueueDuration { get; set; }
        public string? AgentDuration { get; set; }
        public string? HoldDuration { get; set; }
        public string? TotalDuration { get; set; }
        
        public int TotalDurationSeconds { get; set; }
        public int AgentDurationSeconds { get; set; }
        public int QueueDurationSeconds { get; set; }
        public int IvrDurationSeconds { get; set; }
        public int RingDurationSeconds { get; set; }
        public int HoldDurationSeconds { get; set; }
        
        public string? CallEnd { get; set; }
        public string? AgentId { get; set; }
        public string? CallType { get; set; }
        public string? Acd { get; set; }
        public string? Disposition { get; set; }
        public string? SubDisposition { get; set; }
        public string? Shift { get; set; }
        public int? CallHour { get; set; }
        
        public bool IsConnected { get; set; }
        public bool IsAbandoned { get; set; }
    }
}
