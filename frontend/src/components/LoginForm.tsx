import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface LoginFormProps {
  onLogin: (token: string, user: any) => void;
  language?: 'de' | 'en';
  darkMode?: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, language = 'de', darkMode = false }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const translations = {
    de: {
      login: 'Anmelden',
      username: 'Benutzername',
      password: 'Passwort',
      loginButton: 'Anmelden',
      forgotPassword: 'Passwort vergessen?',
      loginError: 'Anmeldung fehlgeschlagen',
      invalidCredentials: 'Ungültige Anmeldedaten',
      demoCredentials: 'Demo-Zugangsdaten:',
      adminUser: 'Admin: admin / admin123',
      qaUser: 'QA-Tester: qa_demo / demo123'
    },
    en: {
      login: 'Login',
      username: 'Username',
      password: 'Password', 
      loginButton: 'Sign In',
      forgotPassword: 'Forgot password?',
      loginError: 'Login failed',
      invalidCredentials: 'Invalid credentials',
      demoCredentials: 'Demo Credentials:',
      adminUser: 'Admin: admin / admin123',
      qaUser: 'QA Tester: qa_demo / demo123'
    }
  };

  const t = translations[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('authToken', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));  // Fixed: Changed from 'qa_user' to 'user'
        onLogin(data.access_token, data.user);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || t.invalidCredentials);
      }
    } catch (err) {
      setError(t.loginError);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (username: string, password: string) => {
    setFormData({ username, password });
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-qa-primary-50 to-qa-gray-100'}`}>
      <div className={`max-w-md w-full rounded-lg shadow-lg p-8 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-qa-primary-100">
            <User className="h-6 w-6 text-qa-primary-600" />
          </div>
          <h2 className={`mt-4 text-2xl font-bold ${darkMode ? 'text-white' : 'text-qa-gray-900'}`}>
            {t.login}
          </h2>
          <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-qa-gray-600'}`}>
            QA-Report-App
          </p>
        </div>

        {/* Demo Credentials Info */}
        <div className={`mb-6 p-4 rounded-lg border ${
          darkMode 
            ? 'bg-gray-700 border-gray-600' 
            : 'bg-qa-gray-50 border-qa-gray-200'
        }`}>
          <h3 className={`text-sm font-semibold mb-2 ${
            darkMode ? 'text-gray-200' : 'text-qa-gray-700'
          }`}>
            {t.demoCredentials}
          </h3>
          <div className={`space-y-1 text-xs ${
            darkMode ? 'text-gray-300' : 'text-qa-gray-600'
          }`}>
            <button 
              type="button"
              onClick={() => handleDemoLogin('admin', 'admin123')}
              className={`block w-full text-left transition-colors ${
                darkMode 
                  ? 'hover:text-cyan-400' 
                  : 'hover:text-qa-primary-600'
              }`}
            >
              • {t.adminUser}
            </button>
            <button
              type="button" 
              onClick={() => handleDemoLogin('qa_demo', 'demo123')}
              className={`block w-full text-left transition-colors ${
                darkMode 
                  ? 'hover:text-cyan-400' 
                  : 'hover:text-qa-primary-600'
              }`}
            >
              • {t.qaUser}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-gray-200' : 'text-qa-gray-700'
            }`}>
              {t.username}
            </label>
            <div className="relative">
              <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                darkMode ? 'text-gray-400' : 'text-qa-gray-400'
              }`} />
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className={`w-full pl-10 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-opacity-50 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-cyan-500 focus:border-cyan-500' 
                    : 'input-field'
                }`}
                placeholder={t.username}
                required
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-gray-200' : 'text-qa-gray-700'
            }`}>
              {t.password}
            </label>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                darkMode ? 'text-gray-400' : 'text-qa-gray-400'
              }`} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full pl-10 pr-10 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-opacity-50 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-cyan-500 focus:border-cyan-500' 
                    : 'input-field'
                }`}
                placeholder={t.password}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                  darkMode 
                    ? 'text-gray-400 hover:text-gray-200' 
                    : 'text-qa-gray-400 hover:text-qa-gray-600'
                }`}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
              loading 
                ? 'opacity-50 cursor-not-allowed' 
                : ''
            } ${
              darkMode
                ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                : 'bg-qa-primary-600 hover:bg-qa-primary-700 text-white'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {t.loginButton}...
              </div>
            ) : (
              t.loginButton
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="#" className="text-sm text-qa-primary-600 hover:text-qa-primary-500">
            {t.forgotPassword}
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;