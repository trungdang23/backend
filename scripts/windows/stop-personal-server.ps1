Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$dockerCli = 'C:\Program Files\Docker\Docker\resources\bin\docker.exe'
$composeFileWindows = 'C:\TrungDang\journey\backend\docker-compose.yml'
$wslDistro = 'Ubuntu-20.04'
$deployDirWsl = '/home/trungdang/apps/journey-backend'

function Stop-CloudflaredTunnel {
    $processes = Get-CimInstance Win32_Process -Filter "Name = 'cloudflared.exe'" -ErrorAction SilentlyContinue

    if (-not $processes) {
        return
    }

    foreach ($process in $processes) {
        if ($process.CommandLine -and $process.CommandLine.Contains('journey-backend')) {
            Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
        }
    }
}

function Stop-BackendRuntime {
    $command = "cd $deployDirWsl && bash ./scripts/stop-production.sh"
    wsl -d $wslDistro bash -lc $command
}

function Stop-PostgresContainer {
    & $dockerCli compose -f $composeFileWindows stop postgres | Out-Null
}

Stop-CloudflaredTunnel
Stop-BackendRuntime
Stop-PostgresContainer
