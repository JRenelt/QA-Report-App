import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Edit, Trash2, Save, X, Search, Crown, UserRound, 
  Mail, Key, Shield, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';

interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'qa_tester';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  companyId?: string; // Firma-Zuordnung
}

interface UserManagementProps {
  authToken: string;
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ 
  authToken, 
  currentUser, 
  isOpen, 
  onClose 
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'qa_tester' as 'admin' | 'qa_tester',
    password: '',
    is_active: true,
    companyId: ''
  });

  // Firmen laden
  const loadCompanies = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://report-qa-portal.preview.emergentagent.com';
      const response = await fetch(`${backendUrl}/api/companies/`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
        
        // Default: Firma des eingeloggten Users
        if (currentUser?.companyId) {
          setSelectedCompanyId(currentUser.companyId);
        } else if (data.length > 0) {
          setSelectedCompanyId(data[0].id);
        }
      } else {
        console.error('Fehler beim Laden der Firmen');
      }
    } catch (error) {
      console.error('Fehler beim Laden der Firmen:', error);
    }
  };

  // Benutzer laden (gefiltert nach Firma)
  const loadUsers = async () => {
    try {
      setLoading(true);
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://report-qa-portal.preview.emergentagent.com';
      const response = await fetch(`${backendUrl}/api/users/`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error('Fehler beim Laden der Benutzer');
      }
    } catch (error) {
      console.error('Fehler beim Laden der Benutzer:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCompanies();
      loadUsers();
    }
  }, [isOpen, authToken]);
  
  // Users neu laden wenn Firma gewechselt wird
  useEffect(() => {
    if (isOpen && selectedCompanyId) {
      loadUsers();
    }
  }, [selectedCompanyId]);

  // Benutzer erstellen
  const handleCreateUser = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://report-qa-portal.preview.emergentagent.com';
      const response = await fetch(`${backendUrl}/api/users/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          companyId: selectedCompanyId // Firma automatisch zuweisen
        })
      });

      if (response.ok) {
        await loadUsers();
        setShowCreateModal(false);
        resetForm();
      } else {
        const errorData = await response.json();
        console.error('Fehler beim Erstellen des Benutzers:', errorData);
        alert(`Fehler: ${errorData.detail || 'Benutzer konnte nicht erstellt werden'}`);
      }
    } catch (error) {
      console.error('Fehler beim Erstellen des Benutzers:', error);
      alert('Netzwerkfehler: Benutzer konnte nicht erstellt werden. Bitte Backend-URL prüfen.');
    }
  };
      if (response.ok) {
        await loadUsers();
        setShowCreateModal(false);
        resetForm();
      } else {
        console.error('Fehler beim Erstellen des Benutzers');
      }
    } catch (error) {
      console.error('Fehler beim Erstellen des Benutzers:', error);
    }
  };

  // Benutzer aktualisieren
  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const updateData: any = { ...formData };
      if (!updateData.password) {
        delete updateData.password; // Passwort nur ändern wenn angegeben
      }

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        await loadUsers();
        setShowEditModal(false);
        setSelectedUser(null);
        resetForm();
      } else {
        console.error('Fehler beim Aktualisieren des Benutzers');
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Benutzers:', error);
    }
  };

  // Benutzer löschen
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Benutzer wirklich löschen?')) return;
    if (userId === currentUser.id) {
      alert('Sie können sich nicht selbst löschen!');
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await loadUsers();
      } else {
        console.error('Fehler beim Löschen des Benutzers');
      }
    } catch (error) {
      console.error('Fehler beim Löschen des Benutzers:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      role: 'qa_tester',
      password: '',
      is_active: true
    });
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      password: '',
      is_active: user.is_active
    });
    setShowEditModal(true);
  };

  // Rollenbasierte Filterung
  const isAdmin = currentUser?.role === 'admin';
  
  const filteredUsers = users
    .filter(user => {
      // Admin sieht alle User, QA-Tester nur User seiner Firma
      if (!isAdmin && currentUser?.companyId) {
        return user.companyId === currentUser.companyId;
      }
      return true;
    })
    .filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const getRoleIcon = (role: string) => {
    return role === 'admin' ? (
      <Crown className="h-4 w-4 text-yellow-400" />
    ) : (
      <UserRound className="h-4 w-4 text-blue-400" />
    );
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <CheckCircle className="h-4 w-4 text-green-400" />
    ) : (
      <XCircle className="h-4 w-4 text-red-400" />
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-[#2C313A] rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <Users className="h-6 w-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Benutzerverwaltung</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Benutzer suchen..."
                className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>
          {/* Create Button - Nur für Admin */}
          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-white text-sm font-medium transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Benutzer hinzufügen</span>
            </button>
          )}
        </div>

        {/* User List */}
        <div className="overflow-y-auto max-h-96 p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-400">Lade Benutzer...</div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-gray-800 rounded-lg p-4 flex items-center justify-between hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    {getRoleIcon(user.role)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-medium">{user.username}</span>
                        {getStatusIcon(user.is_active)}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {user.first_name} {user.last_name} • {user.email}
                      </div>
                      <div className="text-gray-500 text-xs">
                        Rolle: {user.role === 'admin' ? 'Administrator' : 'QA-Tester'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Edit: Admin kann alle bearbeiten, QA-Tester nur sich selbst */}
                    {(isAdmin || user.id === currentUser.id) && (
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                        title="Bearbeiten"
                      >
                        <Edit className="h-4 w-4 text-white" />
                      </button>
                    )}
                    {/* Delete: Nur Admin, nicht sich selbst */}
                    {isAdmin && user.id !== currentUser.id && (
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
                        title="Löschen"
                      >
                        <Trash2 className="h-4 w-4 text-white" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-60">
          <div className="bg-[#2C313A] rounded-lg p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-lg font-bold text-cyan-400 mb-4">Neuen Benutzer erstellen</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                placeholder="Benutzername"
                className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white text-sm focus:border-cyan-500 focus:outline-none"
              />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="E-Mail"
                className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white text-sm focus:border-cyan-500 focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  placeholder="Vorname"
                  className="bg-gray-800 border border-gray-600 rounded p-3 text-white text-sm focus:border-cyan-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  placeholder="Nachname"
                  className="bg-gray-800 border border-gray-600 rounded p-3 text-white text-sm focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Passwort"
                className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white text-sm focus:border-cyan-500 focus:outline-none"
              />
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value as 'admin' | 'qa_tester'})}
                className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white text-sm focus:border-cyan-500 focus:outline-none"
              >
                <option value="qa_tester">QA-Tester</option>
                <option value="admin">Administrator</option>
              </select>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active_create"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="rounded"
                />
                <label htmlFor="is_active_create" className="text-white text-sm">Benutzer aktiviert</label>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCreateUser}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-sm"
              >
                Erstellen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-60">
          <div className="bg-[#2C313A] rounded-lg p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-lg font-bold text-cyan-400 mb-4">Benutzer bearbeiten</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                placeholder="Benutzername"
                className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white text-sm focus:border-cyan-500 focus:outline-none"
              />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="E-Mail"
                className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white text-sm focus:border-cyan-500 focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  placeholder="Vorname"
                  className="bg-gray-800 border border-gray-600 rounded p-3 text-white text-sm focus:border-cyan-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  placeholder="Nachname"
                  className="bg-gray-800 border border-gray-600 rounded p-3 text-white text-sm focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Neues Passwort (leer lassen wenn nicht ändern)"
                className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white text-sm focus:border-cyan-500 focus:outline-none"
              />
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value as 'admin' | 'qa_tester'})}
                className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white text-sm focus:border-cyan-500 focus:outline-none"
                disabled={selectedUser.id === currentUser.id} // Eigene Rolle nicht ändern
              >
                <option value="qa_tester">QA-Tester</option>
                <option value="admin">Administrator</option>
              </select>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active_edit"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="rounded"
                  disabled={selectedUser.id === currentUser.id} // Sich selbst nicht deaktivieren
                />
                <label htmlFor="is_active_edit" className="text-white text-sm">Benutzer aktiviert</label>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
              >
                Abbrechen
              </button>
              <button
                onClick={handleUpdateUser}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-sm"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;