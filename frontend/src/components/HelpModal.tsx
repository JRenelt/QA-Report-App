import React, { useState } from 'react';
import { X, Book, Code, Download, HelpCircle } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  currentUser?: any;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, darkMode, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'technical' | 'installation'>('manual');

  if (!isOpen) return null;

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        {/* Modal */}
        <div className={`inline-block align-bottom ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full`}>
          {/* Header */}
          <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <HelpCircle className="inline h-6 w-6 mr-2" />
                Systemdokumentation
              </h2>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X className={`h-6 w-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <nav className="flex -mb-px px-6">
              <button
                onClick={() => setActiveTab('manual')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'manual'
                    ? 'border-qa-primary-500 text-qa-primary-600'
                    : `border-transparent ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
                }`}
              >
                <Book className="inline h-4 w-4 mr-2" />
                Benutzerhandbuch
              </button>
              {/* Technische Dokumentation & Installation nur für Admins */}
              {isAdmin && (
                <>
                  <button
                    onClick={() => setActiveTab('technical')}
                    className={`py-4 px-6 border-b-2 font-medium text-sm ${
                      activeTab === 'technical'
                        ? 'border-qa-primary-500 text-qa-primary-600'
                        : `border-transparent ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
                    }`}
                  >
                    <Code className="inline h-4 w-4 mr-2" />
                    Technische Dokumentation
                  </button>
                  <button
                    onClick={() => setActiveTab('installation')}
                    className={`py-4 px-6 border-b-2 font-medium text-sm ${
                      activeTab === 'installation'
                        ? 'border-qa-primary-500 text-qa-primary-600'
                        : `border-transparent ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
                    }`}
                  >
                    <Download className="inline h-4 w-4 mr-2" />
                    Installation
                  </button>
                </>
              )}
            </nav>
          </div>

          {/* Content */}
          <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
            {/* BENUTZERHANDBUCH */}
            {activeTab === 'manual' && (
              <div className={`space-y-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <section>
                  <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    QA-Report-App Benutzerhandbuch
                  </h3>
                  <p className="mb-4">
                    Willkommen zur QA-Report-App! Diese Anwendung hilft Ihnen bei der Verwaltung und Dokumentation 
                    von Qualitätssicherungs-Tests für Ihre Projekte.
                  </p>
                </section>

                <section>
                  <h4 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    1. Erste Schritte
                  </h4>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Anmelden:</strong> Verwenden Sie Ihre Zugangsdaten (Standard: admin/admin123)</li>
                    <li><strong>Dashboard:</strong> Nach dem Login sehen Sie eine Übersicht aller Firmen, Projekte und Test-Suiten</li>
                    <li><strong>Dark Mode:</strong> Klicken Sie auf das Mond/Sonne-Symbol rechts oben zum Umschalten</li>
                  </ul>
                </section>

                <section>
                  <h4 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    2. Firmen-Verwaltung
                  </h4>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Neue Firma anlegen:</strong> Klicken Sie auf "+ Neu hinzufügen" im Firmen-Tab</li>
                    <li><strong>Firma bearbeiten:</strong> Nutzen Sie das Stift-Symbol in der Aktionen-Spalte</li>
                    <li><strong>Firma löschen:</strong> Klicken Sie auf das Papierkorb-Symbol (nur wenn keine Projekte vorhanden)</li>
                  </ul>
                </section>

                <section>
                  <h4 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    3. Projekt-Management
                  </h4>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Projekt erstellen:</strong> Wählen Sie eine Firma und erstellen Sie ein neues Projekt</li>
                    <li><strong>Templates:</strong> Wählen Sie zwischen Web-App, Mobile-App oder API-Testing</li>
                    <li><strong>Test-Suiten:</strong> Werden automatisch basierend auf dem Template erstellt</li>
                  </ul>
                </section>

                <section>
                  <h4 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    4. Test-Durchführung
                  </h4>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Test-Fälle:</strong> Jede Test-Suite enthält vordefinierte Test-Fälle</li>
                    <li><strong>Status setzen:</strong> Erfolgreich (grün), Fehler (rot), Warnung (gelb), Übersprungen (grau)</li>
                    <li><strong>Notizen:</strong> Fügen Sie zu jedem Test detaillierte Notizen hinzu</li>
                  </ul>
                </section>

                <section>
                  <h4 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    5. Import/Export
                  </h4>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Excel Import:</strong> Importieren Sie Test-Fälle aus Excel-Dateien</li>
                    <li><strong>PDF Export:</strong> Erstellen Sie professionelle QA-Reports als PDF</li>
                    <li><strong>CSV Export:</strong> Exportieren Sie Daten für weitere Analysen</li>
                  </ul>
                </section>

                <section>
                  <h4 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    6. Archiv-Funktion
                  </h4>
                  <p className="mb-2">
                    Erstellen Sie Snapshots Ihrer Projekte, um den Status zu einem bestimmten Zeitpunkt zu speichern.
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Archiv erstellen:</strong> Speichert alle Test-Daten eines Projekts</li>
                    <li><strong>Wiederherstellen:</strong> Stellt ein archiviertes Projekt wieder her</li>
                  </ul>
                </section>
              </div>
            )}

            {/* TECHNISCHE DOKUMENTATION - Nur für Admins */}
            {activeTab === 'technical' && isAdmin && (
              <div className={`space-y-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <section>
                  <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Technische Dokumentation
                  </h3>
                </section>

                <section>
                  <h4 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Systemarchitektur
                  </h4>
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <ul className="space-y-2">
                      <li><strong>Frontend:</strong> React 18 + TypeScript + Tailwind CSS</li>
                      <li><strong>Backend:</strong> FastAPI (Python 3.11+)</li>
                      <li><strong>Datenbank:</strong> MongoDB 6.0+</li>
                      <li><strong>Authentifizierung:</strong> JWT (JSON Web Tokens)</li>
                      <li><strong>PDF Generation:</strong> ReportLab</li>
                      <li><strong>Excel Processing:</strong> openpyxl + pandas</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h4 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    API Endpoints
                  </h4>
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} font-mono text-sm`}>
                    <div className="space-y-1">
                      <div><span className="text-green-500">POST</span> /api/auth/login</div>
                      <div><span className="text-blue-500">GET</span> /api/users/</div>
                      <div><span className="text-blue-500">GET</span> /api/companies/</div>
                      <div><span className="text-blue-500">GET</span> /api/projects/</div>
                      <div><span className="text-green-500">POST</span> /api/test-cases/</div>
                      <div><span className="text-green-500">POST</span> /api/test-results/</div>
                      <div><span className="text-blue-500">GET</span> /api/pdf-reports/generate/:id</div>
                      <div><span className="text-green-500">POST</span> /api/import-export/import-excel/:id</div>
                      <div><span className="text-blue-500">GET</span> /api/archive/</div>
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Datenbank-Schema
                  </h4>
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <ul className="space-y-2">
                      <li><strong>users:</strong> Benutzerkonten und Authentifizierung</li>
                      <li><strong>companies:</strong> Firmen-Informationen</li>
                      <li><strong>projects:</strong> Projekt-Daten mit Template-Typ</li>
                      <li><strong>test_suites:</strong> Test-Suiten (Kategorien)</li>
                      <li><strong>test_cases:</strong> Individuelle Test-Fälle</li>
                      <li><strong>test_results:</strong> Test-Ergebnisse mit Zeitstempel</li>
                      <li><strong>archives:</strong> Projekt-Snapshots</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h4 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Sicherheit
                  </h4>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>JWT-Tokens mit 30 Minuten Gültigkeit</li>
                    <li>Bcrypt Password Hashing</li>
                    <li>CORS-Protection</li>
                    <li>Role-based Access Control (Admin, QA-Tester, Reviewer)</li>
                  </ul>
                </section>
              </div>
            )}

            {/* INSTALLATION - Nur für Admins */}
            {activeTab === 'installation' && isAdmin && (
              <div className={`space-y-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <section>
                  <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Installationsanleitung
                  </h3>
                </section>

                <section>
                  <h4 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Voraussetzungen
                  </h4>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Python 3.11 oder höher</li>
                    <li>Node.js 18 oder höher</li>
                    <li>MongoDB 6.0 oder höher</li>
                    <li>Yarn Package Manager</li>
                  </ul>
                </section>

                <section>
                  <h4 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Backend Installation
                  </h4>
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} font-mono text-sm`}>
                    <pre className="whitespace-pre-wrap">
{`# 1. Backend-Verzeichnis
cd backend

# 2. Virtual Environment erstellen
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\\Scripts\\activate   # Windows

# 3. Dependencies installieren
pip install -r requirements.txt

# 4. .env Datei konfigurieren
cp .env.example .env
# Bearbeiten Sie MONGO_URL und SECRET_KEY

# 5. Datenbank initialisieren
python init_db.py

# 6. Server starten
uvicorn server:app --host 0.0.0.0 --port 8001 --reload`}
                    </pre>
                  </div>
                </section>

                <section>
                  <h4 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Frontend Installation
                  </h4>
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} font-mono text-sm`}>
                    <pre className="whitespace-pre-wrap">
{`# 1. Frontend-Verzeichnis
cd frontend

# 2. Dependencies installieren
yarn install

# 3. .env Datei konfigurieren
cp .env.example .env
# Setzen Sie REACT_APP_BACKEND_URL

# 4. Development Server starten
yarn start

# 5. Production Build
yarn build`}
                    </pre>
                  </div>
                </section>

                <section>
                  <h4 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    MongoDB Setup
                  </h4>
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} font-mono text-sm`}>
                    <pre className="whitespace-pre-wrap">
{`# MongoDB Community Edition installieren
# https://www.mongodb.com/try/download/community

# MongoDB starten
mongod --dbpath /path/to/data

# Oder mit Docker:
docker run -d -p 27017:27017 \\
  --name mongodb \\
  -e MONGO_INITDB_ROOT_USERNAME=admin \\
  -e MONGO_INITDB_ROOT_PASSWORD=password \\
  mongo:6.0`}
                    </pre>
                  </div>
                </section>

                <section>
                  <h4 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Standard-Zugangsdaten
                  </h4>
                  <div className={`p-4 rounded-lg bg-yellow-50 border border-yellow-200 ${darkMode ? 'bg-opacity-20' : ''}`}>
                    <p className="font-mono">
                      <strong>Username:</strong> admin<br />
                      <strong>Password:</strong> admin123
                    </p>
                    <p className="text-sm text-yellow-700 mt-2">
                      ⚠️ Bitte ändern Sie diese Zugangsdaten nach der Installation!
                    </p>
                  </div>
                </section>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-qa-primary-600 hover:bg-qa-primary-700 text-white rounded-lg transition-colors"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
