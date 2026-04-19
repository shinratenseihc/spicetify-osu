' Lance le watcher spicetify-osu en arriere-plan (sans fenetre PowerShell visible)
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File """ & CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName) & "\spicetify-osu-watch.ps1""", 0, False
