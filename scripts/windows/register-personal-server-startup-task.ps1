Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$taskName = 'JourneyPersonalServerStartup'
$scriptPath = 'C:\TrungDang\journey\backend\scripts\windows\start-personal-server.ps1'
$arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""
$startupDir = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\Startup'
$startupLauncherPath = Join-Path $startupDir 'JourneyPersonalServerStartup.cmd'

$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $arguments
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -StartWhenAvailable
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

try {
    Register-ScheduledTask `
        -TaskName $taskName `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Principal $principal `
        -Force | Out-Null

    Write-Host "Registered scheduled task $taskName"
    exit 0
} catch {
    $launcherContent = @"
@echo off
start "" /min powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "$scriptPath"
"@

    New-Item -ItemType Directory -Force -Path $startupDir | Out-Null
    Set-Content -Path $startupLauncherPath -Value $launcherContent -Encoding ASCII
    Write-Host "Scheduled task registration was denied. Created Startup launcher at $startupLauncherPath"
}
