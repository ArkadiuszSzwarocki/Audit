@echo off
title AuditApp - Serwer Aplikacji
cd /d "%~dp0"
color 0A

echo =======================================================================
echo                   SYSTEM AUDYTOW - AUDITAPP
echo =======================================================================
echo.

:: Pobieranie lokalnego adresu IP komputera w sieci firmowej
set LOCAL_IP=localhost
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address" /c:"Adres IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do set LOCAL_IP=%%b
)

echo [INFO] Wykryty adres IP komputera w sieci firmowej: %LOCAL_IP%
echo.
echo =======================================================================
echo   ADRESY DOSTĘPU DLA PRACOWNIKÓW I URZĄDZEŃ MOBILNYCH:
echo.
echo   - Dostęp lokalny na tym komputerze:  http://localhost:3000
echo   - Dostęp po adresie IP z telefonu:   http://%LOCAL_IP%:3000
echo   - Dostęp po nazwie komputera/aliasie: http://%COMPUTERNAME%:3000
echo   - Dostęp z urządzeń Apple (mDNS):     http://%COMPUTERNAME%.local:3000
echo =======================================================================
echo.
echo [WAŻNE PRZED PIERWSZYM URUCHOMIENIEM W FIRMIE]:
echo 1. Upewnij się, że uruchomiono plik "konfiguruj_zapore.bat" jako Administrator.
echo 2. Telefon/tablet musi być w tej samej sieci Wi-Fi/LAN co ten komputer.
echo 3. Wyłącz VPN na telefonie podczas korzystania z aplikacji.
echo.
echo Uruchamianie serwera aplikacji...
echo.

:: Ustawienie limitu pamięci RAM dla Node.js (4 GB)
set NODE_OPTIONS=--max-old-space-size=4096

:: Otwarcie przeglądarki na serwerze po 3 sekundach
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

:: Uruchomienie Next.js (nasłuchiwanie na 0.0.0.0)
call npm run dev

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo =======================================================================
    echo BLAD: Nie udało się uruchomić serwera!
    echo =======================================================================
    echo Sprawdź czy Node.js jest zainstalowany oraz czy wykonano 'npm install'.
    echo.
    pause
)

