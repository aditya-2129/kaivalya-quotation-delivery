# Appwrite Restore Script
# Usage: run this script and pick a backup when prompted
# WARNING: This OVERWRITES current data.

$DB_CONTAINER = "appwrite-mariadb"
$DB_NAME      = "appwrite"
$DB_ROOT_PASS = "rootsecretpassword"

$Volumes = @{
    "uploads.tar"      = "kaivalya_appwrite-uploads"
    "config.tar"       = "kaivalya_appwrite-config"
    "certificates.tar" = "kaivalya_appwrite-certificates"
    "imports.tar"      = "kaivalya_appwrite-imports"
}

function Log($msg) {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $msg"
}

# Resolve paths relative to this script's location so it works on any machine
$ScriptDir    = Split-Path -Parent $MyInvocation.MyCommand.Path
$SnapshotsDir = Join-Path $ScriptDir "snapshots"

# --- Pick backup ---
$Backups = Get-ChildItem -Path $SnapshotsDir -Directory -Filter "????-??-??_??-??" |
           Sort-Object Name -Descending

if ($Backups.Count -eq 0) {
    Write-Host "No backups found in $SnapshotsDir" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Available backups:" -ForegroundColor Cyan
for ($i = 0; $i -lt $Backups.Count; $i++) {
    $size = [math]::Round((Get-ChildItem $Backups[$i].FullName -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
    Write-Host "  [$i] $($Backups[$i].Name)  ($size MB)"
}
Write-Host ""
$Choice = Read-Host "Enter number to restore (default: 0 = most recent)"
if ($Choice -eq "") { $Choice = 0 }
$BackupDir = $Backups[$Choice].FullName
Log "Selected: $BackupDir"

# --- Confirm ---
Write-Host ""
Write-Host "WARNING: This will OVERWRITE all current Appwrite data." -ForegroundColor Yellow
Write-Host "         Collections, documents, users, and storage files will be replaced." -ForegroundColor Yellow
Write-Host ""
$Confirm = Read-Host "Type YES to continue"
if ($Confirm -ne "YES") {
    Write-Host "Restore cancelled." -ForegroundColor Gray
    exit 0
}

# --- Stop Appwrite containers (keep mariadb running for the DB restore) ---
Log "Stopping Appwrite containers (except mariadb)..."
Push-Location (Split-Path -Parent $ScriptDir)
docker compose stop appwrite appwrite-worker-audits appwrite-worker-webhooks `
    appwrite-worker-deletes appwrite-worker-databases appwrite-worker-builds `
    appwrite-worker-functions appwrite-worker-mails appwrite-worker-messaging `
    appwrite-worker-migrations appwrite-worker-usage appwrite-realtime `
    appwrite-executor appwrite-assistant 2>$null
Log "Containers stopped."

# --- 1. Restore database ---
Log "Restoring database from appwrite-db.sql ..."
$SqlFile = "$BackupDir\appwrite-db.sql"

docker exec -i $DB_CONTAINER mysql -uroot -p"$DB_ROOT_PASS" -e "DROP DATABASE IF EXISTS $DB_NAME; CREATE DATABASE $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
Get-Content $SqlFile | docker exec -i $DB_CONTAINER mysql -uroot -p"$DB_ROOT_PASS" $DB_NAME

if ($LASTEXITCODE -ne 0) {
    Log "ERROR: Database restore failed. Aborting."
    Pop-Location
    exit 1
}
Log "Database restored."

# --- 2. Restore volumes ---
foreach ($entry in $Volumes.GetEnumerator()) {
    $TarFile    = $entry.Key
    $VolumeName = $entry.Value
    $TarPath    = "$BackupDir\$TarFile"

    if (-not (Test-Path $TarPath)) {
        Log "WARNING: $TarFile not found in backup, skipping $VolumeName"
        continue
    }

    Log "Restoring volume $VolumeName from $TarFile ..."

    docker run --rm `
        -v "${VolumeName}:/data" `
        -v "${BackupDir}:/backup:ro" `
        alpine sh -c "rm -rf /data/* /data/.[!.]* 2>/dev/null; tar -xf /backup/$TarFile -C /data"

    if ($LASTEXITCODE -ne 0) {
        Log "WARNING: Failed to restore volume $VolumeName"
    } else {
        Log "Volume $VolumeName restored."
    }
}

# --- 3. Restart all containers ---
Log "Starting all containers..."
docker compose up -d
Pop-Location

Write-Host ""
Write-Host "Restore complete. Appwrite is back up." -ForegroundColor Green
Write-Host "Open https://appwrite.vrivalsarena.com/console to verify." -ForegroundColor Cyan
