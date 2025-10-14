# QA-Report-App - Projekt-Regeln und Standards

## 🎯 Wichtige Projekt-Regeln

### Test-ID Format
**REGEL:** Test-IDs bestehen aus den Anfangsbuchstaben der Wörter im Titel
- Sonderzeichen (&, /, %, -, etc.) werden als Leerzeichen behandelt
- Beispiele:
  - "Logo Darstellung Desktop" → **LDD**
  - "Navigation Menü" → **NM**
  - "Modal Öffnen & Schließen" → **MÖS**
  - "Collapse & Expand" → **CE**

### Datenhaltung
**REGEL:** Alle Client-seitigen Daten in localStorage
- Firmen: `qa_companies`
- Projekte: `qa_projects`
- Test-Suites: `qa_suites_{projectId}`
- Test-Cases: `qa_cases_{projectId}`

### Geschützte Daten
**REGEL:** ID2 GmbH ist die System-Firma und DARF NICHT gelöscht werden
- Bei "Datenbank leeren": Alle Firmen löschen AUSSER ID2
- Papierkorb-Symbol bei ID2 ausblenden
- ID2 muss immer in localStorage vorhanden sein

### Firmen & Projekte
**REGEL:** Kaskadierendes Löschen
- Firma löschen → Automatisch alle Projekte der Firma löschen
- Projekt löschen → Test-Suites und Test-Cases aus localStorage löschen
- Alle Änderungen sofort in localStorage speichern

### UI/UX Standards
- **Counter-Position**: Oben rechts neben "Projekt-Auswahl" Header
- **Dropdown-Breite**: Volle Breite unter dem Header
- **Sidebar-Breite**: Dynamisch, mindestens 280px
- **Dark Mode**: Alle Komponenten müssen Dark Mode unterstützen

### Backend-Routen
**REGEL:** Alle API-Routen MÜSSEN mit `/api` beginnen
- Richtig: `/api/admin/clear-database`
- Falsch: `/admin/clear-database`

### Lokalisierung
**REGEL:** Alle UI-Texte auf Deutsch
- Buttons, Labels, Meldungen
- Fehlermeldungen
- Tooltips

## 📝 Technische Vorgaben

### TypeScript
- Explizite Typen für alle Parameter
- `any` nur wenn unbedingt nötig
- Interface-Definitionen für alle komplexen Objekte

### localStorage Synchronisation
- Polling alle 2 Sekunden für Firmen und Projekte
- Automatisches Speichern bei Änderungen via useEffect
- Fallback zu Standard-Werten wenn localStorage leer

### Testing
- User testet Frontend manuell
- Backend-Tests nur wenn Backend-Änderungen vorgenommen wurden
- Kein automatisches Testing ohne Bestätigung

## 🚫 Verboten

1. ❌ Hardcoded Firmen/Projekte außer ID2 als Fallback
2. ❌ ID2 GmbH löschen oder umbenennen
3. ❌ URLs oder Ports in .env-Dateien ändern
4. ❌ MongoDB ObjectID verwenden (nur UUIDs!)
5. ❌ npm verwenden (nur yarn!)

## ✅ Best Practices

1. ✅ Immer TypeScript-Fehler prüfen vor Build
2. ✅ localStorage-Änderungen sofort committen
3. ✅ Console-Logging für Debugging hinzufügen
4. ✅ Error-Messages benutzerfreundlich auf Deutsch
5. ✅ Bestätigungs-Dialoge bei kritischen Aktionen

---

**Letzte Aktualisierung:** 2025-10-14
**Version:** 1.0
