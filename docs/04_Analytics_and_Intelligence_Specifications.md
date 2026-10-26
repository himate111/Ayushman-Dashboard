# Analytics Visualisations & Intelligence Specifications

## 1. Executive KPI Cards

All KPIs calculate dynamically from MSSQL based on applied global filters:

- **Total Grievances**: `COUNT(*)`
- **Pending Backlog**: `COUNT(*) WHERE Status != 'Closed'`
- **Closed Cases**: `COUNT(*) WHERE Status = 'Closed'`
- **Closure Rate**: `(Closed Grievances / Total Grievances) * 100`
- **Pending Rate**: `(Pending Grievances / Total Grievances) * 100`
- **Urgent Attention Count**: `COUNT(*) WHERE Status != 'Closed' AND (AgeInDays > 30 OR IsRiskFlagged = 1)`

## 2. The Eight Mandatory Analytics Charts

### Chart 1 — Grievance Backlog Movement
- **Management Question**: Are complaints arriving faster than they are being closed?
- **Data Formulation**: Monthly registrations grouped by registration month (`CompDate.Year`, `CompDate.Month`), active unresolved backlog registered in that month, and cumulative pending backlog curve.
- **Handling Missing Closure Dates**: Rather than inventing fabricated closure dates (source reports often lack explicit closure timestamps for historical closed records), the chart clearly plots actual registrations against unresolved pending cases.

### Chart 2 — Grievance Ageing & Escalation
- **Management Question**: Which unresolved cases have been pending too long?
- **Buckets**:
  - `0–7 days` (Normal service velocity)
  - `8–15 days` (Standard enquiry window)
  - `16–30 days` (Turnaround threshold)
  - `31–60 days` (Statutory escalation required)
  - `> 60 days` (Critical operational delay)
- **Interactive Drill-Down**: Clicking any bar filters the Grievance Explorer to inspect the underlying cases.

### Chart 3 — District Performance Analysis
- **Management Question**: Which districts require intervention?
- **Visual**: Ranked horizontal stacked bar chart showing Closed vs Pending cases with Closure Rate %.
- **Interactive Sorting**: One-click sorting by Total Volume, Pending Volume, or Lowest Closure Rate %.

### Chart 4 — Root Cause & Resolution Gap
- **Management Question**: Which specific problems contribute most to the backlog?
- **Visual**: Horizontal stacked bars contrasting resolved vs pending cases by `GrievanceType` (sub-reason).
- **Metric**: Resolution Gap Rate = `(Pending / Total) * 100`.

### Chart 5 — District-wise Grievance Hotspots
- **Management Question**: Where are particular complaint types concentrated?
- **Visual**: Heatmap matrix correlating Top Districts with Top Grievance Categories.

### Chart 6 — Officer Workload Analysis
- **Management Question**: Where might officers need additional support?
- **Visual**: Horizontal stacked bars showing closed cases, pending cases, pending share %, and average age in days per officer.

### Chart 7 — Beneficiary Access & Financial Risk
- **Management Question**: Which unresolved complaints may have serious consequences?
- **Classification Rules**:
  - `Money Demand / Extortion`: Charges, bribe, cash demand, extortion keywords.
  - `Treatment Denial`: Denial of empanelled care, refusal of doctor/hospital.
  - `Admission Refusal`: Bed denial, refused inpatient admission.
  - `Card Refusal`: Refusal to honor valid Ayushman card.
  - `Approval Delay`: Delayed pre-authorization.

### Chart 8 — Grievance Cohort Resolution
- **Management Question**: Are older groups of complaints being cleared?
- **Visual**: Grouped/stacked bar chart following monthly intake cohorts and their current Closed % vs Pending %.

## 3. Executive Intelligence Layer

Every chart automatically generates a real, dynamic finding derived directly from database calculations:
- Highlights exact percentages, numbers, and affected districts/officers/categories.
- Delivers an actionable recommended management intervention.
