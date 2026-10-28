@echo off
title FreshCart Grocery Delivery Server
echo ========================================================
echo   FreshCart Full-Stack Grocery Delivery Platform
echo   Production-Ready MERN Architecture
echo ========================================================
echo.

REM Detect node in scratch folder or standard PATH
set NODE_PATH=C:\Users\psyas\.gemini\antigravity\scratch\node\node-v20.12.2-win-x64
if exist "%NODE_PATH%\node.exe" (
    set "PATH=%NODE_PATH%;%PATH%"
)

REM Check and launch MongoDB if not already running
set MONGO_BIN=C:\Users\psyas\.gemini\antigravity\scratch\mongodb\mongod.exe
if exist "%MONGO_BIN%" (
    netstat -ano | findstr 127.0.0.1:27017 >nul
    if errorlevel 1 (
        echo [INFO] Starting local MongoDB daemon on port 27017...
        start "MongoDB Community Server" /min "%MONGO_BIN%" --dbpath "C:\Users\psyas\.gemini\antigravity\scratch\mongodb\data" --bind_ip 127.0.0.1 --port 27017
        timeout /t 2 /nobreak >nul
    ) else (
        echo [INFO] MongoDB daemon is already running on port 27017.
    )
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
