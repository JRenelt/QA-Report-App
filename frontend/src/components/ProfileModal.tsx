import React, { useState } from 'react';
import { X, User, Lock, Eye, EyeOff, Save, AlertCircle, CheckCircle } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  darkMode: boolean;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user, darkMode }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handlePasswordChange = async () => {
    setError('');
    setSuccess('');

    // Validierung
    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setError('Bitte alle Felder ausfüllen');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Neue Passwörter stimmen nicht überein');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('Neues Passwort muss mindestens 8 Zeichen lang sein');
      return;
    }

    setLoading(true);

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${backendUrl}/api/users-v2/change-password?old_password=${encodeURIComponent(passwordData.oldPassword)}&new_password=${encodeURIComponent(passwordData.newPassword)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        setSuccess('Passwort erfolgreich geändert!');
        setPasswordData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => {
          setSuccess('');
          onClose();
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Fehler beim Ändern des Passworts');
      }
    } catch (err) {
      setError('Fehler beim Ändern des Passworts');
      console.error('Password change error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-2xl rounded-lg shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Profil & Einstellungen
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              darkMode 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'profile'
                ? darkMode
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-cyan-600 border-b-2 border-cyan-600'
                : darkMode
                  ? 'text-gray-400 hover:text-gray-300'
                  : 'text-gray-600 hover:text-gray-700'
            }`}
          >
            <User className="inline-block h-4 w-4 mr-2" />
            Profil
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'password'
                ? darkMode
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-cyan-600 border-b-2 border-cyan-600'
                : darkMode
                  ? 'text-gray-400 hover:text-gray-300'
                  : 'text-gray-600 hover:text-gray-700'
            }`}
          >
            <Lock className="inline-block h-4 w-4 mr-2" />
            Passwort ändern
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Benutzername
                  </label>
                  <input
                    type="text"
                    value={user?.username || ''}
                    disabled
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-300'
                        : 'bg-gray-50 border-gray-300 text-gray-600'
                    } cursor-not-allowed`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Rolle
                  </label>
                  <input
                    type="text"
                    value={user?.role === 'sysop' ? 'System Operator' : user?.role === 'admin' ? 'Administrator' : 'QA-Tester'}
                    disabled
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-300'
                        : 'bg-gray-50 border-gray-300 text-gray-600'
                    } cursor-not-allowed`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Vorname
                  </label>
                  <input
                    type="text"
                    value={user?.first_name || ''}
                    disabled
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-300'
                        : 'bg-gray-50 border-gray-300 text-gray-600'
                    } cursor-not-allowed`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Nachname
                  </label>
                  <input
                    type="text"
                    value={user?.last_name || ''}
                    disabled
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-300'
                        : 'bg-gray-50 border-gray-300 text-gray-600'
                    } cursor-not-allowed`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  E-Mail
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-300'
                      : 'bg-gray-50 border-gray-300 text-gray-600'
                  } cursor-not-allowed`}
                />
              </div>

              {user?.tel && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Telefon
                  </label>
                  <input
                    type="text"
                    value={user.tel}
                    disabled
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-300'
                        : 'bg-gray-50 border-gray-300 text-gray-600'
                    } cursor-not-allowed`}
                  />
                </div>
              )}

              <div className={`p-4 rounded-lg ${darkMode ? 'bg-blue-900 bg-opacity-20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
                <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                  💡 Profildaten können Sie über die Benutzerverwaltung aktualisieren.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="space-y-4">
              {error && (
                <div className={`p-3 rounded-lg flex items-center ${darkMode ? 'bg-red-900 bg-opacity-20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
                  <AlertCircle className={`h-5 w-5 mr-2 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                  <span className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</span>
                </div>
              )}

              {success && (
                <div className={`p-3 rounded-lg flex items-center ${darkMode ? 'bg-green-900 bg-opacity-20 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
                  <CheckCircle className={`h-5 w-5 mr-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                  <span className={`text-sm ${darkMode ? 'text-green-300' : 'text-green-700'}`}>{success}</span>
                </div>
              )}

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Altes Passwort
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    value={passwordData.oldPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                    className={`w-full pl-10 pr-10 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-opacity-50 ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-cyan-500 focus:border-cyan-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-cyan-500 focus:border-cyan-500'
                    }`}
                    placeholder="Altes Passwort eingeben"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {showOldPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Neues Passwort
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className={`w-full pl-10 pr-10 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-opacity-50 ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-cyan-500 focus:border-cyan-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-cyan-500 focus:border-cyan-500'
                    }`}
                    placeholder="Neues Passwort eingeben (min. 8 Zeichen)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Passwort bestätigen
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className={`w-full pl-10 pr-10 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-opacity-50 ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-cyan-500 focus:border-cyan-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-cyan-500 focus:border-cyan-500'
                    }`}
                    placeholder="Neues Passwort wiederholen"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                onClick={handlePasswordChange}
                disabled={loading}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center ${
                  loading
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                } ${
                  darkMode
                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                    : 'bg-cyan-500 hover:bg-cyan-600 text-white'
                }`}
              >
                <Save className="h-5 w-5 mr-2" />
                {loading ? 'Wird gespeichert...' : 'Passwort ändern'}
              </button>

              <div className={`p-4 rounded-lg ${darkMode ? 'bg-yellow-900 bg-opacity-20 border border-yellow-800' : 'bg-yellow-50 border border-yellow-200'}`}>
                <p className={`text-sm ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                  ⚠️ Nach erfolgreicher Passwortänderung können Sie sich mit dem neuen Passwort anmelden.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex justify-end gap-3 p-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
