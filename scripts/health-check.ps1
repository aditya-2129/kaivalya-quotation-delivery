# Kaivalya Engineering - System Health Check
# Double-click to run. Shows status of all services, disk space, and last backup.

$ProjectDir   = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$SnapshotsDir = Join-Path $ProjectDir "backup\snapshots"

# Critical containers that must be running for the app to work
$CriticalContainers = @(
    "appwrite"
    "appwrite-mariadb"
    "appwrite-redis"
    "appwrite-traefik"
    "appwrite-realtime"
    "quotation-maker"
)

# Worker/task containers — important but app still partially works without them
$WorkerContainers = @(
    "appwrite-worker-databases"
    "appwrite-worker-deletes"
    "appwrite-worker-builds"
    "appwrite-worker-functions"
    "appwrite-worker-mails"
    "appwrite-worker-webhooks"
    "appwrite-worker-audits"
    "appwrite-worker-certificates"
    "appwrite-worker-messaging"
    "appwrite-worker-migrations"
    "appwrite-task-maintenance"
    "appwrite-task-scheduler-executions"
    "appwrite-task-scheduler-functions"
    "appwrite-task-scheduler-messages"
    "appwrite-task-stats-resources"
    "appwrite-worker-stats-resources"
    "appwrite-worker-stats-usage"
    "appwrite-browser"
    "appwrite-console"
    "openruntimes-executor"
)

function Header($text) {
    Write-Host ""
    Write-Host "  $text" -ForegroundColor Cyan
    Write-Host "  $("-" * ($text.Length))" -ForegroundColor DarkGray
}

function OK($label, $detail = "") {
    $msg = "  [OK] $label"
    if ($detail) { $msg += "  ($detail)" }
    Write-Host $msg -ForegroundColor Green
}

function WARN($label, $detail = "") {
    $msg = "  [!!] $label"
    if ($detail) { $msg += "  ($detail)" }
    Write-Host $msg -ForegroundColor Yellow
}

function FAIL($label, $detail = "") {
    $msg = "  [XX] $label"
    if ($detail) { $msg += "  ($detail)" }
    Write-Host $msg -ForegroundColor Red
}

$OverallOk = $true

Write-Host ""
Write-Host "  ============================================" -ForegroundColor DarkGray
Write-Host "   Kaivalya Engineering - Health Check" -ForegroundColor White
Write-Host "   $(Get-Date -Format 'dddd, dd MMM yyyy  HH:mm:ss')" -ForegroundColor DarkGray
Write-Host "  ============================================" -ForegroundColor DarkGray

# --- 1. Docker Desktop ---
Header "Docker Desktop"
$dockerRunning = $false
try {
    docker info 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $dockerRunning = $true
        OK "Docker Desktop is running"
    }
} catch {}
if (-not $dockerRunning) {
    FAIL "Docker Desktop is NOT running" "Start Docker Desktop and wait 1 minute"
    $OverallOk = $false
}

# --- 2. Critical Containers ---
Header "Critical Services"
if ($dockerRunning) {
    $RunningContainers = @(docker ps --format "{{.Names}}" 2>$null)
    foreach ($name in $CriticalContainers) {
        if ($RunningContainers -contains $name) {
            OK $name
        } else {
            FAIL $name "not running - run: docker compose up -d"
            $OverallOk = $false
        }
    }
} else {
    WARN "Skipped — Docker is not running"
}

# --- 3. Worker Containers ---
Header "Worker Services"
if ($dockerRunning) {
    $failedWorkers = @()
    foreach ($name in $WorkerContainers) {
        if ($RunningContainers -notcontains $name) {
            $failedWorkers += $name
        }
    }
    if ($failedWorkers.Count -eq 0) {
        OK "All $($WorkerContainers.Count) worker containers running"
    } else {
        foreach ($w in $failedWorkers) {
            WARN $w "not running"
        }
        $OverallOk = $false
    }
} else {
    WARN "Skipped — Docker is not running"
}

# --- 4. Cloudflare Tunnel ---
Header "Cloudflare Tunnel (Internet Access)"
$tunnelStatus = sc.exe query cloudflared 2>$null | Select-String "STATE"
if ($tunnelStatus -match "RUNNING") {
    OK "Cloudflare tunnel is running" "app is accessible from internet"
} else {
    FAIL "Cloudflare tunnel is NOT running" "run as Admin: sc start cloudflared"
    $OverallOk = $false
}

# --- 5. App reachability (local) ---
Header "App Reachability (Local)"
try {
    $resp = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    OK "Frontend (localhost:3000)" "HTTP $($resp.StatusCode)"
} catch {
    FAIL "Frontend (localhost:3000) not responding" "check: docker logs quotation-maker"
    $OverallOk = $false
}
try {
    $resp = Invoke-WebRequest -Uri "http://localhost/v1/health" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    OK "Appwrite API (localhost/v1/health)" "HTTP $($resp.StatusCode)"
} catch {
    # 401 means Appwrite is running but requires auth — that is healthy
    if ($_.Exception.Response.StatusCode.value__ -eq 401) {
        OK "Appwrite API (localhost/v1/health)" "HTTP 401 - running"
    } else {
        FAIL "Appwrite API not responding" "check: docker logs appwrite"
        $OverallOk = $false
    }
}

# --- 6. Disk Space ---
Header "Disk Space"
$disk = Get-PSDrive -Name C
$FreeGB  = [math]::Round($disk.Free / 1GB, 1)
$TotalGB = [math]::Round(($disk.Used + $disk.Free) / 1GB, 1)
$UsedPct = [math]::Round(($disk.Used / ($disk.Used + $disk.Free)) * 100, 0)

$DiskLabel = "C: drive - $FreeGB GB free of $TotalGB GB - $UsedPct% used"
if ($FreeGB -gt 100) {
    OK $DiskLabel
} elseif ($FreeGB -gt 50) {
    WARN $DiskLabel "getting low"
} else {
    FAIL $DiskLabel "critically low - delete old files"
    $OverallOk = $false
}

# --- 7. Last Backup ---
Header "Last Backup"
if (Test-Path $SnapshotsDir) {
    $LastBackup = Get-ChildItem -Path $SnapshotsDir -Directory -Filter "????-??-??_??-??" |
                  Sort-Object Name -Descending | Select-Object -First 1
    if ($LastBackup) {
        $BackupAge = (Get-Date) - $LastBackup.LastWriteTime
        $AgeHours  = [math]::Round($BackupAge.TotalHours, 0)
        $AgeDays   = [math]::Round($BackupAge.TotalDays, 1)

        if ($BackupAge.TotalHours -lt 30) {
            OK "Last backup: $($LastBackup.Name)" "${AgeHours}h ago"
        } elseif ($BackupAge.TotalDays -lt 3) {
            WARN "Last backup: $($LastBackup.Name)" "${AgeDays} days ago"
        } else {
            FAIL "Last backup: $($LastBackup.Name)" "${AgeDays} days ago - backup may not be running"
            $OverallOk = $false
        }

        # Show all available backups
        $AllBackups = Get-ChildItem -Path $SnapshotsDir -Directory -Filter "????-??-??_??-??" |
                      Sort-Object Name -Descending
        Write-Host "  Available backups:" -ForegroundColor DarkGray
        foreach ($b in $AllBackups) {
            $size = [math]::Round((Get-ChildItem $b.FullName -Recurse | Measure-Object -Property Length -Sum).Sum / 1GB, 2)
            Write-Host "    - $($b.Name)  ($size GB)" -ForegroundColor DarkGray
        }
    } else {
        WARN "No backups found in snapshots folder"
    }
} else {
    WARN "Snapshots folder not found" $SnapshotsDir
}

# --- Summary ---
Write-Host ""
Write-Host "  ============================================" -ForegroundColor DarkGray
if ($OverallOk) {
    Write-Host "   SYSTEM STATUS: ALL GOOD" -ForegroundColor Green
} else {
    Write-Host "   SYSTEM STATUS: ACTION REQUIRED" -ForegroundColor Red
    Write-Host "   Check the items marked [XX] above." -ForegroundColor Yellow
}
Write-Host "  ============================================" -ForegroundColor DarkGray
Write-Host ""

Read-Host "  Press Enter to close"
