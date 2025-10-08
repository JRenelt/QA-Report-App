import React, { useState, useEffect, createContext, useContext } from 'react';
import { Sun, Moon, CheckCircle, XCircle, Clock, Settings, HelpCircle } from 'lucide-react';
import LoginForm from './components/LoginForm';
import QADashboardV2 from './components/QADashboardV2';
import SettingsModal from './components/SettingsModal';
import HelpModal from './components/HelpModal';
import './App.css';

// Dark Mode Context
const DarkModeContext = createContext<{
  darkMode: boolean;
  toggleDarkMode: () => void;
}>({
  darkMode: false,
  toggleDarkMode: () => {},
});

export const useDarkMode = () => useContext(DarkModeContext);

interface HealthStatus {
  status: 'healthy' | 'error' | 'loading';
  app?: string;
  version?: string;
  database?: string;
  error?: string;
}

// Fixed Header Component
const Header: React.FC<{ 
  darkMode: boolean; 
  toggleDarkMode: () => void; 
  user: any; 
  onLogout: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
}> = ({ 
  darkMode, 
  toggleDarkMode, 
  user, 
  onLogout,
  onOpenSettings,
  onOpenHelp
}) => {
  return (
    <header className={`fixed top-0 left-0 right-0 z-50 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b shadow-sm`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              QA-Report-App
            </h1>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Help Button - Only when logged in */}
            {user && (
              <button
                onClick={onOpenHelp}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                title="Hilfe & Dokumentation"
              >
                <HelpCircle className="h-5 w-5" />
              </button>
            )}

            {/* Settings Button - Only when logged in */}
            {user && (
              <button
                onClick={onOpenSettings}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                title="Systemeinstellungen"
              >
                <Settings className="h-5 w-5" />
              </button>
            )}

            {/* Dark Mode Toggle - Only when logged in */}
            {user && (
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                title={darkMode ? 'Helles Design' : 'Dunkles Design'}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            )}

            {/* User Info */}
            {user && (
              <div className={`flex items-center space-x-3 px-3 py-2 rounded-lg ${
                darkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                  {user.username}
                </span>
                <button
                  onClick={onLogout}
                  className={`text-sm ${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
                >
                  Abmelden
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// Fixed Footer Component
const Footer: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className={`fixed bottom-0 left-0 right-0 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12">
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            © {currentYear} QA-Report-App. Alle Rechte vorbehalten.
          </div>
          <div className="flex space-x-6">
            <a 
              href="#impressum" 
              className={`text-sm ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
            >
              Impressum
            </a>
            <a 
              href="#datenschutz" 
              className={`text-sm ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
            >
              Datenschutz
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

// System Status Component
const SystemStatus: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
  const [backendHealth, setBackendHealth] = useState<HealthStatus>({ status: 'loading' });

  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL;
        const response = await fetch(`${backendUrl}/health`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        setBackendHealth({
          status: 'healthy',
          app: data.app,
          version: data.version,
          database: data.database || 'MongoDB'
        });
      } catch (error) {
        setBackendHealth({
          status: 'error',
          error: error instanceof Error ? error.message : 'Verbindung fehlgeschlagen'
        });
      }
    };

    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'loading':
      default:
        return 'bg-yellow-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'loading':
      default:
        return <Clock className="h-5 w-5 text-yellow-500 animate-spin" />;
    }
  };

  return (
    <div className={`mt-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="px-4 py-5 sm:p-6">
        <h3 className={`text-lg leading-6 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          System Status
        </h3>
        <div className="mt-5 space-y-4">
          {/* Backend Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`h-3 w-3 rounded-full ${getStatusColor(backendHealth.status)} animate-pulse`}></div>
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Backend: {backendHealth.status === 'healthy' ? 'Verbunden' : 
                           backendHealth.status === 'error' ? 'Fehler' : 'Verbinde...'}
                </p>
                {backendHealth.app && (
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
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
            {getStatusIcon(backendHealth.status)}
          </div>

          {/* Database Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`h-3 w-3 rounded-full ${backendHealth.status === 'healthy' ? 'bg-green-500' : 'bg-gray-400'} animate-pulse`}></div>
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Database: {backendHealth.database || 'MongoDB'}
                </p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {backendHealth.status === 'healthy' ? 'Betriebsbereit' : 'Status unbekannt'}
                </p>
              </div>
            </div>
            <CheckCircle className={`h-5 w-5 ${backendHealth.status === 'healthy' ? 'text-green-500' : 'text-gray-400'}`} />
          </div>

          {/* Frontend Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Frontend: React + TypeScript
                </p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Tailwind CSS + Dark Mode
                </p>
              </div>
            </div>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [user, setUser] = useState<any>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    // Apply dark mode to document
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    if (authToken) {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    }
  }, [authToken]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleLogin = (token: string, userData: any) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setAuthToken(token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setAuthToken(null);
    setUser(null);
  };

  return (
    <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-200`}>
        {/* Fixed Header */}
        <Header 
          darkMode={darkMode} 
          toggleDarkMode={toggleDarkMode} 
          user={user}
          onLogout={handleLogout}
          onOpenSettings={() => setShowSettings(true)}
          onOpenHelp={() => setShowHelp(true)}
        />

        {/* Modals */}
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          authToken={authToken || ''}
        />
        <HelpModal
          isOpen={showHelp}
          onClose={() => setShowHelp(false)}
          darkMode={darkMode}
        />

        {!authToken ? (
          <>
            {/* Main Content with padding for fixed header and footer */}
            <main className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto">
                <div className="max-w-md mx-auto">
                  <LoginForm onLogin={handleLogin} darkMode={darkMode} />
                  <SystemStatus darkMode={darkMode} />
                </div>
              </div>
            </main>
            {/* Fixed Footer */}
            <Footer darkMode={darkMode} />
          </>
        ) : (
          /* Fullscreen Dashboard (ohne extra padding/footer) */
          <main className="pt-16 h-screen overflow-hidden">
            <QADashboardV2 
              authToken={authToken} 
              user={user} 
              darkMode={darkMode}
              onOpenSettings={() => setShowSettings(true)}
              onOpenHelp={() => setShowHelp(true)}
            />
          </main>
        )}
      </div>
    </DarkModeContext.Provider>
  );
}

export default App;
