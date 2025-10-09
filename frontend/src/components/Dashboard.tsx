import React, { useState, useEffect } from 'react';
import { 
  Building, Plus, Settings, FileText, Download, Upload, 
  Search, Eye, Trash2, Edit, FolderOpen, TestTube, 
  CheckCircle, XCircle, AlertTriangle, Clock, Users
} from 'lucide-react';

interface Company {
  id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  company_id: string;
  description: string;
  created_at: string;
}

interface TestSuite {
  id: string;
  name: string;
  project_id: string;
  description: string;
  created_at: string;
}

interface TestCase {
  id: string;
  test_id: string;
  title: string;
  description: string;
  status: string;
  test_suite_id: string;
}

interface DashboardProps {
  authToken: string;
  user: any;
  darkMode: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ authToken, user, darkMode }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedTestSuite, setSelectedTestSuite] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'projects' | 'tests'>('overview');
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const API_BASE = process.env.REACT_APP_BACKEND_URL;

  // API-Anfragen
  const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`${API_BASE}/api${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    return response;
  };

  // Daten laden
  const loadCompanies = async () => {
    try {
      const response = await apiRequest('/companies/');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Firmen:', error);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await apiRequest('/projects/');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Projekte:', error);
    }
  };

  const loadTestSuites = async (projectId: string) => {
    try {
      const response = await apiRequest(`/test-suites/?project_id=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setTestSuites(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Test-Suites:', error);
    }
  };

  const loadTestCases = async (testSuiteId: string) => {
    try {
      const response = await apiRequest(`/test-cases/?test_suite_id=${testSuiteId}`);
      if (response.ok) {
        const data = await response.json();
        setTestCases(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Test Cases:', error);
    }
  };

  // Testdaten generieren
  const generateTestData = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/admin/generate-test-data', {
        method: 'POST',
        body: JSON.stringify({
          companies: 3,
          testsPerCompany: 15
        })
      });
      
      if (response.ok) {
        alert('Testdaten erfolgreich generiert!');
        await loadCompanies();
        await loadProjects();
        setShowGenerateModal(false);
      } else {
        alert('Fehler beim Generieren der Testdaten');
      }
    } catch (error) {
      console.error('Fehler bei der Testdaten-Generierung:', error);
      alert('Fehler beim Generieren der Testdaten');
    } finally {
      setLoading(false);
    }
  };

  // PDF Export
  const exportPDF = async () => {
    if (!selectedProject) {
      alert('Bitte wählen Sie ein Projekt aus');
      return;
    }
    
    try {
      const response = await apiRequest(`/pdf-reports/generate/${selectedProject}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `QA-Bericht-${selectedProject}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Fehler beim PDF-Export');
      }
    } catch (error) {
      console.error('PDF-Export Fehler:', error);
      alert('Fehler beim PDF-Export');
    }
  };

  // CSV Export
  const exportCSV = async () => {
    if (!selectedProject) {
      alert('Bitte wählen Sie ein Projekt aus');
      return;
    }
    
    try {
      const response = await apiRequest(`/import-export/export-excel/${selectedProject}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `QA-Daten-${selectedProject}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Fehler beim CSV-Export');
      }
    } catch (error) {
      console.error('CSV-Export Fehler:', error);
      alert('Fehler beim CSV-Export');
    }
  };

  // UseEffect für Datenladung
  useEffect(() => {
    loadCompanies();
    loadProjects();
  }, [authToken]);

  useEffect(() => {
    if (selectedProject) {
      loadTestSuites(selectedProject);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (selectedTestSuite) {
      loadTestCases(selectedTestSuite);
    }
  }, [selectedTestSuite]);

  // Status-Farben für Tests
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-500';
      case 'error': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'error': return <XCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Navigation Tabs */}
      <div className="border-b border-gray-700 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Übersicht', icon: <Eye className="h-5 w-5" /> },
            { id: 'companies', label: 'Firmen', icon: <Building className="h-5 w-5" /> },
            { id: 'projects', label: 'Projekte', icon: <FolderOpen className="h-5 w-5" /> },
            { id: 'tests', label: 'Tests', icon: <TestTube className="h-5 w-5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-cyan-500 text-cyan-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Aktionen-Toolbar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className={`px-3 py-2 rounded-lg border ${
              darkMode 
                ? 'bg-gray-800 border-gray-600 text-white' 
                : 'bg-white border-gray-300'
            }`}
          >
            <option value="">Firma auswählen...</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>

          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className={`px-3 py-2 rounded-lg border ${
              darkMode 
                ? 'bg-gray-800 border-gray-600 text-white' 
                : 'bg-white border-gray-300'
            }`}
            disabled={!selectedCompany}
          >
            <option value="">Projekt auswählen...</option>
            {projects
              .filter(p => p.company_id === selectedCompany)
              .map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
          </select>

          <select
            value={selectedTestSuite}
            onChange={(e) => setSelectedTestSuite(e.target.value)}
            className={`px-3 py-2 rounded-lg border ${
              darkMode 
                ? 'bg-gray-800 border-gray-600 text-white' 
                : 'bg-white border-gray-300'
            }`}
            disabled={!selectedProject}
          >
            <option value="">Test Suite auswählen...</option>
            {testSuites.map((suite) => (
              <option key={suite.id} value={suite.id}>
                {suite.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowGenerateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>Testdaten</span>
            </button>
          )}

          <button
            onClick={exportPDF}
            disabled={!selectedProject}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-lg text-white text-sm font-medium"
          >
            <FileText className="h-4 w-4" />
            <span>PDF Export</span>
          </button>

          <button
            onClick={exportCSV}
            disabled={!selectedProject}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 rounded-lg text-white text-sm font-medium"
          >
            <Download className="h-4 w-4" />
            <span>CSV Export</span>
          </button>
        </div>
      </div>

      {/* Content basierend auf aktivem Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <div className="flex items-center">
              <Building className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium">Firmen</p>
                <p className="text-2xl font-bold">{companies.length}</p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <div className="flex items-center">
              <FolderOpen className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium">Projekte</p>
                <p className="text-2xl font-bold">{projects.length}</p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <div className="flex items-center">
              <TestTube className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium">Test Cases</p>
                <p className="text-2xl font-bold">{testCases.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'companies' && (
        <div className="space-y-4">
          {companies.map((company) => (
            <div key={company.id} className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
              <h3 className="text-lg font-semibold">{company.name}</h3>
              <p className="text-sm text-gray-500">{company.contact_person} • {company.email}</p>
              <p className="text-sm text-gray-500">{company.address}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="space-y-4">
          {projects.map((project) => {
            const company = companies.find(c => c.id === project.company_id);
            return (
              <div key={project.id} className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
                <h3 className="text-lg font-semibold">{project.name}</h3>
                <p className="text-sm text-gray-500">Firma: {company?.name || 'Unbekannt'}</p>
                <p className="text-sm text-gray-600 mt-2">{project.description}</p>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'tests' && (
        <div className="space-y-4">
          {testCases.map((testCase) => (
            <div key={testCase.id} className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{testCase.test_id}</h3>
                  <p className="text-sm font-medium">{testCase.title}</p>
                  <p className="text-sm text-gray-500 mt-1">{testCase.description}</p>
                </div>
                <div className={`flex items-center space-x-1 ${getStatusColor(testCase.status)}`}>
                  {getStatusIcon(testCase.status)}
                  <span className="text-sm font-medium">{testCase.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Testdaten Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} w-full max-w-md`}>
            <h3 className="text-lg font-bold mb-4">Testdaten generieren</h3>
            <p className="text-sm text-gray-500 mb-6">
              Generiert 3 Demo-Firmen mit jeweils 15 Tests für Demonstrationszwecke.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 rounded-lg text-white text-sm"
              >
                Abbrechen
              </button>
              <button
                onClick={generateTestData}
                disabled={loading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 rounded-lg text-white text-sm"
              >
                {loading ? 'Generiert...' : 'Generieren'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;