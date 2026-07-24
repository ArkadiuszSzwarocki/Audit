@echo off
title AuditApp - Kopia Zapasowa Bazy Danych
cd /d "%~dp0"
color 0B

echo =======================================================================
echo          TWORZENIE KOPII ZAPASOWEJ BAZY DANYCH (SQLITE BACKUP)
echo =======================================================================
echo.

node scripts\backup_db.js

if %errorLevel% EQU 0 (
    echo.
    echo Kopia zapasowa zostala pomyślnie zapisana w folderze "backups\".
) else (
    echo.
    echo Wystąpił błąd podczas wykonywania kopii zapasowej.
)

echo.
timeout /t 5
