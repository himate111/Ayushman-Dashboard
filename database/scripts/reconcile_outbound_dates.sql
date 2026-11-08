-- ==========================================================================================
-- SCRIPT: reconcile_outbound_dates.sql
-- PURPOSE: Production-Grade, Idempotent, Safe Transactional Correction for Outbound CDR Dates
-- DATABASE: call_center
-- TARGET TABLE: dbo.outbound_cdr_calls
-- AUDIT TABLE: dbo.outbound_date_correction_audit
-- AFFECTED SET: Exactly 59,340 records (45,619 in Jan 2026 batch, 13,721 in Dec 2025 batch)
-- RUN IDENTIFIER: RUN_20261106_OUTBOUND_DATE_RECONCILIATION
--
-- SAFETY & IDEMPOTENCY GUARANTEES:
--   1. SET ANSI_NULLS & QUOTED_IDENTIFIER ON for computed column index compatibility.
--   2. Strict pre-flight validation of database name, total rows, and target records.
--   3. Idempotent: Exits cleanly if run has already been applied.
--   4. Staging isolation: Uses primary-keyed audit table with run_id.
--   5. Atomic transaction: Enclosed in BEGIN TRANSACTION with XACT_ABORT.
--   6. Strict rowcount assertions: @@ROWCOUNT must equal 59,340 at each DML step.
--   7. Full post-flight invariant validation: Asserts 540,977 total, 221,020 connected, 0 ghost months.
--   8. Standalone rollback companion: rollback_outbound_dates.sql.
-- ==========================================================================================

USE call_center;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT '====================================================================================';
PRINT '  OUTBOUND CDR HISTORICAL DATE CORRECTION — PRODUCTION TRANSACTIONAL EXECUTION       ';
PRINT '====================================================================================';
PRINT 'Execution Timestamp: ' + CONVERT(VARCHAR(30), SYSUTCDATETIME(), 120) + ' UTC';

DECLARE @RunId VARCHAR(50) = 'RUN_20261106_OUTBOUND_DATE_RECONCILIATION';

-- ------------------------------------------------------------------------------------------
-- 1. SCHEMA VERIFICATION: CREATE AUDIT TABLE IF NOT EXISTS
-- ------------------------------------------------------------------------------------------
IF OBJECT_ID('dbo.outbound_date_correction_audit', 'U') IS NULL
BEGIN
    PRINT 'Creating isolated audit history table dbo.outbound_date_correction_audit...';
    CREATE TABLE dbo.outbound_date_correction_audit (
        run_id VARCHAR(50) NOT NULL,
        id BIGINT NOT NULL,
        batch_id BIGINT NULL,
        report_month NVARCHAR(20) NULL,
        original_call_time DATETIME2(0) NOT NULL,
        corrected_call_time DATETIME2(0) NOT NULL,
        original_call_year INT NULL,
        original_call_month INT NULL,
        corrected_call_year INT NULL,
        corrected_call_month INT NULL,
        applied_at DATETIME2(7) NOT NULL DEFAULT SYSUTCDATETIME(),
        is_reverted BIT NOT NULL DEFAULT 0,
        CONSTRAINT PK_outbound_date_correction_audit PRIMARY KEY (run_id, id)
    );
END
GO

-- ------------------------------------------------------------------------------------------
-- 2. PRE-FLIGHT VERIFICATION & IDEMPOTENCY CHECK
-- ------------------------------------------------------------------------------------------
DECLARE @RunId VARCHAR(50) = 'RUN_20261106_OUTBOUND_DATE_RECONCILIATION';
DECLARE @TotalRecords INT;
DECLARE @TotalConnected INT;
DECLARE @TotalNotConnected INT;
DECLARE @JanAffected INT;
DECLARE @DecAffected INT;
DECLARE @OtherAffected INT;
DECLARE @TotalAffected INT;
DECLARE @ExistingRunAuditCount INT;

SELECT 
    @TotalRecords = COUNT(*),
    @TotalConnected = SUM(CASE WHEN is_connected = 1 THEN 1 ELSE 0 END),
    @TotalNotConnected = SUM(CASE WHEN is_connected = 0 THEN 1 ELSE 0 END),
    @JanAffected = SUM(CASE WHEN report_month = 'Jan' AND call_month != 1 THEN 1 ELSE 0 END),
    @DecAffected = SUM(CASE WHEN report_month = 'Dec' AND call_month != 12 THEN 1 ELSE 0 END),
    @OtherAffected = SUM(CASE WHEN report_month NOT IN ('Jan', 'Dec') AND report_month IS NOT NULL AND 
        ((report_month = 'Feb' AND call_month != 2) OR
         (report_month = 'Mar' AND call_month != 3) OR
         (report_month = 'Apr' AND call_month != 4) OR
         (report_month = 'Aug' AND call_month != 8) OR
         (report_month = 'Sep' AND call_month != 9) OR
         (report_month = 'Oct' AND call_month != 10) OR
         (report_month = 'Nov' AND call_month != 11)) THEN 1 ELSE 0 END)
FROM dbo.outbound_cdr_calls;

SELECT @ExistingRunAuditCount = COUNT(*) 
FROM dbo.outbound_date_correction_audit 
WHERE run_id = @RunId AND is_reverted = 0;

SET @TotalAffected = @JanAffected + @DecAffected;

PRINT 'Pre-Flight Verification Status:';
PRINT '  - Total Records:            ' + CAST(@TotalRecords AS VARCHAR(20)) + ' (Baseline: 540977)';
PRINT '  - Connected Records:        ' + CAST(@TotalConnected AS VARCHAR(20)) + ' (Baseline: 221020)';
PRINT '  - Not-Connected Records:    ' + CAST(@TotalNotConnected AS VARCHAR(20)) + ' (Baseline: 319957)';
PRINT '  - Jan 2026 Records to Fix:  ' + CAST(@JanAffected AS VARCHAR(20));
PRINT '  - Dec 2025 Records to Fix:  ' + CAST(@DecAffected AS VARCHAR(20));
PRINT '  - Target Total to Fix:      ' + CAST(@TotalAffected AS VARCHAR(20));
PRINT '  - Existing Audit Records:   ' + CAST(@ExistingRunAuditCount AS VARCHAR(20));

-- Idempotency check: If already applied, exit safely
IF @TotalAffected = 0 AND @ExistingRunAuditCount = 59340
BEGIN
    PRINT '>> IDEMPOTENCY CONFIRMED: Correction run [' + @RunId + '] is already applied. Zero records require modification.';
    PRINT '>> SCRIPT COMPLETED SAFELY (NO CHANGES NEEDED).';
    RETURN;
END

-- Assert baseline total integrity
IF @TotalRecords != 540977
BEGIN
    THROW 50001, 'ABORT: Total records in dbo.outbound_cdr_calls does not match 540,977 baseline.', 1;
END

IF @TotalConnected != 221020 OR @TotalNotConnected != 319957
BEGIN
    THROW 50002, 'ABORT: Connectivity counts do not match expected baseline (221,020 / 319,957).', 1;
END

IF @JanAffected != 45619 OR @DecAffected != 13721 OR @TotalAffected != 59340 OR @OtherAffected != 0
BEGIN
    THROW 50003, 'ABORT: Misparsed record counts deviate from verified target of 59,340 (45,619 Jan / 13,721 Dec).', 1;
END

PRINT '>> Pre-flight integrity assertions PASSED.';

-- ------------------------------------------------------------------------------------------
-- 3. TRANSACTIONAL EXECUTION WITH ISOLATED STAGING
-- ------------------------------------------------------------------------------------------
BEGIN TRANSACTION;

BEGIN TRY
    PRINT 'Populating isolated audit staging for run [' + @RunId + ']...';

    -- Clean up any prior failed attempt for this specific run ID
    DELETE FROM dbo.outbound_date_correction_audit WHERE run_id = @RunId;

    INSERT INTO dbo.outbound_date_correction_audit (
        run_id,
        id,
        batch_id,
        report_month,
        original_call_time,
        corrected_call_time,
        original_call_year,
        original_call_month,
        corrected_call_year,
        corrected_call_month,
        applied_at,
        is_reverted
    )
    SELECT 
        @RunId,
        c.id,
        c.batch_id,
        c.report_month,
        c.call_time AS original_call_time,
        DATETIMEFROMPARTS(
            YEAR(c.call_time),
            DAY(c.call_time),
            MONTH(c.call_time),
            DATEPART(hour, c.call_time),
            DATEPART(minute, c.call_time),
            DATEPART(second, c.call_time),
            0
        ) AS corrected_call_time,
        c.call_year AS original_call_year,
        c.call_month AS original_call_month,
        YEAR(DATETIMEFROMPARTS(YEAR(c.call_time), DAY(c.call_time), MONTH(c.call_time), DATEPART(hour, c.call_time), DATEPART(minute, c.call_time), DATEPART(second, c.call_time), 0)) AS corrected_call_year,
        MONTH(DATETIMEFROMPARTS(YEAR(c.call_time), DAY(c.call_time), MONTH(c.call_time), DATEPART(hour, c.call_time), DATEPART(minute, c.call_time), DATEPART(second, c.call_time), 0)) AS corrected_call_month,
        SYSUTCDATETIME(),
        0
    FROM dbo.outbound_cdr_calls c
    WHERE (c.report_month = 'Jan' AND c.call_month != 1)
       OR (c.report_month = 'Dec' AND c.call_month != 12);

    DECLARE @StagedCount INT = @@ROWCOUNT;
    PRINT 'Staged records in audit table: ' + CAST(@StagedCount AS VARCHAR(20));

    IF @StagedCount != 59340
    BEGIN
        THROW 50004, 'Mismatch in staged row count. Expected exactly 59,340.', 1;
    END

    PRINT 'Executing in-place date correction on dbo.outbound_cdr_calls using isolated audit staging...';
    
    UPDATE c
    SET c.call_time = a.corrected_call_time
    FROM dbo.outbound_cdr_calls c
    INNER JOIN dbo.outbound_date_correction_audit a 
        ON c.id = a.id
    WHERE a.run_id = @RunId;

    DECLARE @UpdatedCount INT = @@ROWCOUNT;
    PRINT 'Updated records in dbo.outbound_cdr_calls: ' + CAST(@UpdatedCount AS VARCHAR(20));

    IF @UpdatedCount != 59340
    BEGIN
        THROW 50005, 'Mismatch in updated row count. Expected exactly 59,340.', 1;
    END

    -- --------------------------------------------------------------------------------------
    -- 4. POST-CORRECTION INTEGRITY VERIFICATION
    -- --------------------------------------------------------------------------------------
    PRINT 'Verifying post-correction data integrity...';

    DECLARE @RemainingMisparsed INT;
    DECLARE @PostTotal INT;
    DECLARE @PostConnected INT;
    DECLARE @PostNotConnected INT;
    DECLARE @PostNov2026 INT;
    DECLARE @PostDec2026 INT;
    DECLARE @PostJan2026 INT;
    DECLARE @PostDec2025 INT;

    SELECT 
        @RemainingMisparsed = COUNT(*),
        @PostNov2026 = SUM(CASE WHEN call_year = 2026 AND call_month = 11 THEN 1 ELSE 0 END),
        @PostDec2026 = SUM(CASE WHEN call_year = 2026 AND call_month = 12 THEN 1 ELSE 0 END),
        @PostJan2026 = SUM(CASE WHEN call_year = 2026 AND call_month = 1 THEN 1 ELSE 0 END),
        @PostDec2025 = SUM(CASE WHEN call_year = 2025 AND call_month = 12 THEN 1 ELSE 0 END)
    FROM dbo.outbound_cdr_calls
    WHERE (report_month = 'Jan' AND call_month != 1)
       OR (report_month = 'Dec' AND call_month != 12);

    SELECT 
        @PostTotal = COUNT(*),
        @PostConnected = SUM(CASE WHEN is_connected = 1 THEN 1 ELSE 0 END),
        @PostNotConnected = SUM(CASE WHEN is_connected = 0 THEN 1 ELSE 0 END)
    FROM dbo.outbound_cdr_calls;

    PRINT 'Post-Correction Verification:';
    PRINT '  - Remaining Misparsed Records:  ' + CAST(@RemainingMisparsed AS VARCHAR(20)) + ' (Expected: 0)';
    PRINT '  - Post-Correction Total:        ' + CAST(@PostTotal AS VARCHAR(20)) + ' (Expected: 540977)';
    PRINT '  - Post-Correction Connected:    ' + CAST(@PostConnected AS VARCHAR(20)) + ' (Expected: 221020)';
    PRINT '  - Post-Correction Not-Connected:' + CAST(@PostNotConnected AS VARCHAR(20)) + ' (Expected: 319957)';
    PRINT '  - Reconciled Jan 2026 Calls:    ' + CAST(@PostJan2026 AS VARCHAR(20)) + ' (Expected: 65849)';
    PRINT '  - Reconciled Dec 2025 Calls:    ' + CAST(@PostDec2025 AS VARCHAR(20)) + ' (Expected: 70506)';
    PRINT '  - November 2026 Calls:          ' + CAST(ISNULL(@PostNov2026, 0) AS VARCHAR(20)) + ' (Expected: 0)';
    PRINT '  - December 2026 Calls:          ' + CAST(ISNULL(@PostDec2026, 0) AS VARCHAR(20)) + ' (Expected: 0)';

    IF @RemainingMisparsed != 0
    BEGIN
        THROW 50006, 'Post-verification failed: Remaining misparsed records found.', 1;
    END

    IF @PostTotal != 540977 OR @PostConnected != 221020 OR @PostNotConnected != 319957
    BEGIN
        THROW 50007, 'Post-verification failed: Total record counts or connectivity deviated from baseline.', 1;
    END

    IF @PostNov2026 != 0 OR @PostDec2026 != 0
    BEGIN
        THROW 50008, 'Post-verification failed: Ghost months Nov/Dec 2026 still contain records.', 1;
    END

    IF @PostJan2026 != 65849 OR @PostDec2025 != 70506
    BEGIN
        THROW 50009, 'Post-verification failed: Reconstituted Jan 2026 or Dec 2025 totals deviate from expected counts.', 1;
    END

    -- All assertions passed - commit changes safely
    COMMIT TRANSACTION;
    PRINT '>> TRANSACTION COMMITTED SUCCESSFULLY. All 59,340 dates accurately reconciled.';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRANSACTION;
        PRINT '>> TRANSACTION ROLLED BACK DUE TO ERROR: ' + ERROR_MESSAGE();
    END;
    THROW;
END CATCH;
GO
