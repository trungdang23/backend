Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptPath = 'C:\TrungDang\journey\backend\scripts\windows\start-personal-server.ps1'

if (-not (Test-Path $scriptPath)) {
    throw "Startup script not found at $scriptPath"
}

powershell.exe -NoProfile -ExecutionPolicy Bypass -File $scriptPath
