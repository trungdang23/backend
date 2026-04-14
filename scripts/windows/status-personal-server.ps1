Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$dockerCli = 'C:\Program Files\Docker\Docker\resources\bin\docker.exe'
$cloudflaredConfig = 'C:\Users\dangv\.cloudflared\config.yml'
$composeFileWindows = 'C:\TrungDang\journey\backend\docker-compose.yml'
$wslDistro = 'Ubuntu-20.04'
$deployDirWsl = '/home/trungdang/apps/journey-backend'
$healthUrl = 'https://api.buicojourney.com/api/v1/health'
$deploySshHostname = 'ssh.buicojourney.com'

function Write-Section([string]$title) {
    Write-Host ('=' * 8 + " $title " + '=' * 8)
}

Write-Section 'Docker'
try {
    & $dockerCli ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | Select-String -Pattern 'journey-backend-postgres' -CaseSensitive:$false
} catch {
    Write-Host "Docker CLI not available."
}

Write-Section 'Backend (WSL)'
try {
    $command = "cd $deployDirWsl && bash ./scripts/check-production-health.sh"
    wsl -d $wslDistro bash -lc $command
} catch {
    Write-Host "Backend runtime not healthy or WSL not available."
}

Write-Section 'Cloudflare Tunnel'
$processes = Get-CimInstance Win32_Process -Filter "Name = 'cloudflared.exe'" -ErrorAction SilentlyContinue
if ($processes) {
    $matches = $false
    foreach ($process in $processes) {
        if ($process.CommandLine -and $process.CommandLine.Contains('journey-backend')) {
            $matches = $true
            Write-Host ("PID " + $process.ProcessId + " " + $process.CommandLine)
        }
    }
    if (-not $matches) {
        Write-Host 'cloudflared process found but not the journey-backend tunnel.'
    }
} else {
    Write-Host 'cloudflared process not running.'
}

Write-Section 'Deploy SSH'
if (-not (Test-Path $cloudflaredConfig)) {
    Write-Host "cloudflared config not found at $cloudflaredConfig"
} else {
    $configContent = Get-Content $cloudflaredConfig -Raw

    if ($configContent.Contains("hostname: $deploySshHostname") -and $configContent.Contains('service: ssh://localhost:22')) {
        Write-Host "$deploySshHostname -> ssh://localhost:22 configured."
    } else {
        Write-Host "Stable SSH route is missing from $cloudflaredConfig."
    }
}

Write-Section 'Public Health'
try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $healthUrl -TimeoutSec 10
    Write-Host ("HTTP " + $response.StatusCode)
} catch {
    Write-Host "Public health check failed."
}
