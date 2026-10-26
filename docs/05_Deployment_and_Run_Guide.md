# Local Run and Deployment Guide

## Prerequisites

1. **Operating System**: Windows 10/11 (or Windows Server)
2. **Microsoft SQL Server**: 2019, 2022, or 2025 instance running locally on `localhost` (default instance `MSSQLSERVER`)
3. **.NET SDK**: .NET 8.0 SDK (installed at `%LOCALAPPDATA%\Microsoft\dotnet`)
4. **Node.js**: Node.js 18+ and npm

---

## 1. Starting the ASP.NET Core Backend

Open a terminal in `D:\Grievience\backend`:

```powershell
# Set DOTNET_ROOT if using user-level SDK install
$env:DOTNET_ROOT = "$env:LOCALAPPDATA\Microsoft\dotnet"
$env:Path = "$env:LOCALAPPDATA\Microsoft\dotnet;" + $env:Path

cd D:\Grievience\backend
dotnet run --launch-profile http
```

- API Base URL: `http://localhost:5285`
- Swagger UI Documentation: `http://localhost:5285/swagger`

---

## 2. Starting the React Frontend

Open another terminal in `D:\Grievience\frontend`:

```powershell
cd D:\Grievience\frontend
npm run dev -- --port 5173
```

- Dashboard UI: `http://localhost:5173`

---

## 3. Database Initialisation & Reset (Optional)

If resetting or deploying on a new machine:

```powershell
# Run Schema
sqlcmd -S localhost -d master -i D:\Grievience\database\01_CreateSchema.sql

# Run Seed Data
sqlcmd -S localhost -d BeneficiaryGrievanceDB -i D:\Grievience\database\02_SeedData.sql
```

---

## 4. Default Operator Credentials

- **Username**: `admin`
- **Password**: `Admin@123`
- **Role**: `National Administrator`
