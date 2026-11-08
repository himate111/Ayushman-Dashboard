-- ==========================================================================================
-- SCRIPT: rollback_outbound_dates.sql
-- PURPOSE: Production-Grade, Transactional Rollback for Outbound CDR Date Correction
-- DATABASE: call_center
-- TARGET TABLE: dbo.outbound_cdr_calls
-- AUDIT TABLE: dbo.outbound_date_correction_audit
-- RUN IDENTIFIER: RUN_20261106_OUTBOUND_DATE_RECONCILIATION
-- ==========================================================================================

USE call_center;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT '====================================================================================';
PRINT '  OUTBOUND CDR HISTORICAL DATE CORRECTION — TRANSACTIONAL ROLLBACK EXECUTION          ';
PRINT '====================================================================================';
PRINT 'Execution Timestamp: ' + CONVERT(VARCHAR(30), SYSUTCDATETIME(), 120) + ' UTC';

DECLARE @RunId VARCHAR(50) = 'RUN_20261106_OUTBOUND_DATE_RECONCILIATION';

IF OBJECT_ID('dbo.outbound_date_correction_audit', 'U') IS NULL
BEGIN
    THROW 50010, 'ABORT: Audit table dbo.outbound_date_correction_audit does not exist. Cannot perform rollback.', 1;
END

DECLARE @AvailableRollbackCount INT;
SELECT @AvailableRollbackCount = COUNT(*) 
FROM dbo.outbound_date_correction_audit 
WHERE run_id = @RunId AND is_reverted = 0;

PRINT 'Audit records available for rollback for run [' + @RunId + ']: ' + CAST(@AvailableRollbackCount AS VARCHAR(20)) + ' (Expected: 59340)';

IF @AvailableRollbackCount = 0
BEGIN
    PRINT '>> NOTICE: No active un-reverted records found for run [' + @RunId + ']. Table may already be in rolled-back state.';
    RETURN;
END

IF @AvailableRollbackCount != 59340
BEGIN
    THROW 50011, 'ABORT: Audit table active record count does not match expected 59,340 records.', 1;
END

BEGIN TRANSACTION;

BEGIN TRY
    PRINT 'Restoring original call_time timestamps from audit table for run [' + @RunId + ']...';

    UPDATE c
    SET c.call_time = a.original_call_time
    FROM dbo.outbound_cdr_calls c
    INNER JOIN dbo.outbound_date_correction_audit a 
        ON c.id = a.id
    WHERE a.run_id = @RunId AND a.is_reverted = 0;

    DECLARE @RestoredCount INT = @@ROWCOUNT;
    PRINT 'Restored records in dbo.outbound_cdr_calls: ' + CAST(@RestoredCount AS VARCHAR(20));

    IF @RestoredCount != 59340
    BEGIN
        THROW 50012, 'Mismatch in restored row count. Expected exactly 59,340.', 1;
    END

    UPDATE dbo.outbound_date_correction_audit
    SET is_reverted = 1
    WHERE run_id = @RunId;

    -- Verify post-rollback state
    DECLARE @Nov2026Restored INT;
    DECLARE @Dec2026Restored INT;
    DECLARE @TotalRows INT;

    SELECT 
        @TotalRows = COUNT(*),
        @Nov2026Restored = SUM(CASE WHEN call_year = 2026 AND call_month = 11 THEN 1 ELSE 0 END),
        @Dec2026Restored = SUM(CASE WHEN call_year = 2026 AND call_month = 12 THEN 1 ELSE 0 END)
    FROM dbo.outbound_cdr_calls;

    PRINT 'Post-Rollback Verification:';
    PRINT '  - Total Records:       ' + CAST(@TotalRows AS VARCHAR(20)) + ' (Expected: 540977)';
    PRINT '  - Nov 2026 Records:    ' + CAST(ISNULL(@Nov2026Restored, 0) AS VARCHAR(20)) + ' (Expected: 4697)';
    PRINT '  - Dec 2026 Records:    ' + CAST(ISNULL(@Dec2026Restored, 0) AS VARCHAR(20)) + ' (Expected: 4763)';

    IF @TotalRows != 540977 OR @Nov2026Restored != 4697 OR @Dec2026Restored != 4763
    BEGIN
        THROW 50013, 'Post-rollback verification failed: Record distributions did not return to initial baseline.', 1;
    END

    COMMIT TRANSACTION;
    PRINT '>> ROLLBACK TRANSACTION COMMITTED SUCCESSFULLY. Table restored to original state.';

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRANSACTION;
        PRINT '>> ROLLBACK SCRIPT ENCOUNTERED ERROR: ' + ERROR_MESSAGE();
    END;
    THROW;
END CATCH;
GO
