# 📋 QA-Report-App Benutzerhandbuch

## 📖 Inhaltsverzeichnis

1. [Installation & Setup](#installation--setup)
2. [Erste Schritte](#erste-schritte)
3. [Benutzeroberfläche](#benutzeroberfläche)
4. [Firma & Projekt-Verwaltung](#firma--projekt-verwaltung)
5. [Test-Suite Management](#test-suite-management)
6. [Test-Durchführung](#test-durchführung)
7. [Import & Export](#import--export)
8. [Benutzer-Verwaltung](#benutzer-verwaltung)
9. [Systemeinstellungen](#systemeinstellungen)
10. [Häufige Fragen (FAQ)](#häufige-fragen-faq)

---

## 🚀 Installation & Setup

### Systemanforderungen
- **Python**: 3.8 oder höher
- **Node.js**: 16 oder höher
- **Browser**: Chrome, Firefox, Safari, Edge (aktuelle Versionen)
- **Speicher**: Mindestens 2GB RAM
- **Festplatte**: 500MB freier Speicher

### Schnellstart-Installation

1. **Backend starten:**
```bash
cd qa-report-app/backend
pip install -r requirements.txt
python init_db.py  # Datenbank initialisieren
python main.py     # Server starten
```

2. **Frontend starten:**
```bash
cd qa-report-app/frontend
npm install
npm start
```

3. **Anwendung öffnen:**
   - Öffnen Sie `http://localhost:3000` in Ihrem Browser
   - Melden Sie sich mit Demo-Daten an: `admin` / `admin123`

### Produktions-Installation
Detaillierte Anweisungen finden Sie in der [Installations-Anleitung](../QA-REPORT-INSTALLATION.md).

---

## 🎯 Erste Schritte

### 1. Anmeldung

**Demo-Benutzer:**
- **Administrator**: `admin` / `admin123`
  - Vollzugriff auf alle Funktionen
  - Kann Firmen und Projekte erstellen
  - Benutzer-Verwaltung
  
- **QA-Tester**: `qa_demo` / `demo123`
  - Kann Tests durchführen
  - Kann Test-Ergebnisse dokumentieren
  - Nur Lese-Zugriff auf Projekt-Einstellungen

### 2. Dashboard-Übersicht

Nach der Anmeldung sehen Sie das **Dashboard** mit:
- **Statistik-Karten**: Anzahl Firmen, Projekte, Test-Suiten
- **Tab-Navigation**: Firmen, Projekte, Test-Suiten
- **System Status**: Backend-Verbindung, Datenbank-Status
- **Benutzer-Info**: Angemeldeter Benutzer und Rolle

### 3. Navigation

**Hauptmenü:**
- 🏢 **Firmen**: Unternehmens-Verwaltung
- 📂 **Projekte**: Projekt-Management  
- 🧪 **Test-Suiten**: Test-Kategorien
- 📊 **Berichte**: Auswertungen und Export
- 🏛️ **Archiv**: Abgeschlossene Tests

**Benutzer-Menü (oben rechts):**
- 🌐 **DE/EN**: Sprache umschalten
- 👤 **Profil**: Benutzer-Einstellungen
- 🚪 **Abmelden**: Sitzung beenden

---

## 🖥️ Benutzeroberfläche

### Design-Prinzipien
- **Intuitiv**: Klare Symbole und deutsche Beschriftung
- **Responsive**: Funktioniert auf Desktop, Tablet und Mobile
- **Barrierefrei**: Keyboard-Navigation und Screen-Reader-Unterstützung

### Farbsystem
- 🔵 **Primär-Blau**: Hauptaktionen und Navigation
- 🟢 **Grün**: Erfolgreiche Tests und positive Aktionen
- 🔴 **Rot**: Fehlgeschlagene Tests und Lösch-Aktionen
- 🟡 **Gelb**: Warnungen und ausstehende Aktionen
- ⚪ **Grau**: Neutrale Elemente und deaktivierte Buttons

### Icons
- 🏢 **Firma**: Building2 Icon
- 📂 **Projekt**: FolderOpen Icon
- 🧪 **Test-Suite**: TestTube Icon
- ✅ **Erfolgreich**: CheckCircle Icon
- ❌ **Fehler**: XCircle Icon
- ⚠️ **Warnung**: AlertCircle Icon
- ⏸️ **Übersprungen**: Clock Icon

---

## 🏢 Firma & Projekt-Verwaltung

### Firma erstellen

1. **Dashboard → Firmen-Tab**
2. **"Neu hinzufügen"** Button klicken
3. **Firmendaten eingeben:**
   - Name (Pflichtfeld)
   - Beschreibung (optional)
   - Logo-URL (optional)
4. **"Erstellen"** klicken

### Projekt erstellen

1. **Dashboard → Projekte-Tab**
2. **"Neu hinzufügen"** Button klicken  
3. **Projekt-Konfiguration:**
   - **Name**: Projekt-Bezeichnung
   - **Firma**: Zuordnung auswählen
   - **Vorlage-Typ**: 
     - Web-App QA
     - Mobile-App QA
     - API-Testing
     - Benutzerdefiniert
   - **Status**: Aktiv, Entwurf, Archiviert

### Projekt-Vorlagen

**Web-App QA (Standard):**
- 🎨 Allgemeines Design
- 📋 Header-Bereich  
- 📂 Sidebar-Bereich
- 📄 Main-Content

**Mobile-App QA:**
- 📱 Interface-Tests
- 👆 Touch-Gesten
- 🔄 Performance
- 🔋 Akku-Verbrauch

**API-Testing:**
- 🌐 Endpunkt-Tests
- 📊 Performance-Tests
- 🔐 Sicherheits-Tests
- 📋 Dokumentation

---

## 🧪 Test-Suite Management

### Test-Suite öffnen

1. **Dashboard → Test-Suiten-Tab**
2. **Test-Suite auswählen** (z.B. "Allgemeines Design")
3. **"Tests verwalten"** Button klicken

### Management-Modus

**Testfall-Übersicht:**
- **Test-ID**: Eindeutige Kennung (z.B. AD0001)
- **Test-Name**: Beschreibende Bezeichnung
- **Priorität**: Hoch/Mittel/Niedrig
- **Status**: Nicht getestet/Erfolgreich/Fehler/Warnung/Übersprungen
- **Aktionen**: Anzeigen/Bearbeiten/Löschen

**Testfall hinzufügen:**
1. **"Test hinzufügen"** Button klicken
2. **Testfall-Details eingeben:**
   - Test-ID (automatisch generiert oder manuell)
   - Name und Beschreibung
   - Erwartetes Ergebnis
   - Prioritätsstufe
3. **"Speichern"** klicken

### Testfall-Bearbeitung

**Vorhandenen Test bearbeiten:**
1. **Bearbeiten-Icon** (Stift) klicken
2. **Details anpassen**
3. **Änderungen speichern**

**Test löschen:**
- ⚠️ **Achtung**: Vordefinierte Tests können nicht gelöscht werden
- Nur benutzerdefinierte Tests sind löschbar
- Alle zugehörigen Test-Ergebnisse werden mit gelöscht

---

## ✅ Test-Durchführung

### Execution-Modus starten

1. **Test-Suite Management öffnen**
2. **"Tests starten"** Button klicken
3. **Execution-Modus wird aktiviert**

### Test-Durchführung

**Aktueller Test:**
- **Test-ID und Name** werden angezeigt
- **Beschreibung** erklärt den Test-Schritt
- **Erwartetes Ergebnis** als Referenz

**Test-Ergebnis erfassen:**

1. **Test durchführen** (manuell in Ihrer Anwendung)
2. **Notizen eingeben** (optional, aber empfohlen)
3. **Ergebnis auswählen:**
   - 🟢 **Erfolgreich**: Test entspricht Erwartung
   - 🔴 **Fehler**: Test schlägt fehl
   - 🟡 **Warnung**: Test funktioniert, aber mit Einschränkungen
   - ⚪ **Übersprungen**: Test nicht durchführbar/relevant

**Navigation:**
- **"Vorheriger Test"**: Zurück zum letzten Test
- **"Nächster Test"**: Automatisch nach Ergebnis-Eingabe
- **Progress Bar**: Zeigt Fortschritt (z.B. "2/10 Abgeschlossen")

### Fortschritts-Tracking

**Ausführungsfortschritt:**
- Visueller Progress Bar
- Anzahl abgeschlossener Tests
- Prozentuale Vollständigkeit
- Session-ID für Gruppierung

**Test-Session:**
- Alle Tests einer Durchführung erhalten die gleiche Session-ID
- Sessions können später ausgewertet werden
- Wiederholbare Test-Durchläufe möglich

---

## 📊 Import & Export

### Export-Templates generieren

**Systemeinstellungen → Export:**
1. **"Template generieren"** Button klicken
2. **Format auswählen:**
   - 📄 **JSON**: Strukturierte Daten für APIs
   - 📊 **CSV**: Tabellenkalkulation-kompatibel  
   - 📋 **Excel**: Microsoft Excel Format
3. **Template herunterladen**

### Template-Struktur

**JSON-Format:**
```json
{
  "meta": {
    "version": "1.0",
    "created": "2024-09-30T10:00:00Z",
    "template_type": "test_import"
  },
  "companies": [
    {
      "name": "Beispiel Firma GmbH",
      "description": "Beschreibung der Firma"
    }
  ],
  "projects": [
    {
      "name": "Beispiel Projekt",
      "company_name": "Beispiel Firma GmbH",
      "template_type": "web_app_qa",
      "description": "Projekt-Beschreibung"
    }
  ],
  "test_suites": [
    {
      "name": "Allgemeines Design",
      "project_name": "Beispiel Projekt",
      "icon": "🎨",
      "description": "Design und Layout Tests"
    }
  ],
  "test_cases": [
    {
      "test_id": "AD0001",
      "name": "Corporate Identity prüfen",
      "suite_name": "Allgemeines Design", 
      "description": "Überprüfung der Corporate Design Guidelines",
      "expected_result": "Alle Farben und Fonts entsprechen dem Corporate Design",
      "priority": 1
    }
  ]
}
```

**CSV-Format:**
```csv
test_id,name,suite_name,description,expected_result,priority
AD0001,Corporate Identity prüfen,Allgemeines Design,Überprüfung der Corporate Design Guidelines,Alle Farben und Fonts entsprechen dem Corporate Design,1
AD0002,Responsive Design testen,Allgemeines Design,Test der Darstellung auf verschiedenen Bildschirmgrößen,Layout passt sich an alle Geräte an,1
```

### Import-Funktion

**Template importieren:**
1. **Systemeinstellungen → Import**
2. **Template-Datei auswählen**
3. **Import-Optionen:**
   - ☑️ **Bestehende Einträge überspringen** (Standard)
   - ☐ **Bestehende Einträge überschreiben**
   - ☑️ **Validierung vor Import**
4. **"Importieren"** klicken
5. **Import-Bericht anzeigen**

**Validierungsregeln:**
- Test-IDs müssen eindeutig sein
- Firmen-Namen müssen existieren (oder werden erstellt)
- Projekt-Zuordnungen müssen gültig sein
- Pflichtfelder müssen ausgefüllt sein

### FavOrg Migration

**Vorgefertigtes FavOrg-Template:**
- Enthält alle Standard-Testpunkte der FavOrg-Anwendung
- Kategorien: Design, Navigation, Funktionalität, Performance
- Sofort verwendbar nach Import
- Datei: `templates/favorg-testpoints.json`

**Migration durchführen:**
1. **FavOrg-Template herunterladen**
2. **Bei Bedarf anpassen** (Testpunkte ergänzen/entfernen)
3. **In QA-Report-App importieren**
4. **Test-Durchläufe starten**

---

## 👥 Benutzer-Verwaltung

### Benutzer-Rollen

**Administrator:**
- ✅ Firmen und Projekte erstellen/bearbeiten/löschen
- ✅ Benutzer verwalten
- ✅ Systemeinstellungen ändern
- ✅ Alle Test-Ergebnisse einsehen
- ✅ Import/Export-Funktionen

**QA-Tester:**
- ✅ Tests durchführen und dokumentieren
- ✅ Test-Ergebnisse einsehen (eigene Projekte)
- ✅ Notizen und Kommentare hinzufügen
- ❌ Projekteinstellungen ändern
- ❌ Benutzer verwalten

**Reviewer:**
- ✅ Test-Ergebnisse einsehen und bewerten
- ✅ Berichte generieren
- ✅ Kommentare hinzufügen
- ❌ Tests durchführen
- ❌ Projekteinstellungen ändern

### Neuen Benutzer anlegen

**Nur für Administratoren:**
1. **Systemeinstellungen → Benutzer**
2. **"Neuer Benutzer"** Button
3. **Benutzer-Daten eingeben:**
   - Benutzername (eindeutig)
   - E-Mail-Adresse
   - Vor- und Nachname
   - Rolle auswählen
   - Sprach-Präferenz
4. **Temporäres Passwort generieren**
5. **"Erstellen"** klicken

---

## ⚙️ Systemeinstellungen

### Allgemeine Einstellungen

**Sprache:**
- Deutsch (Standard)
- Englisch
- Pro Benutzer konfigurierbar

**Design-Theme:**
- Light Mode (Standard)
- Dark Mode (geplant für zukünftige Version)

**Zeitzone:**
- Automatische Erkennung
- Manuelle Auswahl möglich

### Datenbank-Einstellungen

**SQLite (Entwicklung):**
- Datei-basierte Datenbank
- Automatische Backups
- Einfache Wartung

**PostgreSQL (Produktion):**
- Skalierbare Lösung
- Erweiterte Backup-Optionen
- Multi-User-Unterstützung

### Export-Einstellungen

**Template-Generierung:**
- **Standard-Format**: JSON
- **Datei-Benennung**: `qa-template-YYYY-MM-DD.json`
- **Include Metadata**: ☑️ Aktiviert
- **Komprimierung**: ☐ Optional

**Automatische Exports:**
- **Täglich**: Backup aller Test-Ergebnisse
- **Wöchentlich**: Vollständiger System-Export  
- **Monatlich**: Archiv-Export

### Import-Einstellungen

**Validierung:**
- **Strikt**: Alle Felder müssen gültig sein
- **Tolerant**: Leere Felder werden ignoriert
- **Interaktiv**: Nachfragen bei Konflikten

**Konfliktbehandlung:**
- **Überspringen**: Bestehende Einträge nicht ändern (Standard)
- **Überschreiben**: Bestehende Einträge ersetzen
- **Versionierung**: Alte Versionen aufbewahren

---

## ❓ Häufige Fragen (FAQ)

### Installation & Setup

**F: Welche Python-Version wird benötigt?**
A: Python 3.8 oder höher. Prüfen Sie mit `python --version`.

**F: Backend startet nicht - Port bereits belegt?**
A: Standardport 8002 ändern in `main.py` oder anderen Prozess beenden.

**F: Frontend zeigt "Backend nicht erreichbar"?**
A: Prüfen Sie REACT_APP_BACKEND_URL in `.env` und CORS-Einstellungen.

### Benutzer & Anmeldung

**F: Passwort vergessen - was tun?**
A: Administrator kann Passwort zurücksetzen oder neuen Benutzer anlegen.

**F: Kann ich die Demo-Daten löschen?**
A: Ja, über Systemeinstellungen → Datenbank → Demo-Daten entfernen.

**F: Wie erstelle ich eigene Benutzer?**
A: Als Administrator: Systemeinstellungen → Benutzer → Neuer Benutzer.

### Test-Durchführung

**F: Kann ich Tests pausieren und später fortsetzen?**
A: Ja, Sessions werden automatisch gespeichert. Einfach "Tests stoppen" und später "Tests starten".

**F: Wie füge ich eigene Testfälle hinzu?**
A: Im Management-Modus der Test-Suite: "Test hinzufügen" Button verwenden.

**F: Können mehrere Personen gleichzeitig testen?**
A: Ja, jeder Benutzer hat separate Test-Sessions.

### Import & Export

**F: Welche Dateiformate werden unterstützt?**
A: JSON (empfohlen), CSV und Excel (.xlsx) für Import/Export.

**F: Werden bestehende Tests überschrieben beim Import?**
A: Standardmäßig nein. Option "Überschreiben" muss explizit aktiviert werden.

**F: Wie erstelle ich ein Template mit meinen bestehenden Tests?**
A: Systemeinstellungen → Export → "Template generieren" mit aktuellen Daten.

### Technische Probleme

**F: Seite lädt nicht / weiße Seite?**
A: Browser-Cache leeren, Entwicklertools öffnen (F12) und Console-Errors prüfen.

**F: Test-Ergebnisse werden nicht gespeichert?**
A: Backend-Verbindung prüfen, Benutzer-Berechtigung kontrollieren.

**F: Kann ich die App offline nutzen?**
A: Nein, Backend-Verbindung ist erforderlich. Lokale Installation möglich.

### Produktions-Betrieb

**F: Wie sichere ich die Datenbank?**
A: Automatische Backups in Systemeinstellungen aktivieren oder manuell SQL-Dumps erstellen.

**F: Kann ich auf PostgreSQL umstellen?**
A: Ja, DATABASE_URL in .env ändern und Schema importieren.

**F: Wie aktualisiere ich die Anwendung?**
A: Code aktualisieren, `pip install -r requirements.txt` und `npm install` ausführen.

---

## 📞 Support & Kontakt

**Technischer Support:**
- 📧 E-Mail: support@qa-report-app.com
- 🐛 Bug Reports: GitHub Issues
- 📖 Dokumentation: `/docs` Ordner

**Community:**
- 💬 Forum: Community-Forum (Link)
- 💡 Feature Requests: GitHub Discussions
- 📺 Video-Tutorials: YouTube Kanal (Link)

---

**Handbuch-Version:** 1.0.0  
**Letzte Aktualisierung:** $(date)  
**Gültig für QA-Report-App:** Version 1.0+