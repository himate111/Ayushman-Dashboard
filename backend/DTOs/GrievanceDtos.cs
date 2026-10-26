using System;
using System.Collections.Generic;

namespace BeneficiaryGrievance.Api.DTOs
{
    public class PagedResultDto<T>
    {
        public List<T> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / (PageSize > 0 ? PageSize : 10));
    }

    public class GrievanceGridItemDto
    {
        public long Id { get; set; }
        public long CompId { get; set; }
        public string CompDate { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public string CitizenName { get; set; } = string.Empty;
        public string MaskedMobile { get; set; } = string.Empty;
        public string MaskedAadhar { get; set; } = string.Empty;
        public string? BeneficiaryDistrict { get; set; }
        public string? HospitalName { get; set; }
        public string? GrievanceCategory { get; set; }
        public string? GrievanceType { get; set; }
        public string? OfficerName { get; set; }
        public string? OfficerLevel { get; set; }
        public int AgeInDays { get; set; }
        public string AgeBucket { get; set; } = string.Empty;
        public bool IsRiskFlagged { get; set; }
        public string? RiskCategory { get; set; }
    }

    public class GrievanceDetailDto : GrievanceGridItemDto
    {
        public string? CompTime { get; set; }
        public string? CompType { get; set; }
        public string? DateOfIncident { get; set; }
        public string? CitizenEmailId { get; set; }
        public string? CitizenDOB { get; set; }
        public string? CitizenGender { get; set; }
        public string? CaseNo { get; set; }
        public string? PMJAYId { get; set; }
        public string? ComplaintFor { get; set; }
        public string? Department { get; set; }
        public string? BeneficiaryState { get; set; }
        public string? HospitalState { get; set; }
        public string? HospitalDistrict { get; set; }
        public string? Address { get; set; }
        public string? CompRemarks { get; set; }
        public string? CSolution { get; set; }
        public string? ResolutionDate { get; set; }
        public string? ResolutionTime { get; set; }
        public string? OfficerRemarks { get; set; }
        public string? RiskReason { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public List<GrievanceStatusHistoryDto> StatusHistory { get; set; } = new();
    }

    public class GrievanceStatusHistoryDto
    {
        public long Id { get; set; }
        public string? PreviousStatus { get; set; }
        public string NewStatus { get; set; } = string.Empty;
        public string? PreviousOfficer { get; set; }
        public string? NewOfficer { get; set; }
        public string? Remarks { get; set; }
        public DateTime ChangedAt { get; set; }
    }

    public class GrievanceQueryDto : GlobalFilterDto
    {
        public string? SearchTerm { get; set; }
        public string? SortBy { get; set; } = "CompDate";
        public bool SortDescending { get; set; } = true;
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 25;
        public string? AgeBucket { get; set; }
        public string? RiskCategory { get; set; }
    }

    public class DataQualityStatsDto
    {
        public int TotalRecords { get; set; }
        public int MissingResolutionDateOnClosed { get; set; }
        public int MissingDistrictCount { get; set; }
        public int MissingOfficerCount { get; set; }
        public int MissingCategoryCount { get; set; }
        public int DuplicateCompIdAttemptsBlocked { get; set; }
        public int TotalStatusTransitionsTracked { get; set; }
        public double DataCompletenessRate { get; set; }
    }
}
