@echo off
title FreshCart Grocery Delivery Server
echo ========================================================
echo   FreshCart Full-Stack Grocery Delivery (MERN Capstone)
echo   RVCE CSE Department - Second Year Skill Lab
echo ========================================================
echo.

REM Detect node in scratch folder or standard PATH
set NODE_PATH=C:\Users\psyas\.gemini\antigravity\scratch\node\node-v20.12.2-win-x64
if exist "%NODE_PATH%\node.exe" (
    set "PATH=%NODE_PATH%;%PATH%"
)

echo Checking Node version...
node -v
if %errorlevel% neq 0 (
    echo [ERROR] Node.js executable was not found. Please ensure Node is installed.
    pause
    exit /b %errorlevel%
)

echo Starting FreshCart Full-Stack Server on port 5000...
echo Access in your browser: http://localhost:5000
echo.
node backend/server.js
pause
