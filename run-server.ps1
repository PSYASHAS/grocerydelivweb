# FreshCart Grocery Delivery - PowerShell Startup Script
$nodeDir = "C:\Users\psyas\.gemini\antigravity\scratch\node\node-v20.12.2-win-x64"
if (Test-Path "$nodeDir\node.exe") {
    $env:PATH = "$nodeDir;$env:PATH"
}

# Auto-start MongoDB if not running
$mongoExe = "C:\Users\psyas\.gemini\antigravity\scratch\mongodb\mongod.exe"
if (Test-Path $mongoExe) {
    $conn = Get-NetTCPConnection -LocalPort 27017 -ErrorAction SilentlyContinue
    if (-not $conn) {
        Write-Host "Starting local MongoDB Community daemon on port 27017..." -ForegroundColor Cyan
        Start-Process -FilePath $mongoExe -ArgumentList "--dbpath `"C:\Users\psyas\.gemini\antigravity\scratch\mongodb\data`" --bind_ip 127.0.0.1 --port 27017" -WindowStyle Minimized
        Start-Sleep -Seconds 2
    } else {
        Write-Host "MongoDB daemon is active on port 27017." -ForegroundColor Green
    }
}

Write-Host "========================================================" -ForegroundColor Green
Write-Host "  FreshCart Full-Stack Grocery Delivery Platform" -ForegroundColor Cyan
Write-Host "  Production-Ready MERN Architecture" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Node Version: $(node -v)" -ForegroundColor Gray
Write-Host "Starting FreshCart Full-Stack Server on http://localhost:5000..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to terminate the server anytime.`n" -ForegroundColor Gray

Set-Location $PSScriptRoot
node backend/server.js
