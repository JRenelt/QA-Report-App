import React, { useState, useEffect } from 'react';
import { X, Plus, Edit, Trash2, Ban, CheckCircle, Search, AlertCircle, Building, Users as UsersIcon, Shield, ChevronDown, ChevronUp } from 'lucide-react';

interface CompanyManagementV2Props {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  currentUser: any;
}

interface CompanyV2 {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  short_code: string;
  is_blocked: boolean;
  is_deletable: boolean;
  created_at: string;
  // Adresse
  street?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  // Ansprechpartner
  contact_person_name?: string;
  contact_person_email?: string;
  contact_person_phone?: string;
}

const CompanyManagementV2: React.FC<CompanyManagementV2Props> = ({ isOpen, onClose, darkMode, currentUser }) => {
  const [companies, setCompanies] = useState<CompanyV2[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedCompanies, setCollapsedCompanies] = useState<Set<string>>(new Set());
  
  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyV2 | null>(null);
  
  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo_url: '',
    // Adresse
    street: '',
    postal_code: '',
    city: '',
    country: 'Deutschland',
    // Ansprechpartner
    contact_person_name: '',
    contact_person_email: '',
    contact_person_phone: ''
  });

  // Load companies on mount
  useEffect(() => {
    if (isOpen) {
      loadCompanies();
    }
  }, [isOpen]);

  const loadCompanies = async () => {
    setLoading(true);
    setError('');
    
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
        setCompanies(data);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Fehler beim Laden der Firmen');
      }
    } catch (err) {
      setError('Fehler beim Laden der Firmen');
      console.error('Load companies error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async () => {
    setError('');
    setSuccess('');

    // Validierung
    if (!formData.name) {
      setError('Bitte Firmenname eingeben');
      return;
    }

    setLoading(true);

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${backendUrl}/api/companies-v2/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccess('Firma erfolgreich angelegt!');
        setShowCreateModal(false);
        resetForm();
        loadCompanies();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Fehler beim Anlegen der Firma');
      }
    } catch (err) {
      setError('Fehler beim Anlegen der Firma');
      console.error('Create company error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCompany = async () => {
    if (!selectedCompany) return;

    setError('');
    setSuccess('');

    setLoading(true);

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${backendUrl}/api/companies-v2/${selectedCompany.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccess('Firma erfolgreich aktualisiert!');
        setShowEditModal(false);
        setSelectedCompany(null);
        resetForm();
        loadCompanies();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Fehler beim Aktualisieren der Firma');
      }
    } catch (err) {
      setError('Fehler beim Aktualisieren der Firma');
      console.error('Update company error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCompany = async (companyId: string, companyName: string) => {
    if (!confirm(`Firma "${companyName}" wirklich löschen? Alle zugehörigen User und Projekte werden ebenfalls gelöscht!`)) return;

    setLoading(true);
    setError('');

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${backendUrl}/api/companies-v2/${companyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        setSuccess('Firma erfolgreich gelöscht!');
        loadCompanies();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Fehler beim Löschen der Firma');
      }
    } catch (err) {
      setError('Fehler beim Löschen der Firma');
      console.error('Delete company error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockCompany = async (companyId: string, companyName: string, currentlyBlocked: boolean) => {
    const action = currentlyBlocked ? 'entsperren' : 'sperren';
    if (!confirm(`Firma "${companyName}" und alle zugehörigen User wirklich ${action}?`)) return;

    setLoading(true);
    setError('');

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const token = localStorage.getItem('authToken');

  const toggleCollapse = (companyId: string) => {
    setCollapsedCompanies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(companyId)) {
        newSet.delete(companyId);
      } else {
        newSet.add(companyId);
      }
      return newSet;
    });
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const highlightMatch = (text: string, search: string) => {
    if (!search.trim()) return text;
    const parts = text.split(new RegExp(`(${search})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === search.toLowerCase() 
        ? <mark key={i} className="bg-yellow-300 text-black">{part}</mark>
        : part
    );
  };

      const response = await fetch(`${backendUrl}/api/companies-v2/${companyId}/block`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Firma erfolgreich ${currentlyBlocked ? 'entsperrt' : 'gesperrt'}! ${data.affected_users} User betroffen.`);
        loadCompanies();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || `Fehler beim ${action} der Firma`);
      }
    } catch (err) {
      setError(`Fehler beim ${action} der Firma`);
      console.error('Block company error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (company: CompanyV2) => {
    setSelectedCompany(company);
    setFormData({
      name: company.name,
      description: company.description || '',
      logo_url: company.logo_url || '',
      // Adresse
      street: company.street || '',
      postal_code: company.postal_code || '',
      city: company.city || '',
      country: company.country || 'Deutschland',
      // Ansprechpartner
      contact_person_name: company.contact_person_name || '',
      contact_person_email: company.contact_person_email || '',
      contact_person_phone: company.contact_person_phone || ''
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      logo_url: '',
      // Adresse
      street: '',
      postal_code: '',
      city: '',
      country: 'Deutschland',
      // Ansprechpartner
      contact_person_name: '',
      contact_person_email: '',
      contact_person_phone: ''
    });
  };

  // Filter companies
  const filteredCompanies = companies.filter(company => 
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.short_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  // Nur SysOp darf Firmen verwalten
  const canManage = currentUser?.role === 'sysop';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-6xl rounded-lg shadow-xl max-h-[90vh] overflow-hidden flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${darkMode ? 'bg-cyan-900' : 'bg-cyan-100'}`}>
              <Building className={`h-6 w-6 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Firmenverwaltung
              </h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {canManage ? 'Alle Firmen verwalten' : 'Ihre Firma'}
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
                placeholder="Suche nach Firmenname oder Kürzel..."
                className={`w-full pl-10 pr-10 py-2 rounded-lg border ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                }`}
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Create Button (nur SysOp) */}
            {canManage && (
              <button
                onClick={openCreateModal}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                  darkMode
                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                    : 'bg-cyan-500 hover:bg-cyan-600 text-white'
                }`}
              >
                <Plus className="h-5 w-5 mr-2" />
                Neue Firma
              </button>
            )}
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

        {/* Companies Table */}
        <div className="flex-1 overflow-auto p-6">
          {loading && companies.length === 0 ? (
            <div className="text-center py-12">
              <div className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Lade Firmen...
              </div>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-12">
              <Building className={`h-16 w-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <div className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Keine Firmen gefunden
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCompanies.map(company => {
                const isCollapsed = collapsedCompanies.has(company.id);
                return (
                <div 
                  key={company.id} 
                  className={`p-4 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-750 border-gray-700 hover:border-gray-600' 
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  } transition-colors`}
                >
                  {/* Company Header - ALWAYS VISIBLE */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className={`p-2 rounded-lg ${darkMode ? 'bg-cyan-900' : 'bg-cyan-100'}`}>
                        <Building className={`h-5 w-5 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {highlightMatch(company.name, searchTerm)}
                        </h3>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Kürzel: {highlightMatch(company.short_code, searchTerm)}
                        </p>
                      </div>
                      {/* Collapse Toggle Button */}
                      <button
                        onClick={() => toggleCollapse(company.id)}
                        className={`p-1 rounded transition-colors ${
                          darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        }`}
                        title={isCollapsed ? 'Ausklappen' : 'Einklappen'}
                      >
                        {isCollapsed ? (
                          <ChevronDown className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                        ) : (
                          <ChevronUp className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* COLLAPSIBLE CONTENT */}
                  {!isCollapsed && (
                    <>
                      {/* Description */}
                      {company.description && (
                        <p className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {company.description}
                        </p>
                      )}

                  {/* Adresse */}
                  {(company.street || company.city) && (
                    <div className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <p className="font-medium mb-1">📍 Adresse:</p>
                      {company.street && <p>{company.street}</p>}
                      {(company.postal_code || company.city) && (
                        <p>{company.postal_code} {company.city}</p>
                      )}
                      {company.country && company.country !== 'Deutschland' && <p>{company.country}</p>}
                    </div>
                  )}

                  {/* Ansprechpartner */}
                  {(company.contact_person_name || company.contact_person_email || company.contact_person_phone) && (
                    <div className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <p className="font-medium mb-1">👤 Ansprechpartner:</p>
                      {company.contact_person_name && <p>{company.contact_person_name}</p>}
                      {company.contact_person_email && <p>✉️ {company.contact_person_email}</p>}
                      {company.contact_person_phone && <p>📞 {company.contact_person_phone}</p>}
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="mb-3">
                    {company.is_blocked ? (
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
                    {!company.is_deletable && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-500 text-white ml-2">
                        <Shield className="h-3 w-3 mr-1" />
                        Geschützt
                      </span>
                    )}
                  </div>

                  {/* Actions (nur SysOp) */}
                  {canManage && (
                    <div className="flex items-center space-x-2 pt-3 border-t border-gray-700">
                      <button
                        onClick={() => openEditModal(company)}
                        className={`flex-1 p-2 rounded-lg transition-colors ${
                          darkMode
                            ? 'hover:bg-gray-700 text-blue-400'
                            : 'hover:bg-blue-50 text-blue-600'
                        }`}
                        title="Bearbeiten"
                      >
                        <Edit className="h-4 w-4 mx-auto" />
                      </button>

                      <button
                        onClick={() => handleBlockCompany(company.id, company.name, company.is_blocked)}
                        className={`flex-1 p-2 rounded-lg transition-colors ${
                          darkMode
                            ? 'hover:bg-gray-700 text-orange-400'
                            : 'hover:bg-orange-50 text-orange-600'
                        }`}
                        title={company.is_blocked ? 'Entsperren' : 'Sperren (inkl. aller User)'}
                      >
                        <Ban className="h-4 w-4 mx-auto" />
                      </button>

                      {company.is_deletable && (
                        <button
                          onClick={() => handleDeleteCompany(company.id, company.name)}
                          className={`flex-1 p-2 rounded-lg transition-colors ${
                            darkMode
                              ? 'hover:bg-gray-700 text-red-400'
                              : 'hover:bg-red-50 text-red-600'
                          }`}
                          title="Löschen"
                        >
                          <Trash2 className="h-4 w-4 mx-auto" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex justify-between items-center p-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {filteredCompanies.length} von {companies.length} Firmen
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
                {showCreateModal ? 'Neue Firma anlegen' : 'Firma bearbeiten'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
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
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Firmenname *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="z.B. ID2.de"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Beschreibung
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Kurze Beschreibung der Firma..."
                />
              </div>

              {/* Adresse Section */}
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h4 className={`font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  📍 Postalische Adresse
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Straße & Hausnummer
                    </label>
                    <input
                      type="text"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode
                          ? 'bg-gray-600 border-gray-500 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="z.B. Musterstraße 123"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        PLZ
                      </label>
                      <input
                        type="text"
                        value={formData.postal_code}
                        onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          darkMode
                            ? 'bg-gray-600 border-gray-500 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="12345"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Stadt
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          darkMode
                            ? 'bg-gray-600 border-gray-500 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="z.B. Berlin"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Land
                    </label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode
                          ? 'bg-gray-600 border-gray-500 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Deutschland"
                    />
                  </div>
                </div>
              </div>

              {/* Ansprechpartner Section */}
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h4 className={`font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  👤 Ansprechpartner
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Name
                    </label>
                    <input
                      type="text"
                      value={formData.contact_person_name}
                      onChange={(e) => setFormData({ ...formData, contact_person_name: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode
                          ? 'bg-gray-600 border-gray-500 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="z.B. Max Mustermann"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      E-Mail
                    </label>
                    <input
                      type="email"
                      value={formData.contact_person_email}
                      onChange={(e) => setFormData({ ...formData, contact_person_email: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode
                          ? 'bg-gray-600 border-gray-500 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="kontakt@firma.de"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Telefon
                    </label>
                    <input
                      type="text"
                      value={formData.contact_person_phone}
                      onChange={(e) => setFormData({ ...formData, contact_person_phone: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode
                          ? 'bg-gray-600 border-gray-500 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="+49 123 456789"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Logo URL (optional)
                </label>
                <input
                  type="text"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="https://..."
                />
              </div>

              <div className={`p-4 rounded-lg ${darkMode ? 'bg-blue-900 bg-opacity-20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
                <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                  💡 Das Firmenkürzel (2 Buchstaben) wird automatisch aus dem Namen generiert und für Projekt-IDs verwendet.
                </p>
              </div>
            </div>

            <div className={`flex justify-end gap-3 p-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
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
                onClick={showCreateModal ? handleCreateCompany : handleUpdateCompany}
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

export default CompanyManagementV2;
