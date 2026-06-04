Set-Location $PSScriptRoot
$env:ROADMAP_ADMIN_TOKEN = "dev-admin"

# Ensure Node/npm are on PATH (fresh installs often need a new terminal)
$nodeDir = "C:\Program Files\nodejs"
if ((Test-Path "$nodeDir\npm.cmd") -and ($env:Path -notlike "*$nodeDir*")) {
    $env:Path = "$nodeDir;$env:Path"
}

# Free port 8080 if a previous server is still running
$on8080 = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue
if ($on8080) {
    $on8080 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Seconds 1
}

$frontend = Join-Path $PSScriptRoot "web\frontend"
$npm = Get-Command npm -ErrorAction SilentlyContinue
if ($npm -and (Test-Path (Join-Path $frontend "package.json"))) {
    Push-Location $frontend
    if (-not (Test-Path "node_modules")) {
        Write-Host "Installing UI dependencies (first time)..."
        npm install
    }
    Write-Host "Building React UI..."
    npm run build
    Pop-Location
} elseif (-not $npm) {
    Write-Host "Note: npm not found — install Node.js from https://nodejs.org for the interactive UI."
    Write-Host "       Server will use legacy admin.html until you run: cd web\frontend; npm install; npm run build"
}

$url = "http://127.0.0.1:8080/?token=dev-admin"
Write-Host "After you see 'Application startup complete', open in your browser:"
Write-Host "  $url"
Write-Host "Keep this window open. Press Ctrl+C to stop."
python -m uvicorn web.app:app --host 127.0.0.1 --port 8080
