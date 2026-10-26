-- =====================================================================================
-- Beneficiary Grievance Intelligence Dashboard - Database Schema
-- Database: BeneficiaryGrievanceDB
-- Target: Microsoft SQL Server 2019 / 2022 / 2025
-- =====================================================================================

USE [BeneficiaryGrievanceDB];
GO

-- 1. Users Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE [dbo].[Users] (
        [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [Username] NVARCHAR(100) NOT NULL UNIQUE,
        [PasswordHash] NVARCHAR(256) NOT NULL,
        [FullName] NVARCHAR(150) NOT NULL,
        [Email] NVARCHAR(150) NULL,
        [Role] NVARCHAR(50) NOT NULL DEFAULT 'Executive', -- 'Admin', 'Executive', 'Analyst', 'Officer'
        [IsActive] BIT NOT NULL DEFAULT 1,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [LastLoginAt] DATETIME2 NULL
    );
END
GO

-- 2. ImportBatches Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ImportBatches')
BEGIN
    CREATE TABLE [dbo].[ImportBatches] (
        [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [FileName] NVARCHAR(300) NOT NULL,
        [FileSize] BIGINT NOT NULL,
        [FileHash] VARCHAR(64) NULL, -- SHA256
        [TotalRecords] INT NOT NULL DEFAULT 0,
        [NewRecordsCount] INT NOT NULL DEFAULT 0,
        [UpdatedRecordsCount] INT NOT NULL DEFAULT 0,
        [UnchangedRecordsCount] INT NOT NULL DEFAULT 0,
        [ErrorRecordsCount] INT NOT NULL DEFAULT 0,
        [ImportStatus] NVARCHAR(50) NOT NULL DEFAULT 'Processing', -- 'Completed', 'Partial', 'Failed'
        [ImportDate] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [ImportedBy] NVARCHAR(100) NOT NULL DEFAULT 'System',
        [ExecutionTimeMs] BIGINT NOT NULL DEFAULT 0,
        [SummaryNotes] NVARCHAR(MAX) NULL
    );
END
GO

-- 3. ImportErrors Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ImportErrors')
BEGIN
    CREATE TABLE [dbo].[ImportErrors] (
        [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [ImportBatchId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[ImportBatches]([Id]) ON DELETE CASCADE,
        [RowNumber] INT NOT NULL,
        [CompId] NVARCHAR(50) NULL,
        [ErrorMessage] NVARCHAR(MAX) NOT NULL,
        [RawData] NVARCHAR(MAX) NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_ImportErrors_BatchId ON [dbo].[ImportErrors]([ImportBatchId]);
END
GO

-- 4. GrievanceCategories Table (Reference and Risk Rules)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'GrievanceCategories')
BEGIN
    CREATE TABLE [dbo].[GrievanceCategories] (
        [Id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [CategoryName] NVARCHAR(200) NOT NULL UNIQUE,
        [Description] NVARCHAR(500) NULL,
        [DefaultPriority] NVARCHAR(50) NOT NULL DEFAULT 'Normal',
        [IsHighRisk] BIT NOT NULL DEFAULT 0,
        [RiskKeywordRule] NVARCHAR(500) NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );
END
GO

-- 5. Grievances Main Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Grievances')
BEGIN
    CREATE TABLE [dbo].[Grievances] (
        [Id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [CompId] BIGINT NOT NULL UNIQUE, -- Primary Business Key from source (e.g. 115696)
        [CompType] NVARCHAR(100) NULL DEFAULT 'Beneficiary',
        [CompDate] DATETIME2 NOT NULL, -- Registration Date
        [CompTime] NVARCHAR(50) NULL,
        [Status] NVARCHAR(50) NOT NULL, -- 'Closed', 'WIP', 'Open'
        [Priority] NVARCHAR(50) NOT NULL DEFAULT 'Normal',
        [DateOfIncident] DATETIME2 NULL,
        
        -- Citizen Information (Masked/Secured in APIs)
        [CitizenName] NVARCHAR(200) NULL,
        [CitizenMobileNo] NVARCHAR(50) NULL,
        [CitizenAadharNo] NVARCHAR(50) NULL,
        [CitizenEmailId] NVARCHAR(200) NULL,
        [CitizenDOB] NVARCHAR(50) NULL,
        [CitizenGender] NVARCHAR(20) NULL,
        
        -- Scheme & Identification
        [CaseNo] NVARCHAR(100) NULL,
        [PMJAYId] NVARCHAR(100) NULL,
        [ComplaintFor] NVARCHAR(100) NULL DEFAULT 'PMJAY',
        [Department] NVARCHAR(150) NULL,
        
        -- Geographic Information
        [BeneficiaryState] NVARCHAR(100) NULL,
        [BeneficiaryDistrict] NVARCHAR(100) NULL,
        [HospitalName] NVARCHAR(300) NULL,
        [HospitalState] NVARCHAR(100) NULL,
        [HospitalDistrict] NVARCHAR(100) NULL,
        [Address] NVARCHAR(MAX) NULL,
        
        -- Classification & Root Cause
        [GrievanceCategory] NVARCHAR(200) NULL,
        [GrievanceType] NVARCHAR(300) NULL,
        [CompRemarks] NVARCHAR(MAX) NULL,
        [CSolution] NVARCHAR(MAX) NULL,
        
        -- Resolution Information
        [ResolutionDate] DATETIME2 NULL,
        [ResolutionTime] NVARCHAR(50) NULL,
        [OfficerName] NVARCHAR(200) NULL,
        [OfficerLevel] NVARCHAR(50) NULL,
        [OfficerRemarks] NVARCHAR(MAX) NULL,
        
        -- Intelligence & Analytics Computed Fields
        [AgeInDays] INT NOT NULL DEFAULT 0,
        [AgeBucket] NVARCHAR(50) NOT NULL DEFAULT '0-7 days', -- '0-7 days', '8-15 days', '16-30 days', '31-60 days', '> 60 days'
        [IsRiskFlagged] BIT NOT NULL DEFAULT 0,
        [RiskCategory] NVARCHAR(100) NULL, -- 'Treatment Denial', 'Money Demand / Extortion', 'Card Refusal', 'Approval Delay', 'Admission Refusal', 'Other'
        [RiskReason] NVARCHAR(500) NULL,
        
        -- Audit & Batch Tracking
        [FirstImportBatchId] INT NULL FOREIGN KEY REFERENCES [dbo].[ImportBatches]([Id]),
        [LastImportBatchId] INT NULL FOREIGN KEY REFERENCES [dbo].[ImportBatches]([Id]),
        [CreatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        [UpdatedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    -- Analytics Indexes for fast aggregation across 8 Charts and Global Filters
    CREATE NONCLUSTERED INDEX IX_Grievances_CompDate ON [dbo].[Grievances]([CompDate]);
    CREATE NONCLUSTERED INDEX IX_Grievances_Status ON [dbo].[Grievances]([Status]) INCLUDE ([CompId], [CompDate], [BeneficiaryDistrict], [GrievanceCategory]);
    CREATE NONCLUSTERED INDEX IX_Grievances_District ON [dbo].[Grievances]([BeneficiaryDistrict]) INCLUDE ([Status], [GrievanceCategory]);
    CREATE NONCLUSTERED INDEX IX_Grievances_Category ON [dbo].[Grievances]([GrievanceCategory], [GrievanceType]);
    CREATE NONCLUSTERED INDEX IX_Grievances_Officer ON [dbo].[Grievances]([OfficerName], [OfficerLevel]) INCLUDE ([Status]);
    CREATE NONCLUSTERED INDEX IX_Grievances_AgeBucket ON [dbo].[Grievances]([AgeBucket], [Status]);
    CREATE NONCLUSTERED INDEX IX_Grievances_Risk ON [dbo].[Grievances]([IsRiskFlagged], [RiskCategory]) INCLUDE ([Status]);
END
GO

-- 6. GrievanceStatusHistory Table (Status and assignment change tracking)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'GrievanceStatusHistory')
BEGIN
    CREATE TABLE [dbo].[GrievanceStatusHistory] (
        [Id] BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [GrievanceId] BIGINT NOT NULL FOREIGN KEY REFERENCES [dbo].[Grievances]([Id]) ON DELETE CASCADE,
        [CompId] BIGINT NOT NULL,
        [PreviousStatus] NVARCHAR(50) NULL,
        [NewStatus] NVARCHAR(50) NOT NULL,
        [PreviousOfficer] NVARCHAR(200) NULL,
        [NewOfficer] NVARCHAR(200) NULL,
        [Remarks] NVARCHAR(MAX) NULL,
        [ImportBatchId] INT NULL FOREIGN KEY REFERENCES [dbo].[ImportBatches]([Id]),
        [ChangedAt] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    CREATE NONCLUSTERED INDEX IX_GrievanceStatusHistory_CompId ON [dbo].[GrievanceStatusHistory]([CompId], [ChangedAt]);
    CREATE NONCLUSTERED INDEX IX_GrievanceStatusHistory_GrievanceId ON [dbo].[GrievanceStatusHistory]([GrievanceId]);
END
GO
