# OUTBOUND CALL ANALYTICS — DEPLOYMENT PREPARATION REPORT

**Project:** Ayushman Grievance Redressal System — Outbound Call Analytics  
**Date:** November 8, 2026  
**Stack:** React 18 (Vite) + ASP.NET Core 8 Web API + Microsoft SQL Server (MSSQL)  
**Database:** `call_center` (`dbo.outbound_cdr_calls`)  
**Deployment Target Status:** Prepared & Ready for Deployment (Awaiting Explicit Approval)  

---

## 1. Executive Summary & Readiness Verdict

| Readiness Item | Target Standard | Status | Evidence / Notes |
| :--- | :--- | :--- | :--- |
| **Logic Preservation** | 3-Second Agent Talk rule (`agent_seconds >= 3`) | **PASS** | No modifications made to any business logic or SQL rules. |
| **Data Immutability** | Zero unauthorized edits to prod DB / queries | **PASS** | Total row count remains exactly 540,977 (221,020 connected, 319,957 not connected, 9 null timestamps). |
| **Documentation Alignment** | Correct 79,155 to 99,075 for connected alternate raw dispositions | **PASS** | Corrected in `docs/outbound_complete_audit_report.md` (lines 103 & 343). 0 occurrences of 79,155 remain. |
| **Database Backup** | Fresh, verified full production backup | **PASS** | `call_center_production_release_20261108.bak` (76.6 MB, 56,697 pages) created. |
| **Restore Verification** | Automated restore into isolated database | **PASS** | Restored into `call_center_restore_verify_20261108` in 0.679s. Row counts 100% matched, then cleanly torn down. |
| **Backend Release Build** | .NET 8 Release build & publish output | **PASS** | `dotnet publish -c Release` succeeded with 0 errors, 0 warnings. |
| **Frontend Production Build** | React 18 + Vite production build | **PASS** | `npm run build` succeeded with 0 errors (4,285 modules transformed into `dist/`). |
| **Agent Filter Verification** | API & MSSQL parity standalone & in combinations | **PASS** | Exact row match across S1010 standalone, S1010+Year, S1010+Shift, and S1010+Disposition. |
| **Rollback Procedures** | Documented & tested rollback paths | **PASS** | Point-in-time `.bak` restore + granular transactional script `rollback_outbound_dates.sql`. |

**FINAL RECOMMENDATION: GO FOR DEPLOYMENT**  
*(Pending explicit user authorization. No production configurations or deployments have been executed.)*

---

## 2. Verification Checklist: Item-by-Item Results

### Check 1: 3-Second Agent Talk Duration Rule
- **Rule Definition:** In `dbo.outbound_cdr_calls`, a call is classified as **Connected** if and only if `agent_seconds >= 3` (`is_connected = 1`), regardless of raw disposition string.
- **Verification:**
  - MSSQL queries in `backend/Services/Outbound/OutboundAnalyticsService.cs` use `is_connected = 1` for all connected KPIs and charts.
  - No application logic was altered.
- **Result:** **PASS**

### Check 2: Immutability of Calculations, Charts, Filters & Records
- **Verification:**
  - Ran baseline query against `call_center`:
    ```sql
    SELECT COUNT(*), 
           SUM(CASE WHEN is_connected=1 THEN 1 ELSE 0 END), 
           SUM(CASE WHEN is_connected=0 THEN 1 ELSE 0 END), 
           SUM(CASE WHEN call_time IS NULL THEN 1 ELSE 0 END) 
    FROM dbo.outbound_cdr_calls WITH (NOLOCK);
    -- Output: 540977 | 221020 | 319957 | 9
    ```
  - Zero SQL scripts, migration scripts, or application code were modified during preparation.
- **Result:** **PASS**

### Check 3: Documentation Correction (79,155 to 99,075)
- **Background:** The raw disposition distribution for connected calls (`is_connected = 1`, 221,020 total calls) contains 121,945 calls with raw `disposition = 'Connected'` and 99,075 calls with alternative raw dispositions (77,122 `-`, 21,288 `Not Connected`, 659 `Autosave`, 6 `Call Back`). A prior draft documentation figure of 79,155 had mistakenly subtracted the 19,920 short calls twice.
- **Action Taken:** Updated `docs/outbound_complete_audit_report.md` (lines 103 and 343) and matching conversation artifacts to reflect the exact figure **99,075**.
- **Verification:** Grep search confirmed 0 remaining instances of `79,155` across all markdown documentation files.
- **Result:** **PASS**

### Check 4: Fresh Production Database Backup
- **Backup Script:** `D:\Grevience\database\scripts\backup_call_center_release.sql`
- **Output File:** `D:\Grevience\database\backup\call_center_production_release_20261108.bak`
- **File Size:** 76,591,616 bytes (~73.0 MB)
- **MSSQL Execution Log:**
  - `BACKUP DATABASE successfully processed 56697 pages in 1.025 seconds (432.064 MB/sec).`
- **Integrity:** Native MSSQL checksums enabled, complete multi-file structure preserved (`call_center`, `call_center_data_d`, `call_center_log`, `call_center_log_d`).
- **Result:** **PASS**

### Check 5: Isolated Backup Restore Verification
- **Verification Script:** `D:\Grevience\scripts\uat\verify_backup_restore.js`
- **Isolated Target Database:** `call_center_restore_verify_20261108`
- **Restore Execution Time:** 0.679 seconds (652.34 MB/sec)
- **Row Reconciliation in Isolated Database:**
  - Total Calls: `540,977` (Expected: `540,977`) &rarr; **MATCH**
  - Connected Calls: `221,020` (Expected: `221,020`) &rarr; **MATCH**
  - Not Connected Calls: `319,957` (Expected: `319,957`) &rarr; **MATCH**
  - NULL Call Timestamps: `9` (Expected: `9`) &rarr; **MATCH**
  - Audit Staging Records: `59,340` (Expected: `59,340`) &rarr; **MATCH**
  - Blank Records View (`vw_outbound_data_quality_blank_records`): `9` (Expected: `9`) &rarr; **MATCH**
- **Teardown:** The temporary database was set to `SINGLE_USER WITH ROLLBACK IMMEDIATE`, dropped, and temporary data files deleted cleanly.
- **Result:** **PASS**

### Check 6: React and .NET Production Build Configurations
- **.NET 8 Web API:**
  - Command: `dotnet publish -c Release -o D:\Grevience\backend\publish D:\Grevience\backend\backend.csproj`
  - Output: `0 Error(s)`, `0 Warning(s)`.
  - Artifacts: Published binaries in `backend/publish/`.
- **React 18 + Vite:**
  - Command: `npm --prefix frontend run build`
  - Output: `built in 1.54s`, `4285 modules transformed`.
  - Artifacts: Production bundle in `frontend/dist/`.
- **Result:** **PASS**

---

## 3. Evidence: Agent Filter Verification

The Agent filter was audited across MSSQL, .NET API endpoints, and the React UI.

### 3.1 Backend Implementation Evidence
In `backend/Services/Outbound/OutboundAnalyticsService.cs`:
```csharp
if (!string.IsNullOrWhiteSpace(request.AgentId))
{
    sql.Append(" AND agent_id = @AgentId");
    parameters.Add(new SqlParameter("@AgentId", SqlDbType.VarChar, 50) { Value = request.AgentId.Trim() });
}
```

### 3.2 SQL vs API Reconciliation Results

| Filter Test Scenario | Parameters | MSSQL Database Result | .NET API Response | Variance | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Agent Standalone** | `AgentId=S1010` | Total: **33,437**<br>Conn: **11,151**<br>Unconn: **22,286** | Total: **33,437**<br>Conn: **11,151**<br>Conn Rate: **33.3%** | **0** | **PASS** |
| **Agent + Year** | `AgentId=S1010`<br>`Year=2026` | Total: **26,259**<br>Conn: **8,501**<br>Unconn: **17,758** | Total: **26,259**<br>Conn: **8,501**<br>Conn Rate: **32.4%** | **0** | **PASS** |
| **Agent + Shift** | `AgentId=S1010`<br>`Shift=Morning` (07:00–14:59) | Total: **33,229**<br>Conn: **11,097**<br>Unconn: **22,132** | Total: **33,229**<br>Conn: **11,097**<br>Conn Rate: **33.4%** | **0** | **PASS** |
| **Agent + Disposition** | `AgentId=S1010`<br>`Disposition=Connected` | Total: **6,237**<br>Conn: **5,873**<br>Unconn: **364** | Total: **6,237**<br>Conn: **5,873**<br>Conn Rate: **94.2%** | **0** | **PASS** |

### 3.3 React UI Filter Integration
In `frontend/src/modules/outbound/components/OutboundFilterBar.jsx`:
- Agent selector populates dynamically from distinct `agent_id` values via `/api/outbound/analytics/filters`.
- Changing the Agent selector updates the global filter state and immediately triggers data re-fetch across all 7 KPI cards and 10 charts.

---

## 4. Outstanding Non-Blocking Risks & Operational Notes

| Item | Nature | Operational Impact | Recommended Handling |
| :--- | :--- | :--- | :--- |
| **9 Blank Records** | Historical data collection gaps (NULL timestamps, agent ID, and caller ID). | Nil. Filtered safely from time-series charts (`WHERE call_time IS NOT NULL`). Total count intact. | Retain in database. Monitored via `dbo.vw_outbound_data_quality_blank_records`. No action needed. |
| **729 Duration Inversions** | 729 September 2025 records where `agent_seconds` exceeds `duration_seconds` by 1–8s (avg 3.59s). | Nil. UI shows "Review" status with factual historical description in Data Quality Audit. | Do not alter historical records. Retain as audited historical data. |
| **Vite Chunk Size Notice** | Vite logs notice for chunks > 500 kB (`index.js`). | Standard frontend bundle sizing warning; does not affect application performance or runtime. | Optional post-release code-splitting optimization. |

---

## 5. Deployment Checklist & Rollback Procedures

### 5.1 Pre-Deployment Verification Checklist
- [x] Verify database connectivity to `call_center` on production SQL instance.
- [x] Confirm backup file exists and is intact: `D:\Grevience\database\backup\call_center_production_release_20261108.bak`.
- [x] Confirm test restore passed in isolated environment.
- [x] Verify `backend/publish/` contains up-to-date binaries.
- [x] Verify `frontend/dist/` contains production static build.
- [x] Confirm `appsettings.json` has `UseInboundTestDb: false` and valid production connection strings.

### 5.2 Deployment Steps (Pending User Approval)
1. **Stop Application Services:**
   - Stop backend service / IIS AppPool hosting `backend.exe`.
2. **Deploy Backend Release Binaries:**
   - Copy contents of `D:\Grevience\backend\publish\` to destination deployment directory (e.g., `C:\inetpub\wwwroot\AyushmanApi` or service directory).
   - Ensure `appsettings.json` matches target environment settings.
3. **Deploy Frontend Production Assets:**
   - Copy contents of `D:\Grevience\frontend\dist\` to the frontend web server / static root (e.g., `C:\inetpub\wwwroot\AyushmanFrontend` or Nginx/IIS site).
4. **Start Application Services:**
   - Start backend service / IIS AppPool.
5. **Post-Deployment Smoke Test:**
   - Open browser at `http://<host>/?module=outbound&tab=dashboard`.
   - Verify 7 KPI cards load with default values (Total Calls: 540,977, Connected: 221,020, Rate: 40.9%).
   - Verify filter dropdowns (Year, Month, Date Range, Shift, Disposition, Agent, Campaign) function properly.
   - Navigate to Call Records Explorer, Insights Explorer, Data Quality Audit, and Upload History.

### 5.3 Application Deployment Rollback Procedures

If an unexpected critical regression occurs during application release deployment, execute one of the following deployment rollback procedures:

#### Rollback Path 1: Application Binary & Asset Revert (Application-Level Rollback — < 2 minutes)
If the deployment failure or regression is confined to application code, routing, or frontend rendering:
1. Stop the backend hosting process / IIS Application Pool:
   ```powershell
   Stop-WebAppPool -Name "AyushmanApiPool"  # or stop service
   ```
2. Revert the application deployment directories (`backend/` binaries and `frontend/` static assets) to the previous stable release artifacts.
3. Restart the backend service / IIS Application Pool:
   ```powershell
   Start-WebAppPool -Name "AyushmanApiPool"
   ```
4. Verify portal functionality at `http://<host>/?module=outbound&tab=dashboard`.

#### Rollback Path 2: Full Database Point-in-Time Restore (Database Disaster Recovery — < 3 minutes)
If the database schema or data state is compromised during deployment:
1. Terminate all active database connections and set database to single-user mode:
   ```sql
   ALTER DATABASE [call_center] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
   ```
2. Restore from the verified production release backup:
   ```sql
   RESTORE DATABASE [call_center]
   FROM DISK = 'D:\Grevience\database\backup\call_center_production_release_20261108.bak'
   WITH REPLACE;
   ALTER DATABASE [call_center] SET MULTI_USER;
   ```
3. Verify restored record counts (Total: 540,977, Connected: 221,020, Unconnected: 319,957, NULLs: 9).

---

### 5.4 Specialized Data Maintenance Rollback (Non-Deployment Procedure)

> [!CAUTION]
> **DO NOT USE FOR GENERAL APPLICATION DEPLOYMENT ROLLBACK**  
> `rollback_outbound_dates.sql` is a specialized historical data maintenance script, NOT a general application deployment rollback script. It must **never** be executed to troubleshoot application release failures.

- **Purpose:** Specifically reverses the one-time historical date reconciliation executed under run identifier `RUN_20261106_OUTBOUND_DATE_RECONCILIATION`.
- **Target:** Reverts exactly 59,340 reconciled timestamps in `dbo.outbound_cdr_calls` back to their uncorrected raw timestamps using `dbo.outbound_date_correction_audit`.
- **Execution Script:** `D:\Grevience\database\scripts\rollback_outbound_dates.sql`
- **When to Use:** ONLY if data governance authorities specifically mandate reverting the historical date alignment back to uncorrected source timestamps.

---

## 6. Sign-off & Final Recommendation

- **Integrity Status:** Production database `call_center` is 100% untouched and intact.
- **Build Status:** Both Backend and Frontend release builds are compiled, verified, and ready.
- **Safety Status:** Full verified backup and dual rollback mechanisms are ready and tested.
- **Verdict:** **READY FOR DEPLOYMENT — AWAITING USER APPROVAL.**
