# AIMS Attendance Reset Utility
# This script clears all attendance records from the database for testing purposes.

Write-Host "--- AIMS Attendance Reset Utility ---" -ForegroundColor Cyan

# Navigate to backend directory if needed
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
$backendPath = Join-Path $scriptPath "backend"

if (Test-Path $backendPath) {
    Set-Location $backendPath
} else {
    Write-Host "Error: Could not find 'backend' folder. Please run this script from the project root." -ForegroundColor Red
    exit
}

# Run the Django command
Write-Host "Executing database purge..." -ForegroundColor Yellow
.\venv\Scripts\python.exe manage.py shell -c "from attendance.models import Attendance; count = Attendance.objects.all().count(); Attendance.objects.all().delete(); print(f'>>> SUCCESS: {count} attendance records removed.')"

Write-Host "Done." -ForegroundColor Green
pause
