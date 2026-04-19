# spicetify-osu-watch.ps1
# Lance le backend quand Spotify demarre, le tue quand Spotify se ferme
# A placer dans le dossier du projet et lancer au demarrage Windows

$backendPath = "E:\Windows Folder\Documents\Project Claude\spicetify-osu-clean\backend.py"
$backendProcess = $null

function Start-Backend {
    if (-not (Get-Process pythonw -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -eq "" })) {
        Write-Host "[spicetify-osu] Starting backend..."
        $script:backendProcess = Start-Process pythonw -ArgumentList "`"$backendPath`"" -WindowStyle Hidden -PassThru
    }
}

function Stop-Backend {
    Write-Host "[spicetify-osu] Stopping backend..."
    Get-Process pythonw -ErrorAction SilentlyContinue | Stop-Process -Force
    $script:backendProcess = $null
}

Write-Host "[spicetify-osu] Watcher started. Monitoring Spotify..."

while ($true) {
    $spotify = Get-Process Spotify -ErrorAction SilentlyContinue

    if ($spotify -and -not $backendProcess) {
        Start-Backend
    }
    elseif (-not $spotify -and $backendProcess) {
        Stop-Backend
    }

    Start-Sleep -Seconds 5
}
