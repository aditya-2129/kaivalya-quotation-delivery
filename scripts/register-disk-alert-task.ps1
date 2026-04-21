# Register Disk Space Alert Task
# Run ONCE as Administrator to schedule the daily disk check.
# Usage: Right-click -> "Run with PowerShell" (as Administrator)

$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$AlertScript = Join-Path $ScriptDir "disk-space-alert.ps1"

$TaskName = "\Kaivalya\Disk Space Alert"

# Remove existing task if present
Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue

$Trigger = New-ScheduledTaskTrigger -Daily -At "09:00AM"

# Run as the current logged-in user so the toast/balloon appears on their desktop
$Principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

$Action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NonInteractive -ExecutionPolicy Bypass -File `"$AlertScript`""

$Settings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -DontStopIfGoingOnBatteries `
    -AllowStartIfOnBatteries

Register-ScheduledTask `
    -TaskName $TaskName `
    -Trigger $Trigger `
    -Principal $Principal `
    -Action $Action `
    -Settings $Settings `
    -Description "Daily disk space check for Kaivalya Engineering app. Alerts if C: drive free space is low."

if ($LASTEXITCODE -eq 0 -or $?) {
    Write-Host "Disk alert task registered: $TaskName" -ForegroundColor Green
    Write-Host "Runs daily at 9:00 AM. Alerts if C: drive falls below 100 GB (warning) or 50 GB (critical)." -ForegroundColor Cyan
} else {
    Write-Host "ERROR: Failed to register task. Make sure you are running as Administrator." -ForegroundColor Red
}
