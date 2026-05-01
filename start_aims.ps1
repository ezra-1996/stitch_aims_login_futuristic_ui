$ErrorActionPreference = "Stop"

# Clear console for a clean start
Clear-Host

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   AIMS - Automated Internship Management System" -ForegroundColor Cyan
Write-Host "             System Startup Utility" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

$baseDir = $PSScriptRoot
$backendDir = Join-Path $baseDir "backend"
$frontendDir = Join-Path $baseDir "aims-app"

# 1. Environment Verification
Write-Host "[1/4] Verifying environment..." -ForegroundColor Yellow

# Check Python Venv
$pythonExe = Join-Path $backendDir "venv\Scripts\python.exe"
if (!(Test-Path $pythonExe)) {
    Write-Host "Error: Python virtual environment not found at '$pythonExe'." -ForegroundColor Red
    Write-Host "Please ensure you have created the venv in the backend folder." -ForegroundColor Gray
    exit 1
}

# Check Node/NPM
if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "Error: 'npm' command not found. Please install Node.js and ensure it's in your PATH." -ForegroundColor Red
    exit 1
}

# Check node_modules
if (!(Test-Path (Join-Path $frontendDir "node_modules"))) {
    Write-Host "Warning: 'node_modules' not found in frontend. You might need to run 'npm install' first." -ForegroundColor Yellow
}

# 2. Start Backend
Write-Host "[2/4] Starting Django Backend (Port 8000)..." -ForegroundColor Green
$backendCommand = "Set-Location '$backendDir'; & '.\venv\Scripts\python.exe' manage.py runserver 8000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCommand -WindowStyle Normal

# 3. Start Frontend
Write-Host "[3/4] Starting React Frontend (Port 5173)..." -ForegroundColor Green
# Using --port 5173 --strictPort to ensure it runs where we expect or fails clearly
$frontendCommand = "Set-Location '$frontendDir'; npm run dev -- --port 5173 --strictPort"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCommand -WindowStyle Normal

# 4. Launch Browser
Write-Host "[4/4] Waiting for servers to initialize..." -ForegroundColor Yellow

# Function to check if a port is listening
function Wait-ForPort {
    param([int]$Port, [int]$TimeoutSeconds = 30)
    $startTime = Get-Date
    while (((Get-Date) - $startTime).TotalSeconds -lt $TimeoutSeconds) {
        $connection = Test-NetConnection -ComputerName "localhost" -Port $Port -InformationLevel Quiet
        if ($connection) { return $true }
        Start-Sleep -Seconds 1
    }
    return $false
}

# Wait for Vite (Port 5173)
if (Wait-ForPort -Port 5173) {
    Write-Host "Frontend is ready! Opening browser..." -ForegroundColor Cyan
    Start-Process "http://localhost:5173"
} else {
    Write-Host "Warning: Frontend server took too long to start. Please check the terminal for errors." -ForegroundColor Red
    Write-Host "You can manually open http://localhost:5173 once it's ready." -ForegroundColor Gray
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "   Startup Sequence Complete!" -ForegroundColor Green
Write-Host "   Backend: http://localhost:8000" -ForegroundColor Gray
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Keep the opened terminal windows running to maintain the system." -ForegroundColor Cyan
