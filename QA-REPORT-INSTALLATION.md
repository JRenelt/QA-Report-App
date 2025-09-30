# 🚀 QA-Report-App Installation & Setup Guide

## 📋 Übersicht
Die QA-Report-App ist ein eigenständiges Test-Management-System mit FastAPI Backend, React Frontend und SQLite/PostgreSQL Datenbank-Unterstützung.

## 🔧 System-Anforderungen

### Lokale Entwicklungsumgebung (XAMPP + Python)
- **Python**: 3.8+ 
- **Node.js**: 16+ 
- **XAMPP**: Für lokale Webserver-Tests (optional)
- **Git**: Für Code-Verwaltung

### Produktionsumgebung (Hostsharing.net)
- **Python**: 3.8+ mit pip
- **Node.js**: 16+ mit npm/yarn
- **PostgreSQL**: Für Produktionsdatenbank
- **Webserver**: Nginx/Apache mit Reverse Proxy

## 📁 Projekt-Struktur

```
qa-report-app/
├── backend/                    # FastAPI Backend
│   ├── main.py                # Haupt-Anwendung
│   ├── database.py            # Datenbank-Konfiguration
│   ├── models.py              # Pydantic Models
│   ├── auth.py                # JWT Authentifizierung
│   ├── init_db.py             # Datenbank-Initialisierung
│   ├── requirements.txt       # Python Dependencies
│   ├── .env                   # Backend Umgebungsvariablen
│   └── routes/                # API Endpunkte
│       ├── auth.py            # Login/Logout
│       ├── companies.py       # Firmen-Verwaltung
│       ├── projects.py        # Projekt-Verwaltung
│       ├── test_suites.py     # Test-Suite-Verwaltung
│       ├── test_cases.py      # Testfall-Verwaltung
│       └── test_results.py    # Test-Ergebnis-Verwaltung
├── frontend/                  # React Frontend
│   ├── src/
│   │   ├── App.tsx           # Haupt-Komponente
│   │   ├── components/       # React Komponenten
│   │   │   ├── LoginForm.tsx # Login-Formular
│   │   │   ├── Dashboard.tsx # Dashboard
│   │   │   └── TestSuiteManager.tsx # Test-Verwaltung
│   │   ├── index.css         # Tailwind CSS
│   │   └── main.jsx          # React Entry Point
│   ├── package.json          # Node.js Dependencies
│   ├── tailwind.config.js    # Tailwind Konfiguration
│   └── .env                  # Frontend Umgebungsvariablen
├── database/
│   └── schema.sql            # PostgreSQL Schema (optional)
├── templates/                # Import/Export Templates
│   ├── test-import-template.json
│   ├── test-import-template.csv
│   └── favorg-testpoints.json
├── docs/
│   ├── BENUTZERHANDBUCH.md   # Vollständiges Handbuch
│   └── TECHNICAL-DOCS.md     # Technische Dokumentation
└── README.md                 # Projekt-Übersicht
```

## 🛠️ Installation Schritt-für-Schritt

### 1. Code herunterladen
```bash
# Projekt-Ordner erstellen
mkdir qa-report-app
cd qa-report-app

# Code-Dateien kopieren (alle Dateien aus dem Projekt)
```

### 2. Backend Setup (FastAPI + SQLite)

```bash
# Backend-Ordner wechseln
cd backend

# Virtuelle Python-Umgebung erstellen
python -m venv venv

# Virtuelle Umgebung aktivieren
# Windows (XAMPP):
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Dependencies installieren
pip install -r requirements.txt

# Umgebungsvariablen konfigurieren
# Datei .env bearbeiten:
DATABASE_URL=sqlite:///./qa_report.db
JWT_SECRET_KEY=your-secret-key-hier-einfuegen
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Datenbank initialisieren
python init_db.py

# Backend starten
python main.py
```

**Backend läuft auf:** `http://localhost:8002`
**API Dokumentation:** `http://localhost:8002/docs`

### 3. Frontend Setup (React + Tailwind CSS)

```bash
# Frontend-Ordner wechseln (neues Terminal)
cd frontend

# Node.js Dependencies installieren
npm install
# oder
yarn install

# Umgebungsvariablen konfigurieren
# Datei .env bearbeiten:
REACT_APP_BACKEND_URL=http://localhost:8002
REACT_APP_API_VERSION=v1
REACT_APP_NAME=QA Report App

# Frontend starten
npm start
# oder
yarn start
```

**Frontend läuft auf:** `http://localhost:3000`

### 4. Demo-Login

**Öffnen Sie:** `http://localhost:3000`

**Login-Daten:**
- **Administrator**: `admin` / `admin123`
- **QA-Tester**: `qa_demo` / `demo123`

## 🌐 Produktions-Deployment (Hostsharing.net)

### 1. Code-Upload
```bash
# Code auf Server hochladen (via Git oder FTP)
git clone your-repository.git qa-report-app
cd qa-report-app
```

### 2. Backend-Konfiguration für Produktion
```bash
# .env für Produktion anpassen
DATABASE_URL=postgresql://username:password@localhost:5432/qa_report_db
JWT_SECRET_KEY=production-secret-key-very-secure
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
DEBUG=False
```

### 3. PostgreSQL Setup (falls gewünscht)
```sql
-- Datenbank erstellen
CREATE DATABASE qa_report_db;
CREATE USER qa_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE qa_report_db TO qa_user;

-- Schema importieren
psql -U qa_user -d qa_report_db < database/schema.sql
```

### 4. Systemd Service (für automatischen Start)
```ini
# /etc/systemd/system/qa-report-backend.service
[Unit]
Description=QA Report Backend
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/qa-report-app/backend
ExecStart=/path/to/venv/bin/python main.py
Restart=always

[Install]
WantedBy=multi-user.target
```

### 5. Nginx Reverse Proxy
```nginx
# /etc/nginx/sites-available/qa-report
server {
    listen 80;
    server_name yourdomain.com;
    
    # Frontend (React Build)
    location / {
        root /path/to/qa-report-app/frontend/build;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:8002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🔧 Entwicklung & Debugging

### Backend Tests
```bash
cd backend
python -m pytest  # Falls Tests vorhanden
```

### Frontend Build für Produktion
```bash
cd frontend
npm run build
# Build-Dateien in: frontend/build/
```

### Logs anzeigen
```bash
# Backend Logs
tail -f backend.log

# Frontend Development Logs
# Direkt in Browser Console
```

## 🚨 Troubleshooting

### Häufige Probleme

**Backend startet nicht:**
```bash
# Port bereits belegt prüfen
netstat -tulpn | grep 8002
# Anderen Port verwenden oder Prozess beenden
```

**Frontend kann Backend nicht erreichen:**
- Prüfen Sie REACT_APP_BACKEND_URL in .env
- CORS-Einstellungen im Backend prüfen
- Firewall-Einstellungen prüfen

**Datenbank-Fehler:**
```bash
# SQLite Datei-Berechtigungen prüfen
chmod 664 qa_report.db
# Oder neue Datenbank initialisieren
rm qa_report.db && python init_db.py
```

## 📞 Support

Bei Problemen:
1. Logs prüfen (Backend + Frontend)
2. Browser Developer Tools öffnen
3. API-Dokumentation konsultieren: `http://localhost:8002/docs`
4. GitHub Issues erstellen (falls Repository vorhanden)

## 🔄 Updates

```bash
# Code aktualisieren
git pull origin main

# Backend Dependencies aktualisieren
cd backend && pip install -r requirements.txt

# Frontend Dependencies aktualisieren
cd frontend && npm install

# Datenbank-Migration (falls nötig)
python init_db.py
```

---

**Erstellt:** $(date)  
**Version:** 1.0.0  
**Kompatibilität:** Python 3.8+, Node.js 16+