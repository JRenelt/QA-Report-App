import React, { useState, useEffect } from 'react';
import { X, Plus, Edit, Trash2, Ban, CheckCircle, Search, AlertCircle, User, Mail, Phone, Building, Shield } from 'lucide-react';

interface UserManagementV2Props {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  currentUser: any;
}

interface UserV2 {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  tel: string;
  role: 'sysop' | 'admin' | 'qa_tester';
  company_id: string;
  is_active: boolean;
  is_blocked: boolean;
  is_deletable: boolean;
  created_at: string;
}

interface Company {
  id: string;
  name: string;
}

const UserManagementV2: React.FC<UserManagementV2Props> = ({ isOpen, onClose, darkMode, currentUser }) => {
  const [users, setUsers] = useState<UserV2[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('all');
  
  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserV2 | null>(null);
  
  // Form Data
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    tel: '',
    role: 'qa_tester' as 'sysop' | 'admin' | 'qa_tester',
    company_id: '',
    password: ''
  });

  // Load users and companies on mount
  useEffect(() => {
    if (isOpen) {
      loadUsers();
      loadCompanies();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${backendUrl}/api/users-v2/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Fehler beim Laden der User');
      }
    } catch (err) {
      setError('Fehler beim Laden der User');
      console.error('Load users error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${backendUrl}/api/companies-v2/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Loaded companies:', data); // Debug
        setCompanies(data);
      } else {
        console.error('Failed to load companies');
      }
    } catch (err) {
      console.error('Load companies error:', err);
    }
  };

  const handleCreateUser = async () => {
    setError('');
    setSuccess('');

    // Validierung
    if (!formData.username || !formData.email || !formData.first_name || !formData.last_name || !formData.password || !formData.company_id) {
      setError('Bitte alle Pflichtfelder ausfüllen');
      return;
    }

    if (formData.password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen lang sein');
      return;
    }

    setLoading(true);

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${backendUrl}/api/users-v2/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccess('User erfolgreich angelegt!');
        setShowCreateModal(false);
        resetForm();
        loadUsers();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Fehler beim Anlegen des Users');
      }
    } catch (err) {
      setError('Fehler beim Anlegen des Users');
      console.error('Create user error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    setError('');
    setSuccess('');

    setLoading(true);

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${backendUrl}/api/users-v2/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccess('User erfolgreich aktualisiert!');
        setShowEditModal(false);
        setSelectedUser(null);
        resetForm();
        loadUsers();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Fehler beim Aktualisieren des Users');
      }
    } catch (err) {
      setError('Fehler beim Aktualisieren des Users');
      console.error('Update user error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`User "${username}" wirklich löschen?`)) return;

    setLoading(true);
    setError('');

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${backendUrl}/api/users-v2/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        setSuccess('User erfolgreich gelöscht!');
        loadUsers();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Fehler beim Löschen des Users');
      }
    } catch (err) {
      setError('Fehler beim Löschen des Users');
      console.error('Delete user error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId: string, username: string, currentlyBlocked: boolean) => {
    const action = currentlyBlocked ? 'entsperren' : 'sperren';
    if (!confirm(`User "${username}" wirklich ${action}?`)) return;

    setLoading(true);
    setError('');

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${backendUrl}/api/users-v2/${userId}/block`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        setSuccess(`User erfolgreich ${currentlyBlocked ? 'entsperrt' : 'gesperrt'}!`);
        loadUsers();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || `Fehler beim ${action} des Users`);
      }
    } catch (err) {
      setError(`Fehler beim ${action} des Users`);
      console.error('Block user error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setError(''); // Reset error
    // Set default company for admin
    if (currentUser.role === 'admin') {
      console.log('Setting company_id for admin:', currentUser.company_id); // Debug
      setFormData(prev => ({ ...prev, company_id: currentUser.company_id }));
    }
    console.log('Current companies:', companies); // Debug
    setShowCreateModal(true);
  };

  const openEditModal = (user: UserV2) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      tel: user.tel,
      role: user.role,
      company_id: user.company_id,
      password: '' // Password wird nicht geladen
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      tel: '',
      role: 'qa_tester',
      company_id: '',
      password: ''
    });
  };

  const getCompanyName = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : 'Unbekannt';
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'sysop': return 'System Operator';
      case 'admin': return 'Administrator';
      case 'qa_tester': return 'QA-Tester';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'sysop': return 'bg-purple-500';
      case 'admin': return 'bg-blue-500';
      case 'qa_tester': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCompany = selectedCompanyFilter === 'all' || user.company_id === selectedCompanyFilter;
    
    return matchesSearch && matchesCompany;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-6xl rounded-lg shadow-xl max-h-[90vh] overflow-hidden flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${darkMode ? 'bg-cyan-900' : 'bg-cyan-100'}`}>
              <User className={`h-6 w-6 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Benutzerverwaltung
              </h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {currentUser.role === 'sysop' ? 'Alle Benutzer verwalten' : 'Benutzer Ihrer Firma verwalten'}
              </p>
            </div>
          </div>
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

        {/* Toolbar */}
        <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Suche nach Username, E-Mail, Name..."
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>

            {/* Company Filter (nur für SysOp) */}
            {currentUser.role === 'sysop' && (
              <select
                value={selectedCompanyFilter}
                onChange={(e) => setSelectedCompanyFilter(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="all">Alle Firmen</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
            )}

            {/* Create Button */}
            <button
              onClick={openCreateModal}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                darkMode
                  ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                  : 'bg-cyan-500 hover:bg-cyan-600 text-white'
              }`}
            >
              <Plus className="h-5 w-5 mr-2" />
              Neuer User
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className={`mx-6 mt-4 p-3 rounded-lg flex items-center ${darkMode ? 'bg-red-900 bg-opacity-20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
            <AlertCircle className={`h-5 w-5 mr-2 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
            <span className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</span>
          </div>
        )}

        {success && (
          <div className={`mx-6 mt-4 p-3 rounded-lg flex items-center ${darkMode ? 'bg-green-900 bg-opacity-20 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
            <CheckCircle className={`h-5 w-5 mr-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
            <span className={`text-sm ${darkMode ? 'text-green-300' : 'text-green-700'}`}>{success}</span>
          </div>
        )}

        {/* User Table */}
        <div className="flex-1 overflow-auto p-6">
          {loading && users.length === 0 ? (
            <div className="text-center py-12">
              <div className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Lade Benutzer...
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <User className={`h-16 w-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <div className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Keine Benutzer gefunden
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <th className={`text-left p-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>User</th>
                    <th className={`text-left p-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Name</th>
                    <th className={`text-left p-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Rolle</th>
                    <th className={`text-left p-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Firma</th>
                    <th className={`text-left p-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status</th>
                    <th className={`text-right p-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr 
                      key={user.id} 
                      className={`border-b ${darkMode ? 'border-gray-700 hover:bg-gray-750' : 'border-gray-100 hover:bg-gray-50'}`}
                    >
                      <td className="p-3">
                        <div>
                          <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {user.username}
                          </div>
                          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <Mail className="inline h-3 w-3 mr-1" />
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                          {user.first_name} {user.last_name}
                        </div>
                        {user.tel && (
                          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <Phone className="inline h-3 w-3 mr-1" />
                            {user.tel}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${getRoleColor(user.role)}`}>
                          <Shield className="h-3 w-3 mr-1" />
                          {getRoleName(user.role)}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className={`flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <Building className="h-4 w-4 mr-1" />
                          {getCompanyName(user.company_id)}
                        </div>
                      </td>
                      <td className="p-3">
                        {user.is_blocked ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500 text-white">
                            <Ban className="h-3 w-3 mr-1" />
                            Gesperrt
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Aktiv
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className={`p-2 rounded-lg transition-colors ${
                              darkMode
                                ? 'hover:bg-gray-700 text-blue-400'
                                : 'hover:bg-blue-50 text-blue-600'
                            }`}
                            title="Bearbeiten"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleBlockUser(user.id, user.username, user.is_blocked)}
                            className={`p-2 rounded-lg transition-colors ${
                              darkMode
                                ? 'hover:bg-gray-700 text-orange-400'
                                : 'hover:bg-orange-50 text-orange-600'
                            }`}
                            title={user.is_blocked ? 'Entsperren' : 'Sperren'}
                          >
                            <Ban className="h-4 w-4" />
                          </button>

                          {user.is_deletable && (
                            <button
                              onClick={() => handleDeleteUser(user.id, user.username)}
                              className={`p-2 rounded-lg transition-colors ${
                                darkMode
                                  ? 'hover:bg-gray-700 text-red-400'
                                  : 'hover:bg-red-50 text-red-600'
                              }`}
                              title="Löschen"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex justify-between items-center p-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {filteredUsers.length} von {users.length} Benutzern
          </div>
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

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className={`w-full max-w-2xl rounded-lg shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`flex items-center justify-between p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {showCreateModal ? 'Neuen User anlegen' : 'User bearbeiten'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setError('');
                  resetForm();
                }}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode 
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-auto">
              {/* Error Message im Modal */}
              {error && (
                <div className={`p-3 rounded-lg flex items-center ${darkMode ? 'bg-red-900 bg-opacity-20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
                  <AlertCircle className={`h-5 w-5 mr-2 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                  <span className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Username *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => {
                      setFormData({ ...formData, username: e.target.value });
                      if (error) setError(''); // Reset error beim Tippen
                    }}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      !formData.username && error
                        ? 'bg-orange-500 bg-opacity-10 border-orange-400'
                        : darkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="z.B. JR"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    E-Mail *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (error) setError(''); // Reset error beim Tippen
                    }}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      !formData.email && error
                        ? 'bg-orange-500 bg-opacity-10 border-orange-400'
                        : darkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="user@firma.de"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Vorname *
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => {
                      setFormData({ ...formData, first_name: e.target.value });
                      if (error) setError(''); // Reset error beim Tippen
                    }}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      !formData.first_name && error
                        ? 'bg-orange-500 bg-opacity-10 border-orange-400'
                        : darkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Nachname *
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => {
                      setFormData({ ...formData, last_name: e.target.value });
                      if (error) setError(''); // Reset error beim Tippen
                    }}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      !formData.last_name && error
                        ? 'bg-orange-500 bg-opacity-10 border-orange-400'
                        : darkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Telefon
                </label>
                <input
                  type="text"
                  value={formData.tel}
                  onChange={(e) => setFormData({ ...formData, tel: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="z.B. 01637374570"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Rolle *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    disabled={currentUser.role === 'admin'} // Admin kann keine SysOps erstellen
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {currentUser.role === 'sysop' && <option value="sysop">System Operator</option>}
                    <option value="admin">Administrator</option>
                    <option value="qa_tester">QA-Tester</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Firma *
                  </label>
                  {currentUser.role === 'admin' ? (
                    // Admin sieht nur Firmenname (nicht änderbar)
                    <div className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-300'
                        : 'bg-gray-100 border-gray-300 text-gray-700'
                    }`}>
                      {companies.find(c => c.id === currentUser.company_id)?.name || 'Lädt...'}
                    </div>
                  ) : (
                    // SysOp kann Firma wählen
                    <select
                      value={formData.company_id}
                      onChange={(e) => {
                        setFormData({ ...formData, company_id: e.target.value });
                        // Reset error wenn User Firma auswählt
                        if (error && e.target.value) {
                          setError('');
                        }
                      }}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        !formData.company_id && error
                          ? 'bg-orange-500 bg-opacity-10 border-orange-400'
                          : darkMode
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">Firma wählen...</option>
                      {companies.map(company => (
                        <option key={company.id} value={company.id}>{company.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {showCreateModal && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Passwort * (min. 8 Zeichen)
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (error) setError(''); // Reset error beim Tippen
                    }}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      (!formData.password || formData.password.length < 8) && error
                        ? 'bg-orange-500 bg-opacity-10 border-orange-400'
                        : darkMode
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                  {formData.password && formData.password.length < 8 && (
                    <p className="text-xs text-orange-500 mt-1">⚠️ Passwort muss mindestens 8 Zeichen lang sein</p>
                  )}
                </div>
              )}
            </div>

            <div className={`flex justify-end gap-3 p-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setError('');
                  resetForm();
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                Abbrechen
              </button>
              <button
                onClick={showCreateModal ? handleCreateUser : handleUpdateUser}
                disabled={loading}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                } ${
                  darkMode
                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                    : 'bg-cyan-500 hover:bg-cyan-600 text-white'
                }`}
              >
                {loading ? 'Wird gespeichert...' : showCreateModal ? 'Anlegen' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementV2;
