<#
setup_env.ps1

Creates a clean Python virtual environment at `./ocrenv`, installs pinned
`numpy` and `opencv-python` first to avoid ABI mismatches, then installs
the rest of packages listed in `script/requirements.txt`.

Usage:
  # recreate venv and install everything (may take time)
  .\setup_env.ps1

  # skip installing heavy paddle packages (paddlepaddle/paddleocr)
  .\setup_env.ps1 -SkipPaddle

#>

param(
  [switch]$SkipPaddle
)

Set-StrictMode -Version Latest

$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
Push-Location $root

Write-Host "Setting up Python virtual environment in: $root\..\ocrenv"

# Path to venv dir
$venvPath = Join-Path $root "..\ocrenv"

if (Test-Path $venvPath) {
  Write-Host "Removing existing venv at $venvPath"
  Remove-Item -Recurse -Force $venvPath
}

Write-Host "Creating venv..."
python -m venv $venvPath

$pythonExe = Join-Path $venvPath "Scripts\python.exe"
if (-Not (Test-Path $pythonExe)) {
  Write-Error "Python executable not found in venv: $pythonExe"
  Pop-Location
  exit 1
}

Write-Host "Upgrading pip, setuptools, wheel..."
& $pythonExe -m pip install --upgrade pip setuptools wheel

Write-Host "Installing numpy and opencv (pinned versions)..."
& $pythonExe -m pip install --upgrade --force-reinstall numpy==1.24.4
& $pythonExe -m pip install --upgrade --force-reinstall opencv-python==4.7.0.72

# Read requirements and install remaining packages, optionally skipping paddle
$reqFile = Join-Path $root "requirements.txt"
if (-Not (Test-Path $reqFile)) {
  Write-Error "requirements.txt not found at $reqFile"
  Pop-Location
  exit 1
}

$lines = Get-Content $reqFile | ForEach-Object { $_.Trim() } | Where-Object { $_ -and -not $_.StartsWith('#') }

foreach ($pkg in $lines) {
  # skip pinned numpy/opencv (we already installed them)
  if ($pkg -match '^numpy' -or $pkg -match '^opencv-python') { continue }

  if ($SkipPaddle -and ($pkg -match 'paddlepaddle' -or $pkg -match 'paddleocr')) {
    Write-Host "Skipping heavy package: $pkg"
    continue
  }

  try {
    Write-Host "Installing: $pkg"
    & $pythonExe -m pip install --upgrade --force-reinstall $pkg
  } catch {
    Write-Warning "Failed to install $pkg - continuing. Error: $_"
  }
}

Write-Host "Verifying imports..."
try {
  & $pythonExe -c "import numpy, cv2; print('numpy', numpy.__version__, 'cv2', cv2.__version__)"
} catch {
  Write-Error "Import test failed. See error above. You may need to adjust package versions or install platform-specific wheels."
  Pop-Location
  exit 1
}

Write-Host "Environment setup complete. Activate with:`n& $venvPath\Scripts\Activate.ps1`
Pop-Location
