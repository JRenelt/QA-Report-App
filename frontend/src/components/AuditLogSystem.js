import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CheckCircle, Clock, AlertTriangle, Info, Download, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

const AuditLogSystem = ({ isOpen, onClose }) => {
  const [auditEntries, setAuditEntries] = useState([]);
  const [newTestName, setNewTestName] = useState('');
  const [currentCategory, setCurrentCategory] = useState('Allgemeines Design');
  const [showCategorySelection, setShowCategorySelection] = useState(true);
  const [visitedTests, setVisitedTests] = useState(new Set());

  // Erweiterte Test-Bereiche für alle FavOrg-Funktionen
  const testCategories = [
    'Allgemeines Design',
    'Header-Bereich', 
    'Sidebar-Bereich',
    'Search-Section',
    'Main-Content',
    'Bookmark-Karten',
    'Dialoge & Modals',
    'Navigation & Routing',
    'Drag & Drop System',
    'Filter & Sortierung',
    'Import/Export',
    'Einstellungen',
    'Performance & Responsive'
  ];

  // Lade gespeicherte Audit-Logs beim Öffnen
  useEffect(() => {
    if (isOpen) {
      const savedLogs = localStorage.getItem('favorg_audit_logs');
      if (savedLogs) {
        try {
          setAuditEntries(JSON.parse(savedLogs));
        } catch (error) {
          console.error('Fehler beim Laden der Audit-Logs:', error);
          toast.error('Fehler beim Laden der Audit-Logs');
        }
      }
    }
  }, [isOpen]);

  // Speichere Audit-Logs bei Änderungen
  const saveAuditLogs = (entries) => {
    try {
      localStorage.setItem('favorg_audit_logs', JSON.stringify(entries));
    } catch (error) {
      console.error('Fehler beim Speichern der Audit-Logs:', error);
      toast.error('Fehler beim Speichern der Audit-Logs');
    }
  };

  // Neuen Test-Eintrag hinzufügen
  const addTestEntry = (testName, category, status = 'pending') => {
    const newEntry = {
      id: Date.now(),
      testName: testName || `Test ${auditEntries.length + 1}`,
      category: category || currentCategory,
      status: status,
      timestamp: new Date().toISOString(),
      dateTime: new Date().toLocaleString('de-DE', {
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      notes: ''
    };

    const updatedEntries = [newEntry, ...auditEntries];
    setAuditEntries(updatedEntries);
    saveAuditLogs(updatedEntries);
    
    // Markiere Test als besucht und verstecke Auswahl
    setVisitedTests(prev => new Set([...prev, testName]));
    setShowCategorySelection(false);
    
    toast.success(`Test "${newEntry.testName}" hinzugefügt`);
  };

  // Test-Status ändern (Abhaken/Fehlschlagen)
  const updateTestStatus = (id, newStatus, notes = '') => {
    const updatedEntries = auditEntries.map(entry => {
      if (entry.id === id) {
        return {
          ...entry,
          status: newStatus,
          notes: notes,
          updatedAt: new Date().toISOString(),
          updatedDateTime: new Date().toLocaleString('de-DE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit', 
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        };
      }
      return entry;
    });

    setAuditEntries(updatedEntries);
    saveAuditLogs(updatedEntries);

    const statusMessages = {
      passed: 'Test bestanden ✅',
      failed: 'Test fehlgeschlagen ❌', 
      pending: 'Test zurückgesetzt ⏳',
      info: 'Test-Info aktualisiert ℹ️'
    };

    toast.success(statusMessages[newStatus] || 'Test-Status aktualisiert');
  };

  // Test löschen
  const deleteTest = (id) => {
    const updatedEntries = auditEntries.filter(entry => entry.id !== id);
    setAuditEntries(updatedEntries);
    saveAuditLogs(updatedEntries);
    toast.success('Test-Eintrag gelöscht');
  };

  // Alle Tests löschen - Reset auch die besuchten Tests
  const clearAllTests = () => {
    if (window.confirm('Alle Audit-Log Einträge löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      setAuditEntries([]);
      setVisitedTests(new Set());
      localStorage.removeItem('favorg_audit_logs');
      toast.success('Alle Audit-Logs gelöscht');
    }
  };

  // Audit-Log als JSON exportieren
  const exportAuditLog = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalTests: auditEntries.length,
      passedTests: auditEntries.filter(entry => entry.status === 'passed').length,
      failedTests: auditEntries.filter(entry => entry.status === 'failed').length,
      pendingTests: auditEntries.filter(entry => entry.status === 'pending').length,
      categories: testCategories,
      entries: auditEntries
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `favorg_audit_log_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('Audit-Log exportiert');
  };

  // Status-Badge Komponente
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      passed: { icon: CheckCircle, color: 'bg-green-500', text: 'Bestanden' },
      failed: { icon: AlertTriangle, color: 'bg-red-500', text: 'Fehlgeschlagen' },
      pending: { icon: Clock, color: 'bg-yellow-500', text: 'Ausstehend' },
      info: { icon: Info, color: 'bg-blue-500', text: 'Info' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} text-white`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  // Umfassende Test-Szenarien mit Symbolen und kurzen Namen
  const predefinedTests = [
    // Allgemeines Design
    { name: '80% UI-Kompaktheit', category: 'Allgemeines Design', icon: '📱', tooltip: '80% kompakte UI-Darstellung prüfen' },
    { name: 'Dark Theme', category: 'Allgemeines Design', icon: '🌙', tooltip: 'Dark Theme Konsistenz testen' },
    { name: 'Responsiveness', category: 'Allgemeines Design', icon: '📐', tooltip: 'Responsive Layout auf verschiedenen Größen' },
    { name: 'Typographie', category: 'Allgemeines Design', icon: '🔤', tooltip: 'Typographie und Schriftarten prüfen' },
    
    // Header-Bereich
    { name: 'Logo + Counter', category: 'Header-Bereich', icon: '🏷️', tooltip: 'Logo und Bookmark-Anzahl anzeigen' },
    { name: 'Action-Buttons', category: 'Header-Bereich', icon: '🔘', tooltip: 'Action-Buttons funktional (Neu, Export, etc.)' },
    { name: 'Header-Icons', category: 'Header-Bereich', icon: '⚙️', tooltip: 'Header-Icons klickbar (Hilfe, Statistik, Einstellungen)' },
    { name: 'Status-Buttons', category: 'Header-Bereich', icon: '🎯', tooltip: 'Status-Buttons (TOTE Links, Duplikate, Localhost)' },
    
    // Sidebar-Bereich
    { name: 'Kategorien-Tree', category: 'Sidebar-Bereich', icon: '🌳', tooltip: 'Kategorien-Hierarchie korrekt angezeigt' },
    { name: 'Collapse/Expand', category: 'Sidebar-Bereich', icon: '↔️', tooltip: 'Sidebar Collapse/Expand funktional' },
    { name: 'Navigation', category: 'Sidebar-Bereich', icon: '🧭', tooltip: 'Kategorie-Navigation und -Auswahl' },
    { name: 'Bookmark-Count', category: 'Sidebar-Bereich', icon: '🔢', tooltip: 'Bookmark-Anzahl pro Kategorie anzeigen' },
    { name: 'Resizer', category: 'Sidebar-Bereich', icon: '↕️', tooltip: 'Sidebar-Resizer Funktionalität' },
    
    // Search-Section
    { name: 'Suchfeld', category: 'Search-Section', icon: '🔍', tooltip: 'Suchfeld Eingabe und Funktionalität' },
    { name: 'Erweiterte Suche', category: 'Search-Section', icon: '🔎', tooltip: 'Erweiterte Suche (Titel, URL, Beschreibung)' },
    { name: 'Status-Filter', category: 'Search-Section', icon: '🎛️', tooltip: 'Status-Filter Dropdown funktional' },
    { name: 'Ergebnis-Count', category: 'Search-Section', icon: '📊', tooltip: 'Suchergebnis-Anzahl korrekt angezeigt' },
    { name: 'Clear Button', category: 'Search-Section', icon: '❌', tooltip: 'Clear Search Button funktional' },
    
    // Main-Content
    { name: 'Grid Layout', category: 'Main-Content', icon: '⚏', tooltip: 'Bookmark-Grid Layout korrekt' },
    { name: 'View Toggle', category: 'Main-Content', icon: '🔀', tooltip: 'Karten/Tabellen-Ansicht Umschalter' },
    { name: 'Scrolling', category: 'Main-Content', icon: '📜', tooltip: 'Scrolling und Pagination' },
    { name: 'Responsive', category: 'Main-Content', icon: '📱', tooltip: 'Content-Bereich responsive' },
    
    // Bookmark-Karten
    { name: 'Card Design', category: 'Bookmark-Karten', icon: '🎴', tooltip: 'Bookmark-Karte Design und Layout' },
    { name: 'Status-Badges', category: 'Bookmark-Karten', icon: '🏷️', tooltip: 'Status-Badges korrekt angezeigt' },
    { name: 'Lock Button', category: 'Bookmark-Karten', icon: '🔒', tooltip: 'Lock/Unlock Button funktional' },
    { name: 'Edit/Delete', category: 'Bookmark-Karten', icon: '✏️', tooltip: 'Edit/Delete Buttons verfügbar' },
    { name: 'Favicons', category: 'Bookmark-Karten', icon: '🖼️', tooltip: 'Favicon-Anzeige wenn aktiviert' },
    { name: 'URL-Links', category: 'Bookmark-Karten', icon: '🔗', tooltip: 'URL-Links funktional' },
    
    // Dialoge & Modals
    { name: 'Bookmark-Dialog', category: 'Dialoge & Modals', icon: '📝', tooltip: 'Bookmark-Dialog öffnen/schließen' },
    { name: 'Kategorie-Select', category: 'Dialoge & Modals', icon: '📁', tooltip: 'Kategorie-Auswahl im Dialog' },
    { name: 'Settings-Dialog', category: 'Dialoge & Modals', icon: '⚙️', tooltip: 'Einstellungen-Dialog alle Tabs' },
    { name: 'Help-System', category: 'Dialoge & Modals', icon: '❓', tooltip: 'Hilfe-System Dialog und Navigation' },
    { name: 'Statistics', category: 'Dialoge & Modals', icon: '📈', tooltip: 'Statistik-Dialog Daten-Anzeige' },
    
    // Drag & Drop System
    { name: 'Bookmark D&D', category: 'Drag & Drop System', icon: '🎯', tooltip: 'Bookmark zwischen Kategorien verschieben' },
    { name: 'Category D&D', category: 'Drag & Drop System', icon: '📂', tooltip: 'Kategorie Hierarchie-Verschiebung' },
    { name: 'Cross-Level', category: 'Drag & Drop System', icon: '🎢', tooltip: 'Cross-Level Category Movement' },
    { name: 'Shift+Drag', category: 'Drag & Drop System', icon: '⇧', tooltip: 'Shift+Drag Einfüge-Modus' },
    { name: 'Visual Feedback', category: 'Drag & Drop System', icon: '👁️', tooltip: 'Visuelle Drop-Zone Feedback' },
    
    // Filter & Sortierung
    { name: 'Status-Filter', category: 'Filter & Sortierung', icon: '🎛️', tooltip: 'Status-Filter alle Typen (Aktiv, Tot, etc.)' },
    { name: 'Category-Filter', category: 'Filter & Sortierung', icon: '📁', tooltip: 'Kategorie-Filter Funktionalität' },
    { name: 'Sortierung', category: 'Filter & Sortierung', icon: '🔢', tooltip: 'Sortierung nach Datum/Alphabet' },
    { name: 'Kombiniert', category: 'Filter & Sortierung', icon: '🔗', tooltip: 'Kombinierte Filter (Status + Kategorie)' },
    
    // Import/Export
    { name: 'HTML Import', category: 'Import/Export', icon: '📥', tooltip: 'HTML Import-Funktionalität' },
    { name: 'JSON Export', category: 'Import/Export', icon: '📤', tooltip: 'JSON Export alle Formate' },
    { name: 'XML/CSV', category: 'Import/Export', icon: '📋', tooltip: 'XML/CSV Import/Export' },
    { name: 'Testdaten', category: 'Import/Export', icon: '🧪', tooltip: 'Testdaten-Generierung (70 Bookmarks)' },
    
    // Einstellungen
    { name: 'Theme-Switch', category: 'Einstellungen', icon: '🎨', tooltip: 'Theme-Wechsel (Hell/Dunkel)' },
    { name: 'S-Time', category: 'Einstellungen', icon: '⏱️', tooltip: 'Erweiterte Einstellungen (S-Time)' },
    { name: 'System-Tools', category: 'Einstellungen', icon: '🔧', tooltip: 'System-Tools (AuditLog/SysDok)' },
    { name: 'Meldungen', category: 'Einstellungen', icon: '📢', tooltip: 'Meldungen Delay Einstellung' },
    
    // Performance & Responsive
    { name: 'Load Speed', category: 'Performance & Responsive', icon: '⚡', tooltip: 'Ladezeiten unter 3 Sekunden' },
    { name: 'Mobile', category: 'Performance & Responsive', icon: '📱', tooltip: 'Mobile Responsiveness (768px)' },
    { name: 'Tablet', category: 'Performance & Responsive', icon: '📟', tooltip: 'Tablet-Ansicht (768-1200px)' },
    { name: 'Desktop', category: 'Performance & Responsive', icon: '🖥️', tooltip: 'Desktop-Optimierung (>1200px)' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] bg-gray-900 text-white border-gray-700 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-cyan-400 flex items-center">
            <CheckCircle className="w-6 h-6 mr-2" />
            🔍 FavOrg Audit-Log System - Vollständige Qualitätssicherung
          </DialogTitle>
          <p className="text-gray-300">Systematisches Testing aller FavOrg-Funktionen und UI-Bereiche</p>
        </DialogHeader>

        <div className="flex flex-col h-full space-y-4 overflow-hidden">
          {/* Header Controls - Fixed */}
          <div className="flex-shrink-0">
            <div className="flex flex-wrap gap-4 p-4 bg-gray-800 rounded-lg">
              <div className="flex-1 min-w-[300px]">
                <input
                  type="text"
                  placeholder="Neuer Test-Name..."
                  value={newTestName}
                  onChange={(e) => setNewTestName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newTestName.trim()) {
                      addTestEntry(newTestName.trim(), currentCategory);
                      setNewTestName('');
                    }
                  }}
                />
              </div>
              
              <select
                value={currentCategory}
                onChange={(e) => setCurrentCategory(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              >
                {testCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <Button 
                onClick={() => {
                  if (newTestName.trim()) {
                    addTestEntry(newTestName.trim(), currentCategory);
                    setNewTestName('');
                  }
                }}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Test hinzufügen
              </Button>

              <Button onClick={exportAuditLog} variant="outline" className="border-gray-600 text-white">
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>

              <Button onClick={clearAllTests} variant="outline" className="border-red-600 text-red-400 hover:bg-red-900">
                <Trash2 className="w-4 h-4 mr-2" />
                Alle löschen
              </Button>
            </div>

            {/* Quick Add Predefined Tests */}
            <div className="p-4 bg-gray-850 rounded-lg mt-4">
              <h3 className="text-lg font-semibold mb-3 text-cyan-300">📝 Vordefinierte Test-Szenarien (alle FavOrg-Bereiche):</h3>
              <div className="max-h-32 overflow-y-auto">
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                  {predefinedTests.slice(0, 20).map((test, index) => (
                    <Button
                      key={index}
                      onClick={() => addTestEntry(test.name, test.category)}
                      variant="outline"
                      size="sm"
                      className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700 justify-start"
                    >
                      {test.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-4 gap-4 text-center mt-4">
              <div className="p-3 bg-green-900 rounded-lg">
                <div className="text-2xl font-bold text-green-400">
                  {auditEntries.filter(e => e.status === 'passed').length}
                </div>
                <div className="text-sm text-green-300">Bestanden</div>
              </div>
              <div className="p-3 bg-red-900 rounded-lg">
                <div className="text-2xl font-bold text-red-400">
                  {auditEntries.filter(e => e.status === 'failed').length}
                </div>
                <div className="text-sm text-red-300">Fehlgeschlagen</div>
              </div>
              <div className="p-3 bg-yellow-900 rounded-lg">
                <div className="text-2xl font-bold text-yellow-400">
                  {auditEntries.filter(e => e.status === 'pending').length}
                </div>
                <div className="text-sm text-yellow-300">Ausstehend</div>
              </div>
              <div className="p-3 bg-blue-900 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">
                  {auditEntries.length}
                </div>
                <div className="text-sm text-blue-300">Gesamt</div>
              </div>
            </div>
          </div>

          {/* Audit Log Entries - Scrollable */}
          <div className="flex-1 overflow-y-auto bg-gray-800 rounded-lg">
            {auditEntries.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Keine Test-Einträge vorhanden</h3>
                <p>Fügen Sie Ihren ersten Test hinzu, um mit dem systematischen FavOrg-Testing zu beginnen.</p>
              </div>
            ) : (
              <div className="space-y-2 p-4">
                {auditEntries.map((entry) => (
                  <div key={entry.id} className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <StatusBadge status={entry.status} />
                          <Badge variant="outline" className="border-gray-500 text-gray-300">
                            {entry.category}
                          </Badge>
                          <span className="text-sm text-gray-400">
                            {entry.dateTime}
                          </span>
                        </div>
                        
                        <h4 className="font-semibold text-white mb-1">{entry.testName}</h4>
                        
                        {entry.notes && (
                          <p className="text-sm text-gray-300 bg-gray-800 p-2 rounded mt-2">
                            📝 {entry.notes}
                          </p>
                        )}
                        
                        {entry.updatedAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            Aktualisiert: {entry.updatedDateTime}
                          </p>
                        )}
                      </div>

                      <div className="flex space-x-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => updateTestStatus(entry.id, 'passed', 'Test erfolgreich bestanden')}
                          className="bg-green-600 hover:bg-green-700"
                          disabled={entry.status === 'passed'}
                        >
                          ✅
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            const notes = prompt('Fehlschlag-Notizen:', '');
                            if (notes !== null) {
                              updateTestStatus(entry.id, 'failed', notes || 'Test fehlgeschlagen');
                            }
                          }}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={entry.status === 'failed'}
                        >
                          ❌
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updateTestStatus(entry.id, 'pending')}
                          className="bg-yellow-600 hover:bg-yellow-700"
                          disabled={entry.status === 'pending'}
                        >
                          ⏳
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => deleteTest(entry.id)}
                          variant="outline"
                          className="border-gray-600 text-gray-400 hover:bg-red-900"
                        >
                          🗑️
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuditLogSystem;