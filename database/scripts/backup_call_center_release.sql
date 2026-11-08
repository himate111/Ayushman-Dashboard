USE master;
GO

PRINT 'Starting full backup of production database call_center for release deployment...';
BACKUP DATABASE call_center
TO DISK = 'D:\Grevience\database\backup\call_center_production_release_20261108.bak'
WITH FORMAT, INIT, COMPRESSION, STATS = 10, NAME = 'call_center-Full Release Backup 2026-11-08';
GO
