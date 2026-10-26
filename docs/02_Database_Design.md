# Microsoft SQL Server Database Design

## 1. Database Specifications

- **Database Name**: `BeneficiaryGrievanceDB`
- **Instance**: `localhost` (`GVIJAY` / `MSSQLSERVER`)
- **Authentication**: Windows Integrated Security (`Trusted_Connection=True`)
- **Schema Script**: `D:\Grievience\database\01_CreateSchema.sql`
- **Seed Script**: `D:\Grievience\database\02_SeedData.sql`

## 2. Table Schemas & Dictionary

### 2.1 `dbo.Grievances` (Main Entity)

| Column Name | Data Type | Nullable | Description |
|---|---|---|---|
| `Id` | BIGINT IDENTITY | No | Primary Key |
| `CompId` | BIGINT | No | **Primary Business Key (UNIQUE INDEX)** |
| `CompType` | NVARCHAR(100) | Yes | Complaint source channel (e.g. Beneficiary) |
| `CompDate` | DATETIME2 | No | Registration Date (Indexed) |
| `CompTime` | NVARCHAR(50) | Yes | Registration Time (e.g. 09:56 AM) |
| `Status` | NVARCHAR(50) | No | Normalized Status: `Closed`, `WIP`, `Open` |
| `Priority` | NVARCHAR(50) | No | Default `Normal`, `High`, `Urgent` |
| `CitizenName` | NVARCHAR(200) | Yes | Beneficiary Name |
| `CitizenMobileNo` | NVARCHAR(50) | Yes | Raw mobile number (Masked in UI) |
| `CitizenAadharNo` | NVARCHAR(50) | Yes | Raw Aadhaar number (Masked in UI) |
| `CaseNo` | NVARCHAR(100) | Yes | TMS Treatment Case Number |
| `PMJAYId` | NVARCHAR(100) | Yes | Ayushman Golden Card ID |
| `BeneficiaryDistrict` | NVARCHAR(100) | Yes | Beneficiary Home District (Indexed) |
| `HospitalName` | NVARCHAR(300) | Yes | Empanelled Hospital Name |
| `GrievanceCategory` | NVARCHAR(200) | Yes | Primary Category (Indexed) |
| `GrievanceType` | NVARCHAR(300) | Yes | Root Cause / Subcategory (Indexed) |
| `CompRemarks` | NVARCHAR(MAX) | Yes | Grievance narrative |
| `CSolution` | NVARCHAR(MAX) | Yes | Resolution narrative |
| `ResolutionDate` | DATETIME2 | Yes | Official Closure Date (null when omitted in feed) |
| `OfficerName` | NVARCHAR(200) | Yes | Assigned Redressal Officer (Indexed) |
| `OfficerLevel` | NVARCHAR(50) | Yes | Redressal Hierarchy (L1, L2, L3) |
| `AgeInDays` | INT | No | Computed age in days |
| `AgeBucket` | NVARCHAR(50) | No | `0-7 days`, `8-15 days`, `16-30 days`, `31-60 days`, `> 60 days` |
| `IsRiskFlagged` | BIT | No | Automated risk flag (Indexed) |
| `RiskCategory` | NVARCHAR(100) | Yes | Money Demand, Treatment Denial, Card Refusal, etc. |
| `FirstImportBatchId` | INT FK | Yes | Ingestion audit reference |
| `LastImportBatchId` | INT FK | Yes | Last update audit reference |

### 2.2 `dbo.GrievanceStatusHistory` (Audit & Transition Log)

| Column Name | Data Type | Nullable | Description |
|---|---|---|---|
| `Id` | BIGINT IDENTITY | No | Primary Key |
| `GrievanceId` | BIGINT FK | No | Foreign Key referencing `dbo.Grievances(Id)` |
| `CompId` | BIGINT | No | Source Complaint ID |
| `PreviousStatus` | NVARCHAR(50) | Yes | Prior Status (e.g. WIP) |
| `NewStatus` | NVARCHAR(50) | No | New Status (e.g. Closed) |
| `PreviousOfficer` | NVARCHAR(200) | Yes | Prior Assigned Officer |
| `NewOfficer` | NVARCHAR(200) | Yes | New Assigned Officer |
| `Remarks` | NVARCHAR(MAX) | Yes | Audit notes / resolution text |
| `ImportBatchId` | INT FK | Yes | Batch ID in which update was delivered |
| `ChangedAt` | DATETIME2 | No | Timestamp of change detection |

### 2.3 `dbo.ImportBatches` & `dbo.ImportErrors`

- `dbo.ImportBatches`: Tracks file name, file size, SHA256 file hash, total rows, new count, updated count, unchanged count, error count, execution time, and user.
- `dbo.ImportErrors`: Preserves exact row number, CompId, error message, and raw data for every rejected line.

## 3. High Performance Indexing Strategy

```sql
CREATE NONCLUSTERED INDEX IX_Grievances_CompDate ON [dbo].[Grievances]([CompDate]);
CREATE NONCLUSTERED INDEX IX_Grievances_Status ON [dbo].[Grievances]([Status]) INCLUDE ([CompId], [CompDate], [BeneficiaryDistrict], [GrievanceCategory]);
CREATE NONCLUSTERED INDEX IX_Grievances_District ON [dbo].[Grievances]([BeneficiaryDistrict]) INCLUDE ([Status], [GrievanceCategory]);
CREATE NONCLUSTERED INDEX IX_Grievances_Category ON [dbo].[Grievances]([GrievanceCategory], [GrievanceType]);
CREATE NONCLUSTERED INDEX IX_Grievances_Officer ON [dbo].[Grievances]([OfficerName], [OfficerLevel]) INCLUDE ([Status]);
CREATE NONCLUSTERED INDEX IX_Grievances_AgeBucket ON [dbo].[Grievances]([AgeBucket], [Status]);
CREATE NONCLUSTERED INDEX IX_Grievances_Risk ON [dbo].[Grievances]([IsRiskFlagged], [RiskCategory]) INCLUDE ([Status]);
```
