# Disk Space Alert
# Sends a Windows toast notification if C: drive free space is below threshold.
# Scheduled to run daily at 9:00 AM via Windows Task Scheduler.

$WarnThresholdGB = 100   # yellow warning
$CritThresholdGB = 50    # red critical alert

$disk    = Get-PSDrive -Name C
$FreeGB  = [math]::Round($disk.Free / 1GB, 1)
$TotalGB = [math]::Round(($disk.Used + $disk.Free) / 1GB, 1)
$UsedPct = [math]::Round(($disk.Used / ($disk.Used + $disk.Free)) * 100, 0)

function Show-Toast($title, $message) {
    # Uses BurntToast if available, otherwise falls back to MessageBox
    if (Get-Module -ListAvailable -Name BurntToast -ErrorAction SilentlyContinue) {
        Import-Module BurntToast -ErrorAction SilentlyContinue
        New-BurntToastNotification -Text $title, $message
    } else {
        # Fallback: balloon tip via .NET (visible in taskbar)
        Add-Type -AssemblyName System.Windows.Forms
        $notify = New-Object System.Windows.Forms.NotifyIcon
        $notify.Icon = [System.Drawing.SystemIcons]::Warning
        $notify.Visible = $true
        $notify.ShowBalloonTip(10000, $title, $message, [System.Windows.Forms.ToolTipIcon]::Warning)
        Start-Sleep -Seconds 12
        $notify.Dispose()
    }
}

if ($FreeGB -le $CritThresholdGB) {
    $title   = "Kaivalya - CRITICAL: Disk Almost Full"
    $message = "Only $FreeGB GB free of $TotalGB GB ($UsedPct% used). Delete old files or free up space immediately."
    Show-Toast $title $message
    exit 1
} elseif ($FreeGB -le $WarnThresholdGB) {
    $title   = "Kaivalya - Disk Space Warning"
    $message = "$FreeGB GB free of $TotalGB GB ($UsedPct% used). Consider freeing up disk space soon."
    Show-Toast $title $message
    exit 0
}

# Enough space - no notification needed
exit 0
