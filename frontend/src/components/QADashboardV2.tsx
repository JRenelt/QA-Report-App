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
  status: 'success' | 'error' | 'warning' | 'pending';
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
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'error' | 'warning' | 'pending'>('all');
  const [editDescription, setEditDescription] = useState('');
  const [editNote, setEditNote] = useState('');

  const totalOpenTests = testSuites.reduce((sum, suite) => sum + suite.openTests + suite.failedTests, 0);

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
    
    const newTest: TestCase = {
      id: Date.now().toString(),
      test_id: `AD${String(testCases.length + 1).padStart(4, '0')}`,
      suite_id: activeSuite,
      title: newTestName,
      description: '',
      status: 'pending'
    };
    
    setTestCases([...testCases, newTest]);
    setNewTestName('');
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
  };

  const getUserIcon = () => {
    if (user?.role === 'admin') {
      return <Crown className="h-5 w-5 text-yellow-400" />;
    }
    return <UserRound className="h-5 w-5 text-blue-400" />;
  };

  const getSuiteBadgeStyle = (suite: TestSuite) => {
    if (suite.failedTests > 0) {
      return 'bg-red-600 text-white';
    }
    if (suite.openTests === 0 && suite.totalTests === suite.passedTests) {
      return 'bg-green-600 text-white';
    }
    return 'bg-cyan-600 text-white';
  };

  const getSuiteBadgeContent = (suite: TestSuite) => {
    if (suite.failedTests > 0) {
      return (
        <div className="flex items-center space-x-1">
          <X className="h-3 w-3" />
          <span>{suite.failedTests}</span>
          {suite.openTests > 0 && (
            <>
              <span className="mx-1">•</span>
              <div className="flex items-center space-x-1 bg-blue-500 rounded-full px-1.5 py-0.5">
                <span className="text-xs">{suite.openTests}</span>
              </div>
            </>
          )}
        </div>
      );
    }
    if (suite.openTests === 0 && suite.totalTests === suite.passedTests) {
      return <Check className="h-4 w-4" />;
    }
    return suite.totalTests;
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
        <div className="w-64 bg-[#282C34] border-r border-gray-700 flex flex-col">
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
                    : suite.failedTests > 0 
                    ? 'border-red-500'
                    : 'border-transparent'
                }`}
              >
                <div className="flex items-center flex-1">
                  {getIconComponent(suite.icon)}
                  <span className="ml-3 text-sm">{suite.name}</span>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold flex items-center ${getSuiteBadgeStyle(suite)}`}>
                  {getSuiteBadgeContent(suite)}
                </span>
              </button>
            ))}
          </div>
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
                          title="Test bestanden"
                        >
                          ✓ Bestanden
                        </button>
                        
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
                          title="Test fehlgeschlagen"
                        >
                          ✗ Fehlgeschlagen
                        </button>
                        
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
                          title="In Arbeit"
                        >
                          ⚠ In Arbeit
                        </button>
                        
                        <button
                          onClick={() => {
                            const updated = testCases.map(t => 
                              t.id === test.id ? { ...t, status: 'pending' as const } : t
                            );
                            setTestCases(updated);
                          }}
                          className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                            test.status === 'pending' 
                              ? 'bg-blue-600 text-white shadow-md' 
                              : 'bg-blue-200 text-blue-800 hover:bg-blue-300'
                          }`}
                          title="Test übersprungen"
                        >
                          ↻ Übersprungen
                        </button>
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
                      <button 
                        onClick={() => {
                          setSelectedTest(test);
                          setShowEditModal(true);
                        }}
                        className="p-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors" 
                        title="Bearbeiten"
                      >
                        <Edit className="h-4 w-4 text-white" />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedTest(test);
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
                  ↻ ({statusCounts.pending})
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
                <label className="block text-sm font-medium mb-2">Beschreibung</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white text-sm focus:border-cyan-500 focus:outline-none"
                  rows={4}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button onClick={() => setShowEditModal(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">
                  Abbrechen
                </button>
                <button 
                  onClick={() => {
                    const updated = testCases.map(t => 
                      t.id === selectedTest.id ? { ...t, description: editDescription } : t
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
                defaultValue={selectedTest.note}
                className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white text-sm focus:border-cyan-500 focus:outline-none"
                rows={5}
                placeholder="Notiz eingeben..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowNoteModal(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">
                Abbrechen
              </button>
              <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-sm">
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
