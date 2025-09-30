import React, { useState, useEffect } from 'react';
import { ChevronDown, User, Building2, FolderOpen, TestTube, CheckCircle, XCircle, Clock, LogOut } from 'lucide-react';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import './App.css';

interface HealthStatus {
  status: 'healthy' | 'error' | 'loading';
  app?: string;
  version?: string;
  error?: string;
}

const SystemStatus: React.FC<{ authToken: string | null }> = ({ authToken }) => {
  const [backendHealth, setBackendHealth] = useState<HealthStatus>({ status: 'loading' });

  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8002';
        const response = await fetch(`${backendUrl}/health`);
        const data = await response.json();
        
        if (response.ok) {
          setBackendHealth({
            status: 'healthy',
            app: data.app,
            version: data.version
          });
        } else {
          setBackendHealth({
            status: 'error',
            error: `HTTP ${response.status}`
          });
        }
      } catch (error) {
        setBackendHealth({
          status: 'error',
          error: error instanceof Error ? error.message : 'Connection failed'
        });
      }
    };

    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'loading':
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-400';
      case 'error':
        return 'bg-red-400';
      case 'loading':
      default:
        return 'bg-yellow-400';
    }
  };

  return (
    <div className="mt-12 bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-qa-gray-900">
          System Status
        </h3>
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`h-2 w-2 rounded-full ${getStatusColor(backendHealth.status)}`}></div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-qa-gray-700">
                  Backend: {backendHealth.status === 'healthy' ? 'Connected' : 
                           backendHealth.status === 'error' ? 'Error' : 'Connecting...'}
                </p>
                {backendHealth.app && (
                  <p className="text-xs text-qa-gray-500">
                    {backendHealth.app} v{backendHealth.version}
                  </p>
                )}
                {backendHealth.error && (
                  <p className="text-xs text-red-500">
                    {backendHealth.error}
                  </p>
                )}
              </div>
            </div>
            <div className="flex-shrink-0">
              {getStatusIcon(backendHealth.status)}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-2 w-2 bg-green-400 rounded-full"></div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-qa-gray-700">
                  Database: SQLite (Development)
                </p>
              </div>
            </div>
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-2 w-2 bg-green-400 rounded-full"></div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-qa-gray-700">
                  Frontend: React + Tailwind CSS
                </p>
              </div>
            </div>
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [currentLanguage, setCurrentLanguage] = useState<'de' | 'en'>('de');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Check for existing authentication on app load
  useEffect(() => {
    const savedToken = localStorage.getItem('qa_token');
    const savedUser = localStorage.getItem('qa_user');
    
    if (savedToken && savedUser) {
      setAuthToken(savedToken);
      setCurrentUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
      setCurrentLanguage(JSON.parse(savedUser).language_preference?.toLowerCase() || 'de');
    }
  }, []);

  const translations = {
    de: {
      appTitle: 'QA-Report-App',
      dashboard: 'Dashboard',
      companies: 'Firmen',
      projects: 'Projekte', 
      testSuites: 'Test-Suiten',
      reports: 'Berichte',
      archive: 'Archiv',
      settings: 'Einstellungen',
      logout: 'Abmelden',
      welcome: 'Willkommen bei der QA-Report-App',
      subtitle: 'Verwalten Sie Ihre Qualitätssicherungs-Berichte effizient',
      getStarted: 'Loslegen',
      selectCompany: 'Firma auswählen',
      createProject: 'Projekt erstellen',
      manageTests: 'Tests verwalten'
    },
    en: {
      appTitle: 'QA-Report-App',
      dashboard: 'Dashboard',
      companies: 'Companies',
      projects: 'Projects',
      testSuites: 'Test Suites', 
      reports: 'Reports',
      archive: 'Archive',
      settings: 'Settings',
      logout: 'Logout',
      welcome: 'Welcome to QA-Report-App',
      subtitle: 'Manage your quality assurance reports efficiently',
      getStarted: 'Get Started',
      selectCompany: 'Select Company',
      createProject: 'Create Project',
      manageTests: 'Manage Tests'
    }
  };

  const t = translations[currentLanguage];

  const toggleLanguage = () => {
    setCurrentLanguage(prev => prev === 'de' ? 'en' : 'de');
  };

  const handleLogin = (token: string, user: any) => {
    setAuthToken(token);
    setCurrentUser(user);
    setIsAuthenticated(true);
    setCurrentLanguage(user.language_preference?.toLowerCase() || 'de');
  };

  const handleLogout = () => {
    localStorage.removeItem('qa_token');
    localStorage.removeItem('qa_user');
    setAuthToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} language={currentLanguage} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-qa-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <TestTube className="h-8 w-8 text-qa-primary-600" />
                <span className="ml-2 text-xl font-bold text-qa-gray-900">{t.appTitle}</span>
              </div>
              
              {/* Main Navigation */}
              <div className="hidden md:ml-8 md:flex md:space-x-8">
                <button className="nav-link-active border-b-2 border-qa-primary-600 py-2 px-1 text-sm">
                  {t.dashboard}
                </button>
                <button className="nav-link py-2 px-1 text-sm">
                  {t.companies}
                </button>
                <button className="nav-link py-2 px-1 text-sm">
                  {t.projects}
                </button>
                <button className="nav-link py-2 px-1 text-sm">
                  {t.testSuites}
                </button>
                <button className="nav-link py-2 px-1 text-sm">
                  {t.reports}
                </button>
                <button className="nav-link py-2 px-1 text-sm">
                  {t.archive}
                </button>
              </div>
            </div>

            {/* Right side navigation */}
            <div className="flex items-center space-x-4">
              {/* Language Toggle */}
              <button 
                onClick={toggleLanguage}
                className="text-sm font-medium text-qa-gray-600 hover:text-qa-primary-600 bg-qa-gray-100 px-3 py-1 rounded-md transition-colors"
              >
                {currentLanguage.toUpperCase()}
              </button>

              {/* User Menu */}
              <div className="relative flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-qa-gray-400" />
                  <div className="text-sm">
                    <div className="font-medium text-qa-gray-900">
                      {currentUser?.first_name} {currentUser?.last_name}
                    </div>
                    <div className="text-qa-gray-500">
                      {currentUser?.role === 'admin' ? 'Administrator' : 
                       currentUser?.role === 'qa_tester' ? 'QA-Tester' : 'Reviewer'}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="flex items-center text-qa-gray-400 hover:text-red-600 transition-colors"
                  title={currentLanguage === 'de' ? 'Abmelden' : 'Logout'}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Dashboard */}
        <div className="px-4 py-6 sm:px-0">
          <Dashboard 
            authToken={authToken!} 
            currentUser={currentUser} 
            language={currentLanguage} 
          />
        </div>

        {/* Status Section */}
        <SystemStatus authToken={authToken} />
      </main>
    </div>
  );
}

export default App;
