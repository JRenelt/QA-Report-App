import React, { useState, useEffect } from 'react';
import { 
  Monitor, Tablet, Smartphone, Wrench, Moon, FileText, Palette, Menu, 
  Plus, Check, X, AlertTriangle, RotateCcw, Edit, MessageSquare, 
  Trash2, Save, FileDown, Archive, HelpCircle, Settings, Crown, UserRound, FlaskConical, LogOut
} from 'lucide-react';

interface QADashboardV2Props {
  authToken: string;
  user?: any;
  darkMode?: boolean;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onLogout?: () => void;
}

interface TestSuite {
  id: string;
  name: string;
  icon: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  openTests: number;
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
  onOpenHelp,
  onLogout
}) => {
  // Tooltip-Einstellungen Update-Funktion
  const updateTooltipSettings = (delay: 'fest' | 'kurz' | 'lang') => {
    setUserSettings(prev => ({ ...prev, tooltipDelay: delay }));
  };
  // State declarations
  const [testSuites, setTestSuites] = useState<TestSuite[]>([
    { id: '1', name: 'Allgemeines Design', icon: 'palette', totalTests: 8, passedTests: 6, failedTests: 0, openTests: 2 },
    { id: '2', name: 'Testpunkt Kopfzeile', icon: 'menu', totalTests: 16, passedTests: 14, failedTests: 2, openTests: 0 },
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
  const [editTitle, setEditTitle] = useState('');
  const [sidebarWidth, setSidebarWidth] = useState(256); // 256px = w-64
  const [isResizing, setIsResizing] = useState(false);
  const [userSettings, setUserSettings] = useState({
    tooltipDelay: 'kurz' as 'fest' | 'kurz' | 'lang', // Fest=0ms, Kurz=500ms, Lang=1500ms
    sidebarWidth: 256
  });

  // Tooltip Delay Helper
  const getTooltipDelay = () => {
    switch(userSettings.tooltipDelay) {
      case 'fest': return 0;
      case 'kurz': return 500;
      case 'lang': return 1500;
      default: return 500;
    }
  };

  // Custom Tooltip Component
  const CustomTooltip: React.FC<{ text: string; children: React.ReactElement }> = ({ text, children }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipTimeout, setTooltipTimeout] = useState<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
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

    return (
      <div className="relative inline-block">
        {React.cloneElement(children, {
          onMouseEnter: handleMouseEnter,
          onMouseLeave: handleMouseLeave,
        })}
        {showTooltip && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50">
            {text}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
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

  // Einstellungen laden beim Component Mount
  React.useEffect(() => {
    const loadUserSettings = () => {
      const savedSettings = localStorage.getItem(`qa_app_settings_${user?.username || 'default'}`);
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setUserSettings(prev => ({ ...prev, ...settings }));
        setSidebarWidth(settings.sidebarWidth || 256);
      }
    };
    loadUserSettings();
  }, [user?.username]);

  // Einstellungen speichern bei Änderungen
  React.useEffect(() => {
    if (user?.username) {
      const settingsToSave = {
        ...userSettings,
        sidebarWidth
      };
      localStorage.setItem(`qa_app_settings_${user.username}`, JSON.stringify(settingsToSave));
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

  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: any } = {
      palette: Palette,
      menu: Menu,
      file: FileText,
      form: FileText,
    };
    const IconComponent = icons[iconName] || FileText;
    return <IconComponent className="h-4 w-4" />;
  };

  const handleCreateTest = () => {
    if (!newTestName.trim()) return;
    
    // Bessere ID-Generierung für aktuelle Suite
    const suiteTests = testCases.filter(t => t.suite_id === activeSuite);
    const nextNumber = suiteTests.length + 1;
    const suitePrefix = testSuites.find(s => s.id === activeSuite)?.name.substring(0, 2).toUpperCase() || 'AD';
    
    const newTest: TestCase = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      test_id: `${suitePrefix}${String(nextNumber).padStart(4, '0')}`,
      suite_id: activeSuite,
      title: newTestName.trim(),
      description: '',
      status: 'pending'
    };
    
    setTestCases(prev => [...prev, newTest]);
    setNewTestName('');
    console.log('Test erstellt:', newTest); // Debug-Output
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateTest();
    }
  };

  const filteredTests = testCases.filter(test => {
    if (test.suite_id !== activeSuite) return false;
    if (filterStatus === 'all') return true;
    return test.status === filterStatus;
  });

  const currentSuite = testSuites.find(s => s.id === activeSuite);

  const statusCounts = {
    all: testCases.filter(t => t.suite_id === activeSuite).length,
    success: testCases.filter(t => t.suite_id === activeSuite && t.status === 'success').length,
    error: testCases.filter(t => t.suite_id === activeSuite && t.status === 'error').length,
    warning: testCases.filter(t => t.suite_id === activeSuite && t.status === 'warning').length,
    pending: testCases.filter(t => t.suite_id === activeSuite && t.status === 'pending').length,
    skipped: testCases.filter(t => t.suite_id === activeSuite && t.status === 'skipped').length,
  };

  const getUserIcon = () => {
    if (user?.role === 'admin') {
      return <Crown className="h-5 w-5 text-yellow-400" />;
    }
    return <UserRound className="h-5 w-5 text-blue-400" />;
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
        <div className="flex items-center space-x-1">
          <X className="h-3 w-3" />
          <span>{stats.failedTests}</span>
          {stats.openTests > 0 && (
            <>
              <span className="mx-1">•</span>
              <div className="flex items-center space-x-1 bg-blue-500 rounded-full px-1.5 py-0.5">
                <span className="text-xs">{stats.openTests}</span>
              </div>
            </>
          )}
        </div>
      );
    }
    if (stats.openTests === 0 && stats.totalTests === stats.passedTests && stats.totalTests > 0) {
      return <Check className="h-4 w-4" />;
    }
    return stats.totalTests;
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-[#1a1d26] via-[#1e222b] to-[#252933] text-white">
      {/* Header - Feste Position */}
      <header className="bg-[#282C34] border-b border-gray-700 px-2.5 py-3 flex items-center justify-between shadow-lg flex-shrink-0">
        {/* Links - Logo + Titel */}
        <div className="flex items-center space-x-3">
          <FlaskConical className="h-6 w-6 text-cyan-400" />
          <h1 className="text-xl font-bold text-white">QA-Report-App</h1>
        </div>

        {/* Mitte - Inputfeld */}
        <div className="flex-1 max-w-md mx-8">
          <input
            type="text"
            value={newTestName}
            onChange={(e) => setNewTestName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Neuer Testname... (Enter zum Erstellen)"
            className="w-full px-4 py-2 bg-[#1E222B] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Rechts - User, Hilfe, Settings */}
        <div className="flex items-center space-x-3">
          {/* User */}
          <div className="flex items-center space-x-2 px-3 py-2 bg-[#1E222B] rounded-lg">
            {getUserIcon()}
            <span className="text-sm font-medium">{user?.username || 'User'}</span>
          </div>

          {/* Hilfe */}
          <button
            onClick={onOpenHelp}
            className="p-2 bg-[#1E222B] hover:bg-gray-700 rounded-lg transition-colors"
            title="Hilfe & Dokumentation"
          >
            <HelpCircle className="h-5 w-5 text-gray-300" />
          </button>

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
          className="bg-[#282C34] border-r border-gray-700 flex flex-col relative"
          style={{ width: `${sidebarWidth}px` }}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-cyan-400 font-bold text-lg flex items-center mb-3">
              <FileText className="h-5 w-5 mr-2" />
              Test-Bereiche
            </h2>
            <div className="px-3 py-2 bg-orange-600 rounded text-center font-bold">
              {totalOpenTests} Offen
            </div>
          </div>

          {/* Test Suites List */}
          <div className="flex-1 overflow-y-auto">
            {testSuites.map((suite) => (
              <button
                key={suite.id}
                onClick={() => setActiveSuite(suite.id)}
                className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-700 transition-colors border-l-4 ${
                  activeSuite === suite.id 
                    ? 'bg-cyan-600 bg-opacity-20 border-cyan-400' 
                    : calculateSuiteStats(suite.id).failedTests > 0 
                    ? 'border-red-500'
                    : 'border-transparent'
                }`}
              >
                <div className="flex items-center flex-1">
                  {getIconComponent(suite.icon)}
                  <span className="ml-3 text-sm">{suite.name}</span>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold flex items-center ${getSuiteBadgeStyle(suite.id)}`}>
                  {getSuiteBadgeContent(suite.id)}
                </span>
              </button>
            ))}
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
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {filteredTests.map((test) => (
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
                      
                      {/* Status-Buttons */}
                      <div className="flex space-x-2 mb-3">
                        <CustomTooltip text="Test als erfolgreich markieren">
                          <button
                            onClick={() => {
                              const updated = testCases.map(t => 
                                t.id === test.id ? { ...t, status: 'success' as const } : t
                              );
                              setTestCases(updated);
                            }}
                            className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                              test.status === 'success' 
                                ? 'bg-green-600 text-white shadow-md' 
                                : 'bg-green-200 text-green-800 hover:bg-green-300'
                            }`}
                          >
                            ✓ Bestanden
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
                            className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                              test.status === 'error' 
                                ? 'bg-red-600 text-white shadow-md' 
                                : 'bg-red-200 text-red-800 hover:bg-red-300'
                            }`}
                          >
                            ✗ Fehlgeschlagen
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
                            className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                              test.status === 'warning' 
                                ? 'bg-orange-600 text-white shadow-md' 
                                : 'bg-orange-200 text-orange-800 hover:bg-orange-300'
                            }`}
                          >
                            ⚠ In Arbeit
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
                            className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                              test.status === 'skipped' 
                                ? 'bg-blue-600 text-white shadow-md' 
                                : 'bg-blue-200 text-blue-800 hover:bg-blue-300'
                            }`}
                          >
                            ↻ Übersprungen
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
              {/* Filter Links */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    filterStatus === 'all' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Alle ({statusCounts.all})
                </button>
                <button
                  onClick={() => setFilterStatus('success')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    filterStatus === 'success' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  ✓ ({statusCounts.success})
                </button>
                <button
                  onClick={() => setFilterStatus('error')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    filterStatus === 'error' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  ✗ ({statusCounts.error})
                </button>
                <button
                  onClick={() => setFilterStatus('warning')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    filterStatus === 'warning' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  ⚠ ({statusCounts.warning})
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    filterStatus === 'pending' ? 'bg-gray-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  ⬜ Unbearbeitet ({statusCounts.pending})
                </button>
                <button
                  onClick={() => setFilterStatus('skipped')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    filterStatus === 'skipped' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  ↻ Übersprungen ({statusCounts.skipped})
                </button>
              </div>

              {/* Action Buttons Rechts */}
              <div className="flex space-x-2">
                <button className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-sm rounded transition-colors flex items-center">
                  <Save className="h-4 w-4 mr-1" />
                  Test speichern
                </button>
                <button className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-sm rounded transition-colors flex items-center">
                  <Archive className="h-4 w-4 mr-1" />
                  Archiv
                </button>
                <button className="px-3 py-1.5 bg-green-700 hover:bg-green-600 text-sm rounded transition-colors flex items-center">
                  <FileDown className="h-4 w-4 mr-1" />
                  QA-Bericht
                </button>
                <button className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-sm rounded transition-colors flex items-center">
                  <FileDown className="h-4 w-4 mr-1" />
                  QA-Bericht (Geprüft)
                </button>
                <button className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-sm rounded transition-colors flex items-center">
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Footer - über gesamte Bildschirmbreite */}
      <footer className="bg-[#1a1d26] border-t border-gray-700 px-4 py-2 text-sm text-gray-400 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div>© 2025 QA-Report-App. Alle Rechte vorbehalten.</div>
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
    </div>
  );
};

export default QADashboardV2;
