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
  const [testStatuses, setTestStatuses] = useState({});
  const [editingNote, setEditingNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTests, setFilteredTests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');

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

  // Test-Szenarien pro Bereich (Original aus Technischer Dokumentation)
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

  // Neuen Test hinzufügen (weißes Kreuz)
  const addNewTest = () => {
    const testName = newTestName.trim();
    if (!testName) {
      toast.error('Bitte geben Sie einen Test-Namen ein');
      return;
    }

    // Prüfe ob wir in der Test-Ansicht sind
    if (viewMode !== 'tests' || !currentCategory) {
      toast.error('Bitte wählen Sie zuerst einen Test-Bereich aus');
      return;
    }

    // Stelle sicher dass der Bereich existiert
    if (!predefinedTests[currentCategory]) {
      predefinedTests[currentCategory] = [];
    }

    // Prüfe ob Test bereits existiert
    const existingTest = predefinedTests[currentCategory].find(t => t.name === testName);
    if (existingTest) {
      toast.error(`Test "${testName}" existiert bereits in diesem Bereich`);
      return;
    }

    // Neuer Test - als neue Karte hinzufügen
    const newTest = {
      name: testName,
      icon: '🧪',
      tooltip: `Eigener Test: ${testName}`
    };
    
    predefinedTests[currentCategory].push(newTest);

    // Update Test-Kategorie Counter
    const categoryIndex = testCategories.findIndex(cat => cat.name === currentCategory);
    if (categoryIndex !== -1) {
      testCategories[categoryIndex].tests += 1;
    }
    
    toast.success(`Neue Test-Karte "${testName}" zu "${currentCategory}" hinzugefügt`);
    setNewTestName('');
    
    // Force re-render
    setCurrentCategory(currentCategory);
  };

  // Test aus DB entfernen (rotes Minus)
  const removeTestFromDB = () => {
    const testName = newTestName.trim();
    if (!testName) {
      toast.error('Bitte geben Sie einen Test-Namen ein');
      return;
    }

    // Prüfe ob wir in der Test-Ansicht sind
    if (viewMode !== 'tests' || !currentCategory) {
      toast.error('Bitte wählen Sie zuerst einen Test-Bereich aus');
      return;
    }

    // Stelle sicher dass der Bereich existiert
    if (!predefinedTests[currentCategory]) {
      predefinedTests[currentCategory] = [];
    }

    // Suche Test in aktueller Kategorie
    const existingTestIndex = predefinedTests[currentCategory].findIndex(t => t.name === testName);
    
    if (existingTestIndex === -1) {
      // Suche in allen anderen Kategorien
      let foundCategory = null;
      let foundIndex = -1;
      
      Object.keys(predefinedTests).forEach(categoryName => {
        const testIndex = predefinedTests[categoryName].findIndex(t => t.name === testName);
        if (testIndex !== -1) {
          foundCategory = categoryName;
          foundIndex = testIndex;
        }
      });
      
      if (foundCategory) {
        // Test in anderer Kategorie gefunden - entfernen
        predefinedTests[foundCategory].splice(foundIndex, 1);
        
        // Update Test-Kategorie Counter
        const categoryIndex = testCategories.findIndex(cat => cat.name === foundCategory);
        if (categoryIndex !== -1 && testCategories[categoryIndex].tests > 0) {
          testCategories[categoryIndex].tests -= 1;
        }
        
        toast.success(`Test "${testName}" aus "${foundCategory}" entfernt (Berichte bleiben erhalten)`);
      } else {
        toast.error(`Test "${testName}" nicht in DB gefunden`);
      }
    } else {
      // Test in aktueller Kategorie gefunden - entfernen
      predefinedTests[currentCategory].splice(existingTestIndex, 1);
      
      // Update Test-Kategorie Counter  
      const categoryIndex = testCategories.findIndex(cat => cat.name === currentCategory);
      if (categoryIndex !== -1 && testCategories[categoryIndex].tests > 0) {
        testCategories[categoryIndex].tests -= 1;
      }
      
      toast.success(`Test "${testName}" aus "${currentCategory}" entfernt (Berichte bleiben erhalten)`);
    }

    setNewTestName('');
    // Force re-render
    setCurrentCategory(currentCategory);
  };

  // Test-Bericht als PDF exportieren
  const exportTestReport = () => {
    const reportData = {
      exportDate: new Date().toISOString(),
      reportTitle: `FavOrg Audit-Log Bericht - ${new Date().toLocaleDateString('de-DE')}`,
      categories: testCategories,
      currentCategory: currentCategory,
      testStatuses: testStatuses,
      testNotes: testNotes,
      totalTests: testCategories.reduce((sum, cat) => sum + cat.tests, 0),
      generatedAt: new Date().toLocaleString('de-DE')
    };

    // PDF Export - Einfacher HTML-zu-PDF Ansatz
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>FavOrg Audit-Log Bericht</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .category { margin-bottom: 20px; }
          .test-item { margin: 10px 0; padding: 10px; border-left: 3px solid #ccc; }
          .passed { border-left-color: #10b981; }
          .failed { border-left-color: #ef4444; }
          .inProgress { border-left-color: #3b82f6; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FavOrg Audit-Log Bericht</h1>
          <p>Generiert am: ${reportData.generatedAt}</p>
        </div>
        <h2>Test-Kategorie: ${currentCategory}</h2>
        ${predefinedTests[currentCategory].map(test => {
          const status = testStatuses[test.name];
          const statusClass = status ? status.status : '';
          return `
            <div class="test-item ${statusClass}">
              <strong>${test.name}</strong><br>
              Status: ${status ? status.status : 'Nicht getestet'}<br>
              ${status ? `Zeitstempel: ${status.timestamp}` : ''}
            </div>
          `;
        }).join('')}
      </body>
      </html>
    `;

    // Create PDF-ready HTML
    const dataBlob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `favorg_audit_report_${new Date().toISOString().split('T')[0]}.html`;
    link.click();
    URL.revokeObjectURL(url);
    
    // Bericht speichern
    const newReports = [reportData, ...testReports.slice(0, 9)]; // Max 10 Berichte
    setTestReports(newReports);
    saveTestReports(newReports);
    
    toast.success('Test-Bericht als HTML exportiert (zum PDF-Druck verwenden)');
  };

  // Alle Berichte löschen
  const clearAllReports = () => {
    if (window.confirm('Alle gespeicherten Test-Berichte löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      setTestReports([]);
      localStorage.removeItem('favorg_test_reports');
      toast.success('Alle Test-Berichte gelöscht');
    }
  };

  // Suchlogik für Testpunkte und Bereiche
  const getFilteredTests = () => {
    let tests = [];
    
    if (statusFilter) {
      // Status-Filter aktiv: Suche in allen Bereichen
      Object.keys(predefinedTests).forEach(categoryName => {
        predefinedTests[categoryName].forEach(test => {
          const testStatus = testStatuses[test.name];
          const matchesStatus = statusFilter === 'pending' 
            ? !testStatus 
            : testStatus?.status === statusFilter;
            
          if (matchesStatus) {
            tests.push({...test, category: categoryName});
          }
        });
      });
    } else {
      // Normale Ansicht: NUR aktuelle Kategorie
      tests = (predefinedTests[currentCategory] || []).map(test => ({...test}));
    }
    
    // Textsuche anwenden
    if (searchTerm.trim()) {
      tests = tests.filter(test => 
        test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.tooltip.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return tests;
  };

  const getFilteredCategories = () => {
    if (!searchTerm.trim()) {
      return testCategories;
    }
    
    return testCategories.filter(cat => 
      cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Highlight-Funktion für Suchtreffer
  const highlightText = (text, searchTerm) => {
    if (!searchTerm.trim()) return text;
    
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === searchTerm.toLowerCase() ? 
        <span key={index} className="bg-yellow-400 text-black font-bold">{part}</span> : 
        part
    );
  };

  // Aktuelle Kategorie-Daten
  const currentCategoryData = testCategories.find(cat => cat.name === currentCategory);
  const currentTests = getFilteredTests();

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

  // Test-Status setzen
  const setTestStatus = (testName, status) => {
    const timestamp = new Date().toLocaleString('de-DE');
    setTestStatuses(prev => ({
      ...prev,
      [testName]: { status, timestamp }
    }));
    
    const statusTexts = {
      'passed': 'bestanden',
      'failed': 'fehlgeschlagen',
      'inProgress': 'in Bearbeitung'
    };
    
    toast.success(`Test "${testName}" als ${statusTexts[status]} markiert`);
  };

  // Test-Punkt auswählen (Legacy für Kompatibilität)
  const toggleTestPoint = (testName) => {
    setTestStatus(testName, 'passed');
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
                  <div className="flex gap-1">
                    <Button
                      onClick={addNewTest}
                      size="sm"
                      className="bg-white hover:bg-gray-100 px-1 py-0 h-5 w-5 text-green-600"
                      disabled={!newTestName.trim()}
                      title="Test hinzufügen (Weißes Kreuz + Enter)"
                    >
                      <span className="text-green-600 text-xs font-bold">✓</span>
                    </Button>
                    <Button
                      onClick={removeTestFromDB}
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 px-1 py-0 h-5 w-5"
                      disabled={!newTestName.trim()}
                      title="Test aus DB entfernen (Rotes Minus - Berichte bleiben)"
                    >
                      <span className="text-white text-xs font-bold">−</span>
                    </Button>
                  </div>
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
                {getFilteredCategories().map((category) => (
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
                            {highlightText(
                              category.name.replace('-', ' ').replace(' Bereich', '').replace(' Section', ''),
                              searchTerm
                            )}
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
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="In allen Testpunkten und Bereichen suchen..."
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
                        <div key={index} className={`p-3 rounded border-2 ${
                          testStatuses[test.name]?.status === 'passed' ? 'bg-gray-800 border-green-500' :
                          testStatuses[test.name]?.status === 'failed' ? 'bg-red-900/30 border-red-500' :
                          testStatuses[test.name]?.status === 'inProgress' ? 'bg-gray-800 border-blue-500' :
                          'bg-gray-800 border-gray-700'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {/* Status Badge - dynamisch basierend auf Test-Status */}
                              {testStatuses[test.name] ? (
                                <div className={`px-2 py-1 rounded text-xs text-white font-medium flex items-center gap-1 ${
                                  testStatuses[test.name].status === 'passed' ? 'bg-green-600' :
                                  testStatuses[test.name].status === 'failed' ? 'bg-red-600' :
                                  testStatuses[test.name].status === 'inProgress' ? 'bg-blue-600' :
                                  'bg-gray-600'
                                }`}>
                                  {testStatuses[test.name].status === 'passed' ? '✅' :
                                   testStatuses[test.name].status === 'failed' ? '❌' :
                                   testStatuses[test.name].status === 'inProgress' ? '⏳' :
                                   '○'}
                                  {testStatuses[test.name].status === 'passed' ? 'Bestanden' :
                                   testStatuses[test.name].status === 'failed' ? 'Fehlgeschlagen' :
                                   testStatuses[test.name].status === 'inProgress' ? 'In Bearbeitung' :
                                   'Unbekannt'}
                                </div>
                              ) : null}
                              
                              {/* Test Name */}
                              <div className="flex flex-col">
                                <span className="text-white font-medium text-sm">
                                  {highlightText(test.name, searchTerm)}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {statusFilter && test.category ? `${test.category} | ` : ''}
                                  {testStatuses[test.name]?.timestamp || 'Noch nicht getestet'}
                                </span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                onClick={() => setTestStatus(test.name, 'passed')}
                                className="bg-green-600 hover:bg-green-700 px-2 py-1 text-xs h-8 w-8"
                                title="Test bestanden"
                              >
                                ✅
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => setTestStatus(test.name, 'failed')}
                                variant="outline"
                                className="border-red-600 text-red-400 hover:bg-red-900 px-2 py-1 text-xs h-8 w-8"
                                title="Test fehlgeschlagen"
                              >
                                ❌
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => setTestStatus(test.name, 'inProgress')}
                                variant="outline"
                                className="border-blue-600 text-blue-400 hover:bg-blue-900 px-2 py-1 text-xs h-8 w-8"
                                title="Test in Bearbeitung"
                              >
                                ⏳
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => setEditingNote(test.name)}
                                variant="outline"
                                className="border-yellow-600 text-yellow-400 hover:bg-yellow-900 px-2 py-1 text-xs h-8 w-8"
                                title="Notiz hinzufügen/bearbeiten"
                              >
                                ✏️
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  if (window.confirm(`Test "${test.name}" komplett löschen? (inkl. Status und Notizen)`)) {
                                    // Finde die richtige Kategorie (falls Status-Filter aktiv)
                                    const targetCategory = test.category || currentCategory;
                                    
                                    // Entferne Test aus der Kategorie
                                    if (predefinedTests[targetCategory]) {
                                      predefinedTests[targetCategory] = predefinedTests[targetCategory].filter(t => t.name !== test.name);
                                      
                                      // Update Test-Kategorie Counter
                                      const categoryIndex = testCategories.findIndex(cat => cat.name === targetCategory);
                                      if (categoryIndex !== -1 && testCategories[categoryIndex].tests > 0) {
                                        testCategories[categoryIndex].tests -= 1;
                                      }
                                    }
                                    
                                    // Entferne auch Status und Notizen komplett
                                    setTestStatuses(prev => {
                                      const newStatuses = {...prev};
                                      delete newStatuses[test.name];
                                      return newStatuses;
                                    });
                                    
                                    setTestNotes(prev => {
                                      const newNotes = {...prev};
                                      delete newNotes[test.name];
                                      return newNotes;
                                    });
                                    
                                    toast.success(`Test "${test.name}" komplett gelöscht`);
                                    // Force re-render
                                    setCurrentCategory(currentCategory);
                                  }
                                }}
                                variant="outline"
                                className="border-gray-600 text-gray-400 hover:bg-gray-700 px-2 py-1 text-xs h-8 w-8"
                                title="Test löschen"
                              >
                                🗑️
                              </Button>
                            </div>
                          </div>
                          
                          {/* Notiz-Bereich - erscheint wenn Bleistift geklickt wurde */}
                          {editingNote === test.name && (
                            <div className="mt-3 p-3 bg-gray-700 rounded border border-gray-600">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs text-gray-300">Notiz zu: {test.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <textarea
                                  value={testNotes[test.name] || ''}
                                  onChange={(e) => setTestNotes(prev => ({
                                    ...prev,
                                    [test.name]: e.target.value
                                  }))}
                                  placeholder="Notiz eingeben..."
                                  className="flex-1 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-xs text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 resize-none"
                                  rows="2"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setEditingNote(null);
                                    toast.success('Notiz gespeichert');
                                  }}
                                  className="bg-green-600 hover:bg-green-700 px-2 py-1 text-xs h-8 w-8"
                                  title="Notiz speichern"
                                >
                                  ✅
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setEditingNote(null);
                                    setTestNotes(prev => {
                                      const newNotes = {...prev};
                                      delete newNotes[test.name];
                                      return newNotes;
                                    });
                                  }}
                                  variant="outline"
                                  className="border-red-600 text-red-400 hover:bg-red-900 px-2 py-1 text-xs h-8 w-8"
                                  title="Notiz verwerfen"
                                >
                                  ❌
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {/* Gespeicherte Notiz anzeigen */}
                          {testNotes[test.name] && editingNote !== test.name && (
                            <div className="mt-2 p-2 bg-yellow-900/30 border border-yellow-600 rounded">
                              <div className="text-xs text-yellow-200">
                                <strong>Notiz:</strong> {testNotes[test.name]}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Link zum Handbuch */}
                  <div className="mt-4 text-center">
                    <Button
                      onClick={() => {
                        try {
                          // Schließe AuditLog
                          onClose();
                          
                          // Warte kurz und öffne dann Hilfe
                          setTimeout(() => {
                            try {
                              // Suche Hilfe-Button sicherer
                              const helpSelectors = [
                                'button[title*="Hilfe"]',
                                'button[aria-label*="Help"]', 
                                'button:contains("❓")',
                                '[data-testid="help-button"]',
                                '.help-button'
                              ];
                              
                              let helpButton = null;
                              for (const selector of helpSelectors) {
                                helpButton = document.querySelector(selector);
                                if (helpButton) break;
                              }
                              
                              if (helpButton) {
                                helpButton.click();
                                toast.success('Handbuch geöffnet');
                              } else {
                                // Fallback: Öffne Hilfe über Event
                                const helpEvent = new CustomEvent('openHelp', { 
                                  detail: { section: 'auditlog' },
                                  bubbles: true 
                                });
                                document.dispatchEvent(helpEvent);
                                toast.success('Handbuch-Event gesendet');
                              }
                            } catch (error) {
                              console.error('Fehler beim Öffnen des Handbuchs:', error);
                              toast.error('Handbuch konnte nicht geöffnet werden');
                            }
                          }, 200);
                        } catch (error) {
                          console.error('Runtime Error im Handbuch-Link:', error);
                          toast.error('Fehler beim Handbuch-Zugriff');
                        }
                      }}
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
              {/* Links: Status-Filter-Buttons mit Counter */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setStatusFilter(statusFilter === 'passed' ? '' : 'passed')}
                  className={`w-8 h-8 bg-green-600 hover:bg-green-700 rounded flex flex-col items-center justify-center text-white cursor-pointer relative ${
                    statusFilter === 'passed' ? 'ring-2 ring-white' : ''
                  }`}
                  title="Filter: Bestandene Tests aus allen Bereichen"
                >
                  <span className="text-sm">✓</span>
                  <span className="text-xs font-bold absolute -bottom-1 -right-1 bg-green-800 rounded-full w-4 h-4 flex items-center justify-center">
                    {Object.values(testStatuses).filter(status => status.status === 'passed').length}
                  </span>
                </Button>
                <Button
                  onClick={() => setStatusFilter(statusFilter === 'failed' ? '' : 'failed')}
                  className={`w-8 h-8 bg-red-600 hover:bg-red-700 rounded flex flex-col items-center justify-center text-white cursor-pointer relative ${
                    statusFilter === 'failed' ? 'ring-2 ring-white' : ''
                  }`}
                  title="Filter: Fehlgeschlagene Tests aus allen Bereichen"
                >
                  <span className="text-sm">✗</span>
                  <span className="text-xs font-bold absolute -bottom-1 -right-1 bg-red-800 rounded-full w-4 h-4 flex items-center justify-center">
                    {Object.values(testStatuses).filter(status => status.status === 'failed').length}
                  </span>
                </Button>
                <Button
                  onClick={() => setStatusFilter(statusFilter === 'inProgress' ? '' : 'inProgress')}
                  className={`w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded flex flex-col items-center justify-center text-white cursor-pointer relative ${
                    statusFilter === 'inProgress' ? 'ring-2 ring-white' : ''
                  }`}
                  title="Filter: Tests in Bearbeitung aus allen Bereichen"
                >
                  <span className="text-sm">~</span>
                  <span className="text-xs font-bold absolute -bottom-1 -right-1 bg-blue-800 rounded-full w-4 h-4 flex items-center justify-center">
                    {Object.values(testStatuses).filter(status => status.status === 'inProgress').length}
                  </span>
                </Button>
                <Button
                  onClick={() => setStatusFilter(statusFilter === 'pending' ? '' : 'pending')}
                  className={`w-8 h-8 bg-orange-600 hover:bg-orange-700 rounded flex flex-col items-center justify-center text-white cursor-pointer relative ${
                    statusFilter === 'pending' ? 'ring-2 ring-white' : ''
                  }`}
                  title="Filter: Ausstehende Tests aus allen Bereichen"
                >
                  <span className="text-sm">○</span>
                  <span className="text-xs font-bold absolute -bottom-1 -right-1 bg-orange-800 rounded-full w-4 h-4 flex items-center justify-center">
                    {(() => {
                      // Zähle alle Tests ohne Status aus allen Bereichen
                      let totalTests = 0;
                      let totalWithStatus = Object.keys(testStatuses).length;
                      Object.values(predefinedTests).forEach(tests => {
                        totalTests += tests.length;
                      });
                      return totalTests - totalWithStatus;
                    })()}
                  </span>
                </Button>
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