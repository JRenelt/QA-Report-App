@echo off
REM FavLink Manager - Browser Bookmarks Collector für Windows
REM Sammelt Favoriten von Chrome, Firefox und Edge

setlocal enabledelayedexpansion
echo ============================================================
echo 🔖 FavLink Manager - Browser Bookmarks Collector (Windows)
echo    Sammelt Favoriten von allen installierten Browsern
echo ============================================================
echo.

REM Python verfügbar prüfen
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python ist nicht installiert oder nicht im PATH.
    echo    Bitte installieren Sie Python 3.6+ von https://python.org
    pause
    exit /b 1
)

REM Prüfen ob das Python-Skript existiert
if not exist "collect_bookmarks.py" (
    echo ❌ collect_bookmarks.py nicht gefunden!
    echo    Stellen Sie sicher, dass beide Dateien im gleichen Ordner sind.
    pause
    exit /b 1
)

echo 🚀 Starte Python Bookmarks Collector...
echo.

REM Python-Skript ausführen
python collect_bookmarks.py

echo.
echo 📋 Zusätzliche Windows Browser-Pfade:
echo    Chrome: %LOCALAPPDATA%\Google\Chrome\User Data\Default\Bookmarks
echo    Firefox: %APPDATA%\Mozilla\Firefox\Profiles\*\places.sqlite
echo    Edge: %LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Bookmarks

echo.
echo ✅ Fertig! Drücken Sie eine beliebige Taste zum Beenden.
pause >nul