param(
  [Parameter(Mandatory = $true)]
  [string]$VideoPath,

  [Parameter(Mandatory = $false)]
  [string]$OutDir = "..\server\controllers\shared\output\local_test"
)

Write-Host "Running local OCR pipeline test"
Write-Host "Video: $VideoPath"
Write-Host "OutDir: $OutDir"

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
Push-Location $scriptRoot

if (-Not (Test-Path ".venv")) {
  Write-Host "Creating virtual environment .venv..."
  python -m venv .venv
}

$venvPython = Join-Path $scriptRoot ".venv\Scripts\python.exe"
if (-Not (Test-Path $venvPython)) {
  Write-Error "Python executable not found in venv: $venvPython"
  Pop-Location
  exit 1
}

Write-Host "Installing Python requirements (this may take a while)..."
& $venvPython -m pip install --upgrade pip
& $venvPython -m pip install -r .\requirements.txt

# Ensure output dir exists
$fullOut = Resolve-Path -Path $OutDir -ErrorAction SilentlyContinue
if (-Not $fullOut) { New-Item -ItemType Directory -Path $OutDir -Force | Out-Null }

Write-Host "Running process_video.py..."
& $venvPython .\process_video.py $VideoPath $OutDir

Write-Host "Done. Check the output folder: $OutDir"

Pop-Location
