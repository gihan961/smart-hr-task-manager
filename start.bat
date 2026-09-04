@echo off
title Smart HR Task Manager - Startup
color 0A

echo.
echo  ============================================
echo   Smart HR Task Manager - Starting Up...
echo  ============================================
echo.

echo [1/2] Starting Backend (Port 5000)...
start "Backend - Smart HR" cmd /k "cd /d "%~dp0backend" && npm run dev"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend (Port 3000)...
start "Frontend - Smart HR" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 5 /nobreak >nul

echo.
echo  ============================================
echo   All services started!
echo.
echo   Frontend  --^>  http://localhost:3000
echo   Backend   --^>  http://localhost:5000/api/health
echo   Database  --^>  MongoDB Atlas (Cloud)
echo  ============================================
echo.

start http://localhost:3000

pause