@echo off
setlocal EnableExtensions
title Indsil Damper Monitor - Setup
cd /d "%~dp0"

echo.
echo ================================================
echo   Indsil Damper Monitor - First-time setup
echo ================================================
echo.

where node >nul 2>nul
if not errorlevel 1 goto :node_ready

echo Node.js is not installed. Installing the current LTS version...
where winget >nul 2>nul
if errorlevel 1 goto :no_winget

winget install --id OpenJS.NodeJS.LTS --exact --accept-package-agreements --accept-source-agreements
if errorlevel 1 goto :node_install_failed

rem Make the standard Node.js install location available to this window now.
set "PATH=%ProgramFiles%\nodejs;%LocalAppData%\Programs\nodejs;%PATH%"
where node >nul 2>nul
if errorlevel 1 goto :restart_required

:node_ready
echo Node.js:
node --version
echo npm:
npm --version
echo.

if exist "node_modules" goto :start_dashboard

echo Installing dashboard packages. Internet access is required for this one-time step...
call npm install
if errorlevel 1 goto :packages_failed

:start_dashboard
echo.
echo Starting the dashboard at http://localhost:5173
echo Keep the dashboard window open while using the application.
start "Indsil Damper Monitor" cmd /k "cd /d ""%~dp0"" && npm run dev"
timeout /t 4 /nobreak >nul
start "" "http://localhost:5173"
exit /b 0

:no_winget
echo.
echo Windows Package Manager is unavailable on this PC.
echo Download and install the Node.js LTS version from https://nodejs.org/
echo Then run this file again.
start "" "https://nodejs.org/"
pause
exit /b 1

:node_install_failed
echo.
echo Node.js could not be installed automatically.
echo Install the Node.js LTS version from https://nodejs.org/ and run this file again.
pause
exit /b 1

:restart_required
echo.
echo Node.js was installed, but Windows needs a new command window to find it.
echo Close this window and run INSTALL-AND-START-DASHBOARD.bat again.
pause
exit /b 0

:packages_failed
echo.
echo Dashboard package installation failed. Check the internet connection and run this file again.
pause
exit /b 1
