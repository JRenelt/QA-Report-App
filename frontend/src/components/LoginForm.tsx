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
        localStorage.setItem('qa_token', data.access_token);
        localStorage.setItem('qa_user', JSON.stringify(data.user));
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-qa-primary-50 to-qa-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-qa-primary-100">
            <User className="h-6 w-6 text-qa-primary-600" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-qa-gray-900">
            {t.login}
          </h2>
          <p className="mt-2 text-sm text-qa-gray-600">
            QA-Report-App
          </p>
        </div>

        {/* Demo Credentials Info */}
        <div className="mb-6 p-4 bg-qa-gray-50 rounded-lg border border-qa-gray-200">
          <h3 className="text-sm font-semibold text-qa-gray-700 mb-2">
            {t.demoCredentials}
          </h3>
          <div className="space-y-1 text-xs text-qa-gray-600">
            <button 
              type="button"
              onClick={() => handleDemoLogin('admin', 'admin123')}
              className="block w-full text-left hover:text-qa-primary-600 transition-colors"
            >
              • {t.adminUser}
            </button>
            <button
              type="button" 
              onClick={() => handleDemoLogin('qa_demo', 'demo123')}
              className="block w-full text-left hover:text-qa-primary-600 transition-colors"
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
            <label className="block text-sm font-medium text-qa-gray-700 mb-2">
              {t.username}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-qa-gray-400" />
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="input-field w-full pl-10"
                placeholder={t.username}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-qa-gray-700 mb-2">
              {t.password}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-qa-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-field w-full pl-10 pr-10"
                placeholder={t.password}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-qa-gray-400 hover:text-qa-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full btn-primary ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
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