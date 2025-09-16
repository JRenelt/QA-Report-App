# 🔖 FavLink Manager - Browser Bookmarks Collector

Automatischer Sammler für Browser-Favoriten von **allen installierten Browsern** auf Windows, Linux und macOS.

## 🚀 Unterstützte Browser

- **Google Chrome** (Windows, Linux, macOS)
- **Mozilla Firefox** (Windows, Linux, macOS)
- **Microsoft Edge** (Windows, Linux, macOS)
- **Safari** (nur macOS)

## 📦 Dateien

- `collect_bookmarks.py` - Haupt-Python-Skript (plattformübergreifend)
- `collect_bookmarks.bat` - Windows-Starter (Doppelklick)
- `collect_bookmarks.sh` - Linux/macOS-Starter (Terminal)
- `README_Bookmarks_Collector.md` - Diese Anleitung

## 🔧 Voraussetzungen

- **Python 3.6+** installiert
- Browser mit gespeicherten Favoriten

### Python Installation:

**Windows:**
- Download von [python.org](https://www.python.org/downloads/)
- Bei Installation "Add to PATH" aktivieren

**macOS:**
```bash
brew install python3
```

**Ubuntu/Debian:**
```bash
sudo apt update && sudo apt install python3
```

**Fedora/RHEL:**
```bash
sudo dnf install python3
```

## 🚀 Verwendung

### Windows (Einfach):
1. Doppelklick auf `collect_bookmarks.bat`
2. Warten bis fertig
3. HTML-Datei wird automatisch geöffnet

### Linux/macOS (Terminal):
```bash
chmod +x collect_bookmarks.sh
./collect_bookmarks.sh
```

### Manuell (alle Systeme):
```bash
python3 collect_bookmarks.py
```

## 📁 Browser-Speicherorte

### Windows:
- **Chrome:** `%LOCALAPPDATA%\Google\Chrome\User Data\Default\Bookmarks`
- **Firefox:** `%APPDATA%\Mozilla\Firefox\Profiles\*\places.sqlite`
- **Edge:** `%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Bookmarks`

### macOS:
- **Chrome:** `~/Library/Application Support/Google/Chrome/Default/Bookmarks`
- **Firefox:** `~/Library/Application Support/Firefox/Profiles/*/places.sqlite`
- **Safari:** `~/Library/Safari/Bookmarks.plist`
- **Edge:** `~/Library/Application Support/Microsoft Edge/Default/Bookmarks`

### Linux:
- **Chrome:** `~/.config/google-chrome/Default/Bookmarks`
- **Firefox:** `~/.mozilla/firefox/*/places.sqlite`
- **Edge:** `~/.config/microsoft-edge/Default/Bookmarks`

## 📤 Ausgabe

Das Skript erstellt eine HTML-Datei mit Namen wie:
```
all_bookmarks_20250901_143022.html
```

Diese Datei enthält:
- ✅ Alle Favoriten von allen gefundenen Browsern
- 📁 Automatische Kategorisierung nach Ordnern
- 🧪 **Testdaten mit Duplikaten** für Demo-Zwecke
- 💀 Beispiel-Links für Dead-Link-Tests

## 🎯 Import in FavLink Manager

1. Öffnen Sie FavLink Manager: `https://favorg-manager-1.preview.emergentagent.com`
2. Klicken Sie auf **"Favoriten importieren"**
3. Wählen Sie die generierte HTML-Datei aus
4. Die Anwendung erkennt automatisch:
   - 🔄 Duplikate
   - 💀 Tote Links
   - 📁 Kategorien

## 🧪 Testdaten

Das Skript fügt automatisch Testdaten hinzu mit:

**Normale Bookmarks:**
- Google, GitHub, Stack Overflow, YouTube, Wikipedia

**Duplikate (zum Testen):**
- `https://google.com` vs `https://www.google.com/`
- `https://github.com` vs `https://www.github.com/`
- `https://youtube.com` vs `https://www.youtube.com/`

**Dead Links (zum Testen):**
- `https://this-site-does-not-exist-12345.com`
- `https://invalid-domain-xyz.fake`
- `https://broken-url-test.nonexistent`

## 🔧 Problembehandlung

### "Python nicht gefunden"
- Stellen Sie sicher, dass Python installiert und im PATH ist
- Windows: Python-Installer erneut ausführen und "Add to PATH" aktivieren

### "Keine Bookmarks gefunden"
- Browser mindestens einmal gestartet haben
- Bookmarks in den Browsern gespeichert haben
- Browser geschlossen haben (manche Browser sperren die Dateien)

### "Berechtigung verweigert"
```bash
chmod +x collect_bookmarks.sh    # Linux/macOS
chmod +x collect_bookmarks.py
```

### Firefox-Datenbankfehler
- Firefox vollständig schließen
- Das Skript erstellt automatisch eine temporäre Kopie

## 🆘 Support

Bei Problemen:
1. Browser vollständig schließen
2. Als Administrator/sudo ausführen (wenn nötig)
3. Antivirus-Software temporär deaktivieren
4. Python-Version prüfen: `python3 --version`

## 📋 Ausgabe-Beispiel

```
🚀 Browser Bookmarks Collector gestartet
💻 Betriebssystem: Windows 10
------------------------------------------------------------
📁 Chrome Bookmarks gefunden: C:\Users\...\Bookmarks
📁 Firefox Bookmarks gefunden: C:\Users\...\places.sqlite
📁 Edge Bookmarks gefunden: C:\Users\...\Bookmarks
✅ 15 Testdaten mit Duplikaten hinzugefügt
------------------------------------------------------------
📊 Zusammenfassung:
   Browser gefunden: 3
   Bookmarks gesammelt: 127
✅ HTML-Export erstellt: all_bookmarks_20250901_143022.html
📤 Datei bereit für Import in FavLink Manager!
   Kategorien: 12
   Browser: Chrome, Firefox, Edge, Test
```

## ⚡ Features

- 🔍 **Automatische Browser-Erkennung**
- 📁 **Kategorisierung beibehalten**
- 🔄 **Duplikat-Kennzeichnung**
- 💀 **Dead-Link-Beispiele**
- 🌐 **Plattformübergreifend**
- 📤 **HTML-Export**
- 🧪 **Integrierte Testdaten**