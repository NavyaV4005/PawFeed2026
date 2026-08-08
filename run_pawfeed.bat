@echo off
title PawFeed Launcher
echo ==========================================
echo       Starting PawFeed Web Application
echo ==========================================
echo.

:: 1. Start the Frontend Web Server
echo [1/3] Starting web server for the frontend...
start "PawFeed Frontend Server" cmd /k "npx serve www"

:: 2. Start the Backend API (Optional but recommended for AI features)
echo [2/3] Starting backend API server...
start "PawFeed Backend Server" cmd /k "cd backend && npm run dev"

:: 3. Wait a moment for servers to spin up
echo [3/3] Launching web browser...
timeout /t 3 >nul

:: 4. Open the Web Application in the default browser
start http://localhost:3000

echo.
echo Application started! Keep the terminal windows open while using the app.
echo You can close this window now.
pause
