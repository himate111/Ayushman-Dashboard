using System;
using System.Collections.Generic;

namespace BeneficiaryGrievance.Api.DTOs.Outbound
{
    public class OutboundCallRecordDto
    {
        public long Id { get; set; }
        public long? BatchId { get; set; }
        public long? SrNo { get; set; }
        public string? DidNo { get; set; }
        public string? GroupName { get; set; }
        public string? CalledNo { get; set; }
        public DateTime? CallTime { get; set; }
        public string? RingDuration { get; set; }
        public int? RingSeconds { get; set; }
        public string? IvrDuration { get; set; }
        public int? IvrSeconds { get; set; }
        public string? QueueDuration { get; set; }
        public int? QueueSeconds { get; set; }
        public string? AgentDuration { get; set; }
        public int? AgentSeconds { get; set; }
        public string? HoldDuration { get; set; }
        public int? HoldSeconds { get; set; }
        public string? TotalDuration { get; set; }
        public int? TotalSeconds { get; set; }
        public string? CallMode { get; set; }
        public string? AgentId { get; set; }
        public string? CallType { get; set; }
        public string? Acd { get; set; }
        public string? Disposition { get; set; }
        public string? SubDisposition { get; set; }
        public string? ReportMonth { get; set; }
        public bool IsConnected { get; set; }
    }

    public class OutboundCallQueryDto : OutboundFilterDto
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 25;
        public string? Search { get; set; }
        public string? SortBy { get; set; } = "CallTime";
        public string? SortDirection { get; set; } = "DESC";
    }

    public class OutboundCallRecordsPagedResponseDto
    {
        public List<OutboundCallRecordDto> Items { get; set; } = new();
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
    }
}
