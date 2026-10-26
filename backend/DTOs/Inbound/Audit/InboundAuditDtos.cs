using System;
using System.Collections.Generic;

namespace BeneficiaryGrievance.Api.DTOs.Inbound.Audit
{
    public class InboundAuditKpisDto
    {
        public long TotalAudited { get; set; }
        public long UniqueConfirmedIssues { get; set; }
        public double ConfirmedIssuesRate { get; set; }
        public double OverallQualityRate { get; set; }
        public double DataCompletenessRate { get; set; }
        public long RecordsRequiringReview { get; set; }
        public double ReviewRate { get; set; }
        public long ExpectedOperationalCount { get; set; }
    }

    public class InboundAuditIssueItemDto
    {
        public string RuleId { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty; // "Confirmed Completeness", "Review-Required Anomaly", "Expected Operational"
        public string Title { get; set; } = string.Empty;
        public long Count { get; set; }
        public double Percentage { get; set; }
        public string Severity { get; set; } = "info"; // "critical", "warning", "info", "review"
        public string Description { get; set; } = string.Empty;
        public string DenominatorText { get; set; } = string.Empty;
    }

    public class InboundAuditOverviewResponseDto
    {
        public InboundAuditKpisDto Kpis { get; set; } = new();
        public List<InboundAuditIssueItemDto> Issues { get; set; } = new();
    }

    public class FieldCompletenessItemDto
    {
        public string FieldName { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public long TotalRecords { get; set; }
        public long CompleteRecords { get; set; }
        public long MissingRecords { get; set; }
        public double CompletenessPercentage { get; set; }
        public string TreatmentOfZero { get; set; } = "Not Applicable";
        public string Notes { get; set; } = string.Empty;
    }

    public class InboundAuditTrendPointDto
    {
        public string Period { get; set; } = string.Empty;
        public int Year { get; set; }
        public int Month { get; set; }
        public long TotalCalls { get; set; }
        public long ConfirmedIssuesCount { get; set; }
        public double ConfirmedIssuesRate { get; set; }
        public double QualityRate { get; set; }
        public long ReviewMismatchesCount { get; set; }
        public long MissingOutcomeCount { get; set; }
        public long MissingReasonCount { get; set; }
        public long UnexpectedMissingAgentCount { get; set; }
    }

    public class InboundStatusConsistencyMatrixDto
    {
        public long AgentCallsTotal { get; set; }
        public long AgentCallsNormalTalk { get; set; } // >= 3s
        public long AgentCallsShortTalk { get; set; }  // < 3s (4,413)
        public long QueueDropsTotal { get; set; }
        public long QueueDropsNormal { get; set; }     // < 3s talk
        public long QueueDropsWithTalk { get; set; }   // >= 3s talk (759)
        public long IvrDropsTotal { get; set; }
        public long IvrDropsWithTalk { get; set; }     // >= 3s talk (0)
        public long TotalMismatches { get; set; }      // 5,172
        public double MismatchRate { get; set; }
    }

    public class InboundAuditRuleDefinitionDto
    {
        public string RuleId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string FieldsEvaluated { get; set; } = string.Empty;
        public string ConditionSql { get; set; } = string.Empty;
        public string Severity { get; set; } = string.Empty;
        public string Classification { get; set; } = string.Empty;
        public string BusinessInterpretation { get; set; } = string.Empty;
    }

    public class InboundFlaggedCallsQueryDto : InboundCallQueryDto
    {
        public string? AuditRule { get; set; } = "all"; // "all", "confirmed", "review", "unexpected_agent", "missing_disp", "missing_sub_disp", "mismatch"
    }

    public class InboundFlaggedCallRecordDto : InboundCallRecordDto
    {
        public List<string> TriggeredRules { get; set; } = new();
        public string AuditCategory { get; set; } = "Review Required";
        public string AuditSeverity { get; set; } = "warning";
        public string AuditSummary { get; set; } = string.Empty;
    }

    public class InboundFlaggedCallsPagedResponseDto
    {
        public List<InboundFlaggedCallRecordDto> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public bool HasNext => Page < TotalPages;
        public bool HasPrev => Page > 1;
        public string ActiveAuditFilter { get; set; } = "all";
    }
}
