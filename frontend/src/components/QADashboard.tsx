import React, { useState, useEffect } from 'react';
import { Monitor, Tablet, Smartphone, Wrench, Moon, FileText, Palette, Menu, Plus, Check, X, AlertTriangle, RotateCcw, Edit, MessageSquare, Trash2, Save, FileDown, Archive } from 'lucide-react';

interface QADashboardProps {
  authToken: string;
  user?: any;
  darkMode?: boolean;
}

interface TestSuite {
  id: string;
  name: string;
  icon: string;
  count: number;
}

interface TestCase {
  id: string;
  test_id: string;
  suite_id: string;
  name: string;
  description: string;
  status: {
    desktop: 'success' | 'error' | 'warning' | 'pending';
    tablet: 'success' | 'error' | 'warning' | 'pending';
    mobile: 'success' | 'error' | 'warning' | 'pending';
    technical: 'success' | 'error' | 'warning' | 'pending';
  };
}

const QADashboard: React.FC<QADashboardProps> = ({ authToken, user, darkMode = true }) => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([
    { id: '1', name: 'Allgemeines Design', icon: 'palette', count: 8 },
    { id: '2', name: 'Testpunkt Kopfzeile', icon: 'menu', count: 16 },
    { id: '3', name: 'Navigation Bereich', icon: 'navigation', count: 4 },
    { id: '4', name: 'Suchfeld Bereich', icon: 'search', count: 6 },
    { id: '5', name: 'Sidebar Bereich', icon: 'sidebar', count: 8 },
    { id: '6', name: 'Hauptinhalt Bereich', icon: 'file', count: 8 },
    { id: '7', name: 'Footer Bereich', icon: 'footer', count: 9 },
    { id: '8', name: 'Dialoge und Modale', icon: 'dialog', count: 7 },
    { id: '9', name: 'Formular Eingaben', icon: 'form', count: 6 },
    { id: '10', name: 'Loading und Feedback', icon: 'loading', count: 5 },
    { id: '11', name: 'Responsive Design', icon: 'responsive', count: 4 },
  ]);

  const [activeSuite, setActiveSuite] = useState<string>('1');
  const [testCases, setTestCases] = useState<TestCase[]>([
    {
      id: '1',
      test_id: 'AD0001',
      suite_id: '1',
      name: 'Desktop Darstellung',
      description: 'Korrekte Darstellung auf Desktop-Bildschirmen',
      status: { desktop: 'success', tablet: 'success', mobile: 'warning', technical: 'pending' }
    },
    {
      id: '2',
      test_id: 'AD0002',
      suite_id: '1',
      name: 'Tablet Darstellung',
      description: 'Responsive Darstellung auf Tablet-Geräten',
      status: { desktop: 'success', tablet: 'error', mobile: 'warning', technical: 'success' }
    },
    {
      id: '3',
      test_id: 'AD0003',
      suite_id: '1',
      name: 'Mobile Darstellung',
      description: 'Mobile-optimierte Darstellung',
      status: { desktop: 'success', tablet: 'success', mobile: 'success', technical: 'warning' }
    },
    {
      id: '4',
      test_id: 'AD0004',
      suite_id: '1',
      name: 'Responsive Breakpoints',
      description: 'Übergänge zwischen verschiedenen Bildschirmgrößen',
      status: { desktop: 'success', tablet: 'warning', mobile: 'warning', technical: 'pending' }
    },
    {
      id: '5',
      test_id: 'AD0005',
      suite_id: '1',
      name: 'Dark Theme Konsistenz',
      description: 'Konsistente Darstellung im Dark Mode',
      status: { desktop: 'success', tablet: 'success', mobile: 'success', technical: 'success' }
    },
  ]);

  const [selectedTest, setSelectedTest] = useState<TestCase | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'error' | 'warning' | 'pending'>('all');

  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: any } = {
      palette: Palette,
      menu: Menu,
      file: FileText,
      form: FileText,
    };
    const IconComponent = icons[iconName] || FileText;
    return <IconComponent className="h-5 w-5" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'error':
        return <X className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'pending':
      default:
        return <RotateCcw className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTestIcon = (testId: string) => {
    if (testId.includes('AD0001')) return <Monitor className="h-5 w-5 text-cyan-400" />;
    if (testId.includes('AD0002')) return <Tablet className="h-5 w-5 text-purple-400" />;
    if (testId.includes('AD0003')) return <Smartphone className="h-5 w-5 text-blue-400" />;
    if (testId.includes('AD0004')) return <Wrench className="h-5 w-5 text-orange-400" />;
    if (testId.includes('AD0005')) return <Moon className="h-5 w-5 text-yellow-400" />;
    return <FileText className="h-5 w-5 text-gray-400" />;
  };

  const filteredTests = testCases.filter(test => {
    if (test.suite_id !== activeSuite) return false;
    if (filterStatus === 'all') return true;
    return Object.values(test.status).includes(filterStatus);
  });

  const openTests = testSuites.reduce((sum, suite) => sum + suite.count, 0);
  const currentSuiteTests = testSuites.find(s => s.id === activeSuite)?.count || 0;

  const statusCounts = {
    all: filteredTests.length,
    success: filteredTests.filter(t => Object.values(t.status).every(s => s === 'success')).length,
    error: filteredTests.filter(t => Object.values(t.status).some(s => s === 'error')).length,
    warning: filteredTests.filter(t => Object.values(t.status).some(s => s === 'warning')).length,
    pending: filteredTests.filter(t => Object.values(t.status).some(s => s === 'pending')).length,
  };

  return (
    <div className="flex h-screen bg-[#1E222B] text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-[#282C34] border-r border-gray-700 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-cyan-400 font-bold text-lg flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Test-Bereiche
          </h2>
          <button className="mt-3 w-full px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded flex items-center justify-center text-sm font-medium transition-colors">
            {openTests} offen
          </button>
        </div>

        {/* Test Suites List */}
        <div className="flex-1 overflow-y-auto">
          {testSuites.map((suite) => (
            <button
              key={suite.id}
              onClick={() => setActiveSuite(suite.id)}
              className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-700 transition-colors ${
                activeSuite === suite.id ? 'bg-cyan-600 bg-opacity-20 border-l-4 border-cyan-400' : ''
              }`}
            >
              <div className="flex items-center">
                {getIconComponent(suite.icon)}
                <span className="ml-3 text-sm">{suite.name}</span>
              </div>
              <span className="bg-cyan-600 text-white rounded-full px-2 py-1 text-xs font-bold">
                {suite.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Content Header */}
        <div className="bg-[#282C34] border-b border-gray-700 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-cyan-400 text-xl font-bold">
              {testSuites.find(s => s.id === activeSuite)?.name}
            </h1>
            <span className="bg-blue-600 text-white rounded-full px-3 py-1 text-sm font-bold">
              {currentSuiteTests} Tests
            </span>
          </div>
          <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded flex items-center text-sm font-medium transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            Test erstellen
          </button>
        </div>

        {/* Test Cases List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {filteredTests.map((test) => (
              <div
                key={test.id}
                className="bg-[#2C313A] border border-gray-700 rounded-lg p-4 hover:border-cyan-500 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="mt-1">
                      {getTestIcon(test.test_id)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-cyan-400 font-mono text-sm">{test.test_id}</span>
                        <span className="text-white font-medium">{test.name}</span>
                      </div>
                      <p className="text-gray-400 text-sm mb-3">{test.description}</p>
                      
                      {/* Status Icons */}
                      <div className="flex space-x-2">
                        <div className="flex items-center space-x-1 px-2 py-1 bg-gray-800 rounded">
                          <Monitor className="h-3 w-3 text-gray-400" />
                          {getStatusIcon(test.status.desktop)}
                        </div>
                        <div className="flex items-center space-x-1 px-2 py-1 bg-gray-800 rounded">
                          <Tablet className="h-3 w-3 text-gray-400" />
                          {getStatusIcon(test.status.tablet)}
                        </div>
                        <div className="flex items-center space-x-1 px-2 py-1 bg-gray-800 rounded">
                          <Smartphone className="h-3 w-3 text-gray-400" />
                          {getStatusIcon(test.status.mobile)}
                        </div>
                        <div className="flex items-center space-x-1 px-2 py-1 bg-gray-800 rounded">
                          <Wrench className="h-3 w-3 text-gray-400" />
                          {getStatusIcon(test.status.technical)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 ml-4">
                    <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors" title="Bearbeiten">
                      <Edit className="h-4 w-4 text-blue-400" />
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedTest(test);
                        setShowNoteModal(true);
                      }}
                      className="p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors" 
                      title="Notiz"
                    >
                      <MessageSquare className="h-4 w-4 text-blue-400" />
                    </button>
                    <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors" title="Reset">
                      <RotateCcw className="h-4 w-4 text-blue-400" />
                    </button>
                    <button className="p-2 bg-red-600 hover:bg-red-700 rounded transition-colors" title="Löschen">
                      <Trash2 className="h-4 w-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#282C34] border-t border-gray-700 p-3">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  filterStatus === 'all' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Alle ({statusCounts.all})
              </button>
              <button
                onClick={() => setFilterStatus('success')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  filterStatus === 'success' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                ✓ ({statusCounts.success})
              </button>
              <button
                onClick={() => setFilterStatus('error')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  filterStatus === 'error' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                ✗ ({statusCounts.error})
              </button>
              <button
                onClick={() => setFilterStatus('warning')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  filterStatus === 'warning' ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                ⚠ ({statusCounts.warning})
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  filterStatus === 'pending' ? 'bg-gray-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                ↻ ({statusCounts.pending})
              </button>
            </div>

            <div className="flex space-x-2">
              <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-sm rounded transition-colors flex items-center">
                <Save className="h-4 w-4 mr-1" />
                Test speichern
              </button>
              <button className="px-3 py-1 bg-green-700 hover:bg-green-600 text-sm rounded transition-colors flex items-center">
                <FileDown className="h-4 w-4 mr-1" />
                QA-Bericht (Alle)
              </button>
              <button className="px-3 py-1 bg-green-600 hover:bg-green-500 text-sm rounded transition-colors flex items-center">
                <FileDown className="h-4 w-4 mr-1" />
                QA-Bericht (Geprüft)
              </button>
              <button className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-sm rounded transition-colors flex items-center">
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Note Modal */}
      {showNoteModal && selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#2C313A] rounded-lg p-6 w-full max-w-md border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-cyan-400">Notiz hinzufügen</h3>
              <button 
                onClick={() => setShowNoteModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">Test: {selectedTest.test_id} - {selectedTest.name}</p>
              <textarea
                className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white text-sm focus:border-cyan-500 focus:outline-none"
                rows={5}
                placeholder="Notiz eingeben..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => setShowNoteModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
              >
                Abbrechen
              </button>
              <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-sm transition-colors">
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QADashboard;
