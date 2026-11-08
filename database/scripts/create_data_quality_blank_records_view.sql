USE call_center;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER VIEW dbo.vw_outbound_data_quality_blank_records AS
SELECT 
    id,
    batch_id,
    sr_no,
    did_no,
    group_name,
    called_no,
    call_time,
    call_year,
    call_month,
    call_date,
    call_hour,
    agent_seconds,
    total_seconds,
    disposition,
    agent_id,
    report_month,
    is_connected,
    'FLAGGED_BLANK_TRAILING_ROW' AS data_quality_flag,
    'Trailing empty CSV row from Batch #1 (Feb 2026 upload). Retained for 540,977 rowcount parity. Excluded from timeline charts.' AS review_note
FROM dbo.outbound_cdr_calls
WHERE call_time IS NULL;
GO
