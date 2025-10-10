import React, { useState } from 'react';
import { X, Sun, Moon, AlertTriangle, Database, FileDown, FileUp, Trash2, RotateCcw, CheckCircle, XCircle } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  authToken: string;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, darkMode, toggleDarkMode, authToken }) => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'import-export' | 'advanced'>('appearance');
  const [itemsPerPage, setItemsPerPage] = useState(localStorage.getItem('itemsPerPage') || '10');
  const [showTooltips, setShowTooltips] = useState(localStorage.getItem('showTooltips') !== 'false');
  const [messageDelay, setMessageDelay] = useState(parseInt(localStorage.getItem('messageDelay') || '3000'));
  const [manualTooltipClose, setManualTooltipClose] = useState(localStorage.getItem('manualTooltipClose') === 'true');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  if (!isOpen) return null;

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
    if (!confirm('⚠️ WARNUNG: Diese Aktion löscht ALLE vorhandenen Daten und erstellt neue Testdaten.\n\n15 Firmen mit je 100 Testpunkten werden generiert.\n\nMöchten Sie fortfahren?')) {
      return;
    }

    setLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://qa-report-hub.preview.emergentagent.com';
      const response = await fetch(`${backendUrl}/api/admin/generate-test-data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          companies: 15,
          testsPerCompany: 100
        })
      });

      if (response.ok) {
        const data = await response.json();
        showMessage('success', `✅ Testdaten erstellt: ${data.companies} Firmen, ${data.testCases} Testfälle`);
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

  const handleClearDatabase = async () => {
    if (!confirm('🚨 GEFAHR: Diese Aktion löscht die KOMPLETTE Datenbank!\n\nALLE Firmen, Projekte, Tests und Ergebnisse werden unwiderruflich gelöscht.\n\nDiese Aktion kann NICHT rückgängig gemacht werden!\n\nMöchten Sie wirklich fortfahren?')) {
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
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://qa-report-hub.preview.emergentagent.com';
      const response = await fetch(`${backendUrl}/api/admin/clear-database`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        }
      });

      if (response.ok) {
        showMessage('success', '✅ Datenbank geleert');
        setTimeout(() => window.location.reload(), 2000);
      } else {
        throw new Error('Fehler beim Leeren der Datenbank');
      }
    } catch (error) {
      showMessage('error', '❌ Fehler beim Leeren der Datenbank');
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
    setLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://qa-report-hub.preview.emergentagent.com';
      // This would need a project ID - for now, show a message
      showMessage('success', 'PDF-Export wird vorbereitet...');
    } catch (error) {
      showMessage('error', '❌ Fehler beim PDF-Export');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://qa-report-hub.preview.emergentagent.com';
      showMessage('success', 'CSV-Export wird vorbereitet...');
    } catch (error) {
      showMessage('error', '❌ Fehler beim CSV-Export');
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
                          Erstellt 15 Firmen mit je 100 Testpunkten
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

                {/* DANGER ZONE */}
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
                      className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center justify-center"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Einstellungen zurücksetzen
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
