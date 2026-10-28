# FreshCart Grocery Delivery - PowerShell Startup Script
$nodeDir = "C:\Users\psyas\.gemini\antigravity\scratch\node\node-v20.12.2-win-x64"
if (Test-Path "$nodeDir\node.exe") {
    $env:PATH = "$nodeDir;$env:PATH"
}

Write-Host "========================================================" -ForegroundColor Green
Write-Host "  FreshCart Full-Stack Grocery Delivery (MERN Capstone)" -ForegroundColor Cyan
Write-Host "  RVCE CSE Department - Second Year Skill Lab" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Node Version: $(node -v)" -ForegroundColor Gray
Write-Host "Starting FreshCart Full-Stack Server on http://localhost:5000..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to terminate the server anytime.`n" -ForegroundColor Gray

Set-Location $PSScriptRoot
node backend/server.js
