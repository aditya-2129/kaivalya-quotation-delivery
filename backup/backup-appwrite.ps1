# Appwrite Local Backup Script
# Backs up: MariaDB database dump + uploads + config + certificates
# Schedule via Windows Task Scheduler to run nightly

# Resolve paths relative to this script's location so it works on any machine
$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackupRoot = Join-Path $ScriptDir "snapshots"
$Timestamp  = Get-Date -Format "yyyy-MM-dd_HH-mm"
$BackupDir  = "$BackupRoot\$Timestamp"
$LogFile    = "$BackupRoot\backup.log"

$DB_CONTAINER = "appwrite-mariadb"
$DB_NAME      = "appwrite"
$DB_ROOT_PASS = "rootsecretpassword"

# Volumes to copy out (name → subfolder in backup)
$Volumes = @{
    "kaivalya_appwrite-uploads"      = "uploads"
    "kaivalya_appwrite-config"       = "config"
    "kaivalya_appwrite-certificates" = "certificates"
    "kaivalya_appwrite-imports"      = "imports"
}

function Log($msg) {
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
    Write-Host $line
    Add-Content -Path $LogFile -Value $line
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

# --- 2. Volume copies ---
foreach ($entry in $Volumes.GetEnumerator()) {
    $VolumeName = $entry.Key
    $SubFolder  = $entry.Value
    Log "Copying volume $VolumeName -> $SubFolder ..."

    # Use a temporary Alpine container to tar the volume contents out
    $TarPath = "$BackupDir\$SubFolder.tar"
    docker run --rm `
        -v "${VolumeName}:/data:ro" `
        -v "${BackupDir}:/backup" `
        alpine sh -c "tar -cf /backup/$SubFolder.tar -C /data ."

    if ($LASTEXITCODE -ne 0) {
        Log "WARNING: Failed to copy volume $VolumeName (exit code $LASTEXITCODE)"
    } else {
        Log "Volume $VolumeName backed up to $TarPath"
    }
}

# --- 3. Compress everything into a single zip ---
Log "Compressing backup to zip..."
$ZipPath = "$BackupRoot\appwrite-backup-$Timestamp.zip"
Compress-Archive -Path "$BackupDir\*" -DestinationPath $ZipPath -CompressionLevel Optimal

if ($?) {
    Log "Zip created: $ZipPath"
    # Remove the uncompressed folder to save space
    Remove-Item -Recurse -Force $BackupDir
    Log "Cleaned up temp folder: $BackupDir"
} else {
    Log "WARNING: Zip failed, keeping uncompressed folder at $BackupDir"
}

# --- 4. Retention: keep only last 7 backups ---
Log "Applying retention policy (keep last 7 backups)..."
$AllBackups = Get-ChildItem -Path $BackupRoot -Filter "appwrite-backup-*.zip" |
              Sort-Object LastWriteTime -Descending
if ($AllBackups.Count -gt 7) {
    $ToDelete = $AllBackups | Select-Object -Skip 7
    foreach ($file in $ToDelete) {
        Remove-Item -Force $file.FullName
        Log "Deleted old backup: $($file.Name)"
    }
}

Log "=== Backup completed: $ZipPath ==="
Log ""
