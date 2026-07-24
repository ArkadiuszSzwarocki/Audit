@echo off
title AuditApp - Usuwanie Automatycznego Startu Serwera
color 0C
cd /d "%~dp0"

set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_PATH=%STARTUP_FOLDER%\AuditApp_Autostart.vbs"

if exist "%SHORTCUT_PATH%" (
    del /f /q "%SHORTCUT_PATH%"
    echo [SUCCESS] Usunięto autostart AuditApp z folderu Windows Startup.
) else (
    echo [INFO] Autostart AuditApp nie był zainstalowany.
)

pause
