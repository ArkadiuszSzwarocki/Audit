Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
ScriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Run start_audit.bat silently in background (0 = hidden window)
WshShell.CurrentDirectory = ScriptDir
WshShell.Run "cmd /c """ & ScriptDir & "\start_audit.bat""", 0, False
