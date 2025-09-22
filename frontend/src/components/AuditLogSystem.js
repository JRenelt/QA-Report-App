import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { X, Search, FileText, Trash2, Download, Plus, Info, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

const AuditLogSystem = ({ isOpen, onClose }) => {
  const [currentCategory, setCurrentCategory] = useState('Allgemeines Design');
  const [viewMode, setViewMode] = useState('bereiche'); // 'bereiche', 'tests', 'bericht'
  const [newTestName, setNewTestName] = useState('');
  const [compactView, setCompactView] = useState(false);
  const [testReports, setTestReports] = useState([]);
  const [selectedTestPoints, setSelectedTestPoints] = useState([]);

  // Test-Bereiche für FavOrg
  const testCategories = [
    { name: 'Allgemeines Design', icon: '🎨', tests: 4 },
    { name: 'Header-Bereich', icon: '🔝', tests: 4 }, 
    { name: 'Sidebar-Bereich', icon: '📋', tests: 5 },
    { name: 'Search-Section', icon: '🔍', tests: 5 },
    { name: 'Main-Content', icon: '📄', tests: 4 },
    { name: 'Bookmark-Karten', icon: '🎴', tests: 6 },
    { name: 'Dialoge & Modals', icon: '🗨️', tests: 5 },
    { name: 'Navigation & Routing', icon: '🧭', tests: 3 },
    { name: 'Drag & Drop System', icon: '🎯', tests: 5 },
    { name: 'Filter & Sortierung', icon: '🎛️', tests: 4 },
    { name: 'Import/Export', icon: '📤', tests: 4 },
    { name: 'Einstellungen', icon: '⚙️', tests: 4 },
    { name: 'Performance & Responsive', icon: '⚡', tests: 4 }
  ];

  // Test-Szenarien pro Bereich
  const predefinedTests = {
    'Allgemeines Design': [
      { name: '80% UI-Kompaktheit', icon: '📱', tooltip: '80% kompakte UI-Darstellung prüfen' },
      { name: 'Dark Theme', icon: '🌙', tooltip: 'Dark Theme Konsistenz testen' },
      { name: 'Responsiveness', icon: '📐', tooltip: 'Responsive Layout auf verschiedenen Größen' },
      { name: 'Typographie', icon: '🔤', tooltip: 'Typographie und Schriftarten prüfen' }
    ],
    'Header-Bereich': [
      { name: 'Logo + Counter', icon: '🏷️', tooltip: 'Logo und Bookmark-Anzahl anzeigen' },
      { name: 'Action-Buttons', icon: '🔘', tooltip: 'Action-Buttons funktional (Neu, Export, etc.)' },
      { name: 'Header-Icons', icon: '⚙️', tooltip: 'Header-Icons klickbar (Hilfe, Statistik, Einstellungen)' },
      { name: 'Status-Buttons', icon: '🎯', tooltip: 'Status-Buttons (TOTE Links, Duplikate, Localhost)' }
    ],
    'Sidebar-Bereich': [
      { name: 'Kategorien-Tree', icon: '🌳', tooltip: 'Kategorien-Hierarchie korrekt angezeigt' },
      { name: 'Collapse/Expand', icon: '↔️', tooltip: 'Sidebar Collapse/Expand funktional' },
      { name: 'Navigation', icon: '🧭', tooltip: 'Kategorie-Navigation und -Auswahl' },
      { name: 'Bookmark-Count', icon: '🔢', tooltip: 'Bookmark-Anzahl pro Kategorie anzeigen' },
      { name: 'Resizer', icon: '↕️', tooltip: 'Sidebar-Resizer Funktionalität' }
    ],
    'Search-Section': [
      { name: 'Suchfeld', icon: '🔍', tooltip: 'Suchfeld Eingabe und Funktionalität' },
      { name: 'Erweiterte Suche', icon: '🔎', tooltip: 'Erweiterte Suche (Titel, URL, Beschreibung)' },
      { name: 'Status-Filter', icon: '🎛️', tooltip: 'Status-Filter Dropdown funktional' },
      { name: 'Ergebnis-Count', icon: '📊', tooltip: 'Suchergebnis-Anzahl korrekt angezeigt' },
      { name: 'Clear Button', icon: '❌', tooltip: 'Clear Search Button funktional' }
    ],
    'Main-Content': [
      { name: 'Grid Layout', icon: '⚏', tooltip: 'Bookmark-Grid Layout korrekt' },
      { name: 'View Toggle', icon: '🔀', tooltip: 'Karten/Tabellen-Ansicht Umschalter' },
      { name: 'Scrolling', icon: '📜', tooltip: 'Scrolling und Pagination' },
      { name: 'Responsive', icon: '📱', tooltip: 'Content-Bereich responsive' }
    ],
    'Bookmark-Karten': [
      { name: 'Card Design', icon: '🎴', tooltip: 'Bookmark-Karte Design und Layout' },
      { name: 'Status-Badges', icon: '🏷️', tooltip: 'Status-Badges korrekt angezeigt' },
      { name: 'Lock Button', icon: '🔒', tooltip: 'Lock/Unlock Button funktional' },
      { name: 'Edit/Delete', icon: '✏️', tooltip: 'Edit/Delete Buttons verfügbar' },
      { name: 'Favicons', icon: '🖼️', tooltip: 'Favicon-Anzeige wenn aktiviert' },
      { name: 'URL-Links', icon: '🔗', tooltip: 'URL-Links funktional' }
    ],
    'Dialoge & Modals': [
      { name: 'Bookmark-Dialog', icon: '📝', tooltip: 'Bookmark-Dialog öffnen/schließen' },
      { name: 'Kategorie-Select', icon: '📁', tooltip: 'Kategorie-Auswahl im Dialog' },
      { name: 'Settings-Dialog', icon: '⚙️', tooltip: 'Einstellungen-Dialog alle Tabs' },
      { name: 'Help-System', icon: '❓', tooltip: 'Hilfe-System Dialog und Navigation' },
      { name: 'Statistics', icon: '📈', tooltip: 'Statistik-Dialog Daten-Anzeige' }
    ],
    'Navigation & Routing': [
      { name: 'Sidebar Navigation', icon: '🧭', tooltip: 'Navigation zwischen Kategorien' },
      { name: 'Breadcrumb', icon: '🍞', tooltip: 'Breadcrumb Navigation' },
      { name: 'Deep Links', icon: '🔗', tooltip: 'Deep Link Funktionalität' }
    ],
    'Drag & Drop System': [
      { name: 'Bookmark D&D', icon: '🎯', tooltip: 'Bookmark zwischen Kategorien verschieben' },
      { name: 'Category D&D', icon: '📂', tooltip: 'Kategorie Hierarchie-Verschiebung' },
      { name: 'Cross-Level', icon: '🎢', tooltip: 'Cross-Level Category Movement' },
      { name: 'Shift+Drag', icon: '⇧', tooltip: 'Shift+Drag Einfüge-Modus' },
      { name: 'Visual Feedback', icon: '👁️', tooltip: 'Visuelle Drop-Zone Feedback' }
    ],
    'Filter & Sortierung': [
      { name: 'Status-Filter', icon: '🎛️', tooltip: 'Status-Filter alle Typen (Aktiv, Tot, etc.)' },
      { name: 'Category-Filter', icon: '📁', tooltip: 'Kategorie-Filter Funktionalität' },
      { name: 'Sortierung', icon: '🔢', tooltip: 'Sortierung nach Datum/Alphabet' },
      { name: 'Kombiniert', icon: '🔗', tooltip: 'Kombinierte Filter (Status + Kategorie)' }
    ],
    'Import/Export': [
      { name: 'HTML Import', icon: '📥', tooltip: 'HTML Import-Funktionalität' },
      { name: 'JSON Export', icon: '📤', tooltip: 'JSON Export alle Formate' },
      { name: 'XML/CSV', icon: '📋', tooltip: 'XML/CSV Import/Export' },
      { name: 'Testdaten', icon: '🧪', tooltip: 'Testdaten-Generierung (70 Bookmarks)' }
    ],
    'Einstellungen': [
      { name: 'Theme-Switch', icon: '🎨', tooltip: 'Theme-Wechsel (Hell/Dunkel)' },
      { name: 'S-Time', icon: '⏱️', tooltip: 'Erweiterte Einstellungen (S-Time)' },
      { name: 'System-Tools', icon: '🔧', tooltip: 'System-Tools (AuditLog/SysDok)' },
      { name: 'Meldungen', icon: '📢', tooltip: 'Meldungen Delay Einstellung' }
    ],
    'Performance & Responsive': [
      { name: 'Load Speed', icon: '⚡', tooltip: 'Ladezeiten unter 3 Sekunden' },
      { name: 'Mobile', icon: '📱', tooltip: 'Mobile Responsiveness (768px)' },
      { name: 'Tablet', icon: '📟', tooltip: 'Tablet-Ansicht (768-1200px)' },
      { name: 'Desktop', icon: '🖥️', tooltip: 'Desktop-Optimierung (>1200px)' }
    ]
  };

  // Lade Test-Berichte beim Öffnen
  useEffect(() => {
    if (isOpen) {
      const savedReports = localStorage.getItem('favorg_test_reports');
      if (savedReports) {
        try {
          setTestReports(JSON.parse(savedReports));
        } catch (error) {
          console.error('Fehler beim Laden der Test-Berichte:', error);
        }
      }
    }
  }, [isOpen]);

  // Speichere Test-Berichte
  const saveTestReports = (reports) => {
    try {
      localStorage.setItem('favorg_test_reports', JSON.stringify(reports));
    } catch (error) {
      console.error('Fehler beim Speichern der Test-Berichte:', error);
      toast.error('Fehler beim Speichern der Test-Berichte');
    }
  };

  // Neuen Test hinzufügen
  const addNewTest = () => {
    if (!newTestName.trim()) {
      toast.error('Bitte geben Sie einen Test-Namen ein');
      return;
    }

    const newTest = {
      id: Date.now(),
      name: newTestName.trim(),
      category: currentCategory,
      icon: '🧪',
      tooltip: `Eigener Test: ${newTestName.trim()}`,
      created: new Date().toISOString()
    };

    // Nur zur FavOrg-Seite weiterleiten
    window.open('/', '_blank', 'width=1400,height=900,scrollbars=yes,resizable=yes');
    toast.success(`Test "${newTestName}" erstellt - FavOrg geöffnet`);
    setNewTestName('');
  };

  // Test-Bericht exportieren (PDF-Vorbereitung)
  const exportTestReport = () => {
    const reportData = {
      exportDate: new Date().toISOString(),
      reportTitle: `FavOrg Audit-Log Bericht - ${new Date().toLocaleDateString('de-DE')}`,
      categories: testCategories,
      currentCategory: currentCategory,
      totalTests: testCategories.reduce((sum, cat) => sum + cat.tests, 0),
      generatedAt: new Date().toLocaleString('de-DE')
    };

    // JSON Export (später PDF)
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `favorg_audit_report_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    // Bericht speichern
    const newReports = [reportData, ...testReports.slice(0, 9)]; // Max 10 Berichte
    setTestReports(newReports);
    saveTestReports(newReports);
    
    toast.success('Test-Bericht exportiert');
  };

  // Alle Berichte löschen
  const clearAllReports = () => {
    if (window.confirm('Alle gespeicherten Test-Berichte löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      setTestReports([]);
      localStorage.removeItem('favorg_test_reports');
      toast.success('Alle Test-Berichte gelöscht');
    }
  };

  // Aktuelle Kategorie-Daten
  const currentCategoryData = testCategories.find(cat => cat.name === currentCategory);
  const currentTests = predefinedTests[currentCategory] || [];

  // Kontext-Kurzhilfen
  const getContextHelp = () => {
    switch(viewMode) {
      case 'bereiche':
        return `13 Bereiche verfügbar | Wählen Sie einen Test-Bereich aus`;
      case 'tests':
        return `${currentTests.length} Test-Szenarien | ${currentCategory} | Klicken für Testpunkte`;
      case 'bericht':
        return `${testReports.length} Berichte gespeichert | Historische Verfolgung aktiv`;
      default:
        return "";
    }
  };

  // Toggle Ansicht
  const getViewToggleText = () => {
    switch(viewMode) {
      case 'bereiche': return 'Test anzeigen';
      case 'tests': return 'Bereiche';
      case 'bericht': return 'Bereiche';
      default: return 'Bereiche';
    }
  };

  // Nächste Ansicht
  const toggleView = () => {
    if (viewMode === 'bereiche') {
      setViewMode('tests');
    } else if (viewMode === 'tests') {
      setViewMode('bereiche');
    } else {
      setViewMode('bereiche');
    }
  };

  // Test-Punkt auswählen
  const toggleTestPoint = (testName) => {
    setSelectedTestPoints(prev => {
      const isSelected = prev.includes(testName);
      const newSelection = isSelected 
        ? prev.filter(name => name !== testName)
        : [...prev, testName];
      
      toast.success(`Test "${testName}" ${isSelected ? 'abgewählt' : 'ausgewählt'}`);
      return newSelection;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] bg-gray-900 text-white border-gray-700 overflow-hidden">
        
        {/* Kopfzeile */}
        <DialogHeader className="flex-shrink-0 p-2 border-b border-gray-700">
          {/* Erste Zeile: Titel + FavOrg + Inputfeld + Bereich-Button */}
          <div className="flex items-center justify-between gap-4 mb-1">
            {/* Links: Titel + FavOrg Link */}
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span className="text-sm font-bold text-cyan-400">FavOrg Audit-Log</span>
              <Button
                onClick={() => window.open('/', '_blank', 'width=1400,height=900,scrollbars=yes,resizable=yes')}
                variant="ghost"
                size="sm"
                className="text-cyan-400 hover:text-cyan-300 px-2 py-1 h-6 text-xs border border-cyan-600 rounded"
                title="FavOrg in neuem Fenster öffnen"
              >
                🔗 FavOrg
              </Button>
            </div>

            {/* Mitte: Zentriertes Inputfeld + Plus (nur in Test-Ansicht) */}
            {viewMode === 'tests' && (
              <div className="flex-1 max-w-xs mx-4">
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={newTestName}
                    onChange={(e) => setNewTestName(e.target.value)}
                    placeholder="Eigener Test..."
                    className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
                    onKeyPress={(e) => e.key === 'Enter' && addNewTest()}
                  />
                  <Button
                    onClick={addNewTest}
                    size="sm"
                    className="bg-cyan-600 hover:bg-cyan-700 px-2 py-1 h-7 w-7"
                    disabled={!newTestName.trim()}
                    title="Test hinzufügen"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Rechts: Navigation Buttons + Schließen */}
            <div className="flex items-center gap-2">
              {viewMode !== 'bericht' && (
                <Button
                  onClick={() => setViewMode('bericht')}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white text-xs px-2 py-1 h-7"
                >
                  📊 Berichte
                </Button>
              )}
              <Button
                onClick={toggleView}
                variant="outline"
                size="sm"
                className="border-cyan-600 text-cyan-400 text-xs px-2 py-1 h-7"
              >
                {getViewToggleText()}
              </Button>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white p-1 h-7 w-7"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Zweite Zeile: Subline - kleiner und dezenter */}
          <div className="text-xs text-gray-400 font-normal">
            {getContextHelp()}
          </div>
        </DialogHeader>

        <div className="flex flex-col h-full overflow-hidden">
          
          {/* Bereichsauswahl */}
          {viewMode === 'bereiche' && (
            <div className="flex-1 p-4 overflow-y-auto">
              {/* Toggle für kompakte Ansicht */}
              <div className="flex justify-end mb-3">
                <Button
                  onClick={() => setCompactView(!compactView)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 text-xs"
                >
                  {compactView ? '📝 Vollansicht' : '🎯 Kompakt'}
                </Button>
              </div>

              <div className="grid grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                {testCategories.map((category) => (
                  <Button
                    key={category.name}
                    onClick={() => {
                      setCurrentCategory(category.name);
                      setViewMode('tests');
                    }}
                    variant={currentCategory === category.name ? "default" : "outline"}
                    className={`${compactView ? 'h-10 px-1' : 'h-12 px-2'} flex items-center justify-start text-xs ${
                      currentCategory === category.name 
                        ? 'bg-cyan-600 hover:bg-cyan-700 text-white' 
                        : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <span className="text-sm mr-1">{category.icon}</span>
                    {!compactView ? (
                      <div className="flex flex-col items-start">
                        <span className="font-medium leading-tight text-left text-xs">
                          {category.name.replace('-', ' ').replace(' Bereich', '').replace(' Section', '')}
                        </span>
                        <span className="text-xs text-gray-400">{category.tests}T</span>
                      </div>
                    ) : (
                      <Badge variant="secondary" className="ml-1 text-xs bg-gray-700 text-gray-300 px-1">
                        {category.tests}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Test-Auswahl */}
          {viewMode === 'tests' && (
            /* Test-Auswahl */
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Test-Buttons */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-cyan-400">{currentCategory}</h3>
                  <Button
                    onClick={() => setCompactView(!compactView)}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 text-xs"
                  >
                    {compactView ? '📝 Text anzeigen' : '🎯 Nur Symbole'}
                  </Button>
                </div>

                {/* Testfunktionen - Sichtbare Test-Szenarien */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {currentTests.map((test, index) => {
                      const isSelected = selectedTestPoints.includes(test.name);
                      return (
                        <Button
                          key={index}
                          onClick={() => toggleTestPoint(test.name)}
                          variant="outline"
                          title={test.tooltip}
                          className={`${compactView ? 'h-12' : 'h-16'} flex ${compactView ? 'items-center justify-center' : 'flex-col items-center justify-center'} text-xs relative ${
                            isSelected 
                              ? 'border-green-500 bg-green-900/30 text-green-300 hover:bg-green-900/50'
                              : 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-cyan-500'
                          }`}
                        >
                          {/* Test-Icon */}
                          <span className={`${compactView ? 'text-lg' : 'text-lg mb-1'}`}>
                            {test.icon}
                          </span>
                          {!compactView && (
                            <span className="text-xs text-center leading-tight font-medium">
                              {test.name}
                            </span>
                          )}
                          {/* Ausgewählt-Indikator */}
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </Button>
                      );
                    })}
                  </div>

                  {/* Zusätzliche Test-Funktionen die Sie testen können */}
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-cyan-400 mb-3">🔧 Verfügbare Test-Funktionen:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      
                      {/* Hauptfunktionen */}
                      <div className="bg-gray-800 p-3 rounded border border-gray-700">
                        <h5 className="text-xs font-semibold text-white mb-2">📋 Bookmark-Management</h5>
                        <ul className="text-xs text-gray-300 space-y-1">
                          <li>• ➕ Neuen Bookmark hinzufügen</li>
                          <li>• ✏️ Bookmark bearbeiten</li>
                          <li>• 🗑️ Bookmark löschen</li>
                          <li>• 🔒 Bookmark sperren/entsperren</li>
                        </ul>
                      </div>

                      <div className="bg-gray-800 p-3 rounded border border-gray-700">
                        <h5 className="text-xs font-semibold text-white mb-2">📁 Kategorie-System</h5>
                        <ul className="text-xs text-gray-300 space-y-1">
                          <li>• 🆕 Neue Kategorie erstellen</li>
                          <li>• 🎯 Drag & Drop zwischen Kategorien</li>
                          <li>• 🌳 Hierarchische Struktur</li>
                          <li>• ↔️ Sidebar ein-/ausklappen</li>
                        </ul>
                      </div>

                      <div className="bg-gray-800 p-3 rounded border border-gray-700">
                        <h5 className="text-xs font-semibold text-white mb-2">🔍 Such- & Filter-System</h5>
                        <ul className="text-xs text-gray-300 space-y-1">
                          <li>• 🔎 Textsuche in Titel/URL</li>
                          <li>• 🎛️ Status-Filter (Aktiv, Tot, etc.)</li>
                          <li>• 📊 Erweiterte Suchoptionen</li>
                          <li>• ❌ Suchfilter zurücksetzen</li>
                        </ul>
                      </div>

                      <div className="bg-gray-800 p-3 rounded border border-gray-700">
                        <h5 className="text-xs font-semibold text-white mb-2">⚙️ System-Funktionen</h5>
                        <ul className="text-xs text-gray-300 space-y-1">
                          <li>• 📤 Daten exportieren (JSON/CSV)</li>
                          <li>• 📥 Bookmarks importieren</li>
                          <li>• 🧪 Test-Daten generieren</li>
                          <li>• 🌙 Dark/Light Theme</li>
                        </ul>
                      </div>

                    </div>
                  </div>
                </div>
              </div>

              
            </div>
          )}

          {/* Bericht-Ansicht - Wird nur angezeigt wenn explizit aktiviert */}
          {viewMode === 'bericht' && (
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-3">Gespeicherte Test-Berichte</h3>
                  {testReports.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                      <p className="text-gray-400 mb-2">Noch keine Test-Berichte vorhanden</p>
                      <p className="text-xs text-gray-500">Exportieren Sie Tests um Berichte zu erstellen</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {testReports.map((report, index) => (
                        <div key={index} className="bg-gray-700 p-3 rounded border border-gray-600">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium text-white">{report.reportTitle}</h4>
                              <p className="text-xs text-gray-400">Erstellt: {report.generatedAt}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="text-xs">
                                📥 Laden
                              </Button>
                              <Button size="sm" variant="outline" className="text-xs">
                                🗑️ Löschen
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <h3 className="text-lg font-semibold text-cyan-400 mb-3">Aktueller Test-Status</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{selectedTestPoints.length}</div>
                      <div className="text-xs text-gray-400">Ausgewählt</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">0</div>
                      <div className="text-xs text-gray-400">Fehlgeschlagen</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">0</div>
                      <div className="text-xs text-gray-400">In Bearbeitung</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-400">
                        {testCategories.reduce((sum, cat) => sum + cat.tests, 0) - selectedTestPoints.length}
                      </div>
                      <div className="text-xs text-gray-400">Ausstehend</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fixe Fußzeile - In Test-Ansicht und Bericht-Ansicht */}
          {(viewMode === 'tests' || viewMode === 'bericht') && (
            <div className="flex items-center justify-between p-4 bg-gray-800 border-t border-gray-700 flex-shrink-0">
              {/* Links: Status-Quadrate mit kumulierten Zahlen */}
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 bg-green-600 rounded-lg flex flex-col items-center justify-center text-white cursor-help shadow-lg relative"
                  title="Bestanden - Tests erfolgreich abgeschlossen"
                >
                  <span className="text-lg">✓</span>
                  <span className="text-xs font-bold absolute -bottom-1 -right-1 bg-green-800 rounded-full w-5 h-5 flex items-center justify-center">
                    {selectedTestPoints.length}
                  </span>
                </div>
                <div 
                  className="w-12 h-12 bg-red-600 rounded-lg flex flex-col items-center justify-center text-white cursor-help shadow-lg relative"
                  title="Fehlgeschlagen - Tests mit Problemen"
                >
                  <span className="text-lg">✗</span>
                  <span className="text-xs font-bold absolute -bottom-1 -right-1 bg-red-800 rounded-full w-5 h-5 flex items-center justify-center">
                    0
                  </span>
                </div>
                <div 
                  className="w-12 h-12 bg-blue-600 rounded-lg flex flex-col items-center justify-center text-white cursor-help shadow-lg relative"
                  title="In Bearbeitung - Tests werden aktuell durchgeführt"
                >
                  <span className="text-lg">~</span>
                  <span className="text-xs font-bold absolute -bottom-1 -right-1 bg-blue-800 rounded-full w-5 h-5 flex items-center justify-center">
                    0
                  </span>
                </div>
                <div 
                  className="w-12 h-12 bg-orange-600 rounded-lg flex flex-col items-center justify-center text-white cursor-help shadow-lg relative"
                  title="Ausstehend - Tests noch nicht begonnen"
                >
                  <span className="text-lg">○</span>
                  <span className="text-xs font-bold absolute -bottom-1 -right-1 bg-orange-800 rounded-full w-5 h-5 flex items-center justify-center">
                    {currentTests.length - selectedTestPoints.length}
                  </span>
                </div>
              </div>

              {/* Rechts: Berichte(Archiv) + Download + Mülleimer */}
              <div className="flex items-center gap-3">
                {viewMode === 'tests' && (
                  <span className="text-xs text-gray-400 mr-2">
                    {selectedTestPoints.length}/{currentTests.length} ausgewählt
                  </span>
                )}
                <Button
                  onClick={() => setViewMode('bericht')}
                  variant="outline"
                  size="sm"
                  className={`border-blue-600 text-blue-400 hover:bg-blue-900 px-3 ${viewMode === 'bericht' ? 'bg-blue-900' : ''}`}
                  title="Berichte-Archiv anzeigen"
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Archiv [{testReports.length}]
                </Button>
                <Button
                  onClick={exportTestReport}
                  variant="outline"
                  size="sm"
                  className="border-green-600 text-green-400 hover:bg-green-900 px-3"
                  title="Test-Bericht als PDF exportieren"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
                <Button
                  onClick={clearAllReports}
                  variant="outline"
                  size="sm"
                  className="border-red-600 text-red-400 hover:bg-red-900 px-2"
                  title="Alle Test-Berichte löschen"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuditLogSystem;