import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CheckCircle, Clock, AlertTriangle, Info, Download, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

const AuditLogSystem = ({ isOpen, onClose }) => {
  const [auditEntries, setAuditEntries] = useState([]);
  const [newTestName, setNewTestName] = useState('');
  const [currentCategory, setCurrentCategory] = useState('Drag & Drop Tests');

  // Test-Kategorien
  const testCategories = [
    'Drag & Drop Tests',
    'Kategorie CRUD',
    'Bookmark Management', 
    'Lock System',
    'Search & Filter',
    'Import/Export',
    'UI/UX Tests',
    'Performance Tests'
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

  // Vordefinierte Test-Szenarien
  const predefinedTests = [
    { name: 'Kategorie von Root zu Subcategory verschieben', category: 'Drag & Drop Tests' },
    { name: 'Kategorie zwischen gleichen Ebenen sortieren', category: 'Drag & Drop Tests' },
    { name: 'Shift+Drag Einfüge-Modus testen', category: 'Drag & Drop Tests' },
    { name: 'Kategorie sperren/entsperren', category: 'Lock System' },
    { name: 'Gesperrte Kategorie bearbeiten (403 Fehler)', category: 'Lock System' },
    { name: 'Neue Kategorie erstellen', category: 'Kategorie CRUD' },
    { name: 'Bookmark zwischen Kategorien verschieben', category: 'Bookmark Management' },
    { name: 'Erweiterte Suche in Titel/URL/Beschreibung', category: 'Search & Filter' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[85vh] bg-gray-900 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-cyan-400 flex items-center">
            <CheckCircle className="w-6 h-6 mr-2" />
            🔍 FavOrg Audit-Log System
          </DialogTitle>
          <p className="text-gray-300">Test-Tracking und Qualitätssicherung für FavOrg Phase 2</p>
        </DialogHeader>

        <div className="flex flex-col h-full space-y-4">
          {/* Header Controls */}
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
          <div className="p-4 bg-gray-850 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-cyan-300">📝 Vordefinierte Test-Szenarien:</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {predefinedTests.map((test, index) => (
                <Button
                  key={index}
                  onClick={() => addTestEntry(test.name, test.category)}
                  variant="outline"
                  size="sm"
                  className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  {test.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-4 gap-4 text-center">
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

          {/* Audit Log Entries */}
          <div className="flex-1 overflow-y-auto bg-gray-800 rounded-lg">
            {auditEntries.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Keine Test-Einträge vorhanden</h3>
                <p>Fügen Sie Ihren ersten Test hinzu, um mit dem Audit-Log zu beginnen.</p>
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