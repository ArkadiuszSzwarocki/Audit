@echo off
title AuditApp Server Launcher
cd /d "%~dp0"

echo ========================================================
echo               SYSTEM AUDYTOW - AUDITAPP
echo ========================================================
echo.
echo Uruchamianie serwera aplikacji...
echo.

:: Ustawienie wiekszego limitu pamieci RAM dla Node.js (4 GB)
set NODE_OPTIONS=--max-old-space-size=4096

:: Automatyczne otwarcie przegladarki po 3 sekundach
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

:: WAZNE: Uzycie CALL npm, aby skrypt bat nie zamykal okna wiersza polecen
call npm run dev

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================================
    echo   BLAD: Nie udalo sie uruchomic serwera!
    echo ========================================================
    echo Sprawdz czy Node.js jest zainstalowany i czy wykonano npm install.
    echo.
    pause
)
