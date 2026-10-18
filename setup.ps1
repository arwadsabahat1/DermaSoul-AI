<#
DermaSoul AI - one-time setup for a new Windows machine.

Run from the repository folder in PowerShell:
    powershell -ExecutionPolicy Bypass -File .\setup.ps1

Prerequisites (see SETUP.md): Python 3.12, Node.js 22 LTS or newer, PostgreSQL 16+ (running), Git.
The script is safe to run again: finished steps are skipped or refreshed.
#>
param(
    [switch]$SkipFrontend,
    [switch]$SkipAdmin,
    # Optional: give the database settings here instead of being asked (only used when backend\.env is missing).
    [string]$DbUser,
    [string]$DbPassword,
    [string]$DbHost,
    [string]$DbPort,
    [string]$DbName
)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"
$VenvPython = Join-Path $Backend "venv\Scripts\python.exe"

function Step($text) { Write-Host "`n=== $text" -ForegroundColor Cyan }
function Fail($text) { Write-Host "ERROR: $text" -ForegroundColor Red; exit 1 }
function Run($exe, [string[]]$argList, $workDir) {
    Push-Location $workDir
    try {
        & $exe @argList
        if ($LASTEXITCODE -ne 0) { Fail "'$exe $($argList -join ' ')' failed (exit code $LASTEXITCODE)." }
    } finally { Pop-Location }
}

# ------------------------------------------------------------------ 1. prerequisites
Step "1/7 Checking prerequisites"
$VersionCheck = "import sys; print('%d.%d' % sys.version_info[:2])"
$UsePyLauncher = $false
$PythonFound = $false
if (Get-Command py -ErrorAction SilentlyContinue) {
    $ver = & py -3.12 -c $VersionCheck 2>$null
    if ($LASTEXITCODE -eq 0 -and "$ver".Trim() -eq "3.12") { $UsePyLauncher = $true; $PythonFound = $true }
}
if (-not $PythonFound -and (Get-Command python -ErrorAction SilentlyContinue)) {
    $ver = & python -c $VersionCheck 2>$null
    if ($LASTEXITCODE -eq 0 -and "$ver".Trim() -eq "3.12") { $PythonFound = $true }
}
if (-not $PythonFound) { Fail "Python 3.12 not found. Install it from https://www.python.org/downloads/ (tick 'Add python.exe to PATH')." }
Write-Host ("Python 3.12 found (" + $(if ($UsePyLauncher) { "py -3.12" } else { "python" }) + ")")

if (-not $SkipFrontend) {
    try { $nodeVer = (& node --version).TrimStart("v") } catch { Fail "Node.js not found. Install Node.js 22 LTS from https://nodejs.org/." }
    $parts = $nodeVer.Split(".") | ForEach-Object { [int]$_ }
    if ($parts[0] -lt 20 -or ($parts[0] -eq 20 -and $parts[1] -lt 19) -or ($parts[0] -eq 22 -and $parts[1] -lt 12)) {
        Fail "Node.js $nodeVer is too old for Vite 8. Install Node.js 22 LTS (22.12 or newer) from https://nodejs.org/."
    }
    Write-Host "Node.js $nodeVer found"
}

# ------------------------------------------------------------------ 2. Python environment
Step "2/7 Creating the backend virtual environment and installing packages (first time: 5-15 minutes)"
if (-not (Test-Path $VenvPython)) {
    if ($UsePyLauncher) { Run "py" @("-3.12", "-m", "venv", "venv") $Backend }
    else { Run "python" @("-m", "venv", "venv") $Backend }
}
Run $VenvPython @("-m", "pip", "install", "--upgrade", "pip") $Backend
Run $VenvPython @("-m", "pip", "install", "-r", "requirements-dev.txt") $Backend

# ------------------------------------------------------------------ 3. backend/.env
Step "3/7 Backend configuration (backend\.env)"
$EnvFile = Join-Path $Backend ".env"
if (Test-Path $EnvFile) {
    Write-Host "backend\.env already exists - keeping it."
} else {
    $pgUser = $DbUser; if (-not $pgUser) { $pgUser = Read-Host "PostgreSQL user name [postgres]" }
    if (-not $pgUser) { $pgUser = "postgres" }
    $pgPass = $DbPassword
    if (-not $pgPass) {
        $secure = Read-Host "PostgreSQL password for '$pgUser' (the one chosen when installing PostgreSQL)" -AsSecureString
        $pgPass = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
    }
    $pgHost = $DbHost; if (-not $pgHost) { $pgHost = Read-Host "PostgreSQL host [localhost]" }; if (-not $pgHost) { $pgHost = "localhost" }
    $pgPort = $DbPort; if (-not $pgPort) { $pgPort = Read-Host "PostgreSQL port [5432]" }; if (-not $pgPort) { $pgPort = "5432" }
    $dbName = $DbName; if (-not $dbName) { $dbName = Read-Host "Database name [dermasoul_ai]" }; if (-not $dbName) { $dbName = "dermasoul_ai" }
    $url = "postgresql://{0}:{1}@{2}:{3}/{4}" -f [uri]::EscapeDataString($pgUser), [uri]::EscapeDataString($pgPass), $pgHost, $pgPort, $dbName
    $bytes = New-Object byte[] 48
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $jwt = [Convert]::ToBase64String($bytes).TrimEnd("=").Replace("+", "-").Replace("/", "_")
    $content = Get-Content (Join-Path $Backend ".env.example") -Raw
    $content = $content -replace "(?m)^DATABASE_URL=.*$", "DATABASE_URL=$url"
    $content = $content -replace "(?m)^JWT_SECRET_KEY=.*$", "JWT_SECRET_KEY=$jwt"
    [IO.File]::WriteAllText($EnvFile, $content, (New-Object Text.UTF8Encoding $false))
    Write-Host "Created backend\.env with your database settings and a new random JWT secret."
}

# ------------------------------------------------------------------ 4. Hugging Face models
Step "4/7 Downloading the AI models (about 680 MB, first time only)"
Run $VenvPython @("-m", "app.scripts.download_models") $Backend

# ------------------------------------------------------------------ 5. database
Step "5/7 Creating the database, tables, seed data and RAG index"
Run $VenvPython @("-m", "app.scripts.setup_database") $Backend

# ------------------------------------------------------------------ 6. admin account
Step "6/7 Admin account"
if ($SkipAdmin) {
    Write-Host "Skipped (-SkipAdmin)."
} else {
    $email = Read-Host "Admin email to create (leave empty to skip; you will be asked for a password)"
    if ($email) { Run $VenvPython @("-m", "app.scripts.create_admin", "--email", $email) $Backend }
    else { Write-Host "Skipped. Create one later with: python -m app.scripts.create_admin --email you@example.com" }
}

# ------------------------------------------------------------------ 7. frontend
Step "7/7 Installing frontend packages"
if ($SkipFrontend) { Write-Host "Skipped (-SkipFrontend)." }
else { Run "npm" @("ci", "--no-audit", "--no-fund") $Frontend }

Write-Host "`nSetup complete." -ForegroundColor Green
Write-Host "Start the app with two terminals (or run .\start.ps1):"
Write-Host "  Backend : cd backend; .\venv\Scripts\Activate.ps1; python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8010"
Write-Host "  Frontend: cd frontend; npm run dev     -> open http://localhost:5173"
