param (
    [string]$StudentId = ""
)

$ScriptDir = $PSScriptRoot
$MediaAiDir = Join-Path $ScriptDir "media\ai"
$EnrolledFacesDir = Join-Path $MediaAiDir "enrolled_faces"
$EmbeddingsFile = Join-Path $MediaAiDir "face_embeddings.json"

Write-Host "--- AIMS Biometric Cleanup Utility ---" -ForegroundColor Cyan

if ($StudentId -ne "") {
    Write-Host "Target: Student ID [$StudentId]" -ForegroundColor Magenta
    
    # Delete specific face images
    $TargetFiles = Get-ChildItem -Path $EnrolledFacesDir -Filter "$StudentId.*"
    foreach ($f in $TargetFiles) {
        Write-Host "Deleting image: $($f.Name)" -ForegroundColor Yellow
        Remove-Item $f.FullName -Force
    }

    # Remove from JSON
    if (Test-Path $EmbeddingsFile) {
        $Json = Get-Content $EmbeddingsFile | ConvertFrom-Json
        if ($Json.PSObject.Properties[$StudentId]) {
            Write-Host "Removing $StudentId from embeddings database..." -ForegroundColor Yellow
            $Json.PSObject.Properties.Remove($StudentId)
            $Json | ConvertTo-Json | Out-File $EmbeddingsFile -Encoding utf8
        }
    }
    Write-Host "Cleanup for $StudentId complete." -ForegroundColor Green
    exit
}

# 1. Clear Enrolled Face Images
if (Test-Path $EnrolledFacesDir) {
    $Files = Get-ChildItem -Path $EnrolledFacesDir -File
    if ($Files.Count -gt 0) {
        Write-Host "Deleting $($Files.Count) enrolled face images from $EnrolledFacesDir..." -ForegroundColor Yellow
        Remove-Item -Path (Join-Path $EnrolledFacesDir "*") -Force
        Write-Host "Done." -ForegroundColor Green
    } else {
        Write-Host "No enrolled face images found in $EnrolledFacesDir." -ForegroundColor Gray
    }
} else {
    Write-Host "Enrolled faces directory not found." -ForegroundColor Red
}

# 2. Clear Embeddings JSON
if (Test-Path $EmbeddingsFile) {
    Write-Host "Clearing embeddings database: $EmbeddingsFile..." -ForegroundColor Yellow
    # Reset to empty dictionary instead of deleting
    '{}' | Out-File -FilePath $EmbeddingsFile -Encoding utf8
    Write-Host "Embeddings database reset to {}." -ForegroundColor Green
} else {
    Write-Host "Embeddings file not found." -ForegroundColor Gray
}

# 3. Clear Temp Verification Photos
$TempDir = Join-Path $ScriptDir "media\temp_verification"
if (Test-Path $TempDir) {
    Write-Host "Clearing temporary verification photos..." -ForegroundColor Yellow
    Remove-Item -Path (Join-Path $TempDir "*") -Force
    Write-Host "Done." -ForegroundColor Green
}

Write-Host "Biometric cleanup complete." -ForegroundColor Cyan
