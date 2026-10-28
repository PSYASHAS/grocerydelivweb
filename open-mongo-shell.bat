@echo off
title MongoDB Interactive Shell - FreshCart Database
echo ========================================================
echo   FreshCart - Live MongoDB Shell Client (mongo.exe)
echo   Connecting to: mongodb://127.0.0.1:27017/freshcart_db
echo ========================================================
echo.

set MONGO_SHELL=C:\Users\psyas\.gemini\antigravity\scratch\mongodb\mongo.exe
if not exist "%MONGO_SHELL%" (
    echo [ERROR] mongo.exe was not found at %MONGO_SHELL%
    pause
    exit /b 1
)

echo Switched to database: freshcart_db
echo Type 'show collections' or 'db.products.find().pretty()' to view data.
echo Type 'exit' to quit.
echo.
"%MONGO_SHELL%" "127.0.0.1:27017/freshcart_db"
