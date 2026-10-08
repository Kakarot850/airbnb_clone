# Starts the whole app on Windows with one command:
#   backend  (FastAPI)  -> http://localhost:8000   (API docs: /docs)
#   frontend (Next.js)  -> http://localhost:3000
#
# Usage, from the project folder:
#   start.bat                 (or: powershell -ExecutionPolicy Bypass -File start.ps1)
#   start.bat --reset         wipe the database and reload the demo data first
#
# Press Ctrl+C to stop both servers. (If Windows then asks "Terminate batch job (Y/N)?", press Y.)

$ErrorActionPreference = "Continue"   # we check exit codes ourselves

$Root = $PSScriptRoot
$Backend = Join-Path $Root "backend"
$Frontend = Join-Path $Root "frontend"
$BackendPort = if ($env:BACKEND_PORT) { [int]$env:BACKEND_PORT } else { 8000 }
$FrontendPort = if ($env:FRONTEND_PORT) { [int]$env:FRONTEND_PORT } else { 3000 }
$Reset = ($args -contains "--reset") -or ($args -contains "-reset")
$OnWindows = $env:OS -eq "Windows_NT"

function Say($Text) { Write-Host "> $Text" -ForegroundColor Magenta }
function Fail($Text) { Write-Host "x $Text" -ForegroundColor Red; exit 1 }

function Test-PortInUse([int]$Port) {
    $client = New-Object System.Net.Sockets.TcpClient
    try { $client.Connect("127.0.0.1", $Port); return $true } catch { return $false } finally { $client.Dispose() }
}

# Stops a process and everything it started (uvicorn's reloader worker, Next.js workers).
function Stop-Tree([int]$ProcessId) {
    if ($OnWindows) { & taskkill.exe /PID $ProcessId /T /F *> $null; return }
    foreach ($child in @(& pgrep -P $ProcessId)) { if ($child) { Stop-Tree ([int]$child) } }   # macOS / Linux
    Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
}

function Stop-Server($Process) {
    if ($null -ne $Process) { Stop-Tree $Process.Id }
}

# --- 1. Check the tools we need ----------------------------------------------------
$Python = $null
foreach ($candidate in "python", "py", "python3") {
    if (Get-Command $candidate -ErrorAction SilentlyContinue) {
        & $candidate -c "import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)" *> $null
        if ($LASTEXITCODE -eq 0) { $Python = $candidate; break }
    }
}
if (-not $Python) { Fail "Python 3.10+ is required: https://www.python.org/downloads/ (tick 'Add python.exe to PATH')." }

if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Fail "Node.js 20.9+ is required: https://nodejs.org" }
& node -e "const [a, b] = process.versions.node.split('.').map(Number); process.exit(a > 20 || (a === 20 && b >= 9) ? 0 : 1)"
if ($LASTEXITCODE -ne 0) { Fail "Node.js 20.9+ is required (found $(node -v))." }

foreach ($port in $BackendPort, $FrontendPort) {
    if (Test-PortInUse $port) { Fail "Port $port is already in use. Close the program using it (find it with: netstat -ano | findstr :$port)." }
}

# --- 2. Backend setup ----------------------------------------------------------------
$Venv = Join-Path $Backend ".venv"
$VenvPython = if ($OnWindows) { Join-Path $Venv "Scripts\python.exe" } else { Join-Path $Venv "bin/python" }
$Stamp = Join-Path $Venv ".installed"
$Requirements = Join-Path $Backend "requirements.txt"

if (-not (Test-Path $VenvPython)) {
    Say "Creating Python virtual environment (backend\.venv)..."
    & $Python -m venv $Venv
    if ($LASTEXITCODE -ne 0) { Fail "Could not create the virtual environment." }
}
# Re-install packages only when requirements.txt changed since the last install.
if (-not (Test-Path $Stamp) -or (Get-Item $Requirements).LastWriteTime -gt (Get-Item -Force $Stamp).LastWriteTime) {
    Say "Installing backend packages..."
    & $VenvPython -m pip install --quiet --upgrade pip
    & $VenvPython -m pip install --quiet -r $Requirements
    if ($LASTEXITCODE -ne 0) { Fail "Installing backend packages failed (see the messages above)." }
    New-Item -ItemType File -Force -Path $Stamp | Out-Null
}
if ($Reset) {
    Say "Resetting the database with demo data..."
    Push-Location $Backend
    & $VenvPython -m app.seed
    Pop-Location
}
# (If the database is empty, the backend seeds demo data by itself on startup.)

# --- 3. Frontend setup ---------------------------------------------------------------
if (-not (Test-Path (Join-Path $Frontend "node_modules"))) {
    Say "Installing frontend packages (first run takes a minute)..."
    $npm = if ($OnWindows) { "npm.cmd" } else { "npm" }
    Push-Location $Frontend
    & $npm install --no-audit --no-fund
    $installed = $LASTEXITCODE -eq 0
    Pop-Location
    if (-not $installed) { Fail "Installing frontend packages failed (see the messages above)." }
}
$EnvFile = Join-Path $Frontend ".env.local"
if (-not (Test-Path $EnvFile)) {
    Set-Content -Path $EnvFile -Value "NEXT_PUBLIC_API_URL=http://localhost:$BackendPort" -Encoding ascii
}

# --- 4. Run both servers; Ctrl+C stops everything --------------------------------------
$backendProcess = $null
$frontendProcess = $null
try {
    Say "Starting backend on http://localhost:$BackendPort ..."
    $backendProcess = Start-Process -FilePath $VenvPython -WorkingDirectory $Backend -NoNewWindow -PassThru `
        -ArgumentList "-m", "uvicorn", "app.main:app", "--reload", "--port", "$BackendPort"

    # Wait until the API answers before starting the frontend.
    $ready = $false
    for ($i = 0; $i -lt 60 -and -not $ready -and -not $backendProcess.HasExited; $i++) {
        Start-Sleep -Milliseconds 500
        try {
            Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 "http://127.0.0.1:$BackendPort/api/health" | Out-Null
            $ready = $true
        } catch { }
    }
    if (-not $ready) {
        Write-Host "x Backend did not start. See the messages above." -ForegroundColor Red
        return
    }

    Say "Starting frontend on http://localhost:$FrontendPort ..."
    $nextCli = Join-Path $Frontend "node_modules/next/dist/bin/next"
    $frontendProcess = Start-Process -FilePath "node" -WorkingDirectory $Frontend -NoNewWindow -PassThru `
        -ArgumentList "`"$nextCli`"", "dev", "--port", "$FrontendPort"

    Write-Host ""
    Write-Host "  App:       http://localhost:$FrontendPort"
    Write-Host "  API docs:  http://localhost:$BackendPort/docs"
    Write-Host "  Demo logins (no password): guest@demo.com / host@demo.com"
    Write-Host ""
    Write-Host "  Press Ctrl+C to stop both servers."
    Write-Host ""

    while (-not $backendProcess.HasExited -and -not $frontendProcess.HasExited) { Start-Sleep -Seconds 1 }
    Write-Host "x A server stopped unexpectedly. See the messages above." -ForegroundColor Red
}
finally {
    # Runs on Ctrl+C too.
    Say "Stopping servers..."
    Stop-Server $frontendProcess
    Stop-Server $backendProcess
}
