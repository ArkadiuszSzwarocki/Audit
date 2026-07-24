@echo off
title Konfiguracja Zapory Windows dla AuditApp
cd /d "%~dp0"
color 0B

echo =======================================================================
echo         AUTOMATYCZNA KONFIGURACJA ZAPORY FIREWALL - AUDITAPP
echo =======================================================================
echo.
echo Sprawdzanie uprawnien Administratora...
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo.
    echo =======================================================================
    echo BLAD: Ten plik musi byc uruchomiony jako Administrator!
    echo =======================================================================
    echo Kliknij prawym przyciskiem myszy na Ten Plik i wybierz:
    echo "Uruchom jako administrator".
    echo.
    pause
    exit /b 1
)

echo [OK] Uprawnienia Administratora potwiedzone.
echo.
echo Dodawanie reguly Zapory Defender (Port 3000 TCP)...
powershell -Command "New-NetFirewallRule -DisplayName 'AuditApp Server (Port 3000)' -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue"

if %errorLevel% EQU 0 (
    echo.
    echo =======================================================================
    echo SUKCES: Port 3000 zostal odblokowany w Zaporze Windows!
    echo Urzadzenia z sieci firmowej beda mogly polaczyc sie z aplikacja.
    echo =======================================================================
) else (
    echo.
    echo [UWAGA] Nie udalo sie dodac reguly lub regula juz istnieje.
)

echo.
pause
