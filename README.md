# Beneficiary Grievance Intelligence Dashboard

> **Ayushman Bharat — Pradhan Mantri Jan Arogya Yojana (AB PM-JAY)**  
> National Health Authority (NHA) • Beneficiary Redressal & Backlog Monitoring

A full-stack, enterprise-grade Beneficiary Grievance Analytics & Intelligence Platform built using **React**, **ASP.NET Core Web API (.NET 8)**, and **Microsoft SQL Server (MSSQL)**.

---

## Folder Structure

```text
D:\Grievience\
├── backend\          # ASP.NET Core Web API (.NET 8) Layered Architecture
│   ├── Controllers\  # REST API endpoints (Analytics, Grievances, Import, Auth)
│   ├── Data\         # EF Core DbContext and configurations
│   ├── DTOs\         # Data Transfer Objects
│   ├── Models\       # MSSQL database entities
│   ├── Services\     # Business logic, ClosedXML import, analytics algorithms
│   └── Program.cs    # Application configuration, DI, and Swagger
├── frontend\         # React + Vite + Material-UI + Apache ECharts
│   ├── src\
│   │   ├── api\      # Axios API clients
│   │   ├── components\
│   │   │   └── charts\ # 8 Mandatory Interactive Analytics Charts
│   │   ├── pages\    # 6 Enterprise Pages
│   │   └── theme.js  # Executive Government Healthcare Theme
├── database\         # MSSQL Database Scripts
│   ├── 01_CreateSchema.sql # Tables, indexes, unique constraints, foreign keys
│   └── 02_SeedData.sql     # Initial administrator user and category risk rules
├── docs\             # Project Documentation
│   ├── 01_Architecture_Overview.md
│   ├── 02_Database_Design.md
│   ├── 03_Import_Pipeline_and_Duplicate_Detection.md
│   ├── 04_Analytics_and_Intelligence_Specifications.md
│   └── 05_Deployment_and_Run_Guide.md
└── README.md
```

---

## Key Features

1. **Intelligent Excel & CSV Ingestion Engine**:
   - Supports single-month, multi-month, six-month, and overlapping date reports.
   - Immune to duplication: Re-uploading identical reports skips records without duplication.
   - Status tracking: Records status transitions (e.g., WIP to Closed) in `GrievanceStatusHistory` without data loss.
   - Conflict handling: Older reports cannot silently overwrite newer states.

2. **The Eight Mandatory Analytics Charts**:
   - **Chart 1 — Grievance Backlog Movement**: Registrations vs pending residues over time.
   - **Chart 2 — Grievance Ageing & Escalation**: Pending cases in buckets: 0–7, 8–15, 16–30, 31–60, >60 days.
   - **Chart 3 — District Performance Analysis**: Total, Pending, Closed, and Closure % with sorting.
   - **Chart 4 — Root Cause & Resolution Gap**: Compares resolved vs pending by complaint reason.
   - **Chart 5 — District-wise Grievance Hotspots**: Heatmap matrix correlating districts and categories.
   - **Chart 6 — Officer Workload Analysis**: Assigned cases, pending share %, and average pending age.
   - **Chart 7 — Beneficiary Access & Financial Risk**: Flags extortion, treatment denial, bed refusal, card rejection.
   - **Chart 8 — Grievance Cohort Resolution**: Follows monthly registration cohorts over time.

3. **Executive Intelligence Layer**:
   - Every chart includes an automatically generated data-driven insight and recommended management action derived strictly from actual MSSQL database calculations.

4. **Multi-Dimensional Global Filtering**:
   - Filter simultaneously by Date Range, District, Category, Root Cause, Status, Assigned Officer, and Risk-Only.
   - Dynamically recalculates all 6 KPI cards, 8 charts, and insights in real time.

5. **Beneficiary Data Privacy & Drill-Down**:
   - Masked Citizen Aadhaar and Mobile numbers across all views.
   - Full drill-down modal showing complete citizen details, hospital notes, and audit history.

---

## Quick Start Commands

### Backend (`D:\Grievience\backend`):
```powershell
$env:DOTNET_ROOT = "$env:LOCALAPPDATA\Microsoft\dotnet"
$env:Path = "$env:LOCALAPPDATA\Microsoft\dotnet;" + $env:Path
dotnet run --launch-profile http
```
- API Base: `http://localhost:5285`
- Swagger UI: `http://localhost:5285/swagger`

### Frontend (`D:\Grievience\frontend`):
```powershell
npm run dev -- --port 5173
```
- Dashboard URL: `http://localhost:5173`
- Default Login: `admin` / `Admin@123`
