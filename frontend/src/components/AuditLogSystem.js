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
      status: status, // pending, passed, failed, info
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

  // Alle Tests löschen
  const clearAllTests = () => {
    if (window.confirm('Alle Audit-Log Einträge löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      setAuditEntries([]);
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

  // Umfassende Test-Szenarien für alle FavOrg-Bereiche
  const predefinedTests = [
    // Allgemeines Design
    { name: '80% kompakte UI-Darstellung prüfen', category: 'Allgemeines Design' },
    { name: 'Dark Theme Konsistenz testen', category: 'Allgemeines Design' },
    { name: 'Responsive Layout auf verschiedenen Größen', category: 'Allgemeines Design' },
    { name: 'Typographie und Schriftarten prüfen', category: 'Allgemeines Design' },
    
    // Header-Bereich
    { name: 'Logo und Bookmark-Anzahl anzeigen', category: 'Header-Bereich' },
    { name: 'Action-Buttons funktional (Neu, Export, etc.)', category: 'Header-Bereich' },
    { name: 'Header-Icons klickbar (Hilfe, Statistik, Einstellungen)', category: 'Header-Bereich' },
    { name: 'Status-Buttons (TOTE Links, Duplikate, Localhost)', category: 'Header-Bereich' },
    
    // Sidebar-Bereich
    { name: 'Kategorien-Hierarchie korrekt angezeigt', category: 'Sidebar-Bereich' },
    { name: 'Sidebar Collapse/Expand funktional', category: 'Sidebar-Bereich' },
    { name: 'Kategorie-Navigation und -Auswahl', category: 'Sidebar-Bereich' },
    { name: 'Bookmark-Anzahl pro Kategorie anzeigen', category: 'Sidebar-Bereich' },
    { name: 'Sidebar-Resizer Funktionalität', category: 'Sidebar-Bereich' },
    
    // Search-Section
    { name: 'Suchfeld Eingabe und Funktionalität', category: 'Search-Section' },
    { name: 'Erweiterte Suche (Titel, URL, Beschreibung)', category: 'Search-Section' },
    { name: 'Status-Filter Dropdown funktional', category: 'Search-Section' },
    { name: 'Suchergebnis-Anzahl korrekt angezeigt', category: 'Search-Section' },
    { name: 'Clear Search Button funktional', category: 'Search-Section' },
    
    // Main-Content
    { name: 'Bookmark-Grid Layout korrekt', category: 'Main-Content' },
    { name: 'Karten/Tabellen-Ansicht Umschalter', category: 'Main-Content' },
    { name: 'Scrolling und Pagination', category: 'Main-Content' },
    { name: 'Content-Bereich responsive', category: 'Main-Content' },
    
    // Bookmark-Karten
    { name: 'Bookmark-Karte Design und Layout', category: 'Bookmark-Karten' },
    { name: 'Status-Badges korrekt angezeigt', category: 'Bookmark-Karten' },
    { name: 'Lock/Unlock Button funktional', category: 'Bookmark-Karten' },
    { name: 'Edit/Delete Buttons verfügbar', category: 'Bookmark-Karten' },
    { name: 'Favicon-Anzeige wenn aktiviert', category: 'Bookmark-Karten' },
    { name: 'URL-Links funktional', category: 'Bookmark-Karten' },
    
    // Dialoge & Modals
    { name: 'Bookmark-Dialog öffnen/schließen', category: 'Dialoge & Modals' },
    { name: 'Kategorie-Auswahl im Dialog', category: 'Dialoge & Modals' },
    { name: 'Einstellungen-Dialog alle Tabs', category: 'Dialoge & Modals' },
    { name: 'Hilfe-System Dialog und Navigation', category: 'Dialoge & Modals' },
    { name: 'Statistik-Dialog Daten-Anzeige', category: 'Dialoge & Modals' },
    
    // Drag & Drop System
    { name: 'Bookmark zwischen Kategorien verschieben', category: 'Drag & Drop System' },
    { name: 'Kategorie Hierarchie-Verschiebung', category: 'Drag & Drop System' },
    { name: 'Cross-Level Category Movement', category: 'Drag & Drop System' },
    { name: 'Shift+Drag Einfüge-Modus', category: 'Drag & Drop System' },
    { name: 'Visuelle Drop-Zone Feedback', category: 'Drag & Drop System' },
    
    // Filter & Sortierung
    { name: 'Status-Filter alle Typen (Aktiv, Tot, etc.)', category: 'Filter & Sortierung' },
    { name: 'Kategorie-Filter Funktionalität', category: 'Filter & Sortierung' },
    { name: 'Sortierung nach Datum/Alphabet', category: 'Filter & Sortierung' },
    { name: 'Kombinierte Filter (Status + Kategorie)', category: 'Filter & Sortierung' },
    
    // Import/Export
    { name: 'HTML Import-Funktionalität', category: 'Import/Export' },
    { name: 'JSON Export alle Formate', category: 'Import/Export' },
    { name: 'XML/CSV Import/Export', category: 'Import/Export' },
    { name: 'Testdaten-Generierung (70 Bookmarks)', category: 'Import/Export' },
    
    // Einstellungen
    { name: 'Theme-Wechsel (Hell/Dunkel)', category: 'Einstellungen' },
    { name: 'Erweiterte Einstellungen (S-Time)', category: 'Einstellungen' },
    { name: 'System-Tools (AuditLog/SysDok)', category: 'Einstellungen' },
    { name: 'Meldungen Delay Einstellung', category: 'Einstellungen' },
    
    // Performance & Responsive
    { name: 'Ladezeiten unter 3 Sekunden', category: 'Performance & Responsive' },
    { name: 'Mobile Responsiveness (768px)', category: 'Performance & Responsive' },
    { name: 'Tablet-Ansicht (768-1200px)', category: 'Performance & Responsive' },
    { name: 'Desktop-Optimierung (>1200px)', category: 'Performance & Responsive' }
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