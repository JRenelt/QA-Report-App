import React, { useState } from 'react';
import { X, Sun, Moon, AlertTriangle, Database, FileDown, FileUp, Trash2, RotateCcw, CheckCircle, XCircle } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  authToken: string;
  initialTab?: 'appearance' | 'import-export' | 'advanced';
  currentUser?: any;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, darkMode, toggleDarkMode, authToken, initialTab, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'import-export' | 'advanced'>(initialTab || 'appearance');
  const [itemsPerPage, setItemsPerPage] = useState(localStorage.getItem('itemsPerPage') || '10');
  const [showTooltips, setShowTooltips] = useState(localStorage.getItem('showTooltips') !== 'false');
  const [messageDelay, setMessageDelay] = useState(parseInt(localStorage.getItem('messageDelay') || '3000'));
  const [manualTooltipClose, setManualTooltipClose] = useState(localStorage.getItem('manualTooltipClose') === 'true');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Set initial tab when modal opens
  React.useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const isAdmin = currentUser?.role === 'admin';

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(value);
    localStorage.setItem('itemsPerPage', value);
    
    // Custom Event senden für sofortige Synchronisation
    const event = new CustomEvent('settingsChanged', {
      detail: { type: 'itemsPerPage', value: parseInt(value) }
    });
    window.dispatchEvent(event);
    
    showMessage('success', 'Einstellungen gespeichert');
  };

  const handleTooltipsToggle = () => {
    const newValue = !showTooltips;
    setShowTooltips(newValue);
    localStorage.setItem('showTooltips', newValue.toString());
    showMessage('success', 'Tooltip-Einstellungen aktualisiert');
  };

  const handleMessageDelayChange = (value: string) => {
    const numValue = parseInt(value);
    setMessageDelay(numValue);
    localStorage.setItem('messageDelay', value);
  };

  const handleManualTooltipToggle = () => {
    const newValue = !manualTooltipClose;
    setManualTooltipClose(newValue);
    localStorage.setItem('manualTooltipClose', newValue.toString());
    showMessage('success', 'Tooltip-Verhalten aktualisiert');
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleGenerateTestData = async () => {
    // Admin-Überprüfung
    if (!authToken) {
      showMessage('error', '❌ Nicht authentifiziert. Bitte neu anmelden.');
      return;
    }
    
    // Rollenbasierte Limits
    const limits = isAdmin 
      ? { companies: 15, testsPerProject: 100, message: '15 Firmen mit je 100 Testfällen' }
      : { companies: 1, testsPerProject: 10, message: '1 Projekt mit 10 Testbereichen à 10 Testfällen' };
    
    if (!confirm(`⚠️ WARNUNG: Diese Aktion löscht ALLE vorhandenen Daten und erstellt neue Testdaten.\n\n${limits.message} werden generiert.\n\nMöchten Sie fortfahren?`)) {
      return;
    }

    setLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://testsync-pro.preview.emergentagent.com';
      console.log('🔍 DEBUG: Backend URL:', backendUrl);
      console.log('🔍 DEBUG: Making request to:', `${backendUrl}/api/admin/generate-test-data`);
      console.log('🔍 DEBUG: Auth Token available:', !!authToken);
      
      const response = await fetch(`${backendUrl}/api/admin/generate-test-data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          companies: limits.companies,
          testsPerCompany: limits.testsPerProject
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Lade die neuen Firmen aus dem Backend und speichere in localStorage
        console.log('Lade Firmen aus Backend...');
        const companiesResponse = await fetch(`${backendUrl}/api/companies`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          }
        });
        
        if (companiesResponse.ok) {
          const companies = await companiesResponse.json();
          localStorage.setItem('qa_companies', JSON.stringify(companies));
          console.log(`✅ ${companies.length} Firmen in localStorage gespeichert`);
        }
        
        // Lade die Projekte aus dem Backend
        console.log('Lade Projekte aus Backend...');
        const projectsResponse = await fetch(`${backendUrl}/api/projects`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          }
        });
        
        if (projectsResponse.ok) {
          const projects = await projectsResponse.json();
          localStorage.setItem('qa_projects', JSON.stringify(projects));
          console.log(`✅ ${projects.length} Projekte in localStorage gespeichert`);
        }
        
        showMessage('success', `✅ Testdaten erstellt: ${data.companies} Firmen, ${data.testCases} Testfälle`);
        setTimeout(() => window.location.reload(), 2000);
      } else {
        const errorText = await response.text();
        console.error('Backend-Fehler:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('Testdaten-Generierung Fehler:', error);
      showMessage('error', `❌ Fehler beim Erstellen der Testdaten: ${error instanceof Error ? error.message : error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeDatabase = async () => {
    if (!confirm('Datenbank optimieren?\n\nDiese Aktion komprimiert die MongoDB-Collections und verbessert die Performance.\nDies kann einige Sekunden dauern.')) {
      return;
    }

    setLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://testsync-pro.preview.emergentagent.com';
      console.log('Optimiere Datenbank, URL:', `${backendUrl}/api/admin/optimize-database`);
      console.log('Auth Token:', authToken ? 'vorhanden' : 'fehlt');
      
      const response = await fetch(`${backendUrl}/api/admin/optimize-database`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        }
      });

      console.log('Optimize Response Status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Optimize Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      showMessage('success', `✅ Datenbank optimiert: ${result.optimized} Collections komprimiert`);
    } catch (error) {
      showMessage('error', '❌ Fehler bei der Datenbank-Optimierung');
      console.error('Optimize database error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMassData = async () => {
    // SAFETY CHECK: Prüfe localStorage auf vorhandene Projekte
    const localProjects = localStorage.getItem('qa_projects');
    let hasLocalStorageProjects = false;
    
    if (localProjects) {
      try {
        const projects = JSON.parse(localProjects);
        hasLocalStorageProjects = Array.isArray(projects) && projects.length > 0;
      } catch (e) {
        console.warn('Fehler beim Parsen von qa_projects:', e);
      }
    }
    
    // Zusätzliche Prüfung: Suche nach qa_suites_* und qa_cases_* Keys
    const hasOtherProjectData = Object.keys(localStorage).some(key => 
      key.startsWith('qa_suites_') || key.startsWith('qa_cases_')
    );
    
    hasLocalStorageProjects = hasLocalStorageProjects || hasOtherProjectData;
    
    // Wenn Projekte gefunden → WARNUNG mit klarer Anweisung
    if (hasLocalStorageProjects) {
      showMessage('error', '❌ Masse-Daten-Import nicht möglich. Es sind bereits Projekte vorhanden. Bitte leeren Sie zuerst die Datenbank.');
      return;
    }
    
    if (!confirm('⚠️ WARNUNG: Masse-Daten generieren?\n\nDiese Funktion erstellt:\n• 50 Firmen\n• 50 Testbereiche pro Firma\n• 50 Testfälle pro Bereich\n\nGesamt: 125.000 Testfälle!\n\nDies dient NUR Performance-Tests und kann mehrere Minuten dauern.\n\nFortfahren?')) {
      return;
    }

    setLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://testsync-pro.preview.emergentagent.com';
      console.log('Generiere Masse-Daten...');
      console.log('LocalStorage Projekte vorhanden:', hasLocalStorageProjects);
      
      const response = await fetch(`${backendUrl}/api/admin/generate-mass-data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hasLocalStorageProjects: hasLocalStorageProjects
        })
      });

      console.log('Mass Data Response Status:', response.status);
      
      if (!response.ok) {
        // 409 Conflict = Projekte vorhanden
        if (response.status === 409) {
          try {
            const errorData = await response.json();
            console.error('Projekte bereits vorhanden:', errorData);
            const errorMessage = errorData.detail?.error || errorData.detail || 'Masse-Daten-Import nicht möglich. Es sind bereits Projekte vorhanden. Bitte leeren Sie zuerst die Datenbank.';
            showMessage('error', errorMessage);
          } catch (e) {
            showMessage('error', 'Masse-Daten-Import nicht möglich. Es sind bereits Projekte vorhanden. Bitte leeren Sie zuerst die Datenbank.');
          }
          return;
        }
        
        const errorText = await response.text();
        console.error('Mass Data Error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      // Lade die neuen Firmen aus dem Backend und speichere in localStorage
      console.log('Lade Firmen aus Backend...');
      const companiesResponse = await fetch(`${backendUrl}/api/companies`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        }
      });
      
      if (companiesResponse.ok) {
        const companies = await companiesResponse.json();
        localStorage.setItem('qa_companies', JSON.stringify(companies));
        console.log(`✅ ${companies.length} Firmen in localStorage gespeichert`);
      }
      
      // Lade die Projekte aus dem Backend
      console.log('Lade Projekte aus Backend...');
      const projectsResponse = await fetch(`${backendUrl}/api/projects`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        }
      });
      
      if (projectsResponse.ok) {
        const projects = await projectsResponse.json();
        localStorage.setItem('qa_projects', JSON.stringify(projects));
        console.log(`✅ ${projects.length} Projekte in localStorage gespeichert`);
      }
      
      showMessage('success', `✅ Masse-Daten generiert: ${result.stats.companies} Firmen, ${result.stats.test_cases} Testfälle in ${Math.round(result.duration_seconds)}s`);
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      showMessage('error', '❌ Fehler bei der Masse-Daten Generierung');
      console.error('Generate mass data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearDatabase = async () => {
    if (!confirm('🚨 GEFAHR: Diese Aktion löscht ALLE Projekte, Testdaten und Firmen (außer ID2)!\n\nALLE Firmen (außer ID2 GmbH), Projekte, Tests und Ergebnisse werden unwiderruflich gelöscht.\nDie Firma ID2 GmbH bleibt erhalten (Systemvoraussetzung).\n\nDiese Aktion kann NICHT rückgängig gemacht werden!\n\nMöchten Sie wirklich fortfahren?')) {
      return;
    }

    // Double confirmation
    const confirmText = prompt('Bitte geben Sie "LÖSCHEN" ein, um zu bestätigen:');
    if (confirmText !== 'LÖSCHEN') {
      showMessage('error', 'Aktion abgebrochen');
      return;
    }

    setLoading(true);
    try {
      // 1. Backend-Datenbank leeren
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://testsync-pro.preview.emergentagent.com';
      console.log('Leere Datenbank, URL:', `${backendUrl}/api/admin/clear-database`);
      console.log('Auth Token:', authToken ? 'vorhanden' : 'fehlt');
      
      const response = await fetch(`${backendUrl}/api/admin/clear-database`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        }
      });

      console.log('Clear Database Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Clear Database Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // 2. LocalStorage komplett leeren - ALLE qa_* Keys sammeln
      const keysToRemove: string[] = [];
      
      // Wichtig: Alle Keys ZUERST sammeln (nicht während Iteration löschen)
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('qa_projects') || 
          key.startsWith('qa_suites_') || 
          key.startsWith('qa_cases_') ||
          key === 'qa_companies'
        )) {
          keysToRemove.push(key);
        }
      }
      
      console.log(`LocalStorage: ${keysToRemove.length} Keys gefunden zum Löschen:`, keysToRemove);
      
      // Alle Keys löschen
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`✅ LocalStorage gelöscht: ${key}`);
      });
      
      // Zusätzlich: Sicherstellen, dass keine qa_* Keys mehr existieren
      const remainingKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('qa_') || key.includes('project') || key.includes('suite') || key.includes('case'))) {
          remainingKeys.push(key);
          localStorage.removeItem(key);
          console.log(`⚠️ Zusätzlich gelöscht: ${key}`);
        }
      }

      // 3. ID2 GmbH in localStorage wiederherstellen
      const id2Company = {
        id: 'ID2',
        name: 'ID2 GmbH',
        address: 'Brockhausweg 66b',
        city: 'Hamburg',
        postalCode: '22117',
        country: 'Deutschland',
        createdAt: new Date().toISOString(),
        usersCount: 2,
        projectsCount: 0
      };
      localStorage.setItem('qa_companies', JSON.stringify([id2Company]));
      localStorage.setItem('qa_projects', JSON.stringify([]));  // Leere Projekt-Liste
      console.log('✅ ID2 GmbH in localStorage wiederhergestellt');
      console.log('✅ Leere Projekt-Liste erstellt');

      showMessage('success', '✅ Datenbank geleert - Alle Firmen (außer ID2), Projekte und Testdaten gelöscht');
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      showMessage('error', '❌ Fehler beim Leeren der Datenbank');
      console.error('Clear database error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSettings = () => {
    if (!confirm('Möchten Sie alle Einstellungen auf die Standardwerte zurücksetzen?')) {
      return;
    }

    localStorage.removeItem('itemsPerPage');
    localStorage.removeItem('showTooltips');
    localStorage.removeItem('messageDelay');
    localStorage.removeItem('manualTooltipClose');
    localStorage.removeItem('darkMode');
    
    setItemsPerPage('10');
    setShowTooltips(true);
    setMessageDelay(3000);
    setManualTooltipClose(false);
    
    showMessage('success', '✅ Einstellungen zurückgesetzt');
    setTimeout(() => window.location.reload(), 1500);
  };

  const handleExportPDF = async () => {
    if (!authToken) {
      showMessage('error', '❌ Nicht authentifiziert');
      return;
    }

    // "Speichern unter" Dialog simulieren mit Dateiname-Auswahl
    const defaultName = `QA-Bericht_${new Date().toISOString().split('T')[0]}`;
    const fileName = prompt('PDF-Dateiname:', defaultName);
    
    if (!fileName) {
      showMessage('error', 'Export abgebrochen');
      return;
    }

    setLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://testsync-pro.preview.emergentagent.com';
      
      // Projekt-ID aus localStorage oder ersten verfügbaren Projekt
      const projects = JSON.parse(localStorage.getItem('qa_projects') || '[]');
      const projectId = projects[0]?.id || 'PROJ001';
      
      const response = await fetch(`${backendUrl}/api/pdf-reports/generate/${projectId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      showMessage('success', `✅ PDF gespeichert: ${fileName}.pdf`);
    } catch (error) {
      console.error('PDF Export Fehler:', error);
      showMessage('error', `❌ Fehler beim PDF-Export: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if (!authToken) {
      showMessage('error', '❌ Nicht authentifiziert');
      return;
    }

    // "Speichern unter" Dialog simulieren mit Dateiname-Auswahl
    const defaultName = `QA-Tests_${new Date().toISOString().split('T')[0]}`;
    const fileName = prompt('CSV-Dateiname:', defaultName);
    
    if (!fileName) {
      showMessage('error', 'Export abgebrochen');
      return;
    }

    setLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://testsync-pro.preview.emergentagent.com';
      
      // Projekt-ID aus localStorage
      const projects = JSON.parse(localStorage.getItem('qa_projects') || '[]');
      const projectId = projects[0]?.id || 'PROJ001';
      
      const response = await fetch(`${backendUrl}/api/export/csv/${projectId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      showMessage('success', `✅ CSV gespeichert: ${fileName}.csv`);
    } catch (error) {
      console.error('CSV Export Fehler:', error);
      showMessage('error', `❌ Fehler beim CSV-Export: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        {/* Modal */}
        <div className={`inline-block align-bottom ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full`}>
          {/* Header */}
          <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Systemeinstellungen
              </h2>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X className={`h-6 w-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>
            </div>
          </div>

          {/* Message Banner */}
          {message && (
            <div className={`px-6 py-3 ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border-b`}>
              <div className="flex items-center">
                {message.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 mr-2" />
                )}
                <span className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
                  {message.text}
                </span>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <nav className="flex -mb-px px-6">
              <button
                onClick={() => setActiveTab('appearance')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'appearance'
                    ? 'border-qa-primary-500 text-qa-primary-600'
                    : `border-transparent ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
                }`}
              >
                <Sun className="inline h-4 w-4 mr-2" />
                Darstellung
              </button>
              <button
                onClick={() => setActiveTab('import-export')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'import-export'
                    ? 'border-qa-primary-500 text-qa-primary-600'
                    : `border-transparent ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
                }`}
              >
                <FileDown className="inline h-4 w-4 mr-2" />
                Import/Export
              </button>
              <button
                onClick={() => setActiveTab('advanced')}
                className={`py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === 'advanced'
                    ? 'border-qa-primary-500 text-qa-primary-600'
                    : `border-transparent ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
                }`}
              >
                <Database className="inline h-4 w-4 mr-2" />
                Erweiterte Einstellungen
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
            {/* 1. DARSTELLUNG */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Design & Anzeige
                  </h3>
                  
                  {/* Dark Mode Toggle */}
                  <div className={`flex items-center justify-between p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div>
                      <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Design-Modus
                      </div>
                      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Zwischen hellem und dunklem Design wechseln
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={!darkMode ? undefined : toggleDarkMode}
                        className={`p-2 rounded-lg transition-colors ${
                          !darkMode 
                            ? 'bg-yellow-100 text-yellow-600 border border-yellow-300' 
                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }`}
                        title="Heller Modus"
                      >
                        <Sun className="h-5 w-5" />
                      </button>
                      <button
                        onClick={darkMode ? undefined : toggleDarkMode}
                        className={`p-2 rounded-lg transition-colors ${
                          darkMode 
                            ? 'bg-blue-600 text-white border border-blue-400' 
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                        title="Dunkler Modus"
                      >
                        <Moon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Entries per page */}
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <label className={`block font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Einträge pro Seite: {itemsPerPage}
                    </label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(e.target.value)}
                      className={`w-full p-2 border rounded ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="15">15</option>
                      <option value="20">20</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                    </select>
                  </div>

                  {/* Tooltip-Einstellungen */}
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <h4 className={`font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Tooltip-Einstellungen
                    </h4>
                    
                    {/* Show tooltips */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          Allgemeine Tooltips
                        </div>
                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Hilfetext beim Überfahren anzeigen
                        </div>
                      </div>
                      <button
                        onClick={handleTooltipsToggle}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          showTooltips ? 'bg-qa-primary-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            showTooltips ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Tooltip Delay */}
                    <div>
                      <div className={`font-medium text-sm mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Tooltip-Verzögerung
                      </div>
                      <div className="grid grid-cols-5 gap-1">
                        {[
                          { key: 'sofort', label: 'Sofort', value: '0', desc: '0ms' },
                          { key: 'schnell', label: 'Schnell', value: '200', desc: '0.2s' },
                          { key: 'normal', label: 'Normal', value: '500', desc: '0.5s' },
                          { key: 'langsam', label: 'Langsam', value: '1000', desc: '1s' },
                          { key: 'sehrlangsam', label: 'Sehr langsam', value: '2000', desc: '2s' }
                        ].map((option) => (
                          <button
                            key={option.key}
                            onClick={() => handleMessageDelayChange(option.value)}
                            className={`p-2 rounded text-center transition-all border text-xs ${
                              messageDelay === parseInt(option.value)
                                ? darkMode 
                                  ? 'bg-cyan-600 border-cyan-400 text-white' 
                                  : 'bg-cyan-500 border-cyan-300 text-white'
                                : darkMode
                                  ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <div className="font-medium">{option.label}</div>
                            <div className="opacity-75">{option.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. IMPORT/EXPORT */}
            {activeTab === 'import-export' && (
              <div className="space-y-6">
                <div>
                  <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Daten-Management
                  </h3>

                  {/* Export */}
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <h4 className={`font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      QA-Report Export
                    </h4>
                    <div className="flex space-x-3">
                      <button
                        onClick={handleExportPDF}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        <FileDown className="inline h-4 w-4 mr-2" />
                        PDF Export
                      </button>
                      <button
                        onClick={handleExportCSV}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        <FileDown className="inline h-4 w-4 mr-2" />
                        CSV Export
                      </button>
                    </div>
                  </div>

                  {/* Test Data Generation */}
                  <div className={`mt-4 p-4 rounded-lg border-2 border-yellow-500 ${darkMode ? 'bg-yellow-900 bg-opacity-20' : 'bg-yellow-50'}`}>
                    <div className="flex items-start mb-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                      <div>
                        <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          Testdaten erstellen
                        </h4>
                        <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {isAdmin 
                            ? 'Erstellt 15 Firmen mit je 100 Testfällen' 
                            : 'Erstellt 1 Projekt mit 10 Testbereichen à 10 Testfällen'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleGenerateTestData}
                      disabled={loading}
                      className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Wird erstellt...' : 'Testdaten generieren'}
                    </button>
                    <p className="text-xs text-yellow-600 mt-2">
                      ⚠️ Warnung: Löscht alle vorhandenen Daten!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. ERWEITERTE EINSTELLUNGEN */}
            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <div>
                  <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Erweiterte Optionen
                  </h3>

                  {/* Message Delay - 5 Stufen System */}
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <label className={`block font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Tooltip-Verzögerung
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        { key: 'sofort', label: 'Sofort', value: '0', desc: '0ms' },
                        { key: 'schnell', label: 'Schnell', value: '200', desc: '0.2s' },
                        { key: 'normal', label: 'Normal', value: '500', desc: '0.5s' },
                        { key: 'langsam', label: 'Langsam', value: '1000', desc: '1s' },
                        { key: 'sehrlangsam', label: 'Sehr langsam', value: '2000', desc: '2s' }
                      ].map((option) => (
                        <button
                          key={option.key}
                          onClick={() => handleMessageDelayChange(option.value)}
                          className={`p-3 rounded-lg text-center transition-all border-2 ${
                            messageDelay === parseInt(option.value)
                              ? darkMode 
                                ? 'bg-cyan-600 border-cyan-400 text-white' 
                                : 'bg-cyan-500 border-cyan-300 text-white'
                              : darkMode
                                ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <div className="text-sm font-medium">{option.label}</div>
                          <div className="text-xs opacity-75">{option.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual Tooltip Close */}
                  <div className={`mt-4 flex items-center justify-between p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div>
                      <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Manuelles Schließen
                      </div>
                      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Tooltips mit X-Button schließen statt automatisch
                      </div>
                    </div>
                    <button
                      onClick={handleManualTooltipToggle}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        manualTooltipClose ? 'bg-qa-primary-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          manualTooltipClose ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* DANGER ZONE - Nur für Admins */}
                {isAdmin && (
                  <div className="mt-8 p-4 rounded-lg border-2 border-red-500 bg-red-50 bg-opacity-10">
                    <div className="flex items-start mb-4">
                      <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
                      <div>
                        <h4 className="font-bold text-red-500 text-lg">
                          Gefahrenbereich
                        </h4>
                        <p className="text-sm text-red-600 mt-1">
                          Diese Aktionen können nicht rückgängig gemacht werden!
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={handleResetSettings}
                        disabled={loading}
                        className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        Einstellungen zurücksetzen
                      </button>

                      <button
                        onClick={handleOptimizeDatabase}
                        disabled={loading}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
                      >
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Datenbank optimieren
                      </button>

                      <button
                        onClick={handleGenerateMassData}
                        disabled={loading}
                        className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
                      >
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Masse-Daten generieren (Performance-Test)
                      </button>

                      <button
                        onClick={handleClearDatabase}
                        disabled={loading}
                        className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Datenbank leeren
                      </button>
                    </div>
                  </div>
                )}
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

export default SettingsModal;
