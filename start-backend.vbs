' Lance le backend spicetify-osu en arriere-plan sans console
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "pythonw """ & CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName) & "\backend.py""", 0, False
