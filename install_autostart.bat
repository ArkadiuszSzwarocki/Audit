@echo off
title AuditApp - Instalator Automatycznego Startu Serwera (Windows Boot)
color 0A
cd /d "%~dp0"

echo =======================================================================
echo     INSTALACJA AUTOMATYCZNEGO STARTU AUDITAPP PRZY URUCHOMIENIU WINDOWS
echo =======================================================================
echo.

set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_PATH=%STARTUP_FOLDER%\AuditApp_Autostart.vbs"

echo [*] Kopiowanie pliku autostartu do folderu Autostart Windows...
copy /Y "%~dp0autostart_server.vbs" "%SHORTCUT_PATH%" >nul

if %errorlevel% equ 0 (
    echo.
    echo =======================================================================
    echo  [SUCCESS] AUTOMATYCZNY START ZOSTAŁ POMYŚLNIE ZAINSTALOWANY!
    echo =======================================================================
    echo  Serwer AuditApp od razu po włączeniu komputera uruchomi się w tle
    echo  i będzie dostępny pod adresem http://localhost:3000 oraz w sieci LAN!
    echo.
    echo  Lokalizacja autostartu:
    echo  %SHORTCUT_PATH%
    echo =======================================================================
) else (
    echo [ERROR] Błąd podczas instalacji autostartu. Uruchom skrypt jako Administrator.
)

echo.
pause
