using System.Collections.Generic;

namespace BeneficiaryGrievance.Api.DTOs.Inbound
{
    public class InboundCallRecordsPagedResponseDto
    {
        public List<InboundCallRecordDto> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public bool HasNext => Page < TotalPages;
        public bool HasPrev => Page > 1;

        // Query summary metrics for the currently filtered result set
        public int ConnectedCount { get; set; }
        public int AbandonedCount { get; set; }
        public double AvgTalkDurationSeconds { get; set; }
        public double AvgQueueDurationSeconds { get; set; }
    }
}
