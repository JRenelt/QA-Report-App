import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { Settings, FileText, Archive, Printer, RotateCcw, Save, Eye, Download, Trash2, Edit, StickyNote, TestTube2, CheckCircle, XCircle, Clock, AlertTriangle, Check, X, Pickaxe, CaptionsOff, PencilLine, NotebookPen, SquareArrowOutUpRight, SkipForward } from 'lucide-react';

const AuditLogSystem = ({ isOpen, onClose }) => {
  const [currentCategory, setCurrentCategory] = useState('Allgemeines Design');
  const [viewMode, setViewMode] = useState('tests'); // 'tests', 'archive'
  const [newTestName, setNewTestName] = useState('');
  // Test States - mit localStorage-Persistierung
  const [testStatuses, setTestStatuses] = useState(() => {
    const saved = localStorage.getItem('favorg-audit-testStatuses');
    return saved ? JSON.parse(saved) : {};
  });
  const [testNotes, setTestNotes] = useState(() => {
    const saved = localStorage.getItem('favorg-audit-testNotes');
    return saved ? JSON.parse(saved) : {};
  });
  const [statusFilter, setStatusFilter] = useState('');
  const [archivedReports, setArchivedReports] = useState(() => {
    const saved = localStorage.getItem('favorg-audit-archivedReports');
    return saved ? JSON.parse(saved) : [];
  });
  const [dynamicTests, setDynamicTests] = useState({});
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [editTestDialog, setEditTestDialog] = useState({ show: false, testName: '', currentName: '' });
  const [noteDialog, setNoteDialog] = useState({ show: false, testName: '', currentNote: '' });
  const [auditConfig, setAuditConfig] = useState(() => {
    const saved = localStorage.getItem('favorg-audit-config');
    return saved ? JSON.parse(saved) : {
      tester: 'Jörg Renelt',
      version: 'v2.3.0', // Systemvorgabe: aktuelle FavOrg Version
      environment: 'Windows 11, Chrome 117',
      testGoal: 'Überprüfung aller Funktionen und Fehlermeldungen des FavOrg AuditLog-Systems.',
      testMethodology: 'Manueller Funktionstest mit definierten Testfällen. Eingaben über Web-Oberfläche, Auswertung durch visuelle Prüfung und Funktionsvalidierung.',
      showMetadata: true, // Neuer Toggle für Berichts-Metadaten
      showTooltips: true  // Separater Tooltip-Schalter für AuditLog
    };
  });

  // Initialize environment detection and ensure current version on first load
  useEffect(() => {
    const saved = localStorage.getItem('favorg-audit-config');
    if (!saved) {
      // Erste Initialisierung mit aktueller Version und Umgebung
      const updatedConfig = {
        ...auditConfig,
        version: 'v2.3.0', // Systemvorgabe: aktuelle FavOrg Version
        environment: detectEnvironment()
      };
      setAuditConfig(updatedConfig);
      localStorage.setItem('favorg-audit-config', JSON.stringify(updatedConfig));
    } else {
      // Bestehende Config laden aber Version aktualisieren falls veraltet
      const savedConfig = JSON.parse(saved);
      if (savedConfig.version !== 'v2.3.0') {
        const updatedConfig = {
          ...savedConfig,
          version: 'v2.3.0' // System-Update der Version
        };
        setAuditConfig(updatedConfig);
        localStorage.setItem('favorg-audit-config', JSON.stringify(updatedConfig));
      }
    }
  }, []);
  
  // Persistiere testStatuses bei Änderungen
  useEffect(() => {
    localStorage.setItem('favorg-audit-testStatuses', JSON.stringify(testStatuses));
  }, [testStatuses]);

  // Persistiere testNotes bei Änderungen
  useEffect(() => {
    localStorage.setItem('favorg-audit-testNotes', JSON.stringify(testNotes));
  }, [testNotes]);

  // Persistiere archivedReports bei Änderungen
  useEffect(() => {
    localStorage.setItem('favorg-audit-archivedReports', JSON.stringify(archivedReports));
  }, [archivedReports]);
  
  // Persistiere testStatuses bei Änderungen
  useEffect(() => {
    localStorage.setItem('favorg-audit-testStatuses', JSON.stringify(testStatuses));
  }, [testStatuses]);

  // Persistiere testNotes bei Änderungen
  useEffect(() => {
    localStorage.setItem('favorg-audit-testNotes', JSON.stringify(testNotes));
  }, [testNotes]);

  // Persistiere archivedReports bei Änderungen
  useEffect(() => {
    localStorage.setItem('favorg-audit-archivedReports', JSON.stringify(archivedReports));
  }, [archivedReports]);
  
  // Test-Daten - GUI-orientierte FavOrg Test-Suite
  const predefinedTests = {
    'Allgemeines Design': [
      { name: 'Desktop Darstellung', icon: '🖥️', tooltip: 'Korrekte Darstellung auf Desktop-Bildschirmen' },
      { name: 'Tablet Darstellung', icon: '📱', tooltip: 'Responsive Darstellung auf Tablet-Geräten' },
      { name: 'Mobile Darstellung', icon: '📱', tooltip: 'Mobile-optimierte Darstellung' },
      { name: 'Responsive Breakpoints', icon: '🔧', tooltip: 'Übergänge zwischen verschiedenen Bildschirmgrößen' },
      { name: 'Dark Theme Konsistenz', icon: '🌙', tooltip: 'Dark Theme wird einheitlich angewendet' },
      { name: 'Loading-Indikatoren', icon: '⏳', tooltip: 'Loading-Animationen während Datenoperationen' },
      { name: 'Farbschema Konsistenz', icon: '🎨', tooltip: 'Einheitliches Farbschema in gesamter App' },
      { name: 'Typographie', icon: '🔤', tooltip: 'Typographie und Schriftarten prüfen' }
    ],
    'Testpunkt Kopfzeile': [
      { name: 'Logo Ort: Links', icon: '🏷️', tooltip: 'Logo ist korrekt links in der Kopfzeile positioniert' },
      { name: 'Logo Hover-Effekt', icon: '🎯', tooltip: 'Logo reagiert bei Maus-Hover korrekt' },
      { name: 'Logo Click-Funktion', icon: '🖱️', tooltip: 'Logo-Klick führt zur korrekten Aktion' },
      { name: 'Button Ort: Mittig', icon: '🎯', tooltip: 'Haupt-Navigation-Buttons sind mittig platziert' },
      { name: 'Neu Button - Neue Favorit', icon: '➕', tooltip: 'Button "Neue Favorit" ist vorhanden und funktional' },
      { name: 'Neu Button Design', icon: '🎨', tooltip: 'Design und Styling des "Neue Favorit" Buttons' },
      { name: 'Neu Button Hover-Effekt', icon: '✨', tooltip: 'Hover-Effekt des "Neue Favorit" Buttons' },
      { name: 'Neu Button Click-Funktion', icon: '🔗', tooltip: 'Click-Funktionalität des "Neue Favorit" Buttons' },
      { name: 'Datei Wählen - Favoriten Import', icon: '📤', tooltip: 'Import-Button für Favoriten-Dateien (Sammel APP)' },
      { name: 'Datei Wählen Button Design', icon: '🎨', tooltip: 'Design des Import-Buttons' },
      { name: 'Datei Wählen Button Hover', icon: '✨', tooltip: 'Hover-Effekt des Import-Buttons' },
      { name: 'Datei Wählen Button Funktion', icon: '📂', tooltip: 'Funktionalität des Import-Buttons' },
      { name: 'Fav Export Button', icon: '📥', tooltip: 'Export-Button für Favoriten' },
      { name: 'Fav Export Button Design', icon: '🎨', tooltip: 'Design des Export-Buttons' },
      { name: 'Fav Export Button Hover', icon: '✨', tooltip: 'Hover-Effekt des Export-Buttons' },
      { name: 'Fav Export Button Funktion', icon: '💾', tooltip: 'Funktionalität des Export-Buttons' }
    ],
    'Navigation Bereich': [
      { name: 'Navigation Layout', icon: '📐', tooltip: 'Gesamtlayout der Navigation prüfen' },
      { name: 'Navigation Icons', icon: '🎯', tooltip: 'Alle Icons in der Navigation sind korrekt dargestellt' },
      { name: 'Navigation Hover-Effekte', icon: '✨', tooltip: 'Hover-Effekte aller Navigationselemente' },
      { name: 'Navigation Keyboard-Navigation', icon: '⌨️', tooltip: 'Tastatur-Navigation durch Menüpunkte' }
    ],
    'Suchfeld Bereich': [
      { name: 'Suchfeld Position', icon: '🔍', tooltip: 'Suchfeld ist korrekt im Header positioniert' },
      { name: 'Suchfeld Design', icon: '🎨', tooltip: 'Design und Styling des Suchfeldes' },
      { name: 'Suchfeld Placeholder', icon: '📝', tooltip: 'Placeholder-Text im Suchfeld' },
      { name: 'Suchfeld Funktion', icon: '🔎', tooltip: 'Such-Funktionalität des Eingabefelds' },
      { name: 'Suchfeld Auto-Vervollständigung', icon: '💡', tooltip: 'Auto-Vervollständigung/Suggestion-Funktion' },
      { name: 'Suchfeld Lösch-Button', icon: '❌', tooltip: 'Clear/Reset-Button im Suchfeld' }
    ],
    'Sidebar Bereich': [
      { name: 'Sidebar Sichtbarkeit', icon: '📋', tooltip: 'Sidebar ist korrekt sichtbar und positioniert' },
      { name: 'Sidebar Breite', icon: '📐', tooltip: 'Sidebar hat korrekte Breite und Proportionen' },
      { name: 'Sidebar Resize-Funktion', icon: '↔️', tooltip: 'Sidebar kann in der Breite verändert werden' },
      { name: 'Sidebar Kategorie-Liste', icon: '📂', tooltip: 'Kategorie-Liste wird korrekt angezeigt' },
      { name: 'Sidebar Kategorie-Counter', icon: '🔢', tooltip: 'Counter zeigen korrekte Anzahl je Kategorie' },
      { name: 'Sidebar Kategorie-Hover', icon: '✨', tooltip: 'Hover-Effekte bei Kategorie-Elementen' },
      { name: 'Sidebar Kategorie-Klick', icon: '🖱️', tooltip: 'Klick auf Kategorie filtert Hauptinhalt' },
      { name: 'Sidebar Neue Kategorie Button', icon: '➕', tooltip: 'Button zum Erstellen neuer Kategorien' }
    ],
    'Hauptinhalt Bereich': [
      { name: 'Hauptinhalt Layout', icon: '📄', tooltip: 'Gesamtlayout des Hauptinhalt-Bereichs' },
      { name: 'Hauptinhalt Favoriten-Liste', icon: '📋', tooltip: 'Liste der Favoriten wird korrekt dargestellt' },
      { name: 'Hauptinhalt Favoriten-Karten', icon: '🎴', tooltip: 'Einzelne Favoriten-Karten Design und Layout' },
      { name: 'Hauptinhalt Favoriten-Karten Hover', icon: '✨', tooltip: 'Hover-Effekte auf Favoriten-Karten' },
      { name: 'Hauptinhalt Favoriten Action-Buttons', icon: '🔘', tooltip: 'Action-Buttons (Edit, Delete, Link) auf Karten' },
      { name: 'Hauptinhalt Action-Buttons Hover', icon: '✨', tooltip: 'Hover-Effekte der Action-Buttons' },
      { name: 'Hauptinhalt Action-Buttons Funktion', icon: '⚡', tooltip: 'Edit öffnet Dialog, Delete löscht, Link öffnet URL' },
      { name: 'Hauptinhalt Drag & Drop', icon: '🔄', tooltip: 'Drag & Drop Funktionalität zwischen Kategorien' }
    ],
    'Footer Bereich': [
      { name: 'Footer Sichtbarkeit', icon: '👁️', tooltip: 'Footer ist am unteren Rand sichtbar' },
      { name: 'Footer Layout Links', icon: '👈', tooltip: 'Linke Seite des Footers (Copyright)' },
      { name: 'Footer Mitte', icon: '⏸️', tooltip: 'Mittlerer Bereich des Footers (Pagination)' },
      { name: 'Footer Mitte Icons', icon: '📼', tooltip: 'Pagination-Icons (Tape-Recorder Style)' },
      { name: 'Footer Mitte Icons Hover', icon: '✨', tooltip: 'Hover-Effekte der Pagination-Icons' },
      { name: 'Footer Mitte Icons Funktion', icon: '⚡', tooltip: 'Navigation zwischen Seiten funktioniert korrekt' },
      { name: 'Footer Rechts', icon: '👉', tooltip: 'Rechte Seite des Footers (Impressum)' },
      { name: 'Footer Rechts Hover', icon: '✨', tooltip: 'Hover-Effekt des Impressum-Links' },
      { name: 'Footer Rechts Funktion', icon: '🔗', tooltip: 'Link führt zur korrekten Impressum-Seite' }
    ],
    'Dialoge und Modals': [
      { name: 'Dialog Öffnung', icon: '📂', tooltip: 'Dialoge öffnen sich korrekt' },
      { name: 'Dialog Overlay', icon: '🌫️', tooltip: 'Overlay/Hintergrund bei geöffneten Dialogen' },
      { name: 'Dialog Schließen X', icon: '❌', tooltip: 'X-Button zum Schließen von Dialogen' },
      { name: 'Dialog Schließen X Hover', icon: '✨', tooltip: 'Hover-Effekt des X-Schließen-Buttons' },
      { name: 'Dialog Schließen X Funktion', icon: '⚡', tooltip: 'Dialog schließt sich beim Klick auf X' },
      { name: 'Dialog ESC-Taste', icon: '⌨️', tooltip: 'Dialog schließen mit ESC-Taste' },
      { name: 'Dialog Click-Outside', icon: '🖱️', tooltip: 'Dialog schließen durch Klick außerhalb' }
    ],
    'Formular Eingaben': [
      { name: 'Formular Eingabefelder', icon: '📝', tooltip: 'Alle Eingabefelder sind funktional' },
      { name: 'Formular Validierung', icon: '✅', tooltip: 'Client-seitige Formular-Validierung' },
      { name: 'Formular Validierung Fehlermeldungen', icon: '⚠️', tooltip: 'Fehlermeldungen bei ungültigen Eingaben' },
      { name: 'Formular Submit-Button', icon: '💾', tooltip: 'Submit/Speichern-Button Funktionalität' },
      { name: 'Formular Submit-Button Hover', icon: '✨', tooltip: 'Hover-Effekt des Submit-Buttons' },
      { name: 'Formular Abbrechen-Button', icon: '❌', tooltip: 'Abbrechen/Cancel-Button Funktionalität' }
    ],
    'Loading und Feedback': [
      { name: 'Loading Indicator', icon: '⏳', tooltip: 'Loading-Animationen während Datenoperationen' },
      { name: 'Loading Indicator Modern', icon: '✨', tooltip: 'Moderner Stil der Loading-Indikatoren' },
      { name: 'Toast Messages', icon: '💬', tooltip: 'Toast-Nachrichten für Benutzer-Feedback' },
      { name: 'Toast Messages Position', icon: '📍', tooltip: 'Positionierung der Toast-Nachrichten' },
      { name: 'Toast Messages Dauer', icon: '⏱️', tooltip: 'Anzeigedauer der Toast-Nachrichten' }
    ],
    'Responsive Design': [
      { name: 'Desktop Darstellung', icon: '🖥️', tooltip: 'Korrekte Darstellung auf Desktop-Bildschirmen' },
      { name: 'Tablet Darstellung', icon: '📱', tooltip: 'Responsive Darstellung auf Tablet-Geräten' },
      { name: 'Mobile Darstellung', icon: '📱', tooltip: 'Mobile-optimierte Darstellung' },
      { name: 'Responsive Breakpoints', icon: '🔧', tooltip: 'Übergänge zwischen verschiedenen Bildschirmgrößen' }
    ],
    'Tastatur und Accessibility': [
      { name: 'Tastatur-Navigation', icon: '⌨️', tooltip: 'Vollständige Navigation per Tastatur' },
      { name: 'Tooltips Toggle', icon: '💡', tooltip: 'Toggle-Funktion für Tooltips in Einstellungen' },
      { name: 'Tooltips Funktion', icon: '💬', tooltip: 'Funktionalität der Tooltips' },
      { name: 'Focus-Indikatoren', icon: '🎯', tooltip: 'Sichtbare Focus-Indikatoren bei Tastatur-Navigation' }
    ]
  };

  // Test-Kategorien (dynamisch aus predefinedTests)
  const testCategories = Object.keys(predefinedTests);

  // Helper function to get error counter for category
  const getCategoryErrorCounter = (category) => {
    const categoryTests = predefinedTests[category] || [];
    const dynamicCategoryTests = dynamicTests[category] || [];
    const allCategoryTests = [...categoryTests, ...dynamicCategoryTests];
    return allCategoryTests.filter(test => testStatuses[test.name] === 'error').length;
  };

  // Funktion zur Generierung von Test-IDs nach korrigierten Konventionen
  const generateTestId = (categoryName, testName, testIndex) => {
    // Erste Buchstaben jedes Wortes, Sonderzeichen wie /, \, & trennen Wörter
    const generateCategoryId = (name) => {
      // Split bei Leerzeichen, Bindestrichen UND Sonderzeichen /, \, &
      const words = name.split(/[\s\-\/\\&]+/).filter(word => word.length > 0);
      let id = words.map(word => word.charAt(0).toUpperCase()).join('');
      
      // Prüfe auf Duplikate und erweitere bei Bedarf mit Buchstaben vom letzten Wort
      const existingIds = ['AD', 'HB', 'SB', 'MC', 'FB', 'IE', 'LV', 'DE', 'PE', 'BF', 'EE', 'AMT'];
      let counter = 1;
      const originalId = id;
      const lastWord = words[words.length - 1];
      
      while (existingIds.includes(id) && counter < lastWord.length) {
        // Füge weitere Buchstaben vom letzten Wort hinzu
        id = originalId.slice(0, -1) + lastWord.substring(0, counter + 1).toUpperCase();
        counter++;
      }
      
      return id;
    };

    const categoryMap = {
      'Allgemeines Design': 'AD',           // Allgemeines Design
      'Testpunkt Kopfzeile': 'TK',          // Testpunkt Kopfzeile
      'Navigation Bereich': 'NB',           // Navigation Bereich 
      'Suchfeld Bereich': 'SB',             // Suchfeld Bereich
      'Sidebar Bereich': 'SBB',             // Sidebar Bereich (um Konflikte mit Suchfeld zu vermeiden)
      'Hauptinhalt Bereich': 'HB',          // Hauptinhalt Bereich
      'Footer Bereich': 'FB',               // Footer Bereich
      'Dialoge und Modals': 'DM',           // Dialoge und Modals
      'Formular Eingaben': 'FE',            // Formular Eingaben
      'Loading und Feedback': 'LF',         // Loading und Feedback
      'Responsive Design': 'RD',            // Responsive Design
      'Tastatur und Accessibility': 'TA'    // Tastatur und Accessibility
    };
    
    const categoryId = categoryMap[categoryName] || generateCategoryId(categoryName);
    const testId = (testIndex + 1).toString().padStart(4, '0');
    return `${categoryId}${testId}`;
  };

  // Berechne Counter für jede Kategorie (ungetestete Tests)
  const getCategoryCounter = (category) => {
    const categoryTests = predefinedTests[category] || [];
    const dynamicCategoryTests = dynamicTests[category] || [];
    const allCategoryTests = [...categoryTests, ...dynamicCategoryTests];
    
    // Zähle ungetestete Tests (ohne Status oder Status ist nicht gesetzt)
    const untestedCount = allCategoryTests.filter(test => 
      !testStatuses[test.name] || testStatuses[test.name] === 'ungeprüft'
    ).length;
    
    return untestedCount;
  };

  // Aktuelle Tests berechnen
  const getCurrentTests = () => {
    const baseTests = predefinedTests[currentCategory] || [];
    const categoryDynamicTests = dynamicTests[currentCategory] || [];
    return [...baseTests, ...categoryDynamicTests];
  };

  // Helper function to get current test by name
  const getCurrentTestByName = (testName) => {
    const allTests = getCurrentTests();
    return allTests.find(test => test.name === testName);
  };

  const handleDeleteTest = (testName) => {
    const currentTest = getCurrentTestByName(testName);
    if (!currentTest) return;
    
    if (!currentTest.isDynamic) {
      toast.error('Vordefinierte Tests können nicht gelöscht werden');
      return;
    }
    
    // Lösche dynamischen Test
    const updatedTests = { ...dynamicTests };
    if (updatedTests[currentCategory]) {
      updatedTests[currentCategory] = updatedTests[currentCategory].filter(test => test.name !== testName);
      if (updatedTests[currentCategory].length === 0) {
        delete updatedTests[currentCategory];
      }
    }
    setDynamicTests(updatedTests);
    
    // Entferne auch Status und Notizen
    setTestStatuses(prev => {
      const updated = { ...prev };
      delete updated[testName];
      localStorage.setItem('favorg-audit-testStatuses', JSON.stringify(updated));
      return updated;
    });
    
    setTestNotes(prev => {
      const updated = { ...prev };
      delete updated[testName];
      localStorage.setItem('favorg-audit-testNotes', JSON.stringify(updated));
      return updated;
    });
    
    toast.success(`Test "${testName}" wurde gelöscht`);
  };

  // Alle Tests aller Kategorien berechnen (für PDF-Export)
  const getAllTests = () => {
    let allTests = [];
    
    // Sammle alle Tests aus allen Kategorien
    testCategories.forEach(category => {
      const baseTests = predefinedTests[category] || [];
      const categoryDynamicTests = dynamicTests[category] || [];
      const categoryTests = [...baseTests, ...categoryDynamicTests];
      
      // Füge Kategorie-Kontext hinzu
      const testsWithCategory = categoryTests.map(test => ({
        ...test,
        category: category,
        categoryIcon: getCategoryIcon(category)
      }));
      
      allTests = [...allTests, ...testsWithCategory];
    });
    
    return allTests;
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
    setTestStatuses(prev => {
      const updated = { ...prev, [testName]: status };
      localStorage.setItem('favorg-audit-testStatuses', JSON.stringify(updated));
      
      // Auto-Navigation zum nächsten Test wenn erfolgreich markiert
      if (status === 'success') {
        setTimeout(() => {
          const currentTests = getCurrentTests();
          const currentIndex = currentTests.findIndex(test => test.name === testName);
          const nextTest = currentTests[currentIndex + 1];
          
          if (nextTest) {
            // Scrolle zum nächsten Test
            const nextTestElement = document.querySelector(`[data-test-name="${nextTest.name}"]`);
            if (nextTestElement) {
              nextTestElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
              });
              // Kurzer Highlight-Effekt
              nextTestElement.style.transition = 'all 0.3s';
              nextTestElement.style.backgroundColor = 'rgba(6, 182, 212, 0.2)';
              setTimeout(() => {
                nextTestElement.style.backgroundColor = '';
              }, 1000);
            }
          }
        }, 300);
      }
      
      return updated;
    });
    toast.success(`Status "${status}" gesetzt`);
  };

  const handleEditTest = (testName) => {
    const currentTest = getCurrentTests().find(test => test.name === testName);
    if (!currentTest) return;
    
    // Alle Tests sind jetzt editierbar - keine Einschränkung mehr
    setEditTestDialog({ show: true, testName, currentName: currentTest.name });
  };

  const confirmEditTest = (newName) => {
    if (newName && newName !== editTestDialog.currentName) {
      const currentDynamic = dynamicTests[currentCategory] || [];
      const updatedDynamic = currentDynamic.map(test => 
        test.name === editTestDialog.testName ? { ...test, name: newName } : test
      );
      setDynamicTests({
        ...dynamicTests,
        [currentCategory]: updatedDynamic
      });
      
      // Update Status und Notes mit neuem Namen
      const updatedStatuses = { ...testStatuses };
      const updatedNotes = { ...testNotes };
      if (updatedStatuses[editTestDialog.testName]) {
        updatedStatuses[newName] = updatedStatuses[editTestDialog.testName];
        delete updatedStatuses[editTestDialog.testName];
      }
      if (updatedNotes[editTestDialog.testName]) {
        updatedNotes[newName] = updatedNotes[editTestDialog.testName];
        delete updatedNotes[editTestDialog.testName];
      }
      setTestStatuses(updatedStatuses);
      setTestNotes(updatedNotes);
      
      // localStorage aktualisieren
      localStorage.setItem('favorg-audit-testStatuses', JSON.stringify(updatedStatuses));
      localStorage.setItem('favorg-audit-testNotes', JSON.stringify(updatedNotes));
      
      toast.success('Test-Name aktualisiert');
    }
    setEditTestDialog({ show: false, testName: '', currentName: '' });
  };

  const handleAddNote = (testName) => {
    const currentNote = testNotes[testName] || '';
    setNoteDialog({ show: true, testName, currentNote });
  };

  const confirmAddNote = (newNote) => {
    if (newNote !== null) { // null bedeutet Abbruch
      if (newNote.trim() === '') {
        // Leere Notiz = Notiz löschen
        const updatedNotes = { ...testNotes };
        delete updatedNotes[noteDialog.testName];
        setTestNotes(updatedNotes);
        localStorage.setItem('favorg-audit-testNotes', JSON.stringify(updatedNotes));
        toast.success('Notiz entfernt');
      } else {
        const updatedNotes = {
          ...testNotes,
          [noteDialog.testName]: newNote.trim()
        };
        setTestNotes(updatedNotes);
        localStorage.setItem('favorg-audit-testNotes', JSON.stringify(updatedNotes));
        toast.success('Notiz gespeichert');
      }
    }
    setNoteDialog({ show: false, testName: '', currentNote: '' });
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

  // Environment Detection
  const detectEnvironment = () => {
    const userAgent = navigator.userAgent;
    let os = 'Unknown OS';
    let browser = 'Unknown Browser';
    
    if (userAgent.indexOf('Windows NT 10.0') !== -1) os = 'Windows 10/11';
    else if (userAgent.indexOf('Windows NT 6.3') !== -1) os = 'Windows 8.1';
    else if (userAgent.indexOf('Windows NT 6.1') !== -1) os = 'Windows 7';
    else if (userAgent.indexOf('Mac') !== -1) os = 'macOS';
    else if (userAgent.indexOf('Linux') !== -1) os = 'Linux';
    
    if (userAgent.indexOf('Chrome') !== -1 && userAgent.indexOf('Edge') === -1) {
      const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
      browser = 'Chrome ' + (chromeMatch ? chromeMatch[1] : '');
    } else if (userAgent.indexOf('Firefox') !== -1) {
      const firefoxMatch = userAgent.match(/Firefox\/(\d+)/);
      browser = 'Firefox ' + (firefoxMatch ? firefoxMatch[1] : '');
    } else if (userAgent.indexOf('Safari') !== -1 && userAgent.indexOf('Chrome') === -1) {
      browser = 'Safari';
    } else if (userAgent.indexOf('Edge') !== -1) {
      const edgeMatch = userAgent.match(/Edge\/(\d+)/);
      browser = 'Edge ' + (edgeMatch ? edgeMatch[1] : '');
    }
    
    return os + ', ' + browser;
  };

  // Config Functions
  const openConfigDialog = () => {
    setShowConfigDialog(true);
  };

  const closeConfigDialog = () => {
    setShowConfigDialog(false);
  };

  const saveConfig = (newConfig) => {
    setAuditConfig(newConfig);
    localStorage.setItem('favorg-audit-config', JSON.stringify(newConfig));
    toast.success('Konfiguration gespeichert!');
    setShowConfigDialog(false);
  };

  // Test Results Calculation
  const calculateTestResults = (tests, customStatuses = null, customNotes = null) => {
    // Verwende custom Status/Notes für Archiv-Berichte oder aktuelle für Live-Export
    const statusesToUse = customStatuses || testStatuses;
    const notesToUse = customNotes || testNotes;
    let total = tests.length;
    let passed = 0;
    let failed = 0;
    let warning = 0;
    let ungeprüft = 0;
    let issues = [];
    
    tests.forEach(test => {
      const status = statusesToUse[test.name] || 'ungeprüft';
      switch(status) {
        case 'success':
          passed++;
          break;
        case 'error':
          failed++;
          issues.push({
            name: test.name,
            type: 'FEHLER',
            description: notesToUse[test.name] || 'Kritischer Fehler festgestellt'
          });
          break;
        case 'warning':
          warning++;
          issues.push({
            name: test.name,
            type: 'WARNUNG',
            description: notesToUse[test.name] || 'Verbesserung empfohlen'
          });
          break;
        default:
          ungeprüft++;
      }
    });
    
    return { total, passed, failed, warning, ungeprüft, issues };
  };

  // Export-Funktionen mit Option für nur getestete Tests
  const handlePDFExport = () => {
    const tests = getAllTests(); // Verwende ALLE Tests statt nur aktuelle Kategorie
    const testResults = calculateTestResults(tests);
    const currentDate = new Date().toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    printWindow.document.write(generateStructuredReport(tests, testResults, currentDate));
    printWindow.document.close();
  };

  const handlePDFExportTested = () => {
    const allTests = getAllTests();
    const testedTests = allTests.filter(test => 
      testStatuses[test.name] && testStatuses[test.name] !== 'ungeprüft'
    );
    const testResults = calculateTestResults(testedTests);
    const currentDate = new Date().toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    printWindow.document.write(generateStructuredReport(testedTests, testResults, currentDate));
    printWindow.document.close();
    
    // Normales Verhalten - kein Auto-Print oder Auto-Close
    toast.success(`QA-Bericht (Geprüft) mit ${testedTests.length} Tests generiert`);
  };

  // Generate Structured Report HTML
  const generateStructuredReport = (tests, results, currentDate, reportCategory = null, customStatuses = null, customNotes = null, autoClose = false) => {
    // Verwende custom Status/Notes für Archiv-Berichte oder aktuelle für Live-Export
    const statusesToUse = customStatuses || testStatuses;
    const notesToUse = customNotes || testNotes;
    const categoryToShow = reportCategory || 'Alle Bereiche';
    
    // Gruppiere Tests nach Kategorien für bessere Übersichtlichkeit
    const testsByCategory = {};
    tests.forEach(test => {
      const category = test.category || 'Sonstige';
      if (!testsByCategory[category]) {
        testsByCategory[category] = [];
      }
      testsByCategory[category].push(test);
    });
    
    return `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <title>Testbericht · FavOrg</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 20px; 
            background: white !important;
            color: #333 !important;
            line-height: 1.4;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-size: 11pt;
          }
          .report-header { 
            text-align: center; 
            border-bottom: 3px solid #06b6d4; 
            padding-bottom: 20px; 
            margin-bottom: 25px;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            padding: 25px;
            border-radius: 8px;
          }
          .report-header h1 {
            color: #1a365d !important;
            font-size: 28px;
            margin-bottom: 8px;
            font-weight: 700;
          }
          .metadata-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
            background: #f8fafc;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #06b6d4;
          }
          .metadata-item {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            border-bottom: 1px solid #e2e8f0;
            font-size: 10pt;
          }
          .metadata-label {
            font-weight: 600;
            color: #374151;
          }
          .metadata-value {
            color: #1f2937;
            font-weight: 500;
          }
          .section {
            margin-bottom: 25px;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
          }
          .section h2 {
            color: #111827 !important;
            font-size: 16pt;
            margin-bottom: 12px;
            padding-bottom: 6px;
            border-bottom: 2px solid #111827;
          }
          .category-section {
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          .category-title {
            color: #06b6d4 !important;
            font-size: 14pt;
            font-weight: 700;
            margin-bottom: 10px;
            padding: 8px 12px;
            background: #f0f9ff;
            border-left: 4px solid #06b6d4;
            border-radius: 4px;
          }
          .test-case {
            padding: 12px;
            margin-bottom: 8px;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            background: white;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 10pt;
          }
          .test-case.success { border-color: #10b981; background: #f0fdf4; }
          .test-case.error { border-color: #ef4444; background: #fef2f2; }
          .test-case.warning { border-color: #f59e0b; background: #fffbeb; }
          .test-case.ungeprüft { border-color: #6b7280; background: #f9fafb; }
          .test-info {
            flex: 1;
          }
          .test-name {
            font-weight: 600;
            font-size: 11pt;
            margin-bottom: 4px;
          }
          .test-description {
            color: #6b7280;
            font-size: 9pt;
            margin-bottom: 6px;
          }
          .test-notes {
            font-style: italic;
            color: #4b5563;
            font-size: 9pt;
          }
          .status-badge {
            padding: 6px 12px;
            border-radius: 15px;
            font-weight: 600;
            font-size: 9pt;
            text-align: center;
            min-width: 70px;
          }
          .status-success { background: #10b981; color: white; }
          .status-error { background: #ef4444; color: white; }
          .status-warning { background: #f59e0b; color: white; }
          .status-ungeprüft { background: #6b7280; color: white; }
          
          /* Verbesserte Gesamtübersicht - Nur Rahmen, keine Hintergrundfarbe */
          .results-summary {
            border: 2px solid #374151;
            color: #1f2937 !important;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
            background: white !important;
            page-break-inside: avoid;
          }
          .results-summary h2 {
            margin-top: 0;
            color: #1f2937 !important;
            font-size: 14pt;
            margin-bottom: 10px;
          }
          .results-summary p {
            color: #1f2937 !important;
            font-size: 10pt;
            margin-bottom: 12px;
            line-height: 1.3;
          }
          .results-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 8px;
            margin-top: 10px;
          }
          .result-item {
            text-align: center;
            background: white;
            border: 1px solid #d1d5db;
            padding: 8px 4px;
            border-radius: 4px;
          }
          .result-number {
            font-size: 16pt;
            font-weight: bold;
            display: block;
            color: #1f2937 !important;
          }
          .result-label {
            font-size: 8pt;
            opacity: 0.8;
            line-height: 1.1;
            color: #6b7280;
          }
          
          .issues-list {
            list-style: none;
            padding: 0;
          }
          .issue-item {
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 12px;
            margin-bottom: 8px;
            border-radius: 0 4px 4px 0;
            font-size: 10pt;
          }
          .issue-type {
            font-weight: 700;
            color: #dc2626;
            font-size: 10pt;
          }
          .print-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 10px 16px;
            background: #6b7280;
            color: white;
            border: 1px solid #4b5563;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: all 0.2s;
          }
          .print-btn:hover {
            background: #4b5563;
            transform: translateY(-1px);
          }
          @media print {
            body { 
              background: white !important; 
              color: #333 !important;
              margin: 15px !important;
              font-size: 10pt;
            }
            .print-btn { display: none; }
            .section, .category-section { page-break-inside: avoid; }
            .report-header { page-break-after: avoid; }
            .results-summary { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <button class="print-btn" onclick="window.print()">📄 Bericht drucken</button>
        
        <div class="report-header" style="text-align: left;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
            <h1 style="text-align: left; margin: 0;">📋 Testbericht · FavOrg</h1>
            <span style="font-size: 18pt; font-weight: 600; color: #06b6d4;">🏷️ ${auditConfig.version}</span>
          </div>
          <p style="font-size: 14pt; color: #64748b; margin-bottom: 20px;">AuditLog-System Qualitätsprüfung</p>
          
          <!-- Metadaten kompakt gruppiert - Tester vor Datum -->
          <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 15px;">
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <span style="font-weight: 600; font-size: 11pt;">👤 ${auditConfig.tester}</span>
              <span style="font-weight: 600; font-size: 11pt;">📅 ${currentDate}</span>
            </div>
          </div>
          <div style="margin-bottom: 20px;">
            <span style="font-weight: 600; font-size: 11pt;">💻 Testumgebung:</span> ${auditConfig.environment}
          </div>

          <!-- Kompakte Gesamtübersicht für DIN A4 - Nur Rahmen -->
          <div class="results-summary">
            <h2>📊 Gesamtübersicht</h2>
            <p>
              ${results.passed} von ${results.total} Testfällen bestanden.
              ${results.failed > 0 ? ' Es wurden ' + results.failed + ' kritische Fehler festgestellt.' : ' Alle kritischen Tests erfolgreich.'}
              ${results.ungeprüft > 0 ? ` ${results.ungeprüft} Testfälle wurden nicht geprüft.` : ''}
            </p>
            <div class="results-grid">
              <div class="result-item">
                <span class="result-number">${results.total}</span>
                <span class="result-label">Gesamt</span>
              </div>
              <div class="result-item">
                <span class="result-number">${results.passed}</span>
                <span class="result-label">✅ Bestanden</span>
              </div>
              <div class="result-item">
                <span class="result-number">${results.failed}</span>
                <span class="result-label">❌ Fehler</span>
              </div>
              <div class="result-item">
                <span class="result-number">${results.warning}</span>
                <span class="result-label">⚠️ Warnung</span>
              </div>
              <div class="result-item">
                <span class="result-number">${results.ungeprüft}</span>
                <span class="result-label">⏳ Ungeprüft</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Seitenumbruch für neue Seite -->
        <div style="page-break-before: always;">
          <div class="section">
            <h2>🎯 Ziel des Tests</h2>
            <p>${auditConfig.testGoal}</p>
          </div>

          <div class="section">
            <h2>📋 Testobjekt</h2>
            <p><strong>Testbereich:</strong> ${categoryToShow}</p>
            <p>Testpunkte werden systematisch auf Funktionalität, Design-Konsistenz und Benutzerfreundlichkeit überprüft.</p>
          </div>

          <div class="section">
            <h2>🔬 Testmethodik</h2>
            <p>${auditConfig.testMethodology}</p>
          </div>
        </div>

        <!-- Testfälle mit Bereichsüberschriften -->
        <div style="page-break-before: always;">
          <div class="section">
            <h2>🧪 Testfälle nach Bereichen</h2>
            ${Object.keys(testsByCategory).map(category => {
              const categoryTests = testsByCategory[category];
              return `
                <div class="category-section">
                  <div class="category-title">
                    ${getCategoryIcon(category)} ${category} (${categoryTests.length} Tests)
                  </div>
                  ${categoryTests.map((test, testIndex) => {
                    const status = statusesToUse[test.name] || 'ungeprüft';
                    const notes = notesToUse[test.name];
                    let statusText = '';
                    let statusClass = '';
                    
                    switch(status) {
                      case 'success':
                        statusText = 'OK';
                        statusClass = 'success';
                        break;
                      case 'error':
                        statusText = 'FEHLER';
                        statusClass = 'error';
                        break;
                      case 'warning':
                        statusText = 'In Bearbeitung';  
                        statusClass = 'warning';
                        break;
                      default:
                        statusText = 'Übersprungen';
                        statusClass = 'ungeprüft';
                    }
                    
                    return `
                      <div class="test-case ${statusClass}">
                        <div class="test-info">
                          <div class="test-name">
                            <span class="test-id" style="font-family: monospace; background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 0.8em; margin-right: 8px; color: #0891b2;">
                              ${generateTestId(category, test.name, testIndex)}
                            </span>
                            ${test.icon} ${test.name}
                          </div>
                          <div class="test-description">${test.tooltip}</div>
                          ${notes ? `<div class="test-notes">💭 Notiz: ${notes}</div>` : ''}
                        </div>
                        <div class="status-badge status-${statusClass}">[${statusText}]</div>
                      </div>
                    `;
                  }).join('')}
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Abweichungen und Probleme (keine separate Seite) -->
        <div class="section" style="margin-top: 30px;">
          ${results.issues.length > 0 ? `
            <h2>⚠️ Abweichungen und Probleme</h2>
            <ul class="issues-list">
              ${results.issues.map((issue, issueIndex) => `
                <li class="issue-item">
                  <div class="issue-type">
                    <span class="test-id" style="font-family: monospace; background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 0.8em; margin-right: 8px; color: #0891b2;">
                      ${issue.id || `ERR${(issueIndex + 1).toString().padStart(4, '0')}`}
                    </span>
                    ${issue.type}: ${issue.name}
                  </div>
                  <p>${issue.description}</p>
                </li>
              `).join('')}
            </ul>
          ` : `
            <h2>✅ Keine Abweichungen</h2>
            <p>Alle Tests wurden erfolgreich durchgeführt ohne kritische Probleme.</p>
          `}
        </div>

        <!-- Fazit und Empfehlungen -->
        <div class="section" style="margin-top: 30px;">
          <h2>💡 Fazit und Empfehlungen</h2>
          <p>
            ${results.failed === 0 ? 
              `Das ${categoryToShow} System ist vollständig funktionsfähig. Alle ${results.passed} kritischen Tests wurden erfolgreich bestanden.` :
              `Das ${categoryToShow} System weist ${results.failed} kritische Fehler auf. Vor der Freigabe müssen diese Probleme behoben und erneut getestet werden.`
            }
          </p>
          ${results.warning > 0 ? `<p><strong>Empfehlung:</strong> ${results.warning} Verbesserungen sollten für eine optimale Benutzererfahrung umgesetzt werden.</p>` : ''}
        </div>

        <!-- Anhang -->
        <div class="section" style="margin-top: 30px;">
          <h2>📎 Anhang</h2>
          <p>Detaillierte Testdaten und Screenshots sind im internen AuditLog-System archiviert.</p>
          <p><strong>Berichts-ID:</strong> AuditLog-${Date.now()}</p>
          <p><strong>Generiert von:</strong> FavOrg AuditLog-System ${auditConfig.version}</p>
          <p><strong>Testumfang:</strong> ${tests.length} Testpunkte in ${Object.keys(testsByCategory).length} Bereichen</p>
        </div>
      </body>
      </html>
    `;
  };

  const handleResetAll = () => {
    if (window.confirm('Alle Tests zurücksetzen?')) {
      setTestStatuses({});
      setTestNotes({});
      // localStorage leeren
      localStorage.setItem('favorg-audit-testStatuses', JSON.stringify({}));
      localStorage.setItem('favorg-audit-testNotes', JSON.stringify({}));
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

  const viewReport = (report) => {
    // Rekonstruiere ALLE Tests aus dem gespeicherten Bericht (nicht nur aktuelle Kategorie)
    const savedTests = Object.keys(report.testStatuses).map(testName => {
      // Finde den ursprünglichen Test in allen Kategorien
      let originalTest = null;
      testCategories.forEach(category => {
        const categoryTests = predefinedTests[category] || [];
        const found = categoryTests.find(test => test.name === testName);
        if (found) {
          originalTest = { 
            ...found, 
            category: category,
            categoryIcon: getCategoryIcon(category)
          };
        }
      });
      
      // Falls nicht in predefined Tests gefunden, dynamische Tests prüfen
      if (!originalTest) {
        testCategories.forEach(category => {
          const dynamicCategoryTests = dynamicTests[category] || [];
          const found = dynamicCategoryTests.find(test => test.name === testName);
          if (found) {
            originalTest = { 
              ...found, 
              category: category,
              categoryIcon: getCategoryIcon(category)
            };
          }
        });
      }
      
      // Fallback wenn Test nicht gefunden
      if (!originalTest) {
        originalTest = {
          name: testName,
          icon: '📋',
          tooltip: report.testNotes[testName] || 'Archivierter Test',
          category: report.category,
          categoryIcon: getCategoryIcon(report.category)
        };
      }
      
      return originalTest;
    });
    
    const testResults = calculateTestResults(savedTests, report.testStatuses, report.testNotes);
    const reportDate = report.timestamp;
    
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    printWindow.document.write(generateStructuredReport(savedTests, testResults, reportDate, 'Alle Bereiche (Archiv)', report.testStatuses, report.testNotes));
    printWindow.document.close();
    
    toast.success(`Archivierter Bericht wird angezeigt (${savedTests.length} Tests)`);
  };

  // Generate Archived Report HTML (für gespeicherte Berichte)
  const generateArchivedReport = (tests, results, reportDate, originalReport) => {
    return generateStructuredReport(tests, results, reportDate, originalReport.category, originalReport.testStatuses, originalReport.testNotes);
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
      'Testpunkt Kopfzeile': '🔝',
      'Navigation Bereich': '🧭',
      'Suchfeld Bereich': '🔍',
      'Sidebar Bereich': '📋',
      'Hauptinhalt Bereich': '📄',
      'Footer Bereich': '🔻',
      'Dialoge und Modals': '📂',
      'Formular Eingaben': '📝',
      'Loading und Feedback': '⏳',
      'Responsive Design': '📱',
      'Tastatur und Accessibility': '⌨️'
    };
    return icons[category] || '📂';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="w-full bg-gray-900 border-gray-700 p-0" 
        style={{ 
          width: 'calc(100% - 20px)',
          height: 'calc(100vh - 160px)', // FavOrg Header (80px) + Footer (50px) + 30px Abstände
          margin: '0',
          top: '90px', // FavOrg-Header (80px) + 10px Abstand
          left: '10px',
          right: '10px',
          bottom: '60px', // FavOrg-Footer (50px) + 10px Abstand
          position: 'fixed',
          transform: 'none',
          maxWidth: 'none',
          maxHeight: 'calc(100vh - 160px)',
          zIndex: 9999, // Sehr hohe Priorität für Klick-Events
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-1.5 flex items-center justify-between" style={{ minHeight: '40px' }}>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-cyan-400">🔍 AuditLog - System</h2>
          </div>
          <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Neuer Testname..."
              className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white text-sm"
              value={newTestName}
              onChange={(e) => setNewTestName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTest()}
            />
            
            {/* Neuen Test erstellen - klarer Button */}
            <Button onClick={handleAddTest} size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 flex items-center gap-2" title={auditConfig.showTooltips ? "Neuen Test erstellen" : ""}>
              ➕ Test erstellen
            </Button>
          </div>
          </div>
        </div>

        {/* Content mit Sidebar-Layout - automatische Höhenbegrenzung */}
        <div className="flex flex-1 overflow-hidden" style={{ minHeight: '0' }}>
          {viewMode === 'tests' ? (
            <>
              {/* Sidebar: Test-Bereiche */}
              <div className="w-72 bg-gray-800 border-r border-gray-700 p-2 overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-semibold text-cyan-400 flex items-center gap-2">
                    <span>📋</span>
                    <span>Test-Bereiche</span>
                  </h3>
                  <span className="bg-orange-600 text-white px-2 py-1 rounded text-xs font-bold" title={auditConfig.showTooltips ? "Noch zu erledigende Testpunkte" : ""}>
                    {testCategories.reduce((total, cat) => total + getCategoryCounter(cat), 0)} offen
                  </span>
                </div>
                <div className="space-y-2">
                  {testCategories.map((category) => {
                    const counter = getCategoryCounter(category);
                    const errorCount = getCategoryErrorCounter(category);
                    const isCompleted = counter === 0;
                    const hasErrors = errorCount > 0;
                    
                    return (
                      <button
                        key={category}
                        onClick={() => {
                          setCurrentCategory(category);
                          setStatusFilter('');
                          // Scrolle zum Anfang der Test-Liste
                          setTimeout(() => {
                            const mainContent = document.querySelector('.flex-1.bg-gray-900.p-3.overflow-y-auto');
                            if (mainContent) {
                              mainContent.scrollTop = 0;
                            }
                          }, 100);
                        }}
                        className={`w-full text-left p-1.5 rounded-lg border transition-all duration-200 flex items-center justify-between ${
                          hasErrors 
                            ? 'bg-gray-700 border-red-500 text-gray-300 hover:bg-red-900 hover:border-red-400' 
                            : currentCategory === category
                            ? (isCompleted ? 'bg-green-600 text-white border-green-500' : 'bg-cyan-600 text-white border-cyan-500')
                            : (isCompleted ? 'bg-green-700 border-green-600 text-green-100 hover:bg-green-800' : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-cyan-900 hover:border-cyan-600')
                        }`}
                        style={hasErrors ? { borderWidth: '5px' } : {}}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{getCategoryIcon(category)}</span>
                          <span className="font-medium">{category}</span>
                        </div>
                        {/* Status Anzeige: Fehler-Counter, normaler Counter oder grüner Haken */}
                        {hasErrors ? (
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-600 text-white">
                            ❌ {errorCount}
                          </span>
                        ) : counter > 0 ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            currentCategory === category
                              ? 'bg-white text-cyan-600'
                              : 'bg-cyan-600 text-white'
                          }`}>
                            {counter}
                          </span>
                        ) : (
                          <span className="text-green-300 text-lg">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main: Testpunkte */}
              <div className="flex-1 bg-gray-900 p-2 overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-semibold text-cyan-400">
                    {getCategoryIcon(currentCategory)} {currentCategory}
                  </h3>
                  <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                    {currentTests.length} Tests
                  </span>
                </div>

                <div className="space-y-2">
                  {currentTests.map((test, index) => (
                    <div
                      key={test.name}
                      data-test-name={test.name}
                      className={`bg-gray-800 rounded-lg p-2 border-2 transition-all duration-200 ${
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
                          <div className="flex items-center gap-2">
                            {/* Test-ID vor dem Testpunkt */}
                            <span className="text-xs font-mono bg-gray-700 px-2 py-1 rounded text-cyan-400">
                              {generateTestId(currentCategory, test.name, index)}
                            </span>
                            <strong className="text-white">{test.name}</strong>
                            {/* Alle Tests sind jetzt editierbar - "Custom" Badge entfernt */}
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
                      {/* Notizen-Bereich */}
                      {testNotes[test.name] && (
                        <div className="bg-gray-700 p-3 rounded mt-3 mb-3">
                          <p className="text-cyan-400 text-sm">
                            <span className="font-medium">💭 Notiz:</span> {testNotes[test.name]}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        {/* Links: Status-Buttons (mit Lucide Icons) */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setTestStatus(test.name, 'success')}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '500',
                              transition: 'all 0.2s',
                              background: testStatuses[test.name] === 'success' ? '#059669' : '#90ee90', // Hellgrün
                              color: testStatuses[test.name] === 'success' ? 'white' : '#1f2937',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title={auditConfig.showTooltips ? "Test bestanden" : ""}
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => setTestStatus(test.name, 'error')}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '500',
                              transition: 'all 0.2s',
                              background: testStatuses[test.name] === 'error' ? '#dc2626' : '#ffb3ba', // Hellrot
                              color: testStatuses[test.name] === 'error' ? 'white' : '#1f2937',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title={auditConfig.showTooltips ? "Test fehlgeschlagen" : ""}
                          >
                            <X size={14} />
                          </button>
                          <button
                            onClick={() => setTestStatus(test.name, 'warning')}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '500',
                              transition: 'all 0.2s',
                              background: testStatuses[test.name] === 'warning' ? '#d97706' : '#ffd700', // HellOrange/Gelb
                              color: testStatuses[test.name] === 'warning' ? 'white' : '#1f2937',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title={auditConfig.showTooltips ? "Test in Bearbeitung" : ""}
                          >
                            <Pickaxe size={14} />
                          </button>
                          <button
                            onClick={() => setTestStatus(test.name, 'info')}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '500',
                              transition: 'all 0.2s',
                              background: testStatuses[test.name] === 'info' ? '#2563eb' : '#add8e6', // Hellblau
                              color: testStatuses[test.name] === 'info' ? 'white' : '#1f2937',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title={auditConfig.showTooltips ? "Test übersprungen" : ""}
                          >
                            <SkipForward size={14} />
                          </button>
                        </div>
                        
                        {/* Rechts: Edit- und Notizen-Buttons (Outline-Format mit Lucide Icons) */}
                        <div className="flex items-center gap-1.5">
                          <Button
                            onClick={() => handleEditTest(test.name)}
                            size="sm"
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white text-xs flex items-center gap-1"
                            title={auditConfig.showTooltips ? "Test bearbeiten" : ""}
                          >
                            <PencilLine size={12} />
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleAddNote(test.name)}
                            size="sm"
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white text-xs flex items-center gap-1"
                            title={auditConfig.showTooltips ? "Notiz hinzufügen oder bearbeiten" : ""}
                          >
                            <NotebookPen size={12} />
                            Notiz
                          </Button>
                          <Button
                            onClick={() => setTestStatus(test.name, null)}
                            size="sm"
                            variant="outline"
                            className="border-gray-500 text-gray-400 hover:bg-gray-600 hover:text-white text-xs flex items-center gap-1"
                            title={auditConfig.showTooltips ? "Status zurücksetzen" : ""}
                          >
                            <RotateCcw size={12} />
                            Reset
                          </Button>
                          <Button
                            onClick={() => handleDeleteTest(test.name)}
                            size="sm"
                            variant="outline"
                            className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white text-xs flex items-center gap-1"
                            title={auditConfig.showTooltips ? "Test löschen" : ""}
                          >
                            <Trash2 size={12} />
                            Löschen
                          </Button>
                        </div>
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
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          onClick={() => viewReport(report)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-xs"
                        >
                          👁️ Anzeigen
                        </Button>
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

        {/* Footer - Exaktes Vollbild-Design */}
        <div 
          className="flex-shrink-0 flex items-center justify-between"
          style={{
            position: 'relative',
            bottom: '0',
            left: '0',
            right: '0', 
            background: 'var(--bg-secondary)',
            borderTop: '1px solid var(--border-primary)',
            padding: '1.5px 14px',
            zIndex: '1000',
            minHeight: '56px'
          }}
        >
          {/* Links: 5 Status-Filter Buttons - Mit Lucide Icons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStatusFilter('')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: statusFilter === '' ? 'none' : '1px solid #4b5563',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                background: statusFilter === '' ? '#06b6d4' : '#a8dadc', // Hellblau als Basis für "Alle"
                color: statusFilter === '' ? 'white' : '#1f2937'
              }}
              title="Alle Tests anzeigen"
            >
              Alle ({counts.all})
            </button>
            <button
              onClick={() => setStatusFilter('success')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: statusFilter === 'success' ? 'none' : '1px solid #4b5563',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                background: statusFilter === 'success' ? '#059669' : '#90ee90', // Hellgrün
                color: statusFilter === 'success' ? 'white' : '#1f2937'
              }}
              title="Nur bestandene Tests anzeigen"
            >
              <Check size={16} /> ({counts.success})
            </button>
            <button
              onClick={() => setStatusFilter('error')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: statusFilter === 'error' ? 'none' : '1px solid #4b5563',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                background: statusFilter === 'error' ? '#dc2626' : '#ffb3ba', // Hellrot
                color: statusFilter === 'error' ? 'white' : '#1f2937'
              }}
              title="Nur fehlgeschlagene Tests anzeigen"
            >
              <X size={16} /> ({counts.error})
            </button>
            <button
              onClick={() => setStatusFilter('warning')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: statusFilter === 'warning' ? 'none' : '1px solid #4b5563',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                background: statusFilter === 'warning' ? '#d97706' : '#ffd700', // HellOrange/Gelb
                color: statusFilter === 'warning' ? 'white' : '#1f2937'
              }}
              title="Nur Tests in Bearbeitung anzeigen"
            >
              <Pickaxe size={16} /> ({counts.warning})
            </button>
            <button
              onClick={() => setStatusFilter('info')}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: statusFilter === 'info' ? 'none' : '1px solid #4b5563',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                background: statusFilter === 'info' ? '#2563eb' : '#add8e6', // Hellblau
                color: statusFilter === 'info' ? 'white' : '#1f2937'
              }}
              title="Nur übersprungene Tests anzeigen"
            >
              <CaptionsOff size={16} /> ({counts.info})
            </button>
          </div>

          {/* Rechts: 5 Aktions-Buttons - Mit Tooltips */}
          <div className="flex items-center gap-2">
            <button
              onClick={openConfigDialog}
              className="btn btn-secondary"
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                background: '#374151',
                color: '#d1d5db',
                border: '1px solid #4b5563'
              }}
              title="Berichts-Konfiguration bearbeiten"
            >
              ⚙️ Config
            </button>
            <button
              onClick={handleSaveToArchive}
              className="btn btn-secondary"
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                background: '#374151',
                color: '#d1d5db',
                border: '1px solid #4b5563'
              }}
              title="Aktuellen Test-Stand ins Archiv speichern"
            >
              💾 Test speichern
            </button>
            <button
              onClick={toggleArchiveView}
              className="btn btn-secondary"
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                background: viewMode === 'archive' ? 'white' : '#374151',
                color: viewMode === 'archive' ? '#1f2937' : '#d1d5db',
                border: viewMode === 'archive' ? '1px solid #d1d5db' : '1px solid #4b5563'
              }}
              title={viewMode === 'archive' ? 'Zurück zu Testpunkten' : 'Archivierte Berichte anzeigen'}
            >
              {viewMode === 'archive' ? '📋 Testpunkte' : `📁 Archiv (${archivedReports.length})`}
            </button>
            <button
              onClick={handlePDFExport}
              className="btn btn-secondary"
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                background: '#374151',
                color: '#d1d5db',
                border: '1px solid #4b5563'
              }}
              title="Quality Assurance-Bericht, also Qualitätssicherungsbericht."
            >
              📄 QA-Bericht (Alle)
            </button>
            <button
              onClick={handlePDFExportTested}
              className="btn btn-secondary"
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                background: '#059669',
                color: 'white',
                border: '1px solid #10b981'
              }}
              title="Nur getestete Tests als QA-Bericht exportieren"
            >
              📄 QA-Bericht (Geprüft)
            </button>
            <button
              onClick={handleResetAll}
              className="btn btn-danger"
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                background: '#dc2626',
                color: 'white',
                border: 'none'
              }}
              title="Alle Test-Status und Notizen zurücksetzen"
            >
              🗑️ Reset
            </button>
          </div>
        </div>
      </DialogContent>
      
      {/* Config Dialog */}
      {showConfigDialog && (
        <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
          <DialogContent 
            className="w-full max-w-2xl bg-gray-900 border-gray-700"
            style={{
              position: 'fixed',
              top: '90px', // 10px Abstand von FavOrg Header (80px)
              bottom: '60px', // 10px Abstand von FavOrg Footer (50px) 
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'calc(100% - 40px)', // 20px Gesamtabstand (10px links + 10px rechts)
              maxWidth: '800px',
              maxHeight: 'calc(100vh - 160px)', // Höhe zwischen Header und Footer
              zIndex: 10000, // Höher als AuditLog Dialog (9999)
              margin: 0,
              overflow: 'hidden'
            }}
          >
            <div className="bg-gray-800 border-b border-gray-700 p-4">
              <h3 className="text-xl font-semibold text-cyan-400">⚙️ AuditLog Konfiguration</h3>
            </div>
            
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 240px)' }}>
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-700 pb-2">
                  <h4 className="text-lg text-cyan-400 font-semibold">
                    📋 Berichts-Metadaten
                  </h4>
                  
                  {/* Tooltip Toggle unmittelbar rechts neben Überschrift */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-300">Tooltip anzeigen</span>
                    <button
                      onClick={() => setAuditConfig({...auditConfig, showTooltips: !auditConfig.showTooltips})}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                        auditConfig.showTooltips ? 'bg-cyan-600' : 'bg-gray-400'
                      }`}
                      title="AuditLog Tooltips ein-/ausschalten"
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          auditConfig.showTooltips ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
                
                {/* Toggle für Berichts-Metadaten anzeigen/verbergen */}
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <span className="text-sm font-medium text-gray-300">
                    Metadaten in Berichten anzeigen
                  </span>
                  <button
                    onClick={() => setAuditConfig({...auditConfig, showMetadata: !auditConfig.showMetadata})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                      auditConfig.showMetadata ? 'bg-cyan-600' : 'bg-gray-400'
                    }`}
                    title="Berichts-Metadaten ein-/ausblenden"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        auditConfig.showMetadata ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      HauptUser (Tester):
                    </label>
                    <input
                      type="text"
                      value={auditConfig.tester}
                      onChange={(e) => setAuditConfig({...auditConfig, tester: e.target.value})}
                      placeholder="Name des Testers"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Version:
                    </label>
                    <input
                      type="text"
                      value={auditConfig.version}
                      onChange={(e) => setAuditConfig({...auditConfig, version: e.target.value})}
                      placeholder="z.B. v2.3.0"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Testumgebung:
                    </label>
                    <input
                      type="text"
                      value={auditConfig.environment}
                      onChange={(e) => setAuditConfig({...auditConfig, environment: e.target.value})}
                      placeholder="z.B. Windows 11, Chrome 117"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Testziel:
                    </label>
                    <textarea
                      value={auditConfig.testGoal}
                      onChange={(e) => setAuditConfig({...auditConfig, testGoal: e.target.value})}
                      placeholder="Beschreibung des Testziels"
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-vertical"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Testmethodik:
                    </label>
                    <textarea
                      value={auditConfig.testMethodology}
                      onChange={(e) => setAuditConfig({...auditConfig, testMethodology: e.target.value})}
                      placeholder="Beschreibung der Testmethodik"
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-vertical"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 border-t border-gray-700 p-4 flex items-center justify-end gap-3">
              <Button
                onClick={() => saveConfig(auditConfig)}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                💾 Speichern
              </Button>
              <Button
                onClick={closeConfigDialog}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                ❌ Abbrechen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Test Dialog */}
      {editTestDialog.show && (
        <Dialog open={editTestDialog.show} onOpenChange={() => setEditTestDialog({ show: false, testName: '', currentName: '' })}>
          <DialogContent className="w-full max-w-md bg-gray-900 border-gray-700" style={{ zIndex: 10001 }}>
            <div className="bg-gray-800 border-b border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-cyan-400">✏️ Test bearbeiten</h3>
            </div>
            <div className="p-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Test-Name:</label>
              <input
                id="editTestInput"
                type="text"
                defaultValue={editTestDialog.currentName}
                placeholder="Neuen Test-Namen eingeben"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    confirmEditTest(e.target.value);
                  }
                }}
                autoFocus
              />
            </div>
            <div className="bg-gray-800 border-t border-gray-700 p-4 flex justify-end gap-3">
              <Button onClick={() => setEditTestDialog({ show: false, testName: '', currentName: '' })} variant="outline">
                Abbrechen
              </Button>
              <Button
                onClick={() => {
                  const input = document.getElementById('editTestInput');
                  if (input) confirmEditTest(input.value);
                }}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                Speichern
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Note Dialog */}
      {noteDialog.show && (
        <Dialog open={noteDialog.show} onOpenChange={() => setNoteDialog({ show: false, testName: '', currentNote: '' })}>
          <DialogContent className="w-full max-w-md bg-gray-900 border-gray-700" style={{ zIndex: 10001 }}>
            <div className="bg-gray-800 border-b border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-cyan-400">📝 Notiz hinzufügen</h3>
            </div>
            <div className="p-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Bemerkung:</label>
              <textarea
                id="noteTextarea"
                defaultValue={noteDialog.currentNote}
                placeholder="Bemerkung eingeben..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white resize-vertical"
                rows={4}
                autoFocus
              />
            </div>
            <div className="bg-gray-800 border-t border-gray-700 p-4 flex justify-end gap-3">
              <Button onClick={() => setNoteDialog({ show: false, testName: '', currentNote: '' })} variant="outline">
                Abbrechen
              </Button>
              <Button
                onClick={() => {
                  const textarea = document.getElementById('noteTextarea');
                  if (textarea) confirmAddNote(textarea.value);
                }}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                Speichern
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
};

export default AuditLogSystem;