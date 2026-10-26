# Beneficiary Grievance Intelligence Dashboard — Architecture Overview

## 1. Executive Summary

The **Beneficiary Grievance Intelligence Dashboard** is an enterprise-grade analytics, monitoring, and audit platform designed for **Ayushman Sampark** (National Health Authority — AB PM-JAY). It empowers healthcare administrators, grievance redressal officers, and executive directors to monitor incoming complaints, detect systemic healthcare service bottlenecks, enforce service turnaround charters, and safeguard beneficiary access.

## 2. System Architecture

```text
+-------------------------------------------------------------------------+
|                        Presentation Tier (React Vite)                   |
|  - Modern Executive Light UI (MUI v6)                                   |
|  - 8 Interactive Analytics Visualisations (Apache ECharts)              |
|  - Synchronous Multi-Dimensional Filtering                              |
|  - PII Masking & Drill-Down Modal Inspection                            |
+------------------------------------+------------------------------------+
                                     |  HTTP REST / JSON (JWT Secured)
                                     v
+-------------------------------------------------------------------------+
|                    Application Tier (ASP.NET Core Web API)              |
|  - Controllers: Auth, Import, Analytics, Grievances, Config             |
|  - Services: ImportService, AnalyticsService, GrievanceService, AuthService|
|  - Streaming Ingestion: ClosedXML (Excel .xlsx/.xls) & CsvHelper (CSV)  |
|  - Intelligent Business Logic: Age Bracket Calculation & Risk Classifiers|
+------------------------------------+------------------------------------+
                                     |  EF Core 8 / Parameterized SQL
                                     v
+-------------------------------------------------------------------------+
|                    Database Tier (Microsoft SQL Server)                 |
|  - Database: BeneficiaryGrievanceDB                                     |
|  - Primary Tables: Grievances, GrievanceStatusHistory, ImportBatches,   |
|                    ImportErrors, GrievanceCategories, Users            |
|  - Unique Business Constraint on CompId (Duplicate Immune)              |
|  - High-Performance Multi-Column Analytics Indexes                     |
+-------------------------------------------------------------------------+
```

## 3. Technology Stack

- **Frontend**: React 19, Vite 8, Material-UI (MUI), Apache ECharts (`echarts-for-react`), Axios, Lucide React.
- **Backend**: ASP.NET Core Web API (.NET 8.0), C#, Entity Framework Core 8.0, ClosedXML, CsvHelper, JWT Bearer Authentication, Swagger/OpenAPI.
- **Database**: Microsoft SQL Server 2025 (`localhost` / `MSSQLSERVER`), Windows Integrated Security.

## 4. Key Security & Compliance Safeguards

1. **Beneficiary Data Protection**: Citizen Aadhaar numbers and mobile numbers are stored safely and masked (`XXXX-XXXX-1234`, `97******65`) across all grid views and charts.
2. **SQL Injection Immunity**: 100% parameterised database operations via Entity Framework Core.
3. **Audit Trail Continuity**: Status transitions (e.g. WIP to Closed) and officer reassignments are permanently logged in `GrievanceStatusHistory`.
