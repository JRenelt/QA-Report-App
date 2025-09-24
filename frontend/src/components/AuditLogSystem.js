import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { toast } from 'sonner';

const AuditLogSystem = ({ isOpen, onClose }) => {
  const [currentCategory, setCurrentCategory] = useState('Allgemeines Design');
  const [viewMode, setViewMode] = useState('tests'); // 'tests', 'archive'
  const [newTestName, setNewTestName] = useState('');
  const [testStatuses, setTestStatuses] = useState({});
  const [testNotes, setTestNotes] = useState({});
  const [statusFilter, setStatusFilter] = useState('');
  const [archivedReports, setArchivedReports] = useState([]);
  const [dynamicTests, setDynamicTests] = useState({});
  
  // Test-Kategorien
  const testCategories = [
    'Allgemeines Design',
    'Header-Bereich', 
    'Sidebar-Bereich',
    'Main-Content',
    'Bookmark-Karten',
    'Einstellungen'
  ];

  // Test-Daten
  const predefinedTests = {
    'Allgemeines Design': [
      { name: '80% UI-Kompaktheit', icon: '📱', tooltip: '80% kompakte UI-Darstellung prüfen' },
      { name: 'Dark Theme', icon: '🌙', tooltip: 'Dark Theme Konsistenz testen' },
      { name: 'Responsiveness', icon: '📐', tooltip: 'Responsive Layout auf verschiedenen Größen' },
      { name: 'Typographie', icon: '🔤', tooltip: 'Typographie und Schriftarten prüfen' }
    ],
    'Header-Bereich': [
      { name: 'Logo & Titel Platzierung', icon: '🏷️', tooltip: 'Logo und Titel korrekt positioniert' },
      { name: 'Navigation Icons', icon: '🧭', tooltip: 'Alle Navigation-Icons funktional' },
      { name: 'Bookmark-Anzahl [X]', icon: '🔢', tooltip: 'Bookmark-Counter korrekt angezeigt' },
      { name: 'Header-Buttons Layout', icon: '🔘', tooltip: 'Button-Layout im Header prüfen' }
    ],
    'Sidebar-Bereich': [
      { name: 'Kategorie-Liste', icon: '📂', tooltip: 'Kategorien korrekt aufgelistet' },
      { name: 'Drag & Drop Kategorien', icon: '🎯', tooltip: 'Kategorie D&D funktional' },
      { name: 'Resizing Funktionalität', icon: '↔️', tooltip: 'Sidebar-Größenänderung' },
      { name: 'Kategorie-Tooltips', icon: '💬', tooltip: 'Tooltip-Positionierung testen' },
      { name: 'Unterkategorie-Hierarchie', icon: '🌳', tooltip: 'Hierarchische Darstellung prüfen' }
    ],
    'Main-Content': [
      { name: 'Bookmark-Darstellung', icon: '🎴', tooltip: 'Bookmark-Karten Layout' },
      { name: 'Tabellen-Ansicht Toggle', icon: '📋', tooltip: 'List/Grid View umschalten' },
      { name: 'Scroll-Performance', icon: '📜', tooltip: 'Scrolling bei vielen Bookmarks' },
      { name: 'Leere-State Anzeige', icon: '📭', tooltip: 'Anzeige wenn keine Bookmarks' }
    ],
    'Bookmark-Karten': [
      { name: 'Status-Farb-System', icon: '🎨', tooltip: 'Farben für verschiedene Status' },
      { name: 'Lock/Unlock Buttons', icon: '🔒', tooltip: 'Sperr-Funktionalität testen' },
      { name: 'Action-Buttons Layout', icon: '🔘', tooltip: 'Edit/Delete/Link Button-Layout' },
      { name: 'Drag-Handles sichtbar', icon: '⋮⋮', tooltip: 'Drag-Griffe erkennbar' },
      { name: 'Hover-States', icon: '👆', tooltip: 'Hover-Effekte auf Karten' },
      { name: 'Status-Badge Position', icon: '🏷️', tooltip: 'Status-Badges korrekt positioniert' }
    ],
    'Einstellungen': [
      { name: 'Tab-Navigation Icons', icon: '🗂️', tooltip: 'Settings-Tabs mit Icons' },
      { name: 'Theme-Einstellungen', icon: '🌙', tooltip: 'Dark/Light Theme Toggle' },
      { name: 'Meldungen Delay Checkbox', icon: '⏰', tooltip: 'Toast-Delay Einstellung' },
      { name: 'Gefahr-Bereich rot', icon: '⚠️', tooltip: 'Danger-Zone rote Markierung' }
    ]
  };

  // Aktuelle Tests berechnen
  const getCurrentTests = () => {
    const baseTests = predefinedTests[currentCategory] || [];
    const categoryDynamicTests = dynamicTests[currentCategory] || [];
    return [...baseTests, ...categoryDynamicTests];
  };

  const getFilteredTests = () => {
    const allTests = getCurrentTests();
    if (!statusFilter) return allTests;
    return allTests.filter(test => testStatuses[test.name] === statusFilter);
  };

  // Event-Handler
  const handleAddTest = () => {
    if (!newTestName.trim()) {
      toast.error('Bitte geben Sie einen Testnamen ein');
      return;
    }
    
    if (!dynamicTests[currentCategory]) {
      setDynamicTests({...dynamicTests, [currentCategory]: []});
    }
    
    const newTests = [...(dynamicTests[currentCategory] || []), {
      name: newTestName,
      icon: '🔍',
      tooltip: 'Benutzerdefinierter Test',
      isDynamic: true
    }];
    
    setDynamicTests({...dynamicTests, [currentCategory]: newTests});
    setNewTestName('');
    toast.success('Test hinzugefügt');
  };

  const handleRemoveTest = () => {
    if (!newTestName.trim()) {
      toast.error('Bitte geben Sie den Namen des zu löschenden Tests ein');
      return;
    }
    
    const categoryTests = dynamicTests[currentCategory] || [];
    const newTests = categoryTests.filter(test => test.name !== newTestName);
    
    if (newTests.length === categoryTests.length) {
      toast.error('Test nicht gefunden');
      return;
    }
    
    setDynamicTests({...dynamicTests, [currentCategory]: newTests});
    delete testStatuses[newTestName];
    setNewTestName('');
    toast.success('Test entfernt');
  };

  const setTestStatus = (testName, status) => {
    setTestStatuses({...testStatuses, [testName]: status});
    toast.success(`Status "${status}" gesetzt`);
  };

  const handleSaveToArchive = () => {
    const tests = getCurrentTests();
    const completedTests = tests.filter(test => testStatuses[test.name]);
    
    if (completedTests.length === 0) {
      toast.error('Keine Tests mit Status zum Speichern gefunden');
      return;
    }
    
    const report = {
      id: Date.now(),
      category: currentCategory,
      timestamp: new Date().toLocaleString('de-DE'),
      totalTests: tests.length,
      completedTests: completedTests.length,
      testStatuses: {...testStatuses},
      testNotes: {...testNotes}
    };
    
    const newReports = [report, ...archivedReports.slice(0, 9)];
    setArchivedReports(newReports);
    
    toast.success(`Test-Stand für "${currentCategory}" ins Archiv gespeichert`);
  };

  const handlePDFExport = () => {
    const tests = getCurrentTests();
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>FavOrg AuditLog-Bericht: ${currentCategory}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; background: white; color: black; }
          .header { text-align: center; border-bottom: 2px solid #06b6d4; padding-bottom: 20px; margin-bottom: 30px; }
          .test-item { padding: 10px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 5px; }
          @media print { body { background: white !important; color: black !important; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FavOrg AuditLog-Bericht</h1>
          <h2>${currentCategory}</h2>
          <p>Erstellt am: ${new Date().toLocaleString('de-DE')}</p>
        </div>
        ${tests.map(test => {
          const status = testStatuses[test.name] || 'ungeprüft';
          return `
            <div class="test-item">
              <strong>${test.icon} ${test.name}</strong>
              <p>${test.tooltip}</p>
              <p><strong>Status:</strong> ${status}</p>
            </div>
          `;
        }).join('')}
        <script>
          setTimeout(() => {
            window.print();
            window.onafterprint = () => window.close();
          }, 500);
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleResetAll = () => {
    if (window.confirm('Alle Tests zurücksetzen?')) {
      setTestStatuses({});
      setTestNotes({});
      toast.success('Alle Tests zurückgesetzt');
    }
  };

  const toggleArchiveView = () => {
    setViewMode(viewMode === 'archive' ? 'tests' : 'archive');
  };

  const loadReport = (index) => {
    const report = archivedReports[index];
    if (!report) return;
    
    setTestStatuses({...report.testStatuses});
    setTestNotes({...report.testNotes});
    setCurrentCategory(report.category);
    setViewMode('tests');
    
    toast.success(`Bericht "${report.category}" geladen`);
  };

  const deleteReport = (index) => {
    const report = archivedReports[index];
    if (!report) return;
    
    if (window.confirm(`Bericht "${report.category}" löschen?`)) {
      const newReports = archivedReports.filter((_, i) => i !== index);
      setArchivedReports(newReports);
      toast.success('Bericht gelöscht');
    }
  };

  // Status-Counts berechnen
  const getStatusCounts = () => {
    const allStatuses = Object.values(testStatuses);
    return {
      all: allStatuses.length,
      success: allStatuses.filter(s => s === 'success').length,
      error: allStatuses.filter(s => s === 'error').length,
      warning: allStatuses.filter(s => s === 'warning').length,
      info: allStatuses.filter(s => s === 'info').length
    };
  };

  const counts = getStatusCounts();
  const currentTests = getFilteredTests();

  // Kategorie-Icon Mapping
  const getCategoryIcon = (category) => {
    const icons = {
      'Allgemeines Design': '🎨',
      'Header-Bereich': '🔝',
      'Sidebar-Bereich': '📋',
      'Main-Content': '📄',
      'Bookmark-Karten': '🎴',
      'Einstellungen': '⚙️'
    };
    return icons[category] || '📂';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-full h-[90vh] p-0 bg-gray-900 border-gray-700" style={{ margin: '10px 0' }}>
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between" style={{ minHeight: '60px' }}>
          <h2 className="text-xl font-semibold text-cyan-400">🔍 AuditLog-System - Intern</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Neuer Testname..."
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm pr-8 w-60"
                value={newTestName}
                onChange={(e) => setNewTestName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTest()}
              />
              <button
                onClick={() => setNewTestName('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-none border-2 border-gray-500 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-500 hover:text-gray-900 text-xs transition-all"
                title="Input leeren"
              >
                ×
              </button>
            </div>
            <Button onClick={handleAddTest} size="sm" className="bg-cyan-600 hover:bg-cyan-700">
              ➕
            </Button>
            <Button onClick={handleRemoveTest} size="sm" variant="outline" className="bg-red-600 hover:bg-red-700 text-white border-red-600">
              ✕
            </Button>
            <div 
              className="w-12 h-8 opacity-0 pointer-events-none" 
              style={{ 
                background: 'transparent', 
                minWidth: '50px',
                content: '""',
                display: 'inline-block'
              }}
              title="Spacing Element"
            >
              {/* Transparentes 50px Element für Layout-Kontrolle */}
            </div>
          </div>
        </div>

        {/* Content mit Sidebar-Layout */}
        <div className="flex flex-1 h-full">
          {viewMode === 'tests' ? (
            <>
              {/* Sidebar: Test-Bereiche */}
              <div className="w-80 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
                <h3 className="text-lg font-semibold text-cyan-400 mb-4">📋 Test-Bereiche</h3>
                <div className="space-y-2">
                  {testCategories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setCurrentCategory(category)}
                      className={`w-full text-left p-3 rounded-lg border transition-all duration-200 flex items-center justify-between ${
                        currentCategory === category
                          ? 'bg-cyan-600 text-white border-cyan-500'
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-cyan-900 hover:border-cyan-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{getCategoryIcon(category)}</span>
                        <span className="font-medium">{category}</span>
                      </div>
                      <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                        {(predefinedTests[category]?.length || 0) + (dynamicTests[category]?.length || 0)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Main: Testpunkte */}
              <div className="flex-1 bg-gray-900 p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-cyan-400">
                    {getCategoryIcon(currentCategory)} {currentCategory}
                  </h3>
                  <span className="bg-blue-600 text-white px-3 py-1 rounded text-sm">
                    {currentTests.length} Tests
                  </span>
                </div>

                <div className="space-y-3">
                  {currentTests.map((test) => (
                    <div
                      key={test.name}
                      className={`bg-gray-800 rounded-lg p-4 border-2 transition-all duration-200 ${
                        testStatuses[test.name] === 'success' ? 'border-green-500' :
                        testStatuses[test.name] === 'error' ? 'border-red-500' :
                        testStatuses[test.name] === 'warning' ? 'border-yellow-500' :
                        testStatuses[test.name] === 'info' ? 'border-blue-500' :
                        'border-gray-700 hover:border-cyan-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{test.icon}</span>
                          <div>
                            <strong className="text-white">{test.name}</strong>
                            {test.isDynamic && (
                              <span className="ml-2 bg-cyan-600 text-white px-2 py-1 rounded text-xs">Custom</span>
                            )}
                          </div>
                        </div>
                        {testStatuses[test.name] && (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            testStatuses[test.name] === 'success' ? 'bg-green-600 text-white' :
                            testStatuses[test.name] === 'error' ? 'bg-red-600 text-white' :
                            testStatuses[test.name] === 'warning' ? 'bg-yellow-600 text-white' :
                            testStatuses[test.name] === 'info' ? 'bg-blue-600 text-white' : ''
                          }`}>
                            {testStatuses[test.name] === 'success' ? '✅ Bestanden' :
                             testStatuses[test.name] === 'error' ? '❌ Fehlgeschlagen' :
                             testStatuses[test.name] === 'warning' ? '⏳ In Bearbeitung' :
                             testStatuses[test.name] === 'info' ? '🗑️ Übersprungen' : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mb-3">{test.tooltip}</p>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => setTestStatus(test.name, 'success')}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-xs"
                        >
                          ✅
                        </Button>
                        <Button
                          onClick={() => setTestStatus(test.name, 'error')}
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-xs"
                        >
                          ❌
                        </Button>
                        <Button
                          onClick={() => setTestStatus(test.name, 'warning')}
                          size="sm"
                          className="bg-yellow-600 hover:bg-yellow-700 text-xs"
                        >
                          ⏳
                        </Button>
                        <Button
                          onClick={() => setTestStatus(test.name, 'info')}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-xs"
                        >
                          🗑️
                        </Button>
                      </div>
                    </div>
                  ))}

                  {currentTests.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-gray-400 mb-2">Keine Tests für "{currentCategory}" gefunden.</p>
                      <p className="text-gray-500 text-sm">Verwenden Sie das Input-Feld im Header, um neue Tests hinzuzufügen.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Archiv-Ansicht */
            <div className="flex-1 bg-gray-900 p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-cyan-400">📁 Archivierte Test-Berichte</h3>
                <span className="bg-blue-600 text-white px-3 py-1 rounded text-sm">
                  {archivedReports.length} Berichte
                </span>
              </div>

              {archivedReports.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 mb-2 text-lg">📁 Keine archivierten Berichte vorhanden</p>
                  <p className="text-gray-500">Speichern Sie Tests mit dem "💾 Test speichern" Button, um Berichte zu erstellen.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {archivedReports.map((report, index) => (
                    <div key={report.id} className="bg-gray-800 rounded-lg p-4 border-2 border-cyan-600">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">📊</span>
                          <div>
                            <strong className="text-white">{report.category}</strong>
                            <div className="text-gray-400 text-sm">{report.timestamp}</div>
                          </div>
                        </div>
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                          {report.completedTests}/{report.totalTests} Tests
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-3">
                        Bericht erstellt am {report.timestamp} mit {report.completedTests} abgeschlossenen Tests
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => loadReport(index)}
                          size="sm"
                          className="bg-cyan-600 hover:bg-cyan-700 text-xs"
                        >
                          📥 Laden
                        </Button>
                        <Button
                          onClick={() => deleteReport(index)}
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-xs"
                        >
                          🗑️ Löschen
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-800 border-t border-gray-700 p-3 flex items-center justify-between">
          {/* Links: 5 Status-Filter Buttons */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setStatusFilter('')}
              className={`text-xs ${statusFilter === '' ? 'bg-cyan-600' : 'bg-gray-700'}`}
              size="sm"
            >
              Alle ({counts.all})
            </Button>
            <Button
              onClick={() => setStatusFilter('success')}
              className={`text-xs ${statusFilter === 'success' ? 'bg-green-600' : 'bg-gray-700'}`}
              size="sm"
            >
              ✅ ({counts.success})
            </Button>
            <Button
              onClick={() => setStatusFilter('error')}
              className={`text-xs ${statusFilter === 'error' ? 'bg-red-600' : 'bg-gray-700'}`}
              size="sm"
            >
              ❌ ({counts.error})
            </Button>
            <Button
              onClick={() => setStatusFilter('warning')}
              className={`text-xs ${statusFilter === 'warning' ? 'bg-yellow-600' : 'bg-gray-700'}`}
              size="sm"
            >
              ⏳ ({counts.warning})
            </Button>
            <Button
              onClick={() => setStatusFilter('info')}
              className={`text-xs ${statusFilter === 'info' ? 'bg-blue-600' : 'bg-gray-700'}`}
              size="sm"
            >
              🗑️ ({counts.info})
            </Button>
          </div>

          {/* Rechts: 4 Aktions-Buttons */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSaveToArchive}
              size="sm"
              className="bg-gray-700 hover:bg-gray-600 text-xs"
            >
              💾 Test speichern
            </Button>
            <Button
              onClick={toggleArchiveView}
              size="sm"
              className="bg-gray-700 hover:bg-gray-600 text-xs"
            >
              {viewMode === 'archive' ? '📋 Testpunkte' : `📁 Archiv (${archivedReports.length})`}
            </Button>
            <Button
              onClick={handlePDFExport}
              size="sm"
              className="bg-gray-700 hover:bg-gray-600 text-xs"
            >
              📄 PDF-Export
            </Button>
            <Button
              onClick={handleResetAll}
              size="sm"
              variant="outline"
              className="text-xs"
            >
              🗑️ Reset
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuditLogSystem;