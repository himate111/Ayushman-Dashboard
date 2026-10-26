-- =====================================================================================
-- Beneficiary Grievance Intelligence Dashboard - Seed Data
-- =====================================================================================

USE [BeneficiaryGrievanceDB];
GO

-- Seed Admin User (Password is 'Admin@123' hashed using SHA256)
-- Hash of 'Admin@123' in SHA256: 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
IF NOT EXISTS (SELECT 1 FROM [dbo].[Users] WHERE [Username] = 'admin')
BEGIN
    INSERT INTO [dbo].[Users] ([Username], [PasswordHash], [FullName], [Email], [Role], [IsActive])
    VALUES ('admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'National Grievance Administrator', 'admin@pmjay.gov.in', 'Admin', 1);
END
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[Users] WHERE [Username] = 'director')
BEGIN
    INSERT INTO [dbo].[Users] ([Username], [PasswordHash], [FullName], [Email], [Role], [IsActive])
    VALUES ('director', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'Executive Director (Grievance Cell)', 'director@pmjay.gov.in', 'Executive', 1);
END
GO

-- Seed Categories with Risk Rules
IF NOT EXISTS (SELECT 1 FROM [dbo].[GrievanceCategories] WHERE [CategoryName] = 'Monetary Issues')
BEGIN
    INSERT INTO [dbo].[GrievanceCategories] ([CategoryName], [Description], [DefaultPriority], [IsHighRisk], [RiskKeywordRule])
    VALUES ('Monetary Issues', 'Demands for cash, bribe, unauthorized charges for free treatments', 'High', 1, 'Money Demand / Extortion');
END
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[GrievanceCategories] WHERE [CategoryName] = 'Hospital Services Issues')
BEGIN
    INSERT INTO [dbo].[GrievanceCategories] ([CategoryName], [Description], [DefaultPriority], [IsHighRisk], [RiskKeywordRule])
    VALUES ('Hospital Services Issues', 'Treatment denial, bed refusal, delayed admissions, substandard care', 'High', 1, 'Treatment Denial');
END
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[GrievanceCategories] WHERE [CategoryName] = 'Ayushman Card Related Issues')
BEGIN
    INSERT INTO [dbo].[GrievanceCategories] ([CategoryName], [Description], [DefaultPriority], [IsHighRisk], [RiskKeywordRule])
    VALUES ('Ayushman Card Related Issues', 'Card approval delay, rejection, biometric / eKYC failure', 'Normal', 0, 'Card Refusal');
END
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[GrievanceCategories] WHERE [CategoryName] = 'PDDU Card Related Issues')
BEGIN
    INSERT INTO [dbo].[GrievanceCategories] ([CategoryName], [Description], [DefaultPriority], [IsHighRisk], [RiskKeywordRule])
    VALUES ('PDDU Card Related Issues', 'Pt Deendayal Upadhyay state card issues', 'Normal', 0, 'Approval Delay');
END
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[GrievanceCategories] WHERE [CategoryName] = 'Enrolment Related Issues')
BEGIN
    INSERT INTO [dbo].[GrievanceCategories] ([CategoryName], [Description], [DefaultPriority], [IsHighRisk], [RiskKeywordRule])
    VALUES ('Enrolment Related Issues', 'Beneficiary identification, name mismatch, ration card linking', 'Normal', 0, 'Approval Delay');
END
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[GrievanceCategories] WHERE [CategoryName] = 'Behavioural & Staff Conduct')
BEGIN
    INSERT INTO [dbo].[GrievanceCategories] ([CategoryName], [Description], [DefaultPriority], [IsHighRisk], [RiskKeywordRule])
    VALUES ('Behavioural & Staff Conduct', 'Misbehaviour by hospital staff or call center operator', 'Normal', 0, 'Other');
END
GO
