import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { X, Search, FileText, Trash2, Download, Plus, Info, HelpCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

const AuditLogSystem = ({ isOpen, onClose }) => {
  const [currentCategory, setCurrentCategory] = useState('Allgemeines Design');
  const [viewMode, setViewMode] = useState('bereiche'); // 'bereiche', 'tests', 'bericht'
  const [newTestName, setNewTestName] = useState('');
  const [compactView, setCompactView] = useState(false);
  const [testReports, setTestReports] = useState([]);
  const [selectedTestPoints, setSelectedTestPoints] = useState([]);
  const [testNotes, setTestNotes] = useState({});

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

    // Füge neuen Test zu den aktuellen Tests hinzu
    const newTest = {
      name: newTestName.trim(),
      icon: '🧪',
      tooltip: `Eigener Test: ${newTestName.trim()}`
    };

    // Temporär zu predefinedTests hinzufügen
    if (!predefinedTests[currentCategory]) {
      predefinedTests[currentCategory] = [];
    }
    predefinedTests[currentCategory].push(newTest);

    toast.success(`Test "${newTestName}" hinzugefügt`);
    setNewTestName('');
    
    // Force re-render durch State-Update
    setCurrentCategory(currentCategory);
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
        return `${currentTests.length} Testpunkte | ${currentCategory} | Systematische Qualitätsprüfung`;
      case 'bericht':
        return `${testReports.length} Berichte gespeichert | Historische Verfolgung aktiv`;
      default:
        return "";
    }
  };

  // Toggle Ansicht
  const getViewToggleText = () => {
    switch(viewMode) {
      case 'bereiche': return 'Testpunkte';
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
        
        {/* Kopfzeile - 50% kleinere Schrift */}
        <DialogHeader className="flex-shrink-0 p-1 border-b border-gray-700">
          {/* Erste Zeile: Titel + FavOrg + Inputfeld + Bereich-Button */}
          <div className="flex items-center justify-between gap-2 mb-0">
            {/* Links: Titel + FavOrg Link - FavOrg Design bestimmt AuditLog */}
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <span className="text-xs font-bold text-cyan-400">FavOrg Audit-Log</span>
              <Button
                onClick={() => window.open('/', '_blank', 'width=1400,height=900,scrollbars=yes,resizable=yes')}
                variant="ghost"
                size="sm"
                className="text-cyan-400 hover:text-cyan-300 px-1 py-0 h-5 text-xs border border-cyan-600 rounded"
                title="FavOrg in neuem Fenster öffnen"
              >
                🔗 FavOrg
              </Button>
            </div>

            {/* Mitte: Zentriertes Inputfeld + Plus (nur in Test-Ansicht) */}
            {viewMode === 'tests' && (
              <div className="flex-1 max-w-xs mx-2">
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={newTestName}
                    onChange={(e) => setNewTestName(e.target.value)}
                    placeholder="Eigener Test..."
                    className="flex-1 px-1 py-0 bg-gray-700 border border-gray-600 rounded text-xs text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 h-5"
                    onKeyPress={(e) => e.key === 'Enter' && addNewTest()}
                  />
                  <Button
                    onClick={addNewTest}
                    size="sm"
                    className="bg-cyan-600 hover:bg-cyan-700 px-1 py-0 h-5 w-5"
                    disabled={!newTestName.trim()}
                    title="Test hinzufügen"
                  >
                    <Plus className="w-2 h-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Rechts: Nur Toggle Button (redundantes Schließen-X entfernt) */}
            <div className="flex items-center gap-1">
              <Button
                onClick={toggleView}
                variant="outline"
                size="sm"
                className="border-cyan-600 text-cyan-400 text-xs px-1 py-0 h-5"
              >
                {getViewToggleText()}
              </Button>
            </div>
          </div>

          {/* Zweite Zeile: Subline - kleinerer Durchschuss */}
          <div className="text-xs text-gray-400 font-normal -mt-1">
            {getContextHelp()}
          </div>
        </DialogHeader>

        <div className="flex flex-col h-full overflow-hidden">
          
          {/* Bereichsauswahl */}
          {viewMode === 'bereiche' && (
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="mb-4">
                <p className="text-sm text-gray-300 mb-3">
                  Wählen Sie einen der verfügbaren Test-Bereiche aus um mit der systematischen Prüfung zu beginnen:
                </p>
              </div>
              <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                {testCategories.map((category) => (
                  <Button
                    key={category.name}
                    onClick={() => {
                      setCurrentCategory(category.name);
                      setViewMode('tests');
                    }}
                    variant={currentCategory === category.name ? "default" : "outline"}
                    className={`h-12 px-2 flex items-center justify-start text-xs ${
                      currentCategory === category.name 
                        ? 'bg-cyan-600 hover:bg-cyan-700 text-white' 
                        : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <span className="text-lg mr-2 flex-shrink-0">{category.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs leading-tight truncate">
                            {category.name.replace('-', ' ').replace(' Bereich', '').replace(' Section', '')}
                          </div>
                          <div className="text-xs text-gray-400 truncate">
                            {category.tests} Tests
                          </div>
                        </div>
                        <Badge variant="secondary" className="ml-2 text-xs bg-gray-700 text-gray-300 px-1 flex-shrink-0">
                          {category.tests}
                        </Badge>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Test-Auswahl */}
          {viewMode === 'tests' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Suchbereich für Testpunkte */}
              <div className="p-3 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Testpunkt suchen..."
                    className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
              
              {/* Testpunkte */}
              <div className="flex-1 p-2 overflow-y-auto">
                {/* Testpunkte/Testeinträge wie in Auditlog6.png */}
                <div className="mt-2">
                  <div className="space-y-3">
                    {currentTests.map((test, index) => {
                      const isSelected = selectedTestPoints.includes(test.name);
                      return (
                        <div key={index} className="bg-gray-800 p-3 rounded border border-gray-700">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {/* Status Badge */}
                              <div className="px-2 py-1 bg-yellow-600 rounded text-xs text-white font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Ausstehend
                              </div>
                              
                              {/* Test Name */}
                              <div className="flex flex-col">
                                <span className="text-white font-medium text-sm">{test.name}</span>
                                <span className="text-xs text-gray-400">
                                  {new Date().toLocaleDateString('de-DE')}, {new Date().toLocaleTimeString('de-DE')}
                                </span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                onClick={() => toggleTestPoint(test.name)}
                                className="bg-green-600 hover:bg-green-700 px-2 py-1 text-xs h-8 w-8"
                                title="Test bestanden"
                              >
                                ✅
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-600 text-red-400 hover:bg-red-900 px-2 py-1 text-xs h-8 w-8"
                                title="Test fehlgeschlagen"
                              >
                                ❌
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-blue-600 text-blue-400 hover:bg-blue-900 px-2 py-1 text-xs h-8 w-8"
                                title="Test in Bearbeitung"
                              >
                                ⏳
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-yellow-600 text-yellow-400 hover:bg-yellow-900 px-2 py-1 text-xs h-8 w-8"
                                title="Notiz hinzufügen/bearbeiten"
                              >
                                ✏️
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-gray-600 text-gray-400 hover:bg-gray-700 px-2 py-1 text-xs h-8 w-8"
                                title="Test löschen"
                              >
                                🗑️
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Link zum Handbuch */}
                  <div className="mt-4 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-cyan-400 hover:text-cyan-300 text-xs"
                      title="Öffnet das Handbuch mit detaillierten Testanleitungen"
                    >
                      📖 Detaillierte Testanleitungen im Handbuch
                    </Button>
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

          {/* Fixe Fußzeile - Nahtloser Übergang zu FavOrg Footer */}
          {(viewMode === 'tests' || viewMode === 'bericht') && (
            <div className="flex items-center justify-between p-2 bg-gray-800 border-t border-gray-700 flex-shrink-0">
              {/* Links: Status-Quadrate mit kumulierten Zahlen - 50% schmaler */}
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 bg-green-600 rounded flex flex-col items-center justify-center text-white cursor-help relative"
                  title="Bestanden - Tests erfolgreich abgeschlossen"
                >
                  <span className="text-sm">✓</span>
                  <span className="text-xs font-bold absolute -bottom-1 -right-1 bg-green-800 rounded-full w-4 h-4 flex items-center justify-center">
                    {selectedTestPoints.length}
                  </span>
                </div>
                <div 
                  className="w-8 h-8 bg-red-600 rounded flex flex-col items-center justify-center text-white cursor-help relative"
                  title="Fehlgeschlagen - Tests mit Problemen"
                >
                  <span className="text-sm">✗</span>
                  <span className="text-xs font-bold absolute -bottom-1 -right-1 bg-red-800 rounded-full w-4 h-4 flex items-center justify-center">
                    0
                  </span>
                </div>
                <div 
                  className="w-8 h-8 bg-blue-600 rounded flex flex-col items-center justify-center text-white cursor-help relative"
                  title="In Bearbeitung - Tests werden aktuell durchgeführt"
                >
                  <span className="text-sm">~</span>
                  <span className="text-xs font-bold absolute -bottom-1 -right-1 bg-blue-800 rounded-full w-4 h-4 flex items-center justify-center">
                    0
                  </span>
                </div>
                <div 
                  className="w-8 h-8 bg-orange-600 rounded flex flex-col items-center justify-center text-white cursor-help relative"
                  title="Ausstehend - Tests noch nicht begonnen"
                >
                  <span className="text-sm">○</span>
                  <span className="text-xs font-bold absolute -bottom-1 -right-1 bg-orange-800 rounded-full w-4 h-4 flex items-center justify-center">
                    {currentTests.length - selectedTestPoints.length}
                  </span>
                </div>
              </div>

              {/* Rechts: Berichte(Archiv) + Download + Mülleimer */}
              <div className="flex items-center gap-2">
                {viewMode === 'tests' && (
                  <span className="text-xs text-gray-400 mr-2">
                    {selectedTestPoints.length}/{currentTests.length} ausgewählt
                  </span>
                )}
                <Button
                  onClick={() => setViewMode('bericht')}
                  variant="outline"
                  size="sm"
                  className={`border-blue-600 text-blue-400 hover:bg-blue-900 px-2 ${viewMode === 'bericht' ? 'bg-blue-900' : ''}`}
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