import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { Settings, FileText, Archive, Printer, RotateCcw, Save, Eye, Download, Trash2, Edit, StickyNote, TestTube2, CheckCircle, XCircle, Clock, AlertTriangle, Check, X, Pickaxe, CaptionsOff, PencilLine, NotebookPen } from 'lucide-react';

const AuditLogSystem = ({ isOpen, onClose }) => {
  const [currentCategory, setCurrentCategory] = useState('Allgemeines Design');
  const [viewMode, setViewMode] = useState('tests'); // 'tests', 'archive'
  const [newTestName, setNewTestName] = useState('');
  const [testStatuses, setTestStatuses] = useState({});
  const [testNotes, setTestNotes] = useState({});
  const [statusFilter, setStatusFilter] = useState('');
  const [archivedReports, setArchivedReports] = useState([]);
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
      testMethodology: 'Manueller Funktionstest mit definierten Testfällen. Eingaben über Web-Oberfläche, Auswertung durch visuelle Prüfung und Funktionsvalidierung.'
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

  // Test-Kategorien (dynamisch aus predefinedTests)
  const testCategories = Object.keys(predefinedTests);

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
    setTestStatuses({...testStatuses, [testName]: status});
    toast.success(`Status "${status}" gesetzt`);
  };

  const handleEditTest = (testName) => {
    const currentTest = getCurrentTests().find(test => test.name === testName);
    if (!currentTest) return;
    
    if (!currentTest.isDynamic) {
      toast.error('Vordefinierte Tests können nicht bearbeitet werden');
      return;
    }
    
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
        toast.success('Notiz entfernt');
      } else {
        setTestNotes({
          ...testNotes,
          [noteDialog.testName]: newNote.trim()
        });
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

  // Enhanced PDF Export with structured report
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

  // Generate Structured Report HTML
  const generateStructuredReport = (tests, results, currentDate, reportCategory = null, customStatuses = null, customNotes = null) => {
    // Verwende custom Status/Notes für Archiv-Berichte oder aktuelle für Live-Export
    const statusesToUse = customStatuses || testStatuses;
    const notesToUse = customNotes || testNotes;
    const categoryToShow = reportCategory || 'Alle Bereiche';
    return `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <title>Testbericht · FavOrg</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 30px; 
            background: white !important;
            color: #333 !important;
            line-height: 1.5;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .report-header { 
            text-align: center; 
            border-bottom: 3px solid #06b6d4; 
            padding-bottom: 25px; 
            margin-bottom: 40px;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            padding: 30px;
            border-radius: 8px;
          }
          .report-header h1 {
            color: #1a365d !important;
            font-size: 32px;
            margin-bottom: 10px;
            font-weight: 700;
          }
          .metadata-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
            background: #f8fafc;
            padding: 20px;
            border-radius: 6px;
            border-left: 4px solid #06b6d4;
          }
          .metadata-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
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
            margin-bottom: 35px;
            padding: 20px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
          }
          .section h2 {
            color: #111827 !important;
            font-size: 20px;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #111827;
          }
          .test-case {
            padding: 15px;
            margin-bottom: 12px;
            border: 2px solid #e5e7eb;
            border-radius: 6px;
            background: white;
            display: flex;
            align-items: center;
            justify-content: space-between;
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
            font-size: 16px;
            margin-bottom: 5px;
          }
          .test-description {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 8px;
          }
          .test-notes {
            font-style: italic;
            color: #4b5563;
            font-size: 13px;
          }
          .status-badge {
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
            text-align: center;
            min-width: 80px;
          }
          .status-success { background: #10b981; color: white; }
          .status-error { background: #ef4444; color: white; }
          .status-warning { background: #f59e0b; color: white; }
          .status-ungeprüft { background: #6b7280; color: white; }
          .results-summary {
            background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
            color: white !important;
            padding: 25px;
            border-radius: 8px;
            margin-bottom: 25px;
          }
          .results-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 15px;
            margin-top: 15px;
          }
          .result-item {
            text-align: center;
            background: rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 6px;
          }
          .result-number {
            font-size: 28px;
            font-weight: bold;
            display: block;
          }
          .result-label {
            font-size: 12px;
            opacity: 0.9;
          }
          .issues-list {
            list-style: none;
            padding: 0;
          }
          .issue-item {
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 0 6px 6px 0;
          }
          .issue-type {
            font-weight: 700;
            color: #dc2626;
            font-size: 14px;
          }
          .print-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: #111827;
            color: #9CA3AF;
            border: 1px solid #374151;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          @media print {
            body { background: white !important; color: #333 !important; }
            .print-btn { display: none; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <button class="print-btn" onclick="window.print()">📄 Bericht drucken</button>
        
        <div class="report-header" style="text-align: left;">
          <h1 style="text-align: left; margin-bottom: 20px;">📋 Testbericht · FavOrg</h1>
          <p style="font-size: 16px; color: #64748b; margin-bottom: 30px;">AuditLog-System Qualitätsprüfung</p>
          
          <!-- Metadaten kompakt gruppiert -->
          <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 20px;">
            <div style="display: flex; gap: 10px;">
              <span style="font-weight: 600;">📅 ${currentDate}</span>
              <span style="font-weight: 600;">👤 ${auditConfig.tester}</span>
              <span style="font-weight: 600;">🏷️ ${auditConfig.version}</span>
            </div>
          </div>
          <div style="margin-bottom: 30px;">
            <span style="font-weight: 600;">💻 Testumgebung:</span> ${auditConfig.environment}
          </div>

          <!-- Gesamtübersicht direkt auf erster Seite -->
          <div class="results-summary" style="margin-top: 30px; background: #111827; border: 1px solid #374151;">
            <h2 style="margin-top: 0; color: #9CA3AF;">📊 Gesamtübersicht</h2>
            <p style="color: #9CA3AF; font-size: 16px; margin-bottom: 20px;">
              ${results.passed} von ${results.total} Testfällen bestanden.
              ${results.failed > 0 ? ' Es wurden ' + results.failed + ' kritische Fehler festgestellt.' : ' Alle kritischen Tests erfolgreich.'}
            </p>
            <div class="results-grid">
              <div class="result-item" style="background: rgba(17, 24, 39, 0.8); border: 2px solid #374151;">
                <span class="result-number" style="color: #9CA3AF;">${results.total}</span>
                <span class="result-label">Gesamt</span>
              </div>
              <div class="result-item" style="background: rgba(17, 24, 39, 0.8); border: 2px solid #374151;">
                <span class="result-number" style="color: #9CA3AF;">${results.passed}</span>
                <span class="result-label">✅ Bestanden</span>
              </div>
              <div class="result-item" style="background: rgba(17, 24, 39, 0.8); border: 2px solid #374151;">
                <span class="result-number" style="color: #9CA3AF;">${results.failed}</span>
                <span class="result-label">❌ Fehler</span>
              </div>
              <div class="result-item" style="background: rgba(17, 24, 39, 0.8); border: 2px solid #374151;">
                <span class="result-number" style="color: #9CA3AF;">${results.warning}</span>
                <span class="result-label">⚠️ Warnung</span>
              </div>
              <div class="result-item" style="background: rgba(17, 24, 39, 0.8); border: 2px solid #374151;">
                <span class="result-number" style="color: #9CA3AF;">${results.ungeprüft}</span>
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

        <!-- Gesamtübersicht entfernt - ist jetzt auf Seite 1 -->

        <!-- Seitenumbruch für Testfälle -->
        <div style="page-break-before: always;">
          <div class="section">
            <h2>🧪 Testfälle</h2>
          ${tests.map((test, index) => {
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
                statusText = 'WARNUNG';  
                statusClass = 'warning';
                break;
              default:
                statusText = 'UNGEPRÜFT';
                statusClass = 'ungeprüft';
            }
            
            // Zeige Kategorie wenn alle Tests exportiert werden
            const categoryInfo = test.category ? ` (${test.categoryIcon} ${test.category})` : '';
            
            return `
              <div class="test-case ${statusClass}">
                <div class="test-info">
                  <div class="test-name">${index + 1}. ${test.icon} ${test.name}${categoryInfo}</div>
                  <div class="test-description">${test.tooltip}</div>
                  ${notes ? `<div class="test-notes">💭 Notiz: ${notes}</div>` : ''}
                </div>
                <div class="status-badge status-${statusClass}">[${statusText}]</div>
              </div>
            `;
          }).join('')}
        </div>

          </div>
        </div>

        <!-- Seitenumbruch für Abweichungen, Fazit und Anhang -->
        <div style="page-break-before: always;">
          ${results.issues.length > 0 ? `
            <div class="section">
              <h2>⚠️ Abweichungen und Probleme</h2>
              <ul class="issues-list">
                ${results.issues.map(issue => `
                  <li class="issue-item">
                    <div class="issue-type">${issue.type}: ${issue.name}</div>
                    <p>${issue.description}</p>
                  </li>
                `).join('')}
              </ul>
            </div>
          ` : ''}

          <div class="section">
            <h2>💡 Fazit und Empfehlungen</h2>
            <p>
              ${results.failed === 0 ? 
                `Das ${categoryToShow} System ist vollständig funktionsfähig. Alle ${results.passed} kritischen Tests wurden erfolgreich bestanden.` :
                `Das ${categoryToShow} System weist ${results.failed} kritische Fehler auf. Vor der Freigabe müssen diese Probleme behoben und erneut getestet werden.`
              }
            </p>
            ${results.warning > 0 ? `<p><strong>Empfehlung:</strong> ${results.warning} Verbesserungen sollten für eine optimale Benutzererfahrung umgesetzt werden.</p>` : ''}
          </div>

          <div class="section">
            <h2>📎 Anhang</h2>
            <p>Detaillierte Testdaten und Screenshots sind im internen AuditLog-System archiviert.</p>
            <p><strong>Berichts-ID:</strong> AuditLog-${Date.now()}</p>
            <p><strong>Generiert von:</strong> FavOrg AuditLog-System ${auditConfig.version}</p>
          </div>
        </div>
      </body>
      </html>
    `;
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

        {/* Content mit Sidebar-Layout - automatische Höhenbegrenzung */}
        <div className="flex flex-1 overflow-hidden" style={{ minHeight: '0' }}>
          {viewMode === 'tests' ? (
            <>
              {/* Sidebar: Test-Bereiche */}
              <div className="w-80 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-cyan-400">📋 Test-Bereiche</h3>
                  <span className="bg-orange-600 text-white px-3 py-1 rounded text-sm font-bold">
                    {testCategories.reduce((total, cat) => total + getCategoryCounter(cat), 0)} offen
                  </span>
                </div>
                <div className="space-y-2">
                  {testCategories.map((category) => {
                    const counter = getCategoryCounter(category);
                    const isCompleted = counter === 0;
                    
                    return (
                      <button
                        key={category}
                        onClick={() => {
                          setCurrentCategory(category);
                          // Zeige alle Tests der Kategorie im Main-Bereich an
                          setStatusFilter('');
                        }}
                        className={`w-full text-left p-3 rounded-lg border transition-all duration-200 flex items-center justify-between ${
                          currentCategory === category
                            ? (isCompleted ? 'bg-green-600 text-white border-green-500' : 'bg-cyan-600 text-white border-cyan-500')
                            : (isCompleted ? 'bg-green-700 border-green-600 text-green-100 hover:bg-green-800' : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-cyan-900 hover:border-cyan-600')
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{getCategoryIcon(category)}</span>
                          <span className="font-medium">{category}</span>
                        </div>
                        {counter > 0 && (
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            currentCategory === category
                              ? 'bg-white text-cyan-600'
                              : 'bg-cyan-600 text-white'
                          }`}>
                            {counter}
                          </span>
                        )}
                        {counter === 0 && (
                          <span className="text-green-300 text-lg">✓</span>
                        )}
                      </button>
                    );
                  })}
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
                            title="Test bestanden"
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
                            title="Test fehlgeschlagen"
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
                            title="Test in Bearbeitung"
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
                            title="Test übersprungen"
                          >
                            <CaptionsOff size={14} />
                          </button>
                        </div>
                        
                        {/* Rechts: Edit- und Notizen-Buttons (Outline-Format mit Lucide Icons) */}
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleEditTest(test.name)}
                            size="sm"
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white text-xs flex items-center gap-1"
                            title="Test bearbeiten"
                          >
                            <PencilLine size={12} />
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleAddNote(test.name)}
                            size="sm"
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white text-xs flex items-center gap-1"
                            title="Notiz hinzufügen oder bearbeiten"
                          >
                            <NotebookPen size={12} />
                            Notiz
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
            padding: '8px 16px',
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
                background: '#374151',
                color: '#d1d5db',
                border: '1px solid #4b5563'
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
              title="Strukturierten Test-Bericht als PDF exportieren"
            >
              📄 PDF-Export
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
                <h4 className="text-lg text-cyan-400 font-semibold border-b border-gray-700 pb-2">
                  📋 Berichts-Metadaten
                </h4>
                
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