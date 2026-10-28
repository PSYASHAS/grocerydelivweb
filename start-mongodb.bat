@echo off
title MongoDB Community Server (Local Port 27017)
echo ========================================================
echo   FreshCart - Real Local MongoDB Community Database
echo   Port: 27017  ^|  Data: C:\Users\psyas\.gemini\antigravity\scratch\mongodb\data
echo ========================================================
echo.

set MONGO_BIN=C:\Users\psyas\.gemini\antigravity\scratch\mongodb\bin\mongod.exe
if not exist "%MONGO_BIN%" (
    set MONGO_BIN=C:\Users\psyas\.gemini\antigravity\scratch\mongodb\mongod.exe
)

if not exist "%MONGO_BIN%" (
    echo [ERROR] mongod.exe was not found in scratch\mongodb.
    pause
    exit /b 1
)

echo Starting MongoDB daemon on 127.0.0.1:27017...
"%MONGO_BIN%" --dbpath "C:\Users\psyas\.gemini\antigravity\scratch\mongodb\data" --bind_ip 127.0.0.1 --port 27017
pause
