# QA-Report-App

Deutschsprachige QA-Management-Anwendung für Test-Berichte und Projekt-Verwaltung.

## 📚 Wichtige Dokumentation

- **[PROJEKT_REGELN.md](./PROJEKT_REGELN.md)** - Alle Projekt-spezifischen Regeln und Standards
- **[TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md)** - Technische Details

## 🚀 Quick Start

1. **Backend starten**: `sudo supervisorctl start backend`
2. **Frontend starten**: `sudo supervisorctl start frontend`
3. **Status prüfen**: `sudo supervisorctl status all`

## 🏗️ Tech Stack

- **Backend**: FastAPI + MongoDB + JWT Auth
- **Frontend**: React + TypeScript + Tailwind CSS
- **Deployment**: Supervisor + Kubernetes

## 📝 Wichtige Regeln

⚠️ **IMMER PROJEKT_REGELN.md beachten!**

- Test-IDs: Anfangsbuchstaben der Wörter (z.B. "Logo Darstellung Desktop" → LDD)
- ID2 GmbH ist geschützt und darf nicht gelöscht werden
- Alle Daten in localStorage (qa_companies, qa_projects, etc.)
- Alle UI-Texte auf Deutsch

## 🔗 Links

- Template-Download: https://testflow-app-3.preview.emergentagent.com/test-import-template-v2.json
- API-Docs: `/api/docs`

---

**Für AI-Agenten:** Lies immer zuerst `/app/PROJEKT_REGELN.md` für alle Projekt-Standards.
