Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$dockerDesktopExe = 'C:\Program Files\Docker\Docker\Docker Desktop.exe'
$dockerCli = 'C:\Program Files\Docker\Docker\resources\bin\docker.exe'
$cloudflaredExe = 'C:\Cloudflared\bin\cloudflared.exe'
$cloudflaredConfig = 'C:\Users\dangv\.cloudflared\config.yml'
$repoRootWindows = 'C:\TrungDang\journey\backend'
$composeFileWindows = 'C:\TrungDang\journey\backend\docker-compose.yml'
$wslDistro = 'Ubuntu-20.04'
$deployDirWsl = '/home/trungdang/apps/journey-backend'
$backendHealthUrl = 'https://api.buicojourney.com/api/v1/health'

function Test-CloudflaredTunnelProcess {
    $processes = Get-CimInstance Win32_Process -Filter "Name = 'cloudflared.exe'" -ErrorAction SilentlyContinue

    if (-not $processes) {
        return $false
    }

    foreach ($process in $processes) {
        if ($process.CommandLine -and $process.CommandLine.Contains('journey-backend')) {
            return $true
        }
    }

    return $false
}

function Start-DockerDesktopIfNeeded {
    if (-not (Get-Process 'Docker Desktop' -ErrorAction SilentlyContinue)) {
        Start-Process -FilePath $dockerDesktopExe | Out-Null
        Start-Sleep -Seconds 5
    }

    for ($attempt = 1; $attempt -le 30; $attempt++) {
        & $dockerCli version | Out-Null
        if ($LASTEXITCODE -eq 0) {
            return
        }

        Start-Sleep -Seconds 3
    }

    throw 'Docker Desktop did not become ready in time.'
}

function Ensure-PostgresContainer {
    & $dockerCli compose -f $composeFileWindows up -d postgres | Out-Null
}

function Restart-BackendRuntime {
    $command = "cd $deployDirWsl && bash ./scripts/restart-production.sh"
    wsl -d $wslDistro bash -lc $command
}

function Start-CloudflaredTunnelIfNeeded {
    if (-not (Test-Path $cloudflaredExe)) {
        throw "cloudflared was not found at $cloudflaredExe"
    }

    if (-not (Test-Path $cloudflaredConfig)) {
        throw "cloudflared config was not found at $cloudflaredConfig"
    }

    if (Test-CloudflaredTunnelProcess) {
        return
    }

    $stdoutLog = 'C:\Users\dangv\.cloudflared\cloudflared.out.log'
    $stderrLog = 'C:\Users\dangv\.cloudflared\cloudflared.err.log'

    Start-Process `
        -FilePath $cloudflaredExe `
        -ArgumentList @('tunnel', '--config', $cloudflaredConfig, 'run', 'journey-backend') `
        -WindowStyle Hidden `
        -RedirectStandardOutput $stdoutLog `
        -RedirectStandardError $stderrLog | Out-Null
}

function Wait-ForPublicHealth {
    for ($attempt = 1; $attempt -le 30; $attempt++) {
        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri $backendHealthUrl -TimeoutSec 10
            if ($response.StatusCode -eq 200) {
                return
            }
        } catch {
            Start-Sleep -Seconds 2
            continue
        }
    }

    throw "Backend health endpoint did not return 200 at $backendHealthUrl"
}

Start-DockerDesktopIfNeeded
Ensure-PostgresContainer
Restart-BackendRuntime
Start-CloudflaredTunnelIfNeeded
Wait-ForPublicHealth
