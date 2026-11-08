-- ============================================================================
-- Outbound Call Analytics Schema for Ayushman Dashboard
-- Database: call_center
-- Module: Outbound Call Center Analytics
-- ============================================================================

USE call_center;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- 1. Main Outbound CDR Table
IF OBJECT_ID('dbo.outbound_cdr_calls', 'U') IS NOT NULL
BEGIN
    PRINT 'Table dbo.outbound_cdr_calls already exists.';
END
ELSE
BEGIN
    CREATE TABLE dbo.outbound_cdr_calls (
        id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY CLUSTERED,
        batch_id BIGINT NULL,
        sr_no BIGINT NULL,
        did_no NVARCHAR(50) NULL,
        group_name NVARCHAR(255) NULL,
        called_no NVARCHAR(50) NULL,
        call_time DATETIME2(0) NULL,
        ring_durn NVARCHAR(20) NULL,
        ring_seconds INT NULL,
        ivr_dur NVARCHAR(20) NULL,
        ivr_seconds INT NULL,
        queue_durn NVARCHAR(20) NULL,
        queue_seconds INT NULL,
        agent_durn NVARCHAR(20) NULL,
        agent_seconds INT NULL,
        hold_durn NVARCHAR(20) NULL,
        hold_seconds INT NULL,
        total_durn NVARCHAR(20) NULL,
        total_seconds INT NULL,
        call_mode NVARCHAR(20) NULL,
        agent_id NVARCHAR(50) NULL,
        call_type NVARCHAR(50) NULL,
        acd NVARCHAR(50) NULL,
        disposition NVARCHAR(100) NULL,
        sub_disposition NVARCHAR(255) NULL,
        report_month NVARCHAR(20) NULL,
        
        -- SARGable Persisted Computed Columns for Sub-Second Indexing & Analytics
        call_year AS (CASE WHEN call_time IS NOT NULL THEN DATEPART(year, call_time) END) PERSISTED,
        call_month AS (CASE WHEN call_time IS NOT NULL THEN DATEPART(month, call_time) END) PERSISTED,
        call_date AS (CASE WHEN call_time IS NOT NULL THEN CAST(call_time AS DATE) END) PERSISTED,
        call_hour AS (CASE WHEN call_time IS NOT NULL THEN DATEPART(hour, call_time) END) PERSISTED,
        is_connected AS (CASE WHEN ISNULL(agent_seconds, 0) >= 3 THEN 1 ELSE 0 END) PERSISTED,
        created_at DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME()
    );

    PRINT 'Created table dbo.outbound_cdr_calls successfully.';
END
GO

-- 2. Indexes for High-Performance Analytics & Filters
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_outbound_filter_year_month' AND object_id = OBJECT_ID('dbo.outbound_cdr_calls'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_outbound_filter_year_month 
    ON dbo.outbound_cdr_calls (call_year, call_month, is_connected)
    INCLUDE (group_name, disposition, sub_disposition, agent_id, agent_seconds, total_seconds, call_hour);
    PRINT 'Created index IX_outbound_filter_year_month.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_outbound_agent' AND object_id = OBJECT_ID('dbo.outbound_cdr_calls'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_outbound_agent 
    ON dbo.outbound_cdr_calls (agent_id, call_year, call_month)
    INCLUDE (is_connected, agent_seconds, total_seconds);
    PRINT 'Created index IX_outbound_agent.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_outbound_group' AND object_id = OBJECT_ID('dbo.outbound_cdr_calls'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_outbound_group 
    ON dbo.outbound_cdr_calls (group_name, call_year, call_month);
    PRINT 'Created index IX_outbound_group.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_outbound_call_date' AND object_id = OBJECT_ID('dbo.outbound_cdr_calls'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_outbound_call_date 
    ON dbo.outbound_cdr_calls (call_date)
    INCLUDE (is_connected, agent_seconds, total_seconds);
    PRINT 'Created index IX_outbound_call_date.';
END
GO

-- 3. Batch Tracking Table for Uploads
IF OBJECT_ID('dbo.outbound_import_batches', 'U') IS NOT NULL
BEGIN
    PRINT 'Table dbo.outbound_import_batches already exists.';
END
ELSE
BEGIN
    CREATE TABLE dbo.outbound_import_batches (
        id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY CLUSTERED,
        file_name NVARCHAR(255) NOT NULL,
        file_size BIGINT NOT NULL,
        file_hash NVARCHAR(64) NOT NULL,
        total_rows INT NOT NULL,
        inserted_rows INT NOT NULL,
        duplicate_rows INT NOT NULL,
        error_rows INT NOT NULL,
        duration_seconds DECIMAL(10,2) NOT NULL,
        status NVARCHAR(50) NOT NULL,
        imported_by NVARCHAR(100) NOT NULL,
        imported_at DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME()
    );

    CREATE NONCLUSTERED INDEX IX_outbound_batches_hash 
    ON dbo.outbound_import_batches (file_hash);

    PRINT 'Created table dbo.outbound_import_batches successfully.';
END
GO

-- 4. Import Error Log Table
IF OBJECT_ID('dbo.outbound_import_errors', 'U') IS NOT NULL
BEGIN
    PRINT 'Table dbo.outbound_import_errors already exists.';
END
ELSE
BEGIN
    CREATE TABLE dbo.outbound_import_errors (
        id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY CLUSTERED,
        batch_id BIGINT NOT NULL,
        row_number INT NOT NULL,
        raw_data NVARCHAR(MAX) NULL,
        error_message NVARCHAR(500) NOT NULL,
        created_at DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_outbound_errors_batch FOREIGN KEY (batch_id) REFERENCES dbo.outbound_import_batches(id) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_outbound_errors_batch_id 
    ON dbo.outbound_import_errors (batch_id);

    PRINT 'Created table dbo.outbound_import_errors successfully.';
END
GO
