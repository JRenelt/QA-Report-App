import React, { useState, useEffect } from 'react';
import { Building2, FolderOpen, TestTube, Plus, Eye, Edit, Trash2, Users, Calendar, CheckCircle } from 'lucide-react';
import TestSuiteManager from './TestSuiteManager';

interface Company {
  id: number;
  name: string;
  description?: string;
  logo_url?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: number;
  name: string;
  description?: string;
  template_type: string;
  status: string;
  company_id: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

interface TestSuite {
  id: number;
  name: string;
  description?: string;
  icon: string;
  sort_order: number;
  project_id: number;
  created_at: string;
}

interface DashboardProps {
  authToken: string;
  currentUser: any;
  language: 'de' | 'en';
}

const Dashboard: React.FC<DashboardProps> = ({ authToken, currentUser, language }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'companies' | 'projects' | 'testSuites'>('companies');
  const [selectedTestSuite, setSelectedTestSuite] = useState<TestSuite | null>(null);

  const translations = {
    de: {
      dashboard: 'Dashboard',
      companies: 'Firmen',
      projects: 'Projekte',
      testSuites: 'Test-Suiten',
      loading: 'Lädt...',
      noData: 'Keine Daten verfügbar',
      addNew: 'Neu hinzufügen',
      view: 'Anzeigen',
      edit: 'Bearbeiten',
      delete: 'Löschen',
      created: 'Erstellt',
      status: 'Status',
      active: 'Aktiv',
      archived: 'Archiviert',
      draft: 'Entwurf',
      description: 'Beschreibung',
      actions: 'Aktionen',
      templateType: 'Vorlage-Typ',
      webAppQa: 'Web-App QA',
      mobileAppQa: 'Mobile-App QA',
      apiTesting: 'API-Tests',
      custom: 'Benutzerdefiniert'
    },
    en: {
      dashboard: 'Dashboard',
      companies: 'Companies',
      projects: 'Projects',
      testSuites: 'Test Suites',
      loading: 'Loading...',
      noData: 'No data available',
      addNew: 'Add New',
      view: 'View',
      edit: 'Edit',
      delete: 'Delete',
      created: 'Created',
      status: 'Status',
      active: 'Active',
      archived: 'Archived',
      draft: 'Draft',
      description: 'Description',
      actions: 'Actions',
      templateType: 'Template Type',
      webAppQa: 'Web App QA',
      mobileAppQa: 'Mobile App QA',
      apiTesting: 'API Testing',
      custom: 'Custom'
    }
  };

  const t = translations[language];

  useEffect(() => {
    loadData();
  }, [authToken]);

  const loadData = async () => {
    setLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8002';
      const headers = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      };

      // Load companies
      const companiesResponse = await fetch(`${backendUrl}/api/companies/`, { headers });
      if (companiesResponse.ok) {
        const companiesData = await companiesResponse.json();
        setCompanies(companiesData);
      }

      // Load projects  
      const projectsResponse = await fetch(`${backendUrl}/api/projects/`, { headers });
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData);
      }

      // Load test suites
      const testSuitesResponse = await fetch(`${backendUrl}/api/test-suites/`, { headers });
      if (testSuitesResponse.ok) {
        const testSuitesData = await testSuitesResponse.json();
        setTestSuites(testSuitesData);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getTemplateTypeLabel = (type: string) => {
    switch (type) {
      case 'web_app_qa': return t.webAppQa;
      case 'mobile_app_qa': return t.mobileAppQa;
      case 'api_testing': return t.apiTesting;
      default: return t.custom;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-qa-primary-600"></div>
        <span className="ml-2 text-qa-gray-600">{t.loading}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-qa-gray-900 mb-2">{t.dashboard}</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center p-4 bg-qa-primary-50 rounded-lg">
            <Building2 className="h-8 w-8 text-qa-primary-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-qa-primary-900">{companies.length}</div>
              <div className="text-sm text-qa-primary-700">{t.companies}</div>
            </div>
          </div>
          <div className="flex items-center p-4 bg-green-50 rounded-lg">
            <FolderOpen className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-green-900">{projects.length}</div>
              <div className="text-sm text-green-700">{t.projects}</div>
            </div>
          </div>
          <div className="flex items-center p-4 bg-purple-50 rounded-lg">
            <TestTube className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-purple-900">{testSuites.length}</div>
              <div className="text-sm text-purple-700">{t.testSuites}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-qa-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('companies')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'companies'
                  ? 'border-qa-primary-500 text-qa-primary-600'
                  : 'border-transparent text-qa-gray-500 hover:text-qa-gray-700 hover:border-qa-gray-300'
              }`}
            >
              <Building2 className="inline h-4 w-4 mr-2" />
              {t.companies}
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'projects'
                  ? 'border-qa-primary-500 text-qa-primary-600'
                  : 'border-transparent text-qa-gray-500 hover:text-qa-gray-700 hover:border-qa-gray-300'
              }`}
            >
              <FolderOpen className="inline h-4 w-4 mr-2" />
              {t.projects}
            </button>
            <button
              onClick={() => setActiveTab('testSuites')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'testSuites'
                  ? 'border-qa-primary-500 text-qa-primary-600'
                  : 'border-transparent text-qa-gray-500 hover:text-qa-gray-700 hover:border-qa-gray-300'
              }`}
            >
              <TestTube className="inline h-4 w-4 mr-2" />
              {t.testSuites}
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'companies' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-qa-gray-900">{t.companies}</h2>
                <button className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  {t.addNew}
                </button>
              </div>
              
              {companies.length === 0 ? (
                <p className="text-qa-gray-500">{t.noData}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-qa-gray-200">
                    <thead className="bg-qa-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-qa-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-qa-gray-500 uppercase tracking-wider">
                          {t.description}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-qa-gray-500 uppercase tracking-wider">
                          {t.created}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-qa-gray-500 uppercase tracking-wider">
                          {t.actions}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-qa-gray-200">
                      {companies.map((company) => (
                        <tr key={company.id} className="hover:bg-qa-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-qa-gray-900">{company.name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-qa-gray-500">
                              {company.description || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-qa-gray-500">
                            {formatDate(company.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button className="text-qa-primary-600 hover:text-qa-primary-900">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="text-yellow-600 hover:text-yellow-900">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'projects' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-qa-gray-900">{t.projects}</h2>
                <button className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  {t.addNew}
                </button>
              </div>
              
              {projects.length === 0 ? (
                <p className="text-qa-gray-500">{t.noData}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map((project) => (
                    <div key={project.id} className="card p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-qa-gray-900">{project.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                          {project.status === 'active' ? t.active : project.status === 'archived' ? t.archived : t.draft}
                        </span>
                      </div>
                      <p className="text-sm text-qa-gray-600 mb-3">
                        {project.description || '-'}
                      </p>
                      <div className="text-xs text-qa-gray-500 mb-3">
                        <div><strong>{t.templateType}:</strong> {getTemplateTypeLabel(project.template_type)}</div>
                        <div><strong>{t.created}:</strong> {formatDate(project.created_at)}</div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="flex-1 btn-secondary text-xs py-1">
                          <Eye className="h-3 w-3 mr-1" />
                          {t.view}
                        </button>
                        <button className="flex-1 btn-secondary text-xs py-1">
                          <Edit className="h-3 w-3 mr-1" />
                          {t.edit}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'testSuites' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-qa-gray-900">{t.testSuites}</h2>
                <button className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  {t.addNew}
                </button>
              </div>
              
              {testSuites.length === 0 ? (
                <p className="text-qa-gray-500">{t.noData}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {testSuites.map((testSuite) => (
                    <div key={testSuite.id} className="card p-4 hover:shadow-md transition-shadow">
                      <div className="text-center">
                        <div className="text-3xl mb-2">{testSuite.icon}</div>
                        <h3 className="font-semibold text-qa-gray-900 mb-1">{testSuite.name}</h3>
                        <p className="text-xs text-qa-gray-600 mb-3">
                          {testSuite.description || '-'}
                        </p>
                        <div className="text-xs text-qa-gray-500 mb-3">
                          {formatDate(testSuite.created_at)}
                        </div>
                        <button className="w-full btn-secondary text-xs py-1">
                          <TestTube className="h-3 w-3 mr-1" />
                          Tests verwalten
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;