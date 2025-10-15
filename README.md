# QA-Report-App v2.1.1-stable
**Professionelle Qualitätssicherung und Testmanagement**

Die **QA-Report-App** ist eine umfassende Webanwendung für [Qualitätssicherung](#qualitätssicherung), [Testmanagement](#testmanagement) und Team-Kollaboration, entwickelt für moderne Entwicklungsteams.

## Inhaltsverzeichnis
1. [Schnellstart](#schnellstart)
2. [Funktionen](#funktionen)  
3. [Benutzerrollen](#benutzerrollen)
4. [Test-Management](#test-management)
5. [Berichte und Export](#berichte-und-export)
6. [Systemeinstellungen](#systemeinstellungen)
7. [Troubleshooting](#troubleshooting)
8. [Siehe auch](#siehe-auch)

---

## Übersicht
Die QA-Report-App ist eine professionelle Qualitätssicherungs-Anwendung für Testmanagement, Reporting und Team-Collaboration.

## Schnellstart

### Login und Zugang
**Hauptartikel:** [Authentifizierung](#authentifizierung)

- **URL**: [https://qa-report-hub.preview.emergentagt.com/](https://testsync-pro.preview.emergentagent.com/)
- **[Administrator](#administrator)**: `admin` / `admin123`  
- **[QA-Tester](#qa-tester)**: Accounts werden über das [Benutzermanagement](#benutzermanagement) erstellt

### Erste Schritte
1. **[Anmeldung](#anmeldung)**: Mit Administrator-Account anmelden
2. **[Testdaten-Generierung](#testdaten-generierung)**: [Einstellungen](#systemeinstellungen) → [Erweitert](#erweiterte-einstellungen) → "Testdaten generieren"
3. **Navigation**: [Test-Bereiche](#test-bereiche) in der Sidebar erkunden
4. **[Test-Erstellung](#test-erstellung)**: Tests erstellen und [Status](#test-status) setzen

## 📋 Hauptfunktionen

### Test-Management
**Test-Erstellung:**
- Eingabefeld "Neuer Testname..." verwenden
- Enter drücken oder Plus-Button klicken
- Tests werden automatisch mit ID versehen (AD0001, AD0002, etc.)

**Status setzen:**
- ✅ **Bestanden**: Grüner Check-Button
- ❌ **Fehlgeschlagen**: Roter X-Button  
- ☕ **In Arbeit**: Oranger Coffee-Button
- ↻ **Übersprungen**: Blauer Text-Button

### Filter & Suche
**Filter-Buttons (Toolbar):**
- 🔽 **Alle Tests** (FunnelX Icon)
- ✅ **Bestanden** (Check Icon) 
- ❌ **Fehlgeschlagen** (X Icon)
- ☕ **In Bearbeitung** (Coffee Icon)
- ⭕ **Unbearbeitet** (CircleOff Icon)
- ↻ **Übersprungen** (Text)

### Action-Buttons (Toolbar)
- ⚙️ **Config**: Test-Metadaten bearbeiten
- 💾 **Test speichern [X]**: Zeigt Anzahl ungespeicherter Tests
- 📦 **Archiv**: Archiv-Funktionen  
- 📤 **Export**: Öffnet Export-Einstellungen
- 📄 **QA-Bericht**: PDF-Vorschau generieren
- 📊 **QA-Bericht (Getestet)**: Nur getestete Fälle

## ⚙️ Einstellungen

### Darstellung
- **Dark/Light Mode**: Umschaltung zwischen Themes
- **Items pro Seite**: 5, 10, 20, 50 Tests pro Seite  
- **Tooltip-Einstellungen**:
  - Verzögerung: Fest, Kurz, Lang
  - Manuelles Schließen: An/Aus

### Import/Export  
- **PDF Export**: QA-Berichte als PDF
- **CSV Export**: Testdaten als CSV
- **Import**: Excel/CSV Dateien importieren

### Erweitert (Admin)
- **Testdaten generieren**: 15 Firmen mit je 100 Tests erstellen
- **Datenbank leeren**: Alle Daten löschen
- **System zurücksetzen**: Factory Reset

## 📊 Reports & Export

### PDF-Berichte
**Struktur:**
- Titel und Beschreibung (links, 10px Rand)
- Metadaten in zwei Spalten  
- Ziel des Tests, Testobjekt, Testmethodik
- Grafische Testergebnisse/Statistik
- Link zu "Fazit und Empfehlungen"

**Seite 2+:**
- Detaillierte Testfälle
- Fazit und Empfehlungen
- Fußzeile: "© 2025 Jörg Renelt · QA-Report-App · Alle Rechte vorbehalten."

### CSV-Export
- Alle Testdaten strukturiert
- Import in Excel/Sheets möglich
- Filter-Optionen verfügbar

## 🔧 Troubleshooting

### Häufige Probleme
**Login funktioniert nicht:**
- Benutzername: `admin` (nicht E-Mail!)
- Passwort: `admin123`
- Cache leeren und erneut versuchen

**Tests werden nicht gespeichert:**
- Auf "Test speichern [X]" Button klicken
- Backend-Verbindung prüfen
- Admin-Rechte erforderlich

**Layout zu klein/groß:**
- Browser auf 67% Zoom einstellen
- Oder Sidebar mit Drag-Handle anpassen

### Browser-Kompatibilität  
- **Chrome/Edge**: Vollständig unterstützt ✅
- **Firefox**: Vollständig unterstützt ✅  
- **Safari**: Grundfunktionen ✅
- **Mobile**: Responsive Design ✅

## 👥 Rollen & Berechtigungen

### Administrator
- Vollzugriff auf alle Funktionen
- Testdaten-Generierung
- Benutzer-Management
- System-Einstellungen  
- Export/Import

### QA-Tester
- Test-Erstellung und -Bearbeitung
- Status-Updates
- Report-Generierung
- Basis-Export Funktionen

## 📝 Tipps & Best Practices

### Effektives Test-Management
1. **Klare Namensgebung**: Aussagekräftige Test-Namen verwenden
2. **Status aktuell halten**: Regelmäßig Status updaten  
3. **Notizen nutzen**: Detaillierte Beschreibungen hinzufügen
4. **Filter verwenden**: Große Test-Suiten organisieren

### Performance-Optimierung
- **Regelmäßige Archivierung**: Alte Tests archivieren
- **Batch-Operations**: Mehrere Tests gleichzeitig bearbeiten
- **Filter aktiv nutzen**: Nur relevante Tests anzeigen

### Sicherheit
- **Regelmäßige Backups**: Testdaten exportieren
- **Passwörter ändern**: Standard-Passwörter anpassen
- **Zugriffsrechte prüfen**: Nur erforderliche Berechtigungen vergeben

## 🆘 Support

### Dokumentation
- **Technische Docs**: `/TECHNICAL_DOCUMENTATION.md`
- **API-Dokumentation**: Backend Swagger UI
- **Changelog**: Git Commit History

### Häufige Fragen
**Q: Wie kann ich das Design anpassen?**  
A: Dark/Light Mode in Einstellungen → Darstellung

**Q: Kann ich eigene Test-Kategorien erstellen?**  
A: Aktuell über Admin-Panel möglich

**Q: Wie exportiere ich alle Daten?**  
A: Export-Button → CSV Export für vollständigen Datenexport

---

**Version**: v2.1.1-stable  
**Letztes Update**: 10. Januar 2025  
**Support**: Über Admin-Panel oder technische Dokumentation
