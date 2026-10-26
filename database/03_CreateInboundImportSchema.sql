-- ===================================================================
-- Script: 03_CreateInboundImportSchema.sql
-- Description: DDL to create telephony import tracking and audit tables
-- Target Database: call_center (or isolated test copy call_center_test)
-- Note: Do NOT execute on main call_center without explicit approval
-- ===================================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'inbound_import_batches' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.inbound_import_batches (
        id INT IDENTITY(1,1) PRIMARY KEY,
        file_name VARCHAR(300) NOT NULL,
        file_size BIGINT NOT NULL,
        file_hash VARCHAR(64) NULL,
        total_records INT NOT NULL DEFAULT 0,
        new_records_count INT NOT NULL DEFAULT 0,
        duplicate_records_count INT NOT NULL DEFAULT 0,
        invalid_records_count INT NOT NULL DEFAULT 0,
        import_status VARCHAR(50) NOT NULL DEFAULT 'Processing', -- 'Processing', 'Completed', 'Failed'
        import_date DATETIME NOT NULL DEFAULT GETUTCDATE(),
        imported_by VARCHAR(100) NOT NULL DEFAULT 'System',
        execution_time_ms BIGINT NOT NULL DEFAULT 0,
        summary_notes NVARCHAR(MAX) NULL
    );

    CREATE INDEX idx_inbound_import_batches_date ON dbo.inbound_import_batches(import_date DESC);
    CREATE INDEX idx_inbound_import_batches_hash ON dbo.inbound_import_batches(file_hash);
    PRINT 'Created table dbo.inbound_import_batches and indexes.';
END
ELSE
BEGIN
    PRINT 'Table dbo.inbound_import_batches already exists.';
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'inbound_import_errors' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE dbo.inbound_import_errors (
        id INT IDENTITY(1,1) PRIMARY KEY,
        import_batch_id INT NOT NULL,
        row_number INT NOT NULL,
        call_identifier VARCHAR(100) NULL,
        error_message NVARCHAR(1000) NOT NULL,
        raw_data NVARCHAR(MAX) NULL,
        created_at DATETIME NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_inbound_import_errors_batch 
            FOREIGN KEY (import_batch_id) REFERENCES dbo.inbound_import_batches(id) 
            ON DELETE CASCADE
    );

    CREATE INDEX idx_inbound_import_errors_batch ON dbo.inbound_import_errors(import_batch_id);
    PRINT 'Created table dbo.inbound_import_errors and indexes.';
END
ELSE
BEGIN
    PRINT 'Table dbo.inbound_import_errors already exists.';
END
GO
