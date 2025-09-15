#!/bin/bash

# FavLink Manager - Browser Bookmarks Collector für Linux/macOS
# Sammelt Favoriten von Chrome, Firefox, Safari und Edge

set -e

echo "============================================================"
echo "🔖 FavLink Manager - Browser Bookmarks Collector (Unix)"
echo "   Sammelt Favoriten von allen installierten Browsern"
echo "============================================================"
echo

# Python verfügbar prüfen
if ! command -v python3 &> /dev/null; then
    if ! command -v python &> /dev/null; then
        echo "❌ Python ist nicht installiert oder nicht im PATH."
        echo "   Bitte installieren Sie Python 3.6+ über Ihren Paketmanager:"
        echo "   Ubuntu/Debian: sudo apt install python3"
        echo "   macOS: brew install python3"
        echo "   Fedora: sudo dnf install python3"
        exit 1
    else
        PYTHON_CMD="python"
    fi
else
    PYTHON_CMD="python3"
fi

# Python-Version prüfen
PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1-2)
echo "🐍 Python Version: $PYTHON_VERSION gefunden"

# Prüfen ob das Python-Skript existiert
if [[ ! -f "collect_bookmarks.py" ]]; then
    echo "❌ collect_bookmarks.py nicht gefunden!"
    echo "   Stellen Sie sicher, dass beide Dateien im gleichen Ordner sind."
    exit 1
fi

echo "🚀 Starte Python Bookmarks Collector..."
echo

# Ausführbar machen falls nötig
chmod +x collect_bookmarks.py

# Python-Skript ausführen
$PYTHON_CMD collect_bookmarks.py

echo
echo "📋 Browser-Pfade auf diesem System:"
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "   Chrome: ~/Library/Application Support/Google/Chrome/Default/Bookmarks"
    echo "   Firefox: ~/Library/Application Support/Firefox/Profiles/"
    echo "   Safari: ~/Library/Safari/Bookmarks.plist"
    echo "   Edge: ~/Library/Application Support/Microsoft Edge/Default/Bookmarks"
else
    echo "   Chrome: ~/.config/google-chrome/Default/Bookmarks"
    echo "   Firefox: ~/.mozilla/firefox/"
    echo "   Edge: ~/.config/microsoft-edge/Default/Bookmarks"
fi

echo
echo "✅ Fertig! Die HTML-Datei kann jetzt in FavLink Manager importiert werden."