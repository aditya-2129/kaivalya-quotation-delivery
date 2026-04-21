# Appwrite Local Backup Script
# Backs up: MariaDB database dump + uploads + config + certificates
# Scheduled via Windows Task Scheduler to run daily at 1:00 PM

# Resolve paths relative to this script's location so it works on any machine
$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
$BackupRoot = Join-Path $ScriptDir "snapshots"
$Timestamp  = Get-Date -Format "yyyy-MM-dd_HH-mm"
$BackupDir  = "$BackupRoot\$Timestamp"
$LogFile    = "$BackupRoot\backup.log"

# Read credentials from appwrite/.env so this works on any machine
$EnvFile = Join-Path $ProjectDir "appwrite\.env"
$DB_ROOT_PASS = (Get-Content $EnvFile | Select-String "^_APP_DB_ROOT_PASS=").ToString().Split("=",2)[1].Trim('"')
$DB_NAME      = (Get-Content $EnvFile | Select-String "^_APP_DB_SCHEMA=").ToString().Split("=",2)[1].Trim('"')
$DB_CONTAINER = "appwrite-mariadb"

# Derive Docker Compose project name from folder name (lowercase)
$ProjectName = (Split-Path -Leaf $ProjectDir).ToLower()

# Volumes to copy out (name -> subfolder in backup)
$Volumes = @{
    "${ProjectName}_appwrite-uploads"      = "uploads"
    "${ProjectName}_appwrite-config"       = "config"
    "${ProjectName}_appwrite-certificates" = "certificates"
    "${ProjectName}_appwrite-imports"      = "imports"
}

$BackupFailed = $false

function Log($msg) {
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
    Write-Host $line
    Add-Content -Path $LogFile -Value $line
}

function Alert($title, $message) {
    Add-Type -AssemblyName System.Windows.Forms
    $notify = New-Object System.Windows.Forms.NotifyIcon
    $notify.Icon = [System.Drawing.SystemIcons]::Warning
    $notify.Visible = $true
    $notify.ShowBalloonTip(15000, $title, $message, [System.Windows.Forms.ToolTipIcon]::Error)
    Start-Sleep -Seconds 3
    $notify.Dispose()
}

function Verify($path, $label) {
    if (-not (Test-Path $path)) {
        Log "ERROR: $label - file not found: $path"
        $script:BackupFailed = $true
        return
    }
    $sizeKB = [math]::Round((Get-Item $path).Length / 1KB, 1)
    if ($sizeKB -lt 1) {
        Log "ERROR: $label - file is empty (0 bytes): $path"
        $script:BackupFailed = $true
    } else {
        Log "OK: $label - $sizeKB KB"
    }
}

Log "=== Backup started: $Timestamp ==="

# Create backup directory
New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null

# --- 1. Database dump ---
Log "Dumping MariaDB database..."
$DumpPath = "$BackupDir\appwrite-db.sql"

docker exec $DB_CONTAINER mysqldump -uroot -p"$DB_ROOT_PASS" --single-transaction --routines --triggers $DB_NAME | Out-File -FilePath $DumpPath -Encoding utf8

if ($LASTEXITCODE -ne 0) {
    Log "ERROR: Database dump failed (exit code $LASTEXITCODE)"
    exit 1
}
Log "Database dump done: $DumpPath"
Verify $DumpPath "Database dump"

# --- 2. Volume copies ---
foreach ($entry in $Volumes.GetEnumerator()) {
    $VolumeName = $entry.Key
    $SubFolder  = $entry.Value
    Log "Copying volume $VolumeName -> $SubFolder ..."

    $TarPath = "$BackupDir\$SubFolder.tar"
    docker run --rm `
        -v "${VolumeName}:/data:ro" `
        -v "${BackupDir}:/backup" `
        alpine sh -c "tar -cf /backup/$SubFolder.tar -C /data ."

    if ($LASTEXITCODE -ne 0) {
        Log "ERROR: Failed to copy volume $VolumeName (exit code $LASTEXITCODE)"
        $script:BackupFailed = $true
    } else {
        Log "Volume $VolumeName backed up to $TarPath"
        Verify $TarPath "Volume $VolumeName"
    }
}

# --- 3. Retention: keep only last 3 backups ---
Log "Applying retention policy (keep last 3 backups)..."
$AllBackups = Get-ChildItem -Path $BackupRoot -Directory -Filter "????-??-??_??-??" |
              Sort-Object Name -Descending
if ($AllBackups.Count -gt 3) {
    $ToDelete = $AllBackups | Select-Object -Skip 3
    foreach ($dir in $ToDelete) {
        Remove-Item -Recurse -Force $dir.FullName
        Log "Deleted old backup: $($dir.Name)"
    }
}

if ($BackupFailed) {
    Log "=== Backup completed WITH ERRORS: $BackupDir ==="
    Alert "Kaivalya - Backup Failed" "One or more backup files are missing or empty. Check backup\snapshots\backup.log for details."
} else {
    Log "=== Backup completed successfully: $BackupDir ==="
}
Log ""

# --- Log rotation: keep last 100 lines ---
if (Test-Path $LogFile) {
    $lines = Get-Content $LogFile
    if ($lines.Count -gt 100) {
        $lines | Select-Object -Last 100 | Set-Content $LogFile
    }
}
