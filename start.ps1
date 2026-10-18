<#
DermaSoul AI - start the backend and the frontend in two new PowerShell windows.
Run setup.ps1 once before using this.

    powershell -ExecutionPolicy Bypass -File .\start.ps1
#>
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"

if (-not (Test-Path (Join-Path $Backend "venv\Scripts\python.exe"))) {
    Write-Host "Backend environment not found - run setup.ps1 first." -ForegroundColor Red
    exit 1
}
Start-Process powershell -WorkingDirectory $Backend -ArgumentList @(
    "-NoExit", "-Command",
    ".\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8010")
Start-Process powershell -WorkingDirectory $Frontend -ArgumentList @("-NoExit", "-Command", "npm run dev")
Write-Host "Backend : http://127.0.0.1:8010/health"
Write-Host "Frontend: http://localhost:5173  (opens once Vite has started)"
