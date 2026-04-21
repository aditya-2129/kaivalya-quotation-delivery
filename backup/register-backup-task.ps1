# Run this script ONCE as Administrator to register the nightly backup task
# Right-click -> "Run with PowerShell as Administrator"

# Resolve the backup script path relative to this script's location
$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackupScript = Join-Path $ScriptDir "backup-appwrite.ps1"

$Action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$BackupScript`""

$Trigger = New-ScheduledTaskTrigger -Daily -At "01:00PM"

$Settings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable:$false `
    -ExecutionTimeLimit (New-TimeSpan -Hours 1)

Register-ScheduledTask `
    -TaskName "Appwrite Daily Backup" `
    -TaskPath "\Kaivalya\" `
    -Action $Action `
    -Trigger $Trigger `
    -Settings $Settings `
    -RunLevel Highest `
    -Description "Daily backup of Appwrite DB and storage volumes to local folder" `
    -Force

Write-Host "Task registered. It will run daily at 1:00 PM." -ForegroundColor Green
Write-Host "Backups will be saved to: $(Join-Path $ScriptDir 'snapshots')" -ForegroundColor Cyan
