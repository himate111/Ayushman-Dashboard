namespace BeneficiaryGrievance.Api.DTOs.Inbound
{
    public class InboundFilterDto
    {
        public string? Year { get; set; }
        public string? Month { get; set; }
        public string? StartDate { get; set; }
        public string? EndDate { get; set; }
        public string? GroupName { get; set; }
        public string? Agent { get; set; }
        public string? Disposition { get; set; }
        public string? SubDisposition { get; set; }
        public string? Shift { get; set; }
        public string? Acd { get; set; }
        public string? CallType { get; set; }
    }
}
