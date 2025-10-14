import React, { useState, useEffect } from 'react';
import { 
  Monitor, Tablet, Smartphone, Wrench, Moon, FileText, Palette, Menu, 
  Plus, Check, X, AlertTriangle, RotateCcw, Edit, MessageSquare, 
  Trash2, Save, FileDown, Archive, HelpCircle, Settings, Crown, UserRound, FlaskConical, LogOut, Users,
  CheckCircle, User, FunnelX, Coffee, CircleOff, MousePointerClick, CircleCheck, Factory, FolderOpen
} from 'lucide-react';
import UserManagement from './UserManagement';
import CompanyManagement from './CompanyManagement';
import qaService from '../services/qaService';

interface QADashboardV2Props {
  authToken: string;
  user?: any;
  darkMode?: boolean;
  onOpenSettings: () => void;
  onOpenExport: () => void;
  onOpenHelp: () => void;
  onLogout?: () => void;
}

interface TestSuite {
  id: string;
  name: string;
  icon: string;
  description?: string;
  created_by?: string;
  created_at?: string;
  totalTests?: number;
  passedTests?: number;
  failedTests?: number;
  openTests?: number;
}

interface TestCase {
  id: string;
  test_id: string;
  suite_id: string;
  title: string;
  description: string;
  status: 'success' | 'error' | 'warning' | 'pending' | 'skipped';
  note?: string;
}

const QADashboardV2: React.FC<QADashboardV2Props> = ({ 
  authToken, 
  user, 
  darkMode = true,
  onOpenSettings,
  onOpenExport,
  onOpenHelp,
  onLogout
}) => {
  // QA Service Token setzen
  React.useEffect(() => {
    if (authToken) {
      qaService.setAuthToken(authToken);
    }
    
    // DEBUG: Backend URL prüfen
    console.log('REACT_APP_BACKEND_URL:', process.env.REACT_APP_BACKEND_URL);
    console.log('Current location:', window.location.href);
  }, [authToken]);

  // Tooltip-Einstellungen Update-Funktion
  const updateTooltipSettings = (delay: 'fest' | 'kurz' | 'lang') => {
    setUserSettings(prev => ({ ...prev, tooltipDelay: delay }));
  };
  // State declarations
  const [testSuites, setTestSuites] = useState<TestSuite[]>([
    { id: '1', name: 'Allgemeines Design', icon: 'palette', totalTests: 8, passedTests: 6, failedTests: 0, openTests: 2 },
    { id: '2', name: 'Testfall Kopfzeile', icon: 'menu', totalTests: 16, passedTests: 14, failedTests: 2, openTests: 0 },
    { id: '3', name: 'Navigation Bereich', icon: 'navigation', totalTests: 4, passedTests: 4, failedTests: 0, openTests: 0 },
    { id: '4', name: 'Suchfeld Bereich', icon: 'search', totalTests: 6, passedTests: 4, failedTests: 0, openTests: 2 },
    { id: '5', name: 'Sidebar Bereich', icon: 'sidebar', totalTests: 8, passedTests: 6, failedTests: 1, openTests: 1 },
    { id: '6', name: 'Hauptinhalt Bereich', icon: 'file', totalTests: 8, passedTests: 7, failedTests: 0, openTests: 1 },
    { id: '7', name: 'Footer Bereich', icon: 'footer', totalTests: 9, passedTests: 8, failedTests: 0, openTests: 1 },
    { id: '8', name: 'Dialoge und Modale', icon: 'dialog', totalTests: 7, passedTests: 6, failedTests: 0, openTests: 1 },
    { id: '9', name: 'Formular Eingaben', icon: 'form', totalTests: 6, passedTests: 5, failedTests: 1, openTests: 0 },
    { id: '10', name: 'Loading und Feedback', icon: 'loading', totalTests: 5, passedTests: 5, failedTests: 0, openTests: 0 },
    { id: '11', name: 'Responsive Design', icon: 'responsive', totalTests: 4, passedTests: 2, failedTests: 2, openTests: 0 },
  ]);

  const [activeSuite, setActiveSuite] = useState<string>('1');
  const [newTestName, setNewTestName] = useState('');
  const [testCases, setTestCases] = useState<TestCase[]>([
    {
      id: '1', test_id: 'AD0001', suite_id: '1',
      title: 'Desktop Darstellung',
      description: 'Korrekte Darstellung auf Desktop-Bildschirmen',
      status: 'success'
    },
    {
      id: '2', test_id: 'AD0002', suite_id: '1',
      title: 'Tablet Darstellung',
      description: 'Responsive Darstellung auf Tablet-Geräten',
      status: 'error'
    },
    {
      id: '3', test_id: 'AD0003', suite_id: '1',
      title: 'Mobile Darstellung',
      description: 'Mobile-optimierte Darstellung',
      status: 'success'
    },
    {
      id: '4', test_id: 'AD0004', suite_id: '1',
      title: 'Responsive Breakpoints',
      description: 'Übergänge zwischen verschiedenen Bildschirmgrößen',
      status: 'warning'
    },
    {
      id: '5', test_id: 'AD0005', suite_id: '1',
      title: 'Dark Theme Konsistenz',
      description: 'Konsistente Darstellung im Dark Mode',
      status: 'pending'
    },
  ]);

  const [selectedTest, setSelectedTest] = useState<TestCase | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'error' | 'warning' | 'pending' | 'skipped'>('all');
  const [editDescription, setEditDescription] = useState('');
  const [editNote, setEditNote] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configTest, setConfigTest] = useState<TestCase | null>(null);
  const [testConfig, setTestConfig] = useState({
    title: '',
    description: '',
    notes: '',
    testId: '',
    company: '',
    userInitials: '',
    softwareVersion: '',
    tester: ''
  });
  const [editTitle, setEditTitle] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const saved = localStorage.getItem('itemsPerPage');
    return saved ? parseInt(saved) : 10;
  });

  // EINFACHER ANSATZ: Polling für itemsPerPage Änderungen
  React.useEffect(() => {
    const pollInterval = setInterval(() => {
      const savedValue = localStorage.getItem('itemsPerPage');
      const newItemsPerPage = savedValue ? parseInt(savedValue) : 10;
      
      if (newItemsPerPage !== itemsPerPage) {
        console.log(`Einträge pro Seite geändert: ${itemsPerPage} -> ${newItemsPerPage}`);
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
      }
    }, 500); // Prüft alle 500ms

    return () => clearInterval(pollInterval);
  }, [itemsPerPage]);
  const [sidebarWidth, setSidebarWidth] = useState(350); // Vergrößert von 256px auf 350px für 100% größeren Content
  const [isResizing, setIsResizing] = useState(false);
  const [userSettings, setUserSettings] = useState({
    tooltipDelay: 'kurz' as 'fest' | 'kurz' | 'lang', // Fest=0ms, Kurz=500ms, Lang=1500ms
    sidebarWidth: 350
  });
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showCompanyManagement, setShowCompanyManagement] = useState(false);

  // Company and Project Management State
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [availableCompanies] = useState([
    { id: 'ID2', name: 'ID2 GmbH' },
    { id: 'TG01', name: 'TechGlobal Solutions AG' },
    { id: 'DE02', name: 'Digital Excellence GmbH' },
    { id: 'IN03', name: 'Innovate Systems Ltd.' }
  ]);
  const [projects] = useState([
    { id: 'PROJ001', name: 'E-Commerce Plattform Redesign', companyId: 'ID2' },
    { id: 'PROJ002', name: 'Mobile Banking App Security Audit', companyId: 'TG01' },
    { id: 'PROJ003', name: 'CRM Dashboard Performance Optimization', companyId: 'DE02' },
    { id: 'PROJ004', name: 'IoT Device Management Portal', companyId: 'IN03' },
    { id: 'PROJ005', name: 'Multi-Cloud Infrastructure Dashboard', companyId: 'ID2' }
  ]);
  
  // Current user's company (for normal users)
  const currentUserCompany = availableCompanies.find(c => c.id === (user?.companyId || 'ID2')) || availableCompanies[0];

  // Initialize company selection
  React.useEffect(() => {
    if (user?.role === 'admin' && !selectedCompanyId && availableCompanies.length > 0) {
      setSelectedCompanyId(availableCompanies[0].id);
      const companyProjects = projects.filter(p => p.companyId === availableCompanies[0].id);
      if (companyProjects.length > 0) {
        setSelectedProjectId(companyProjects[0].id);
      }
    } else if (user?.role !== 'admin' && currentUserCompany) {
      setSelectedCompanyId(currentUserCompany.id);
      const userProjects = projects.filter(p => p.companyId === currentUserCompany.id);
      if (userProjects.length > 0) {
        setSelectedProjectId(userProjects[0].id);
      }
    }
  }, [user, availableCompanies, projects, currentUserCompany, selectedCompanyId]);

  // Doppelte Definition entfernt - wird oben bereits definiert

  // Tooltip Delay Helper
  const getTooltipDelay = () => {
    switch(userSettings.tooltipDelay) {
      case 'fest': return 0;
      case 'kurz': return 500;
      case 'lang': return 1500;
      default: return 500;
    }
  };

  // Custom Tooltip Component mit Settings-Integration
  const CustomTooltip: React.FC<{ text: string; children: React.ReactElement; enabled?: boolean }> = ({ 
    text, 
    children, 
    enabled = true 
  }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipTimeout, setTooltipTimeout] = useState<NodeJS.Timeout | null>(null);

    // Tooltips nur anzeigen wenn aktiviert
    const tooltipsEnabled = localStorage.getItem('showTooltips') !== 'false' && enabled;

    const handleMouseEnter = () => {
      if (!tooltipsEnabled) return;
      
      const delay = getTooltipDelay();
      const timeout = setTimeout(() => {
        setShowTooltip(true);
      }, delay);
      setTooltipTimeout(timeout);
    };

    const handleMouseLeave = () => {
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
      }
      setShowTooltip(false);
    };

    const handleCloseTooltip = () => {
      setShowTooltip(false);
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
      }
    };

    return (
      <div 
        className="relative inline-block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
        {showTooltip && tooltipsEnabled && (
          <div 
            className="absolute mb-2 px-3 py-2 rounded shadow-lg max-w-xs z-[9999]"
            style={{ 
              backgroundColor: '#f6cda1',
              color: '#8b4513',
              left: '50%',
              bottom: window.scrollY < 100 ? 'auto' : '100%', // Unten positionieren wenn oben wenig Platz
              top: window.scrollY < 100 ? '100%' : 'auto', // Oben positionieren wenn unten wenig Platz
              transform: 'translateX(-50%)',
              marginLeft: window.innerWidth < 400 ? '-50px' : '0px' // Bildschirmrand-Schutz
            }}
          >
            <div className="flex items-start justify-between">
              <span className="text-xs whitespace-pre-wrap pr-2">{text}</span>
              <button
                onClick={handleCloseTooltip}
                className="ml-1 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center hover:bg-orange-200 transition-colors"
                title="Tooltip schließen"
              >
                <CircleCheck className="h-3 w-3" />
              </button>
            </div>
            <div 
              className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent"
              style={{ borderTopColor: '#f6cda1' }}
            ></div>
          </div>
        )}
      </div>
    );
  };

  // Resize handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  // Einstellungen laden beim Component Mount (NUR LocalStorage)
  React.useEffect(() => {
    const savedSettings = localStorage.getItem(`qa_app_settings_${user?.username || 'default'}`);
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setUserSettings(prev => ({ ...prev, ...settings }));
      setSidebarWidth(settings.sidebarWidth || 350);
    }
  }, [user?.username]);

  // Einstellungen speichern bei Änderungen (NUR LocalStorage)
  React.useEffect(() => {
    if (user?.username) {
      localStorage.setItem(`qa_app_settings_${user.username}`, JSON.stringify({
        ...userSettings,
        sidebarWidth
      }));
    }
  }, [userSettings, sidebarWidth, user?.username]);

  // Auto-Sizing für Sidebar basierend auf längstem Eintrag
  const calculateOptimalSidebarWidth = () => {
    let maxLength = 0;
    testSuites.forEach(suite => {
      const stats = calculateSuiteStats(suite.id);
      const displayText = `${suite.name} (${stats.totalTests})`;
      maxLength = Math.max(maxLength, displayText.length);
    });
    // Basis: 12px pro Zeichen + Icons + Padding + Counter-Bereich
    const calculatedWidth = Math.max(200, Math.min(500, maxLength * 12 + 120));
    return calculatedWidth;
  };

  // Auto-resize bei Suite-Änderungen
  React.useEffect(() => {
    if (!isResizing) {
      const optimalWidth = calculateOptimalSidebarWidth();
      setSidebarWidth(optimalWidth);
    }
  }, [testSuites, testCases, isResizing]);

  React.useEffect(() => {
    const handleMouseMoveEvent = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth >= 200 && newWidth <= 500) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUpEvent = () => {
      setIsResizing(false);
    };
    
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMoveEvent);
      document.addEventListener('mouseup', handleMouseUpEvent);
      return () => {
        document.removeEventListener('mousemove', handleMouseMoveEvent);
        document.removeEventListener('mouseup', handleMouseUpEvent);
      };
    }
  }, [isResizing]);

  // Dynamisch berechnete Test Suite Stats
  const calculateSuiteStats = (suiteId: string) => {
    const suiteTests = testCases.filter(t => t.suite_id === suiteId);
    return {
      totalTests: suiteTests.length,
      passedTests: suiteTests.filter(t => t.status === 'success').length,
      failedTests: suiteTests.filter(t => t.status === 'error').length,
      openTests: suiteTests.filter(t => t.status === 'pending' || t.status === 'warning').length,
      skippedTests: suiteTests.filter(t => t.status === 'skipped').length,
    };
  };

  const totalOpenTests = testSuites.reduce((sum, suite) => {
    const stats = calculateSuiteStats(suite.id);
    return sum + stats.openTests + stats.failedTests;
  }, 0);

  // Icon mapping for test suites
  const icons: { [key: string]: any } = {
    palette: Palette,
    menu: Menu,
    file: FileText,
    form: FileText,
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = icons[iconName] || FileText;
    return <IconComponent className="h-4 w-4" />;
  };

  const handleCreateTest = async () => {
    const testName = newTestName.trim();
    console.log('=== TEST ERSTELLUNG START (BACKEND) ===');
    console.log('Input-Name:', testName);
    console.log('Aktive Suite:', activeSuite);
    console.log('Auth Token verfügbar:', !!authToken);
    
    if (!testName) {
      console.log('ABBRUCH: Leerer Testname');
      return;
    }
    
    if (!authToken) {
      alert('Fehler: Nicht authentifiziert. Bitte neu anmelden.');
      return;
    }
    
    try {
      // Sichere ID-Generierung
      const suiteTests = testCases.filter(t => t.suite_id === activeSuite);
      const nextNumber = suiteTests.length + 1;
      const activeSuiteData = testSuites.find(s => s.id === activeSuite);
      const suitePrefix = activeSuiteData ? activeSuiteData.name.substring(0, 2).toUpperCase() : 'AD';
      
      // Backend API verwenden
      const newTestData = {
        test_suite_id: activeSuite,
        test_id: `${suitePrefix}${String(nextNumber).padStart(4, '0')}`,
        name: testName,
        description: `Beschreiben Sie den ${testName}`, // Hilfreicher Default-Text
        priority: 2, // medium priority
        expected_result: '',
        sort_order: nextNumber,
        created_by: user?.username || 'unknown'
      };
      
      console.log('Sende Test-Daten an Backend:', newTestData);
      
      const createdTest = await qaService.createTestCase(newTestData as any);
      
      // Lokal hinzufügen (für UI-Update)
      const newTest: TestCase = {
        id: createdTest.id,
        test_id: createdTest.test_id,
        suite_id: activeSuite,
        title: testName,
        description: `Beschreiben Sie den ${testName}`, // Hilfreicher Default-Text
        status: 'pending'
      };
      
      setTestCases(prevTests => {
        const updatedTests = [...prevTests, newTest];
        console.log('Test erfolgreich hinzugefügt. Anzahl Tests:', updatedTests.length);
        return updatedTests;
      });
      
      // Input-Feld leeren
      setNewTestName('');
      console.log('=== TEST ERSTELLUNG ERFOLGREICH (BACKEND) ===');
      
      // KREDO: "Kein Testfall ohne Beschreibung" - Edit-Modal sofort öffnen
      setSelectedTest(newTest);
      setEditTitle(newTest.title || '');
      setEditDescription(newTest.description || '');
      setShowEditModal(true);
      console.log('Edit-Modal geöffnet für neuen Test:', newTest.test_id);
      
    } catch (error) {
      console.error('=== BACKEND-SPEICHERUNG FEHLGESCHLAGEN ===');
      console.error('Fehler Details:', error);
      console.error('Fehler Typ:', typeof error);
      console.error('Fehler Name:', error instanceof Error ? error.name : 'Unknown');
      console.error('Fehler Message:', error instanceof Error ? error.message : error);
      console.error('Auth Token:', authToken ? 'Vorhanden' : 'Fehlt');
      
      // Detailierte Fehleranalyse
      let errorMessage = 'Unbekannter Fehler';
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Netzwerk-Verbindungsfehler - Backend nicht erreichbar';
        } else if (error.message.includes('401')) {
          errorMessage = 'Authentifizierung fehlgeschlagen - Token ungültig';
        } else if (error.message.includes('403')) {
          errorMessage = 'Berechtigung fehlt - Admin-Zugriff erforderlich';
        } else if (error.message.includes('404')) {
          errorMessage = 'API-Endpoint nicht gefunden';
        } else if (error.message.includes('500')) {
          errorMessage = 'Server-Fehler - Backend-Problem';
        } else {
          errorMessage = error.message;
        }
      }
      
      // Fallback: Lokale Erstellung wenn Backend-Integration fehlschlägt
      const suiteTests = testCases.filter(t => t.suite_id === activeSuite);
      const nextNumber = suiteTests.length + 1;
      const activeSuiteData = testSuites.find(s => s.id === activeSuite);
      const suitePrefix = activeSuiteData ? activeSuiteData.name.substring(0, 2).toUpperCase() : 'AD';
      
      const newTest: TestCase = {
        id: `test-${Date.now()}`,
        test_id: `${suitePrefix}${String(nextNumber).padStart(4, '0')}`,
        suite_id: activeSuite,
        title: testName,
        description: `Beschreiben Sie den ${testName}`, // Hilfreicher Default-Text
        status: 'pending'
      };
      
      setTestCases(prevTests => [...prevTests, newTest]);
      setNewTestName('');
      
      // KREDO: "Kein Testfall ohne Beschreibung" - Edit-Modal auch bei lokalem Fallback öffnen
      setSelectedTest(newTest);
      setEditTitle(newTest.title || '');
      setEditDescription(newTest.description || '');
      setShowEditModal(true);
      console.log('Edit-Modal geöffnet für neuen Test (Fallback):', newTest.test_id);
      
      // Verbesserte Fehlermeldung
      const fullErrorMessage = `⚠️ WARNUNG: Test wurde lokal erstellt, aber Backend-Speicherung fehlgeschlagen\n\n` +
        `🔍 Diagnose: ${errorMessage}\n\n` +
        `Backend URL: ${process.env.REACT_APP_BACKEND_URL || 'Nicht konfiguriert'}\n` +
        `Authentifizierung: ${authToken ? 'Token vorhanden' : 'Kein Token'}\n\n` +
        `Der Test wurde vorläufig lokal gespeichert.`;
      
      alert(fullErrorMessage);
    }
  };

  // PDF Export Funktionen
  const handlePDFExport = (type: 'all' | 'tested') => {
    const testsToExport = type === 'all' 
      ? testCases.filter(t => t.suite_id === activeSuite)
      : testCases.filter(t => t.suite_id === activeSuite && t.status !== 'pending');
    
    const activeSuiteData = testSuites.find(s => s.id === activeSuite);
    const suiteName = activeSuiteData?.name || 'Test-Suite';
    
    // HTML für PDF generieren
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>QA-Bericht ${type === 'all' ? '(Alle Tests)' : '(Getestete Tests)'}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #1f2937; border-bottom: 2px solid #06b6d4; padding-bottom: 10px; }
            h2 { color: #374151; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
            th { background-color: #f3f4f6; font-weight: bold; }
            .status-success { background-color: #dcfce7; color: #166534; }
            .status-error { background-color: #fef2f2; color: #991b1b; }
            .status-warning { background-color: #fef3c7; color: #92400e; }
            .status-pending { background-color: #f3f4f6; color: #374151; }
            .status-skipped { background-color: #dbeafe; color: #1d4ed8; }
            .footer { margin-top: 30px; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <h1>QA-Bericht: ${suiteName}</h1>
          <p><strong>Erstellt am:</strong> ${new Date().toLocaleDateString('de-DE')}</p>
          <p><strong>Art:</strong> ${type === 'all' ? 'Alle Tests' : 'Nur getestete Tests'}</p>
          <p><strong>Anzahl Tests:</strong> ${testsToExport.length}</p>
          
          <h2>Test-Übersicht</h2>
          <table>
            <thead>
              <tr>
                <th>Test-ID</th>
                <th>Titel</th>
                <th>Beschreibung</th>
                <th>Status</th>
                <th>Notiz</th>
              </tr>
            </thead>
            <tbody>
              ${testsToExport.map(test => `
                <tr>
                  <td>${test.test_id}</td>
                  <td>${test.title}</td>
                  <td>${test.description || '-'}</td>
                  <td class="status-${test.status}">
                    ${test.status === 'success' ? 'Bestanden' : 
                      test.status === 'error' ? 'Fehlgeschlagen' :
                      test.status === 'warning' ? 'In Arbeit' :
                      test.status === 'skipped' ? 'Übersprungen' : 'Unbearbeitet'}
                  </td>
                  <td>${test.note || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>QA-Report-App - Generiert am ${new Date().toLocaleString('de-DE')}</p>
          </div>
        </body>
      </html>
    `;
    
    // Neues Fenster für Print-Vorschau öffnen
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Nach dem Laden direkt drucken
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  // Reset Tests mit Sicherheitsabfrage
  const handleResetTests = () => {
    if (confirm('Alle Tests wirklich zurücksetzen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      const resetTests = testCases.map(test => ({
        ...test,
        status: 'pending' as const,
        note: ''
      }));
      setTestCases(resetTests);
      alert('Alle Tests wurden zurückgesetzt.');
    }
  };

  // PDF Preview vor Export
  const handlePDFPreview = (type: 'all' | 'tested') => {
    const testsToExport = type === 'all' 
      ? testCases.filter(t => t.suite_id === activeSuite)
      : testCases.filter(t => t.suite_id === activeSuite && t.status !== 'pending');
    
    const activeSuiteData = testSuites.find(s => s.id === activeSuite);
    const suiteName = activeSuiteData?.name || 'Test-Suite';
    
    // Detaillierte Testbericht-Struktur
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Testbericht - ${suiteName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .header { text-align: center; border-bottom: 3px solid #06b6d4; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 28px; color: #1f2937; margin-bottom: 10px; }
            .metadata { background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .section { margin: 25px 0; }
            .section-title { font-size: 18px; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 15px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; }
            th { background-color: #f3f4f6; font-weight: bold; }
            .status-success { background-color: #dcfce7; color: #166534; font-weight: bold; }
            .status-error { background-color: #fef2f2; color: #991b1b; font-weight: bold; }
            .status-warning { background-color: #fef3c7; color: #92400e; font-weight: bold; }
            .status-pending { background-color: #f3f4f6; color: #374151; }
            .status-skipped { background-color: #dbeafe; color: #1d4ed8; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; }
            .summary { background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .print-btn { background: #06b6d4; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 10px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="no-print">
            <button onclick="window.print()" class="print-btn">🖨️ Drucken / Als PDF speichern</button>
            <button onclick="window.close()" class="print-btn" style="background: #6b7280;">✕ Schließen</button>
          </div>
          
          <div class="header">
            <div class="title">Testbericht</div>
            <p style="font-size: 16px; color: #6b7280;">Grafisch ansprechend und gut lesbar</p>
          </div>

          <div class="metadata">
            <h3>Metadaten</h3>
            <p><strong>Titel:</strong> Testbericht · ${suiteName}</p>
            <p><strong>Datum:</strong> ${new Date().toLocaleDateString('de-DE')} (Erstellungsdatum)</p>
            <p><strong>Tester:</strong> ${user?.username || 'Unbekannt'}</p>
            <p><strong>Version:</strong> v1.2.3</p>
            <p><strong>Testumgebung:</strong> ${navigator.userAgent}</p>
          </div>

          <div class="section">
            <div class="section-title">Ziel des Tests</div>
            <p>Überprüfung der ${suiteName} auf korrekte Funktionalität und Fehlermeldungen.</p>
          </div>

          <div class="section">
            <div class="section-title">Testobjekt</div>
            <p>${suiteName} mit definierten Testfällen und Funktionalitäts-Prüfungen.</p>
          </div>

          <div class="section">
            <div class="section-title">Testmethodik</div>
            <p>Manueller Funktionstest mit definierten Testfällen. Eingaben über Web-Oberfläche, Auswertung durch visuelle Kontrolle.</p>
          </div>

          <div class="summary">
            <div class="section-title">Testergebnisse</div>
            <p><strong>${testsToExport.filter(t => t.status === 'success').length} von ${testsToExport.length} Testfällen bestanden.</strong></p>
            ${testsToExport.filter(t => t.status === 'error').length > 0 ? 
              `<p style="color: #991b1b;">⚠️ ${testsToExport.filter(t => t.status === 'error').length} kritische Fehler wurden festgestellt.</p>` : 
              '<p style="color: #166534;">✅ Keine kritischen Fehler festgestellt.</p>'
            }
          </div>

          <div class="section">
            <div class="section-title">Testfälle</div>
            <table>
              <thead>
                <tr>
                  <th>Nr.</th>
                  <th>Test-ID</th>
                  <th>Beschreibung</th>
                  <th>Ergebnis</th>
                  <th>Status</th>
                  <th>Notizen</th>
                </tr>
              </thead>
              <tbody>
                ${testsToExport.map((test, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${test.test_id}</td>
                    <td>${test.title}</td>
                    <td>${test.description || 'Keine Beschreibung'}</td>
                    <td class="status-${test.status}">
                      ${test.status === 'success' ? '[OK] Bestanden' : 
                        test.status === 'error' ? '[FEHLER] Fehlgeschlagen' :
                        test.status === 'warning' ? '[WARNUNG] In Arbeit' :
                        test.status === 'skipped' ? '[ÜBERSPRUNGEN]' : '[OFFEN] Ungetestet'}
                    </td>
                    <td>${test.note || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Fazit und Empfehlungen</div>
            <p>${testsToExport.filter(t => t.status === 'error').length === 0 ? 
              'Alle Tests waren erfolgreich. Das System ist bereit für die Freigabe.' :
              'Es wurden Fehler festgestellt. Vor Freigabe müssen die kritischen Bugs behoben und erneut getestet werden.'
            }</p>
          </div>

          <div class="footer">
            <p>© 2025 ${user?.username || 'QA-Tester'} · QA-Report-App · Alle Rechte vorbehalten.</p>
          </div>
        </body>
      </html>
    `;
    
    // Vorschau-Fenster öffnen
    const previewWindow = window.open('', '_blank', 'width=800,height=900,scrollbars=yes');
    if (previewWindow) {
      previewWindow.document.write(htmlContent);
      previewWindow.document.close();
    }
  };

  // CSV Export Funktion
  const handleCSVExport = () => {
    const testsToExport = testCases.filter(t => t.suite_id === activeSuite);
    const activeSuiteData = testSuites.find(s => s.id === activeSuite);
    const suiteName = activeSuiteData?.name || 'Test-Suite';
    
    // CSV Header
    const headers = ['Test-ID', 'Titel', 'Beschreibung', 'Status', 'Notiz'];
    const csvContent = [
      headers.join(';'),
      ...testsToExport.map(test => [
        test.test_id,
        `"${test.title}"`,
        `"${test.description || ''}"`,
        test.status === 'success' ? 'Bestanden' : 
        test.status === 'error' ? 'Fehlgeschlagen' :
        test.status === 'warning' ? 'In Arbeit' :
        test.status === 'skipped' ? 'Übersprungen' : 'Unbearbeitet',
        `"${test.note || ''}"`
      ].join(';'))
    ].join('\n');
    
    // CSV als Blob erstellen und downloaden
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `QA-Bericht-${suiteName}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTests = testCases.filter(test => {
    if (test.suite_id !== activeSuite) return false;
    if (filterStatus === 'all') return true;
    return test.status === filterStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredTests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTests = filteredTests.slice(startIndex, endIndex);
  
  // DEBUG: Log pagination info
  console.log(`Pagination: ${currentTests.length} von ${filteredTests.length} Tests (${itemsPerPage} pro Seite, Seite ${currentPage}/${totalPages})`);

  // Reset page when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, activeSuite]);

  const currentSuite = testSuites.find(s => s.id === activeSuite);

  const statusCounts = React.useMemo(() => {
    const suiteTests = testCases.filter(t => t.suite_id === activeSuite);
    return {
      all: suiteTests.length,
      success: suiteTests.filter(t => t.status === 'success').length,
      error: suiteTests.filter(t => t.status === 'error').length,
      warning: suiteTests.filter(t => t.status === 'warning').length,
      pending: suiteTests.filter(t => t.status === 'pending').length,
      skipped: suiteTests.filter(t => t.status === 'skipped').length,
    };
  }, [testCases, activeSuite]);

  const getUserIcon = () => {
    if (user?.role === 'admin') {
      return <Crown className="h-5 w-5 text-yellow-400" />;
    }
    return <User className="h-5 w-5 text-blue-400" />;
  };

  const getSuiteBadgeStyle = (suiteId: string) => {
    const stats = calculateSuiteStats(suiteId);
    if (stats.failedTests > 0) {
      return 'bg-red-600 text-white';
    }
    if (stats.openTests === 0 && stats.totalTests === stats.passedTests && stats.totalTests > 0) {
      return 'bg-green-600 text-white';
    }
    return 'bg-cyan-600 text-white';
  };

  const getSuiteBadgeContent = (suiteId: string) => {
    const stats = calculateSuiteStats(suiteId);
    if (stats.failedTests > 0) {
      return (
        <CustomTooltip text={`${stats.failedTests} fehlgeschlagene Tests`}>
          <X className="h-3 w-3 text-red-500" />
        </CustomTooltip>
      );
    }
    if (stats.openTests === 0 && stats.totalTests === stats.passedTests) {
      return (
        <CustomTooltip text="Alle Tests bestanden">
          <Check className="h-3 w-3 text-green-500" />
        </CustomTooltip>
      );
    }
    return (
      <CustomTooltip text={`${stats.openTests} noch zu testende Aufgaben`}>
        <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
          darkMode ? 'bg-orange-600 text-white' : 'bg-orange-200 text-orange-800'
        }`}>
          {stats.openTests}
        </span>
      </CustomTooltip>
    );
  };

  return (
    <div className={`flex flex-col h-screen ${
      darkMode 
        ? 'bg-gradient-to-br from-[#1a1d26] via-[#1e222b] to-[#252933] text-white' 
        : 'bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 text-gray-900'
    }`}>
      {/* Header - Kompakt */}
      <header className={`${
        darkMode ? 'bg-[#282C34] border-b border-gray-700' : 'bg-white border-b border-gray-300'
      } px-2.5 py-2 flex items-center justify-between shadow-lg flex-shrink-0`}>
        {/* Links - Logo + Titel */}
        <div className="flex items-center space-x-3">
          <FlaskConical className="h-6 w-6 text-cyan-400" />
          <div>
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>QA-Report-App</h1>
            
            {/* Firmenanzeige/Auswahl */}
            <div className="flex items-center mt-1">
              <Factory className="h-4 w-4 mr-2 text-gray-500" />
              {user?.role === 'admin' ? (
                /* Admin: Firmenauswahl-Dropdown */
                <select
                  value={selectedCompanyId}
                  onChange={(e) => {
                    setSelectedCompanyId(e.target.value);
                    // Reset auf erste Test-Suite der neuen Firma
                    const companyProjects = projects.filter(p => p.companyId === e.target.value);
                    if (companyProjects.length > 0) {
                      setSelectedProjectId(companyProjects[0].id);
                      // Hier müsste die erste Test-Suite des ersten Projekts gesetzt werden
                    }
                  }}
                  className={`text-sm rounded border px-2 py-1 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-gray-300' 
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}
                >
                  {availableCompanies.map(company => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              ) : (
                /* Normal User: Firma anzeigen */
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {currentUserCompany?.name || 'Keine Firma zugewiesen'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Mitte - Inputfeld + Button */}
        <div className="flex-1 max-w-md mx-8 flex items-center space-x-2">
          <input
            type="text"
            value={newTestName}
            onChange={(e) => setNewTestName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCreateTest();
              }
            }}
            placeholder="Neuer Testname..."
            className={`flex-1 px-4 py-2 border rounded-lg focus:border-cyan-500 focus:outline-none transition-colors ${
              darkMode 
                ? 'bg-[#1E222B] border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
          />
          <button
            onClick={handleCreateTest}
            disabled={!newTestName.trim()}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              !newTestName.trim()
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : darkMode 
                ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                : 'bg-cyan-500 hover:bg-cyan-600 text-white'
            }`}
          >
            +
          </button>
        </div>

        {/* Rechts - User, Hilfe, Settings */}
        <div className="flex items-center space-x-3">
          {/* User */}
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
            darkMode ? 'bg-[#1E222B]' : 'bg-gray-100'
          }`}>
            {getUserIcon()}
            <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {user?.username || 'User'}
            </span>
          </div>

          {/* Hilfe */}
          <button
            onClick={onOpenHelp}
            className="p-2 bg-[#1E222B] hover:bg-gray-700 rounded-lg transition-colors"
            title="Hilfe & Dokumentation"
          >
            <HelpCircle className="h-5 w-5 text-gray-300" />
          </button>

          {/* User Management (nur für Admins) */}
          {user?.role === 'admin' && (
            <>
              <CustomTooltip text="Firmen- & Projektverwaltung">
                <button
                  onClick={() => setShowCompanyManagement(true)}
                  className="p-2 bg-[#1E222B] hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Factory className="h-5 w-5 text-gray-300" />
                </button>
              </CustomTooltip>
              <CustomTooltip text="Benutzerverwaltung">
                <button
                  onClick={() => setShowUserManagement(true)}
                  className="p-2 bg-[#1E222B] hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Users className="h-5 w-5 text-gray-300" />
                </button>
              </CustomTooltip>
            </>
          )}

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 bg-[#1E222B] hover:bg-gray-700 rounded-lg transition-colors"
            title="Systemeinstellungen"
          >
            <Settings className="h-5 w-5 text-gray-300" />
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            title="Abmelden"
          >
            <LogOut className="h-5 w-5 text-white" />
          </button>
        </div>
      </header>

      {/* Main Content Area - zwischen Header und Footer */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div 
          className={`${
            darkMode ? 'bg-[#282C34] border-r border-gray-700' : 'bg-gray-50 border-r border-gray-300'
          } flex flex-col relative`}
          style={{ width: `${sidebarWidth}px` }}
        >
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-700">
            {/* Projekt-Auswahl Header - wie in Soll-Bild (100% größer) */}
            <div className="flex items-center space-x-3 mb-4">
              <FolderOpen className="h-6 w-6 text-cyan-400" />
              <h2 className={`text-lg font-semibold ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>
                Projekt-Auswahl
              </h2>
            </div>
            
            {/* Projekt-Dropdown + Orange Counter für offene Tests (5-stellig) */}
            <div className="flex items-center space-x-3">
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                }}
                className={`flex-1 text-base rounded border px-3 py-2.5 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-300' 
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                {(() => {
                  const userProjects = user?.role === 'admin' 
                    ? projects.filter(p => p.companyId === selectedCompanyId)
                    : projects.filter(p => p.companyId === currentUserCompany?.id);
                  
                  return userProjects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ));
                })()}
              </select>
              
              {/* Orange Counter für noch zu testende Testfälle (5-stellig) */}
              <CustomTooltip text="Anzahl der noch zu testenden Testfälle">
                <div className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded text-base font-bold min-w-[80px] text-center">
                  {(() => {
                    // Berechne Anzahl offener Tests für aktuelles Projekt
                    const openTestsCount = testCases.filter(t => 
                      t.status === 'pending' || t.status === 'warning'
                    ).length;
                    // 5-stellig formatieren
                    return String(openTestsCount).padStart(5, '0');
                  })()}
                </div>
              </CustomTooltip>
            </div>
          </div>

          {/* Test Suites List - Vergrößertes Design (100% größer) */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-5 pb-6">
              {testSuites.map((suite) => {
                const stats = calculateSuiteStats(suite.id);
                const isActive = suite.id === activeSuite;

                return (
                  <button
                    key={suite.id}
                    onClick={() => setActiveSuite(suite.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 mb-2 rounded text-left transition-all hover:bg-gray-700 ${
                      isActive ? 'bg-gray-700' : ''
                    }`}
                  >
                    <FileText className="h-5 w-5 flex-shrink-0 text-gray-400" />
                    <div className="flex-1 min-w-0 text-base text-gray-300 truncate">
                      {suite.name}
                    </div>
                    <div className="flex items-center">
                      <CustomTooltip text={`${stats.openTests} noch zu testende Aufgaben in diesem Bereich`}>
                        <span className="bg-cyan-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-base font-bold">
                          {stats.openTests}
                        </span>
                      </CustomTooltip>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Resize Handle */}
          <div
            className="absolute right-0 top-0 bottom-0 w-1 bg-gray-600 hover:bg-cyan-500 cursor-col-resize transition-colors"
            onMouseDown={handleMouseDown}
            title="Seitenleiste vergrößern/verkleinern"
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Content Header */}
          <div className="bg-[#282C34] border-b border-gray-700 p-4 flex items-center justify-between">
            <h1 className="text-cyan-400 text-xl font-bold">
              {currentSuite?.name}
            </h1>
          </div>

          {/* Test Cases List */}
          <div className="flex-1 overflow-y-auto p-4 pb-16">
            <div className="space-y-3">
              {currentTests.map((test) => (
                <div
                  key={test.id}
                  className={`bg-[#2C313A] border-t-4 rounded-lg p-4 hover:shadow-lg transition-all ${
                    test.status === 'success' ? 'border-green-500' :
                    test.status === 'error' ? 'border-red-500' :
                    test.status === 'warning' ? 'border-yellow-500' :
                    test.status === 'skipped' ? 'border-blue-500' :
                    'border-gray-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-cyan-400 font-mono text-sm font-bold">{test.test_id}</span>
                        <span className="text-white font-semibold text-lg">{test.title}</span>
                      </div>
                      <p className="text-gray-400 text-sm mb-3">{test.description || 'Keine Beschreibung'}</p>
                      
                      {/* Status-Buttons - Mit Icons wie Filter-Buttons */}
                      <div className="flex space-x-2 mb-3">
                        <CustomTooltip text="Test als erfolgreich markieren">
                          <button
                            onClick={() => {
                              const updated = testCases.map(t => 
                                t.id === test.id ? { ...t, status: 'success' as const } : t
                              );
                              setTestCases(updated);
                            }}
                            className={`w-8 h-8 rounded-full transition-colors flex items-center justify-center ${
                              test.status === 'success' 
                                ? 'bg-green-600 text-white' 
                                : 'bg-green-300 hover:bg-green-400 text-green-800'
                            }`}
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        </CustomTooltip>
                        
                        <CustomTooltip text="Test als fehlgeschlagen markieren">
                          <button
                            onClick={() => {
                              const updated = testCases.map(t => 
                                t.id === test.id ? { ...t, status: 'error' as const } : t
                              );
                              setTestCases(updated);
                            }}
                            className={`w-8 h-8 rounded-full transition-colors flex items-center justify-center ${
                              test.status === 'error' 
                                ? 'bg-red-600 text-white' 
                                : 'bg-red-300 hover:bg-red-400 text-red-800'
                            }`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </CustomTooltip>
                        
                        <CustomTooltip text="Test als in Bearbeitung markieren">
                          <button
                            onClick={() => {
                              const updated = testCases.map(t => 
                                t.id === test.id ? { ...t, status: 'warning' as const } : t
                              );
                              setTestCases(updated);
                            }}
                            className={`w-8 h-8 rounded-full transition-colors flex items-center justify-center ${
                              test.status === 'warning' 
                                ? 'bg-orange-600 text-white' 
                                : 'bg-orange-300 hover:bg-orange-400 text-orange-800'
                            }`}
                          >
                            <Coffee className="h-4 w-4" />
                          </button>
                        </CustomTooltip>
                        
                        <CustomTooltip text="Test überspringen">
                          <button
                            onClick={() => {
                              const updated = testCases.map(t => 
                                t.id === test.id ? { ...t, status: 'skipped' as const } : t
                              );
                              setTestCases(updated);
                            }}
                            className={`w-8 h-8 rounded-full transition-colors flex items-center justify-center ${
                              test.status === 'skipped' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-blue-300 hover:bg-blue-400 text-blue-800'
                            }`}
                          >
                            ↻
                          </button>
                        </CustomTooltip>
                      </div>

                      {test.note && (
                        <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded p-2 text-sm text-blue-200 mb-2">
                          <MessageSquare className="inline h-3 w-3 mr-1" />
                          {test.note}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2 ml-4">
                      <CustomTooltip text="Test bearbeiten (Titel und Beschreibung)">
                        <button 
                          onClick={() => {
                            setSelectedTest(test);
                            setEditTitle(test.title || '');
                            setEditDescription(test.description || '');
                            setShowEditModal(true);
                          }}
                          className="p-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                        >
                          <Edit className="h-4 w-4 text-white" />
                        </button>
                      </CustomTooltip>
                      <button 
                        onClick={() => {
                          setSelectedTest(test);
                          setEditNote(test.note || '');
                          setShowNoteModal(true);
                        }}
                        className="p-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors" 
                        title="Notiz"
                      >
                        <MessageSquare className="h-4 w-4 text-white" />
                      </button>
                      <button 
                        onClick={() => {
                          // Reset test
                          const updated = testCases.map(t => 
                            t.id === test.id ? { ...t, status: 'pending' as const } : t
                          );
                          setTestCases(updated);
                        }}
                        className="p-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors" 
                        title="Reset"
                      >
                        <RotateCcw className="h-4 w-4 text-white" />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm('Test wirklich löschen?')) {
                            setTestCases(testCases.filter(t => t.id !== test.id));
                          }
                        }}
                        className="p-2 bg-red-600 hover:bg-red-700 rounded transition-colors" 
                        title="Löschen"
                      >
                        <Trash2 className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Toolbar (über Footer) */}
          <div className="bg-[#282C34] border-t border-gray-700 p-3">
            <div className="flex items-center justify-between">
              {/* Filter Buttons - Mit Symbolen */}
              <div className="flex space-x-2">
                <CustomTooltip text={`Alle Tests anzeigen (${statusCounts.all})`}>
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={`w-8 h-8 rounded-full transition-colors flex items-center justify-center ${
                      filterStatus === 'all' ? 'bg-cyan-600 text-white' : 'bg-cyan-300 hover:bg-cyan-400 text-cyan-800'
                    }`}
                  >
                    <FunnelX className="h-4 w-4" />
                  </button>
                </CustomTooltip>
                <CustomTooltip text={`Bestandene Tests anzeigen (${statusCounts.success})`}>
                  <button
                    onClick={() => setFilterStatus('success')}
                    className={`w-8 h-8 rounded-full transition-colors flex items-center justify-center ${
                      filterStatus === 'success' ? 'bg-green-600 text-white' : 'bg-green-300 hover:bg-green-400 text-green-800'
                    }`}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </CustomTooltip>
                <CustomTooltip text={`Fehlgeschlagene Tests anzeigen (${statusCounts.error})`}>
                  <button
                    onClick={() => setFilterStatus('error')}
                    className={`w-8 h-8 rounded-full transition-colors flex items-center justify-center ${
                      filterStatus === 'error' ? 'bg-red-600 text-white' : 'bg-red-300 hover:bg-red-400 text-red-800'
                    }`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </CustomTooltip>
                <CustomTooltip text={`Tests in Bearbeitung anzeigen (${statusCounts.warning})`}>
                  <button
                    onClick={() => setFilterStatus('warning')}
                    className={`w-8 h-8 rounded-full transition-colors flex items-center justify-center ${
                      filterStatus === 'warning' ? 'bg-orange-600 text-white' : 'bg-orange-300 hover:bg-orange-400 text-orange-800'
                    }`}
                  >
                    <Coffee className="h-4 w-4" />
                  </button>
                </CustomTooltip>
                <CustomTooltip text={`Unbearbeitete Tests anzeigen (${statusCounts.pending})`}>
                  <button
                    onClick={() => setFilterStatus('pending')}
                    className={`w-8 h-8 rounded-full transition-colors flex items-center justify-center ${
                      filterStatus === 'pending' ? 'bg-gray-600 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                    }`}
                  >
                    <CircleOff className="h-4 w-4" />
                  </button>
                </CustomTooltip>
                <CustomTooltip text={`Übersprungene Tests anzeigen (${statusCounts.skipped})`}>
                  <button
                    onClick={() => setFilterStatus('skipped')}
                    className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                      filterStatus === 'skipped' 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-blue-300 hover:bg-blue-400 text-blue-800'
                    }`}
                  >
                    ↻
                  </button>
                </CustomTooltip>
              </div>

              {/* Action Buttons Rechts - Korrigiert */}
              <div className="flex space-x-2">
                <CustomTooltip text="Test-Konfiguration bearbeiten">
                  <button 
                    onClick={() => {
                      if (currentTests.length > 0) {
                        const firstTest = currentTests[0];
                        setConfigTest(firstTest);
                        setTestConfig({
                          title: firstTest.title,
                          description: firstTest.description || '',
                          notes: firstTest.note || '',
                          testId: firstTest.test_id,
                          company: 'JR', // Erste zwei Buchstaben Firma
                          userInitials: user?.username?.substring(0, 2).toUpperCase() || 'AD',
                          softwareVersion: '1.0.0',
                          tester: user?.username || 'admin'
                        });
                        setShowConfigModal(true);
                      } else {
                        alert('Keine Tests verfügbar zum Konfigurieren');
                      }
                    }}
                    className={`px-3 py-1.5 text-sm rounded transition-all flex items-center border ${
                      darkMode 
                        ? 'border-gray-400 text-gray-400 hover:bg-gray-400 hover:bg-opacity-20' 
                        : 'border-gray-500 text-gray-500 hover:bg-gray-500 hover:bg-opacity-10'
                    }`}>
                    <Wrench className="h-4 w-4 mr-1" />
                    Config
                  </button>
                </CustomTooltip>
                <CustomTooltip text="Alle Tests im Backend speichern">
                  <button 
                    onClick={async () => {
                      try {
                        const unsavedTests = testCases.filter(test => test.id.startsWith('test-')); // Lokale Tests
                        if (unsavedTests.length === 0) {
                          alert('Alle Tests sind bereits gespeichert.');
                          return;
                        }
                        
                        const saved = await Promise.all(unsavedTests.map(async (test) => {
                          try {
                            const testData = {
                              test_id: test.test_id,
                              suite_id: test.suite_id,
                              title: test.title,
                              description: test.description || '',
                              status: 'pending' as const,
                              created_by: user?.username || 'unknown'
                            };
                            return await qaService.createTestCase(testData);
                          } catch (error) {
                            console.error('Fehler beim Speichern von Test:', test.test_id, error);
                            return null;
                          }
                        }));
                        
                        const successCount = saved.filter(s => s !== null).length;
                        alert(`${successCount} von ${unsavedTests.length} Tests erfolgreich gespeichert.`);
                        
                        // UI aktualisieren - lokale Test IDs durch Backend IDs ersetzen
                        setTestCases(testCases.map(test => {
                          if (test.id.startsWith('test-')) {
                            const savedTest = saved.find((s, i) => unsavedTests[i].id === test.id && s !== null);
                            return savedTest ? { ...test, id: savedTest.id } : test;
                          }
                          return test;
                        }));
                        
                      } catch (error) {
                        console.error('Fehler beim Speichern:', error);
                        alert(`Fehler beim Speichern: ${error instanceof Error ? error.message : error}`);
                      }
                    }}
                    className={`px-3 py-1.5 text-sm rounded transition-all flex items-center border ${
                      darkMode 
                        ? 'border-green-400 text-green-400 hover:bg-green-400 hover:bg-opacity-20' 
                        : 'border-green-500 text-green-500 hover:bg-green-500 hover:bg-opacity-10'
                    }`}>
                    <Save className="h-4 w-4 mr-1" />
                    Test speichern [{testCases.filter(t => t.id.startsWith('test-')).length}]
                  </button>
                </CustomTooltip>
                <CustomTooltip text="Archiv mit persistenten Tests öffnen">
                  <button 
                    onClick={() => {
                      // Archivierte Tests anzeigen (Status completed/archived)
                      const archivedTests = testCases.filter(test => 
                        test.status === 'success' || test.note?.includes('[ARCHIVIERT]')
                      );
                      
                      if (archivedTests.length === 0) {
                        alert('Keine archivierten Tests gefunden.\n\nTipp: Tests werden automatisch archiviert wenn sie als "Bestanden" markiert werden.');
                        return;
                      }
                      
                      const archiveInfo = `ARCHIV ÜBERSICHT\n\n` +
                        `📁 Archivierte Tests: ${archivedTests.length}\n` +
                        `✅ Bestandene Tests: ${archivedTests.filter(t => t.status === 'success').length}\n` +
                        `📂 Manuell archivierte: ${archivedTests.filter(t => t.note?.includes('[ARCHIVIERT]')).length}\n\n` +
                        `Aktuelle Suite: ${testSuites.find(s => s.id === activeSuite)?.name}\n` +
                        `Tests in dieser Suite: ${testCases.filter(t => t.suite_id === activeSuite).length}\n\n` +
                        `Möchten Sie alle archivierten Tests als Filter anzeigen?`;
                      
                      if (confirm(archiveInfo)) {
                        // Filter auf erfolgreiche Tests setzen
                        setFilterStatus('success');
                      }
                    }}
                    className={`px-3 py-1.5 text-sm rounded transition-all flex items-center border ${
                      darkMode 
                        ? 'border-purple-400 text-purple-400 hover:bg-purple-400 hover:bg-opacity-20' 
                        : 'border-purple-500 text-purple-500 hover:bg-purple-500 hover:bg-purple-opacity-10'
                    }`}>
                    <Archive className="h-4 w-4 mr-1" />
                    Archiv
                  </button>
                </CustomTooltip>
                <CustomTooltip text="Export-Funktionen öffnen (Systemsteuerung)">
                  <button 
                    onClick={onOpenExport}
                    className={`px-3 py-1.5 text-sm rounded transition-all flex items-center border ${
                      darkMode 
                        ? 'border-orange-400 text-orange-400 hover:bg-orange-400 hover:bg-opacity-20' 
                        : 'border-orange-500 text-orange-500 hover:bg-orange-500 hover:bg-opacity-10'
                    }`}>
                    <FileDown className="h-4 w-4 mr-1" />
                    Export
                  </button>
                </CustomTooltip>
                <CustomTooltip text="QA-Bericht für alle Tests mit Vorschau">
                  <button 
                    onClick={() => handlePDFPreview('all')}
                    className={`px-3 py-1.5 text-sm rounded transition-all flex items-center border ${
                      darkMode 
                        ? 'border-green-400 text-green-400 hover:bg-green-400 hover:bg-opacity-20' 
                        : 'border-green-500 text-green-500 hover:bg-green-500 hover:bg-opacity-10'
                    }`}>
                    <FileText className="h-4 w-4 mr-1" />
                    QA-Bericht
                  </button>
                </CustomTooltip>
                <CustomTooltip text="QA-Bericht nur für getestete Tests mit Vorschau">
                  <button 
                    onClick={() => handlePDFPreview('tested')}
                    className={`px-3 py-1.5 text-sm rounded transition-all flex items-center border ${
                      darkMode 
                        ? 'border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:bg-opacity-20' 
                        : 'border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:bg-opacity-10'
                    }`}>
                    <FileText className="h-4 w-4 mr-1" />
                    QA-Bericht (Getestet)
                  </button>
                </CustomTooltip>
                <CustomTooltip text="Alle Tests zurücksetzen">
                  <button 
                    onClick={handleResetTests}
                    className={`px-3 py-1.5 text-sm rounded transition-all flex items-center border ${
                      darkMode 
                        ? 'border-red-400 text-red-400 hover:bg-red-400 hover:bg-opacity-20' 
                        : 'border-red-500 text-red-500 hover:bg-red-500 hover:bg-opacity-10'
                    }`}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Reset
                  </button>
                </CustomTooltip>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Footer - über gesamte Bildschirmbreite */}
      <footer className="bg-[#1a1d26] border-t border-gray-700 px-4 py-2 text-sm text-gray-400 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div>© 2025 QA-Report-App. Alle Rechte vorbehalten.</div>
          
          {/* Seitennavigation - IMMER ANZEIGEN FÜR DEBUG */}
          {filteredTests.length > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2 py-1 text-xs rounded hover:bg-gray-600 disabled:text-gray-500 disabled:cursor-not-allowed"
                title="Zum Anfang"
              >
                &lt;&lt;
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 text-xs rounded hover:bg-gray-600 disabled:text-gray-500 disabled:cursor-not-allowed"
                title="Eine Seite zurück"
              >
                &lt;
              </button>
              <span className="px-2 py-1 text-xs bg-gray-700 rounded">
                {currentPage} von {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 text-xs rounded hover:bg-gray-600 disabled:text-gray-500 disabled:cursor-not-allowed"
                title="Eine Seite weiter"
              >
                &gt;
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2 py-1 text-xs rounded hover:bg-gray-600 disabled:text-gray-500 disabled:cursor-not-allowed"
                title="Zum Ende"
              >
                &gt;&gt;
              </button>
            </div>
          )}
          
          <a href="#impressum" className="hover:text-white transition-colors">Impressum</a>
        </div>
      </footer>

      {/* Modals */}
      {showEditModal && selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-[#2C313A] rounded-lg p-6 w-full max-w-md border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-cyan-400">Test bearbeiten</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Test-ID (nicht änderbar)</label>
                <input
                  value={selectedTest.test_id}
                  disabled
                  className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-gray-400 text-sm cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Titel</label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white text-sm focus:border-cyan-500 focus:outline-none"
                  placeholder="Test-Titel eingeben..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Beschreibung</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white text-sm focus:border-cyan-500 focus:outline-none"
                  rows={4}
                  placeholder="Test-Beschreibung eingeben..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button onClick={() => setShowEditModal(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">
                  Abbrechen
                </button>
                <button 
                  onClick={() => {
                    const updated = testCases.map(t => 
                      t.id === selectedTest.id ? { 
                        ...t, 
                        title: editTitle,
                        description: editDescription 
                      } : t
                    );
                    setTestCases(updated);
                    setShowEditModal(false);
                  }}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-sm"
                >
                  Speichern
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNoteModal && selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-[#2C313A] rounded-lg p-6 w-full max-w-md border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-cyan-400">Notiz hinzufügen</h3>
              <button onClick={() => setShowNoteModal(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">Test: {selectedTest.test_id} - {selectedTest.title}</p>
              <textarea
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white text-sm focus:border-cyan-500 focus:outline-none"
                rows={5}
                placeholder="Notiz eingeben..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowNoteModal(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">
                Abbrechen
              </button>
              <button 
                onClick={() => {
                  const updated = testCases.map(t => 
                    t.id === selectedTest.id ? { ...t, note: editNote } : t
                  );
                  setTestCases(updated);
                  setShowNoteModal(false);
                }}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-sm"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Config Modal */}
      {showConfigModal && configTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#2C313A] rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Projekt-Konfiguration</h2>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Projekt ID Generation */}
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-sm font-bold text-cyan-400 mb-2">Automatisch generierte Projekt-ID</h3>
                <div className="text-xs text-gray-300 mb-2">
                  Format: [2 Firma][2 User][Zeitstempel][Lfd.Nr] = {testConfig.company}{testConfig.userInitials}{Date.now().toString().slice(-6)}01
                </div>
                <div className="font-mono text-sm text-white bg-gray-800 p-2 rounded">
                  {testConfig.company}{testConfig.userInitials}{Date.now().toString().slice(-6)}01
                </div>
              </div>

              {/* Firma und User - Read Only */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Firma (aus Registrierung)
                    <CustomTooltip text="Wird automatisch aus der Benutzer-Registrierung übernommen">
                      <HelpCircle className="h-3 w-3 inline ml-1" />
                    </CustomTooltip>
                  </label>
                  <input
                    type="text"
                    value={testConfig.company}
                    readOnly
                    className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-gray-300 text-sm cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    User-Initialen
                    <CustomTooltip text="Vor- und Nachname Initialen des aktuellen Users">
                      <HelpCircle className="h-3 w-3 inline ml-1" />
                    </CustomTooltip>
                  </label>
                  <input
                    type="text"
                    value={testConfig.userInitials}
                    readOnly
                    className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-gray-300 text-sm cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Projekt Details - Editierbar */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Projekt Titel
                  <CustomTooltip text="Name des Projekts (kann aus Import kommen oder manuell eingegeben werden)">
                    <HelpCircle className="h-3 w-3 inline ml-1" />
                  </CustomTooltip>
                </label>
                <input
                  type="text"
                  value={testConfig.title}
                  onChange={(e) => setTestConfig({...testConfig, title: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm"
                  placeholder="z.B. Website Redesign Projekt"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Projekt Beschreibung
                  <CustomTooltip text="Detaillierte Beschreibung des Projekts">
                    <HelpCircle className="h-3 w-3 inline ml-1" />
                  </CustomTooltip>
                </label>
                <input
                  type="text"
                  value={testConfig.description}
                  onChange={(e) => setTestConfig({...testConfig, description: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm"
                  placeholder="z.B. Vollständiges Redesign der Unternehmenswebsite"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Projekt Notizen
                  <CustomTooltip text="Zusätzliche Notizen und Anmerkungen zum Projekt">
                    <HelpCircle className="h-3 w-3 inline ml-1" />
                  </CustomTooltip>
                </label>
                <textarea
                  value={testConfig.notes}
                  onChange={(e) => setTestConfig({...testConfig, notes: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm"
                  rows={3}
                  placeholder="Zusätzliche Notizen zum Projekt..."
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white"
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  // Update test with new config
                  if (configTest) {
                    const updated = testCases.map(t => 
                      t.id === configTest.id ? {
                        ...t,
                        title: testConfig.title,
                        description: testConfig.description,
                        note: testConfig.notes,
                        test_id: testConfig.testId
                      } : t
                    );
                    setTestCases(updated);
                    setShowConfigModal(false);
                  }
                }}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-sm text-white"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Company Management Modal */}
      <CompanyManagement
        isOpen={showCompanyManagement}
        onClose={() => setShowCompanyManagement(false)}
        darkMode={darkMode}
        authToken={authToken}
        currentUser={user}
      />

      {/* User Management Modal */}
      <UserManagement
        authToken={authToken}
        currentUser={user}
        isOpen={showUserManagement}
        onClose={() => setShowUserManagement(false)}
      />

      {/* Fixed Footer - Immer am unteren Bildschirmrand */}
      <footer className={`fixed bottom-0 left-0 right-0 z-10 ${
        darkMode ? 'bg-[#282C34] border-t border-gray-700' : 'bg-white border-t border-gray-300'
      } px-4 py-2 text-xs shadow-lg`}>
        <div className="flex items-center justify-between">
          {/* Copyright Links */}
          <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} flex items-center space-x-2`}>
            <span>© 2025 Jörg Renelt · QA-Report-App</span>
            <span className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
              v2.1.1-stable
            </span>
          </div>
          
          {/* Seitennavigation Mitte */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className={`px-2 py-1 rounded hover:bg-opacity-20 ${
                currentPage === 1 
                  ? (darkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed')
                  : (darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-600' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300')
              }`}
            >
              &lt;&lt;
            </button>
            <button 
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`px-2 py-1 rounded hover:bg-opacity-20 ${
                currentPage === 1 
                  ? (darkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed')
                  : (darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-600' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300')
              }`}
            >
              &lt;
            </button>
            <span className={`px-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              [{currentPage} von {totalPages}]
            </span>
            <button 
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`px-2 py-1 rounded hover:bg-opacity-20 ${
                currentPage === totalPages 
                  ? (darkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed')
                  : (darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-600' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300')
              }`}
            >
              &gt;
            </button>
            <button 
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className={`px-2 py-1 rounded hover:bg-opacity-20 ${
                currentPage === totalPages 
                  ? (darkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed')
                  : (darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-600' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-300')
              }`}
            >
              &gt;&gt;
            </button>
          </div>
          
          {/* Impressum/Rechtliches Rechts */}
          <div className="flex items-center space-x-3">
            <button className={`hover:underline ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}>
              Impressum
            </button>
            <button className={`hover:underline ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}>
              Datenschutz
            </button>
            <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              Alle Rechte vorbehalten
            </span>
          </div>
        </div>
      </footer>
    </div>
  );

};

export default QADashboardV2;
