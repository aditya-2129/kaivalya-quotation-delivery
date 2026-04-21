# Appwrite Restore Script
# Usage: run this script and pick a backup zip when prompted
# WARNING: This OVERWRITES current data. Stop containers before restoring.

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

# --- Pick backup zip ---
# Resolve paths relative to this script's location so it works on any machine
$ScriptDir    = Split-Path -Parent $MyInvocation.MyCommand.Path
$SnapshotsDir = Join-Path $ScriptDir "snapshots"
$Zips = Get-ChildItem -Path $SnapshotsDir -Filter "appwrite-backup-*.zip" | Sort-Object LastWriteTime -Descending

if ($Zips.Count -eq 0) {
    Write-Host "No backup zips found in $SnapshotsDir" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Available backups:" -ForegroundColor Cyan
for ($i = 0; $i -lt $Zips.Count; $i++) {
    Write-Host "  [$i] $($Zips[$i].Name)  ($([math]::Round($Zips[$i].Length/1MB, 2)) MB)"
}
Write-Host ""
$Choice = Read-Host "Enter number to restore (default: 0 = most recent)"
if ($Choice -eq "") { $Choice = 0 }
$ZipFile = $Zips[$Choice].FullName
Log "Selected: $ZipFile"

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

# --- Extract zip to temp folder ---
$TempDir = "$env:TEMP\appwrite-restore-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Log "Extracting zip to $TempDir ..."
Expand-Archive -Path $ZipFile -DestinationPath $TempDir -Force

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
$SqlFile = "$TempDir\appwrite-db.sql"

# Drop and recreate the database, then pipe the dump in
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
    $TarFile   = $entry.Key
    $VolumeName = $entry.Value
    $TarPath   = "$TempDir\$TarFile"

    if (-not (Test-Path $TarPath)) {
        Log "WARNING: $TarFile not found in backup, skipping $VolumeName"
        continue
    }

    Log "Restoring volume $VolumeName from $TarFile ..."

    # Wipe the volume contents, then extract the tar into it
    docker run --rm `
        -v "${VolumeName}:/data" `
        -v "${TempDir}:/backup:ro" `
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

# --- Cleanup temp ---
Remove-Item -Recurse -Force $TempDir
Log "Temp files cleaned up."

Write-Host ""
Write-Host "Restore complete. Appwrite is back up." -ForegroundColor Green
Write-Host "Open https://appwrite.vrivalsarena.com/console to verify." -ForegroundColor Cyan
