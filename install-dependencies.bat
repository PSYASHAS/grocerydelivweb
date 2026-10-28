@echo off
title FreshCart - Install MongoDB & Express Dependencies
echo ========================================================
echo   FreshCart Full-Stack Grocery Delivery (MERN Stack)
echo   Installing Real MongoDB Driver (Mongoose) + Express
echo ========================================================
echo.

set NODE_PATH=C:\Users\psyas\.gemini\antigravity\scratch\node\node-v20.12.2-win-x64
if exist "%NODE_PATH%\npm.cmd" (
    set "PATH=%NODE_PATH%;%PATH%"
)

echo Installing mongoose, express, cors, dotenv...
npm install

echo.
echo ========================================================
echo  Dependencies installed successfully!
echo ========================================================
pause
