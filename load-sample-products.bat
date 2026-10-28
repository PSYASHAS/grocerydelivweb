@echo off
title FreshCart - Load Sample Products into MongoDB
cd /d "%~dp0"

echo ========================================================
echo   FreshCart Database Seeder
echo   Loading 24 Sample Grocery Items into MongoDB...
echo ========================================================
echo.

REM Set portable Node path
set NODE_PATH=C:\Users\psyas\.gemini\antigravity\scratch\node\node-v20.12.2-win-x64
if exist "%NODE_PATH%\node.exe" (
    set "PATH=%NODE_PATH%;%PATH%"
)

REM Check if MongoDB is running on port 27017
netstat -ano | findstr 127.0.0.1:27017 >nul
if errorlevel 1 (
    echo [INFO] MongoDB daemon is not running. Starting it now...
    set MONGO_BIN=C:\Users\psyas\.gemini\antigravity\scratch\mongodb\mongod.exe
    if exist "%MONGO_BIN%" (
        start "MongoDB Community Server" /min "%MONGO_BIN%" --dbpath "C:\Users\psyas\.gemini\antigravity\scratch\mongodb\data" --bind_ip 127.0.0.1 --port 27017
        timeout /t 2 /nobreak >nul
    )
)

echo Running seeder script: node backend/data/seed.js
echo.
node backend/data/seed.js

echo.
echo ========================================================
echo   Done! All 24 grocery items are now loaded in MongoDB.
echo ========================================================
echo.
pause
