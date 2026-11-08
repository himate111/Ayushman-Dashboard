USE master;
GO

PRINT 'Starting full backup of database call_center...';
BACKUP DATABASE call_center
TO DISK = 'D:\Grevience\database\backup\call_center_pre_date_fix.bak'
WITH FORMAT, INIT, COMPRESSION, STATS = 10;
GO
