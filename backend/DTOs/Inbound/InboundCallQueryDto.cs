namespace BeneficiaryGrievance.Api.DTOs.Inbound
{
    public class InboundCallQueryDto : InboundFilterDto
    {
        public string? Search { get; set; }
        public string? CallEnd { get; set; }
        public string SortBy { get; set; } = "call_time";
        public string SortOrder { get; set; } = "desc";
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }
}
