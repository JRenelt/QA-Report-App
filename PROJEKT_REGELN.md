# QA-Report-App - Projekt-Regeln und Standards

## 🎯 Wichtige Projekt-Regeln

### AI-Agent Arbeitsregeln
**REGEL:** Kritische Arbeitsabläufe für AI-Agent
1. **Erledigte Aufgaben:** 
   - ❌ NIEMALS erledigte Aufgaben wieder auf "unerledigt" setzen
   - ✅ NUR User darf Aufgaben manuell auf "unerledigt" stellen
   - ✅ Bei Unsicherheit: User fragen, ob Aufgabe wirklich erledigt ist

2. **Projektregeln anzeigen:**
   - ✅ Nach JEDER Änderung an PROJEKT_REGELN.md die komplette Datei anzeigen
   - ✅ User muss Änderungen sofort sehen können

3. **Frontend-Kompilierungs-Check:**
   - ✅ Nach JEDER erledigten Aufgabe Frontend-Logs prüfen
   - ✅ Command: `tail -n 50 /var/log/supervisor/frontend.out.log | grep -i "compiled\|error\|failed"`
   - ✅ Auf "Compiled with problems:" oder andere Fehler prüfen
   - ✅ User SOFORT informieren wenn Frontend nicht kompiliert
   - ✅ Fehler NICHT ignorieren - Frontend muss immer zugänglich sein

### Entwicklungsumgebung
**REGEL:** User arbeitet mit 3 Browsern für Testing und Entwicklung
- **Chrome** (primär für Entwicklung und DevTools)
- **Edge** (Cross-Browser Testing)
- **Firefox** (Cross-Browser Testing)
- **WICHTIG:** Alle Frontend-Änderungen müssen in allen 3 Browsern getestet werden
- Browser-spezifische Probleme (z.B. Cache, Service Workers) müssen in allen 3 Browsern verifiziert werden

### Bekanntes Problem: CloudFront CDN Cache
**PROBLEM:** CloudFront CDN (d2adkz2s9zlge.cloudfront.net) cached alte JavaScript-Bundles
- **Symptom:** Browser lädt alte Version trotz Code-Änderungen und Rebuild
- **Ursache:** CDN-Cache wird nicht automatisch bei Code-Änderungen invalidiert
- **Lösung:** Emergent Support muss CDN-Cache manuell invalidieren
- **Workaround:** Rebuild allein reicht NICHT aus - CDN-Cache-Invalidierung erforderlich
- **Test ob behoben:** Console prüfen auf "Mixed Content: http://" Fehler - wenn weg, dann behoben
- **Support-Kontakt:** support@emergent.sh mit Job-ID und Preview-URL

### Bekannte Fehler-Muster
**REGEL:** JSX-Fragment-Error (häufiger Syntax-Fehler)
- **Symptom:** TypeScript-Fehler "Unexpected token" mit Zeichen wie `}`}>`
- **Ursache:** Bei Code-Ersetzungen bleiben versehentlich Syntax-Reste stehen
- **Prävention:**
  - Immer die komplette Zeile/Block prüfen nach Änderungen
  - TypeScript-Compiler-Fehler sofort checken
  - `tail -n 50 /var/log/supervisor/frontend.out.log` nach jeder Änderung ausführen
- **Lösung:** Fehlerhafte Syntax-Reste manuell entfernen

### Test-ID Format
**REGEL:** Anfangsbuchstabe JEDES Wortes im Titel des Testfalles + laufende Nummer (3-stellig)
- **Format:** `[BUCHSTABEN][NUMMER]` (z.B. LDD001, SLMEP002)
- Sonderzeichen die als Leerzeichen behandelt werden: & / % - + = ( ) [ ] { } < > | \ : ; , . ? ! " ' ` ~ @ # $ ^ * _
- Umlaute bleiben erhalten (Ä, Ö, Ü)
- Laufende Nummer: 3-stellig mit führenden Nullen (001, 002, 003, ...)
- Beispiele:
  - "Logo Darstellung Desktop" → **LDD001** (3 Wörter + Nr. 001)
  - "Navigation Menü" → **NM002** (2 Wörter + Nr. 002)
  - "Modal Öffnen & Schließen" → **MÖS003** (& = Leerzeichen, 3 Wörter + Nr. 003)
  - "User-Verwaltung/Admin" → **UVA004** (- und / = Leerzeichen, 3 Wörter + Nr. 004)
  - "Performance (100% CPU)" → **P1C005** (Klammern und % = Leerzeichen, 3 Wörter + Nr. 005)

### Datenhaltung
**REGEL:** Alle Client-seitigen Daten in localStorage
- Firmen: `qa_companies`
- Projekte: `qa_projects`
- Test-Suites: `qa_suites_{projectId}`
- Test-Cases: `qa_cases_{projectId}`

### Rollen-System
**REGEL:** Drei Rollen mit unterschiedlichen Berechtigungen

**1. SysOp (System-Operator)**
- **Höchste Rechte** im gesamten System
- Kann ALLE User sehen und verwalten (inkl. Admins)
- Kann Firmen anlegen, bearbeiten, löschen
- Kann User mit Rollen "admin" und "qa_tester" anlegen
- Kann KEINE weiteren SysOps anlegen (nur "jre" existiert)
- Zugriff auf alle Systemfunktionen
- **User:** Jörg Renelt (jre) bei Firma ID2.de

**2. Admin (Administrator)**
- Kann Firmen anlegen, bearbeiten, löschen
- Kann User mit Rollen "admin" und "qa_tester" für alle Firmen anlegen
- Kann KEINE SysOps anlegen oder sehen
- Kann KEINE SysOps bearbeiten oder löschen
- Voller Zugriff auf eigene Firma und alle anderen Firmen (außer ID2 SysOp)

**3. QA-Tester**
- Kann NUR eigenes Profil bearbeiten
- Kann KEINE User anlegen oder löschen
- Sieht NUR sich selbst in der User-Verwaltung
- Kann Tests erstellen, bearbeiten, ausführen
- Zugriff nur auf eigene Firma

### Geschützte Daten
**REGEL:** ID2 GmbH ist die System-Firma und DARF NICHT gelöscht werden
- Bei "Datenbank leeren": Alle Firmen löschen AUSSER ID2
- Papierkorb-Symbol bei ID2 ausblenden
- ID2 muss immer in localStorage vorhanden sein

**REGEL:** SysOp-User "Jörg Renelt" DARF NIEMALS gelöscht werden
- **Username:** `jre`
- **Password:** `sysop123` (ändern nach erstem Login!)
- **Firma:** ID2.de
- **Rolle:** SysOp (System-Administrator - höchste Rechte)
- **Wichtig:** Dieser User ist der einzige System-Administrator und muss IMMER existieren
- Bei "Datenbank leeren": User "jre" MUSS erhalten bleiben
- Papierkorb-Symbol bei diesem User ausblenden
- Kein Löschen über UI oder Backend möglich
- Kein Update der Rolle möglich (IMMER sysop bleiben)

**WARNUNG:** Passwort-Anzeige in Klarschrift (User-Management)
- Passwörter können temporär im Klartext angezeigt werden (Eye/EyeOff Toggle)
- Dies ist ein bewusstes Security-Risk auf Wunsch des Users
- Nur in User-Management Modal verfügbar (Create/Edit)
- Toggle wird beim Schließen des Modals zurückgesetzt
- **Hinweis:** In Production-Umgebung sollte dies deaktiviert werden

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
- **Glossar**: Nur für Admins zugänglich (Admin-Bereich)

### Backend-Routen
**REGEL:** Alle API-Routen MÜSSEN mit `/api` beginnen
- Richtig: `/api/admin/clear-database`
- Falsch: `/admin/clear-database`

### Frontend-Testing
**REGEL:** Nach jeder Änderung Frontend auf Anomalien und gewünschtes Ergebnis prüfen
- Screenshot-Tool verwenden, um visuelle Veränderungen zu überprüfen
- Browser-Console-Logs auf Fehler prüfen (capture_logs=true)
- Testen ob API-Calls erfolgreich sind (Network-Tab prüfen)
- Fehlermeldungen im UI auf Korrektheit prüfen
- Daten-Synchronisation zwischen Backend und Frontend verifizieren
- localStorage-Status nach Operationen prüfen
- **WICHTIG**: Bei "Failed to fetch" oder ähnlichen Fehlern IMMER Browser-Console und Network-Tab prüfen

### Browser-Cache Management
**REGEL:** Bei persistenten Problemen trotz Code-Änderungen muss der Browser-Cache geleert werden

**Methode 1: Cache über F12 (Entwickler-Konsole) leeren**
1. F12 drücken (Entwickler-Tools öffnen)
2. **Application Tab** wählen
3. Links: **"Lokaler Speicher"** erweitern
4. Auf `https://report-qa-portal.preview.emergentagent.com` klicken
5. Alle Keys/Einträge auf der rechten Seite auswählen
6. **Delete-Taste** drücken oder Button "Websitedaten löschen" verwenden
7. Optional: **"Service Workers"** → Alle "Unregister" klicken
8. **Seite neu laden** (F5 oder Strg+Shift+R)

**Methode 2: Cache über Browser-Einstellungen löschen**
1. **Strg + Shift + Delete** drücken
2. **"Bilder und Dateien im Cache"** auswählen
3. Zeitraum: **"Alle Zeit"** oder **"Letzte 24 Stunden"**
4. **"Daten löschen"** klicken
5. **Hard Refresh**: Strg + Shift + R

**Methode 3: Cache während Entwicklung deaktivieren**
1. F12 (DevTools öffnen)
2. Oben rechts: **3 Punkte (⋮)** → **Settings**
3. Unter **"Network"**: Aktivieren Sie **"Disable cache (while DevTools is open)"**
4. **DevTools OFFEN LASSEN** während der Entwicklung

**Wann Cache leeren?**
- Nach größeren Code-Änderungen am Frontend
- Bei "Mixed Content" Fehlern (HTTP vs HTTPS)
- Wenn alte JavaScript-Versionen trotz Rebuild geladen werden
- Bei persistenten "Failed to fetch" Fehlern
- Wenn localStorage-Daten inkonsistent sind

### Systemanalyse-Seite
**REGEL:** Referenz zur System-Analyse-Seite
- **URL:** `https://report-qa-portal.preview.emergentagent.com/system-analyse.html`
- **Kurzname:** Wenn User von dieser Seite spricht, wird sie zukünftig "systemanalyse.html" genannt
- **Zweck:** Diese Seite dient zur System-Analyse und Diagnostik der Applikation
- **WICHTIG:** User verwendet diesen Kurznamen zur vereinfachten Kommunikation

### Fehler-Management-System
**REGEL:** Interaktives Fehler-Management-Wiki
- **URL:** `https://report-qa-portal.preview.emergentagent.com/fehler-management.html`
- **Kurzname:** "fehler-management.html" oder "Fehler-Wiki"
- **Datei:** `/app/frontend/public/fehler-management.html`
- **Zweck:** Umfassende Dokumentation aller Frontend/Backend-Fehler, Design-Anomalien und Systemprobleme
- **Features:**
  - Vollständige Analyse aller Buttons, Links und API-Endpoints
  - Design-Anomalien-Tracking
  - Systemeinstellungen-Prüfung
  - Interaktives Status-Management (Offen ↔ Erledigt)
  - Erledigte Items: Grüner "ERLEDIGT"-Badge + Zeitstempel
  - Hypertext-Navigation zwischen Fehler-Kategorien
  - Gruppierung nach: Kritisch, Wichtig, Klein, Design, Code-Qualität
  - Bekannte Fehler-Muster Sektion (z.B. JSX-Fragment-Error)
- **Aktualisierung:** 
  - Automatisch bei neuen Bugs durch AI-Agent
  - Manuell durch User über UI-Buttons
  - Zeitstempel wird bei Status-Änderung gespeichert in localStorage
- **WICHTIG:** Alle Fehler müssen reproduzierbar und mit Code-Referenzen dokumentiert sein
- **Status-Persistenz:** LocalStorage speichert erledigte/offene Status pro Fehler-ID

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
