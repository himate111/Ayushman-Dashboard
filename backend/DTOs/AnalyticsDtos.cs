using System;
using System.Collections.Generic;

namespace BeneficiaryGrievance.Api.DTOs
{
    public class GlobalFilterDto
    {
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? District { get; set; }
        public List<string>? Districts { get; set; }
        public string? Category { get; set; }
        public List<string>? Categories { get; set; }
        public string? GrievanceType { get; set; }
        public string? Officer { get; set; }
        public List<string>? Officers { get; set; }
        public string? Hospital { get; set; }
        public string? Status { get; set; } // "All", "Closed", "WIP", "Open", "Pending"
        public List<string>? Statuses { get; set; }
        public string? Priority { get; set; }
        public bool? RiskOnly { get; set; }
    }

    public class DashboardKpisDto
    {
        public int TotalGrievances { get; set; }
        public int PendingGrievances { get; set; }
        public int ClosedGrievances { get; set; }
        public double ClosureRate { get; set; } // (Closed / Total) * 100
        public double PendingRate { get; set; } // (Pending / Total) * 100
        public int AttentionRequiredCount { get; set; } // Pending > 30 days OR High Risk
        public int HighRiskCount { get; set; }
        public int OverdueSixtyDaysCount { get; set; }
        public string? LastUpdatedDate { get; set; }
    }

    public class ExecutiveInsightDto
    {
        public string ChartKey { get; set; } = string.Empty;
        public string Insight { get; set; } = string.Empty;
        public string Recommendation { get; set; } = string.Empty;
        public string Severity { get; set; } = "info"; // info, warning, alert, success
    }

    // Chart 1: Grievance Backlog Movement
    public class Chart1BacklogDto
    {
        public string Period { get; set; } = string.Empty; // e.g. "Jan 2026"
        public int Registrations { get; set; }
        public int Closures { get; set; }
        public int CurrentPendingRegisteredInPeriod { get; set; }
        public int CumulativeBacklog { get; set; }
    }

    // Chart 2: Grievance Ageing & Escalation
    public class Chart2AgeingDto
    {
        public string Bucket { get; set; } = string.Empty; // "0-7 days", "8-15 days", "16-30 days", "31-60 days", "> 60 days"
        public int Count { get; set; }
        public double Percentage { get; set; }
        public string Severity { get; set; } = "normal"; // normal, medium, high, critical
    }

    // Chart 3: District Performance Analysis
    public class Chart3DistrictPerformanceDto
    {
        public string District { get; set; } = string.Empty;
        public int Total { get; set; }
        public int Pending { get; set; }
        public int Closed { get; set; }
        public double ClosureRate { get; set; }
        public double PendingRate { get; set; }
        public double StateAvgClosureRate { get; set; }
        public double VarianceFromStateAvg { get; set; }
    }

    // Chart 4: Root Cause & Resolution Gap
    public class Chart4RootCauseGapDto
    {
        public string Reason { get; set; } = string.Empty; // GrievanceType
        public string Category { get; set; } = string.Empty;
        public int Total { get; set; }
        public int Pending { get; set; }
        public int Closed { get; set; }
        public double ResolutionGapRate { get; set; } // Pending / Total * 100
    }

    // Chart 5: District-wise Grievance Hotspots
    public class Chart5HotspotDto
    {
        public List<string> Districts { get; set; } = new();
        public List<string> Categories { get; set; } = new();
        public List<HotspotDataPoint> DataPoints { get; set; } = new();
    }

    public class HotspotDataPoint
    {
        public int DistrictIndex { get; set; }
        public int CategoryIndex { get; set; }
        public string District { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int TotalCount { get; set; }
        public int PendingCount { get; set; }
        public double PendingPercentage { get; set; }
        public int DistrictTotalCount { get; set; }
        public double PercentageOfDistrictVolume { get; set; }
    }

    // Chart 6: Officer Workload Analysis
    public class Chart6OfficerWorkloadDto
    {
        public string OfficerName { get; set; } = string.Empty;
        public string OfficerLevel { get; set; } = string.Empty;
        public int AssignedTotal { get; set; }
        public int WipCases { get; set; }
        public int OpenCases { get; set; }
        public int PendingCases { get; set; }
        public int ClosedCases { get; set; }
        public double PendingRate { get; set; }
        public double AveragePendingAgeDays { get; set; }
    }

    // Chart 7: Beneficiary Access & Financial Risk
    public class Chart7RiskDto
    {
        public string RiskCategory { get; set; } = string.Empty; // e.g. "Money Demand / Extortion", "Treatment Denial", "Card Refusal"
        public int TotalComplaints { get; set; }
        public int PendingComplaints { get; set; }
        public int ClosedComplaints { get; set; }
        public double PendingRate { get; set; }
        public string ConsequenceSeverity { get; set; } = "High"; // High, Critical, Severe
    }

    // Chart 8: Grievance Cohort Resolution
    public class Chart8CohortDto
    {
        public string RegistrationCohort { get; set; } = string.Empty; // e.g. "Jan 2026"
        public int TotalRegistered { get; set; }
        public int CurrentPending { get; set; }
        public int CurrentClosed { get; set; }
        public double ClosedPercentage { get; set; }
        public double PendingPercentage { get; set; }
    }

    // Full Analytics Response Payload
    public class DashboardAnalyticsResponseDto
    {
        public DashboardKpisDto Kpis { get; set; } = new();
        public List<Chart1BacklogDto> Chart1Backlog { get; set; } = new();
        public List<Chart2AgeingDto> Chart2Ageing { get; set; } = new();
        public List<Chart3DistrictPerformanceDto> Chart3DistrictPerformance { get; set; } = new();
        public List<Chart4RootCauseGapDto> Chart4RootCauseGap { get; set; } = new();
        public Chart5HotspotDto Chart5Hotspots { get; set; } = new();
        public List<Chart6OfficerWorkloadDto> Chart6OfficerWorkload { get; set; } = new();
        public List<Chart7RiskDto> Chart7RiskAnalysis { get; set; } = new();
        public List<Chart8CohortDto> Chart8CohortResolution { get; set; } = new();
        public Dictionary<string, ExecutiveInsightDto> Insights { get; set; } = new();
    }

    public class FilterLookupOptionsDto
    {
        public List<string> Districts { get; set; } = new();
        public List<string> Categories { get; set; } = new();
        public List<string> GrievanceTypes { get; set; } = new();
        public List<string> Officers { get; set; } = new();
        public List<OfficerLookupDto> OfficersDetailed { get; set; } = new();
        public List<string> Hospitals { get; set; } = new();
        public List<string> Statuses { get; set; } = new();
        public List<string> Priorities { get; set; } = new();
        public DateTime? MinDate { get; set; }
        public DateTime? MaxDate { get; set; }
    }

    public class OfficerLookupDto
    {
        public string Name { get; set; } = string.Empty;
        public string Level { get; set; } = "L1";
    }
}
