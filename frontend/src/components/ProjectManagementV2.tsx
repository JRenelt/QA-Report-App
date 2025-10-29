import React, { useState, useEffect } from 'react';
import { X, Plus, Edit, Trash2, Ban, CheckCircle, Search, AlertCircle, FolderKanban, Users, User, Clock, Building, Download, FileSpreadsheet, FileJson, Upload } from 'lucide-react';

interface ProjectManagementV2Props {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  currentUser: any;
}

interface ProjectV2 {
  id: string;
  project_id: string;
  title: string;
  description: string;
  notes: string;
  company_id: string;
  company_name: string;
  status: string;
  is_blocked: boolean;
  assigned_testers: QATesterAssignment[];
  created_at: string;
}

interface QATesterAssignment {
  user_id: string;
  username: string;
  assigned_at: string;
}

interface Company {
  id: string;
  name: string;
}

interface UserV2 {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
}

const ProjectManagementV2: React.FC<ProjectManagementV2Props> = ({ isOpen, onClose, darkMode, currentUser }) => {
  // Safety check: Falls currentUser null ist (nach DB-Leerung)
  if (!currentUser) {
    return null;
  }

  const [projects, setProjects] = useState<ProjectV2[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<UserV2[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('all');
  
  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectV2 | null>(null);
  
  // Modal-specific error (appears inside dialog)
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  
  // Import States
  const [importTab, setImportTab] = useState<'csv' | 'json' | 'manual'>('csv');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  
  // Form Data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    notes: '',
    company_id: ''
  });

  // Load data on mount
  useEffect(() => {
    if (isOpen) {
      loadProjects();
      loadCompanies();
      loadUsers();
    }
  }, [isOpen, selectedCompanyFilter]);

  // SysOp: Automatisch ID2.de Firma vorauswählen beim ersten Laden
  useEffect(() => {
    if (isOpen && currentUser.role === 'sysop' && companies.length > 0 && selectedCompanyFilter === 'all') {
      // Finde ID2.de Firma
      const id2Company = companies.find(c => c.name === 'ID2.de');
      if (id2Company) {
        setSelectedCompanyFilter(id2Company.id);
      }
    }
  }, [isOpen, companies, currentUser.role]);

  const loadProjects = async () => {
    setLoading(true);
    setError('');
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const token = localStorage.getItem('authToken');

      // Build URL with company filter for SysOp
      let url = `${backendUrl}/api/projects-v2/`;
      if (currentUser.role === 'sysop' && selectedCompanyFilter !== 'all') {
        url += `?company_id=${selectedCompanyFilter}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Fehler beim Laden der Projekte');
      }
    } catch (err) {
      setError('Fehler beim Laden der Projekte');
      console.error('Load projects error:', err);
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
        setCompanies(data);
      }
    } catch (err) {
      console.error('Load companies error:', err);
    }
  };

  const loadUsers = async () => {
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
      }
    } catch (err) {
      console.error('Load users error:', err);
    }
  };

  const handleCreateProject = async () => {
    setModalError('');
    setModalSuccess('');

    // Validierung
    if (!formData.title.trim()) {
      setModalError('❌ Projekttitel ist ein Pflichtfeld');
      return;
    }
    
    if (!formData.description.trim()) {
      setModalError('❌ Projektbeschreibung ist ein Pflichtfeld');
      return;
    }
    
    if (!formData.company_id) {
      setModalError('❌ Bitte wählen Sie eine Firma aus');
      return;
    }

    setLoading(true);

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${backendUrl}/api/projects-v2/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccess('✅ Projekt erfolgreich angelegt!');
        setShowCreateModal(false);
        resetForm();
        loadProjects();
      } else {
        const errorData = await response.json();
        // Detaillierte Fehlermeldung
        let errorMessage = '❌ Fehler beim Anlegen des Projekts:\n\n';
        
        if (errorData.detail) {
          if (typeof errorData.detail === 'string') {
            errorMessage += errorData.detail;
          } else if (Array.isArray(errorData.detail)) {
            errorMessage += errorData.detail.map((err: any) => `• ${err.msg || err}`).join('\n');
          } else {
            errorMessage += JSON.stringify(errorData.detail);
          }
        } else {
          errorMessage += `Server antwortete mit Status ${response.status}`;
        }
        
        errorMessage += '\n\n💡 Bitte überprüfen Sie Ihre Eingaben und versuchen Sie es erneut.';
        setModalError(errorMessage);
      }
    } catch (err) {
      console.error('Create project error:', err);
      setModalError(
        '❌ Netzwerkfehler:\n\n' +
        'Die Verbindung zum Server konnte nicht hergestellt werden.\n\n' +
        '💡 Mögliche Ursachen:\n' +
        '• Backend ist nicht erreichbar\n' +
        '• Netzwerkprobleme\n' +
        '• Token abgelaufen\n\n' +
        'Bitte versuchen Sie es erneut oder kontaktieren Sie den Administrator.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProject = async () => {
    if (!selectedProject) return;

    setError('');
    setSuccess('');

    setLoading(true);

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${backendUrl}/api/projects-v2/${selectedProject.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccess('Projekt erfolgreich aktualisiert!');
        setShowEditModal(false);
        setSelectedProject(null);
        resetForm();
        loadProjects();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Fehler beim Aktualisieren des Projekts');
      }
    } catch (err) {
      setError('Fehler beim Aktualisieren des Projekts');
      console.error('Update project error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string, projectTitle: string) => {
    if (!confirm(`Projekt "${projectTitle}" wirklich löschen? Alle zugehörigen Testfälle werden ebenfalls gelöscht!`)) return;

    setLoading(true);
    setError('');

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${backendUrl}/api/projects-v2/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        setSuccess('Projekt erfolgreich gelöscht!');
        loadProjects();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Fehler beim Löschen des Projekts');
      }
    } catch (err) {
      setError('Fehler beim Löschen des Projekts');
      console.error('Delete project error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockProject = async (projectId: string, projectTitle: string, currentlyBlocked: boolean) => {
    const action = currentlyBlocked ? 'entsperren' : 'sperren';
    if (!confirm(`Projekt "${projectTitle}" wirklich ${action}?`)) return;

    setLoading(true);
    setError('');

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${backendUrl}/api/projects-v2/${projectId}/block`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        setSuccess(`Projekt erfolgreich ${currentlyBlocked ? 'entsperrt' : 'gesperrt'}!`);
        loadProjects();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || `Fehler beim ${action} des Projekts`);
      }
    } catch (err) {
      setError(`Fehler beim ${action} des Projekts`);
      console.error('Block project error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTester = async (userId: string) => {
    if (!selectedProject) return;

    setLoading(true);
    setError('');

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${backendUrl}/api/projects-v2/${selectedProject.id}/assign-tester/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        setSuccess('QA-Tester erfolgreich zugewiesen!');
        setShowAssignModal(false);
        loadProjects();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Fehler beim Zuweisen des Testers');
      }
    } catch (err) {
      setError('Fehler beim Zuweisen des Testers');
      console.error('Assign tester error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTester = async (projectId: string, userId: string) => {
    if (!confirm('QA-Tester wirklich entfernen?')) return;

    setLoading(true);
    setError('');

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const token = localStorage.getItem('authToken');

      const response = await fetch(`${backendUrl}/api/projects-v2/${projectId}/assign-tester/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        setSuccess('QA-Tester erfolgreich entfernt!');
        loadProjects();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Fehler beim Entfernen des Testers');
      }
    } catch (err) {
      setError('Fehler beim Entfernen des Testers');
      console.error('Remove tester error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    resetForm();
    if (currentUser.role === 'admin') {
      setFormData(prev => ({ ...prev, company_id: currentUser.company_id }));
    }
    setShowCreateModal(true);
  };

  const openEditModal = (project: ProjectV2) => {
    setSelectedProject(project);
    
    // QA-Tester kann nur notes ändern
    if (currentUser.role === 'qa_tester') {
      setFormData({
        title: project.title,
        description: project.description,
        notes: project.notes,
        company_id: project.company_id
      });
    } else {
      setFormData({
        title: project.title,
        description: project.description,
        notes: project.notes,
        company_id: project.company_id
      });
    }
    setShowEditModal(true);
  };

  const openAssignModal = (project: ProjectV2) => {
    setSelectedProject(project);
    setShowAssignModal(true);
  };

  // Import-Funktionen
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportPreview([]);
    setImportResult(null);

    // Vorschau laden
    await loadImportPreview(file);
  };

  const loadImportPreview = async (file: File) => {
    setImportLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const token = localStorage.getItem('authToken');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('file_type', importTab === 'csv' ? 'csv' : 'json');
      formData.append('import_type', 'projects');

      const response = await fetch(`${backendUrl}/api/import-v2/preview`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setImportPreview(data.preview);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Fehler beim Laden der Vorschau');
      }
    } catch (err) {
      setError('Fehler beim Laden der Vorschau');
      console.error('Preview error:', err);
    } finally {
      setImportLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      setError('Bitte wählen Sie eine Datei aus');
      return;
    }

    // Bestätigung
    const duplicateCount = importPreview.filter(p => p.is_duplicate).length;
    const importCount = importPreview.length - duplicateCount;
    
    if (!confirm(`${importCount} Projekte werden importiert. ${duplicateCount} Duplikate werden übersprungen.\n\nFortfahren?`)) {
      return;
    }

    setImportLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const token = localStorage.getItem('authToken');
      
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('file_type', importTab === 'csv' ? 'csv' : 'json');

      const response = await fetch(`${backendUrl}/api/import-v2/projects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setImportResult(data);
        setSuccess(`✅ ${data.imported} Projekte importiert, ${data.skipped} übersprungen`);
        
        // Liste neu laden
        await loadProjects();
        
        // Modal nach 3 Sekunden schließen
        setTimeout(() => {
          setShowImportModal(false);
          setImportFile(null);
          setImportPreview([]);
          setImportResult(null);
        }, 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Fehler beim Import');
      }
    } catch (err) {
      setError('Fehler beim Import');
      console.error('Import error:', err);
    } finally {
      setImportLoading(false);
    }
  };

  const resetImport = () => {
    setImportFile(null);
    setImportPreview([]);
    setImportResult(null);
    setImportTab('csv');
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      notes: '',
      company_id: ''
    });
    setModalError('');
    setModalSuccess('');
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter projects
  const filteredProjects = projects.filter(project => 
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.project_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get available testers for assignment
  const getAvailableTesters = () => {
    if (!selectedProject) return [];
    const assignedIds = selectedProject.assigned_testers.map(t => t.user_id);
    return users.filter(u => u.role === 'qa_tester' && !assignedIds.includes(u.id));
  };

  if (!isOpen) return null;

  const canManage = currentUser?.role === 'sysop' || currentUser?.role === 'admin';
  const canEdit = canManage || currentUser?.role === 'qa_tester';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-7xl rounded-lg shadow-xl max-h-[90vh] overflow-hidden flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${darkMode ? 'bg-cyan-900' : 'bg-cyan-100'}`}>
              <FolderKanban className={`h-6 w-6 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Projektverwaltung
              </h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {currentUser.role === 'sysop' ? 'Alle Projekte verwalten' : 
                 currentUser.role === 'admin' ? 'Projekte Ihrer Firma verwalten' :
                 'Zugewiesene Projekte'}
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
                placeholder="Suche nach Projekttitel, ID oder Firma..."
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

            {/* Template Download Buttons & Import - Nur sichtbar bei spezifischer Firma (nicht "Alle Firmen") */}
            {((currentUser.role === 'admin') || (currentUser.role === 'sysop' && selectedCompanyFilter !== 'all')) && (
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      const backendUrl = process.env.REACT_APP_BACKEND_URL;
                      const token = localStorage.getItem('authToken');
                      const response = await fetch(`${backendUrl}/api/templates/project-template-csv`, {
                        headers: {
                          'Authorization': `Bearer ${token}`
                        }
                      });
                      if (response.ok) {
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'projekt_testfaelle_template.csv';
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                        setSuccess('Excel-Template heruntergeladen');
                      } else {
                        setError('Fehler beim Download des Excel-Templates');
                      }
                    } catch (err) {
                      setError('Fehler beim Download des Excel-Templates');
                      console.error('Template download error:', err);
                    }
                  }}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors flex items-center ${
                    darkMode
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                  title="Excel Template herunterladen"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-1" />
                  Excel
                </button>

                <button
                  onClick={async () => {
                    try {
                      const backendUrl = process.env.REACT_APP_BACKEND_URL;
                      const token = localStorage.getItem('authToken');
                      const response = await fetch(`${backendUrl}/api/templates/project-template-json`, {
                        headers: {
                          'Authorization': `Bearer ${token}`
                        }
                      });
                      if (response.ok) {
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'projekt_template.json';
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                      } else {
                        setError('Fehler beim Download des JSON-Templates');
                      }
                    } catch (err) {
                      setError('Fehler beim Download des JSON-Templates');
                      console.error('Template download error:', err);
                    }
                  }}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors flex items-center ${
                    darkMode
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                  title="JSON Template herunterladen"
                >
                  <FileJson className="h-4 w-4 mr-1" />
                  JSON
                </button>

                <button
                  onClick={() => setShowImportModal(true)}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors flex items-center ${
                    darkMode
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-purple-500 hover:bg-purple-600 text-white'
                  }`}
                  title="Projekte importieren"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Import
                </button>
              </div>
            )}

            {/* Create Button - Nur anzeigen wenn: Admin ODER (SysOp UND Firma ausgewählt) */}
            {canManage && (currentUser.role === 'admin' || (currentUser.role === 'sysop' && selectedCompanyFilter !== 'all')) && (
              <button
                onClick={openCreateModal}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                  darkMode
                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                    : 'bg-cyan-500 hover:bg-cyan-600 text-white'
                }`}
              >
                <Plus className="h-5 w-5 mr-2" />
                Neues Projekt
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

        {/* Projects Grid */}
        <div className="flex-1 overflow-auto p-6">
          {loading && projects.length === 0 ? (
            <div className="text-center py-12">
              <div className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Lade Projekte...
              </div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <FolderKanban className={`h-16 w-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <div className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Keine Projekte gefunden
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProjects.map(project => (
                <div 
                  key={project.id} 
                  className={`p-4 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-750 border-gray-700 hover:border-gray-600' 
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  } transition-colors`}
                >
                  {/* Project Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <FolderKanban className={`h-4 w-4 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
                        <span 
                          className={`text-xs font-mono ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                          data-content={project.project_id}
                        >
                          {project.project_id}
                        </span>
                      </div>
                      <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {project.title}
                      </h3>
                      <p className={`text-sm flex items-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <Building className="h-3 w-3 mr-1" />
                        {project.company_name}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {project.description}
                  </p>

                  {/* Notes */}
                  {project.notes && (
                    <div className={`text-sm mb-3 p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <p className="font-medium mb-1">📝 Notizen:</p>
                      <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{project.notes}</p>
                    </div>
                  )}

                  {/* Assigned Testers */}
                  {project.assigned_testers.length > 0 && (
                    <div className="mb-3">
                      <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        👥 Zugeordnete QA-Tester:
                      </p>
                      <div className="space-y-1">
                        {project.assigned_testers.map((tester, index) => (
                          <div 
                            key={tester.user_id}
                            className={`flex items-center justify-between p-2 rounded text-sm ${
                              darkMode ? 'bg-gray-700' : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <User className="h-3 w-3" />
                              <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                                {tester.username}
                              </span>
                              {index === 0 && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500 text-white">
                                  Aktuell
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs flex items-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                <Clock className="h-3 w-3 mr-1" />
                                {formatDateTime(tester.assigned_at)}
                              </span>
                              {canManage && (
                                <button
                                  onClick={() => handleRemoveTester(project.id, tester.user_id)}
                                  className={`p-1 rounded transition-colors ${
                                    darkMode ? 'hover:bg-gray-600 text-red-400' : 'hover:bg-red-50 text-red-600'
                                  }`}
                                  title="Entfernen"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="mb-3">
                    {project.is_blocked ? (
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
                  </div>

                  {/* Actions */}
                  <div className={`flex items-center gap-2 pt-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    {canEdit && (
                      <button
                        onClick={() => openEditModal(project)}
                        className={`flex-1 p-2 rounded-lg transition-colors ${
                          darkMode
                            ? 'hover:bg-gray-700 text-blue-400'
                            : 'hover:bg-blue-50 text-blue-600'
                        }`}
                        title="Bearbeiten"
                      >
                        <Edit className="h-4 w-4 mx-auto" />
                      </button>
                    )}

                    {canManage && (
                      <>
                        <button
                          onClick={() => openAssignModal(project)}
                          className={`flex-1 p-2 rounded-lg transition-colors ${
                            darkMode
                              ? 'hover:bg-gray-700 text-green-400'
                              : 'hover:bg-green-50 text-green-600'
                          }`}
                          title="QA-Tester zuweisen"
                        >
                          <Users className="h-4 w-4 mx-auto" />
                        </button>

                        {currentUser.role === 'sysop' && (
                          <button
                            onClick={() => handleBlockProject(project.id, project.title, project.is_blocked)}
                            className={`flex-1 p-2 rounded-lg transition-colors ${
                              darkMode
                                ? 'hover:bg-gray-700 text-orange-400'
                                : 'hover:bg-orange-50 text-orange-600'
                            }`}
                            title={project.is_blocked ? 'Entsperren' : 'Sperren'}
                          >
                            <Ban className="h-4 w-4 mx-auto" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteProject(project.id, project.title)}
                          className={`flex-1 p-2 rounded-lg transition-colors ${
                            darkMode
                              ? 'hover:bg-gray-700 text-red-400'
                              : 'hover:bg-red-50 text-red-600'
                          }`}
                          title="Löschen"
                        >
                          <Trash2 className="h-4 w-4 mx-auto" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex justify-between items-center p-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {filteredProjects.length} von {projects.length} Projekten
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
                {showCreateModal ? 'Neues Projekt anlegen' : 'Projekt bearbeiten'}
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

            {/* Modal Error/Success Messages */}
            {modalError && (
              <div className="mx-6 mt-4 p-4 rounded-lg bg-red-500 bg-opacity-10 border border-red-500">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-red-500 whitespace-pre-line text-sm">{modalError}</p>
                  </div>
                  <button
                    onClick={() => setModalError('')}
                    className="text-red-500 hover:text-red-600 ml-2"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {modalSuccess && (
              <div className="mx-6 mt-4 p-4 rounded-lg bg-green-500 bg-opacity-10 border border-green-500">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-green-500 whitespace-pre-line text-sm">{modalSuccess}</p>
                  </div>
                  <button
                    onClick={() => setModalSuccess('')}
                    className="text-green-500 hover:text-green-600 ml-2"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="p-6 space-y-4">
              {(canManage || showCreateModal) && (
                <>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Projekttitel * {currentUser.role === 'qa_tester' && '(nicht änderbar)'}
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      disabled={currentUser.role === 'qa_tester'}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        currentUser.role === 'qa_tester'
                          ? 'bg-gray-600 cursor-not-allowed'
                          : darkMode
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="z.B. Website Relaunch"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Beschreibung * {currentUser.role === 'qa_tester' && '(nicht änderbar)'}
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      disabled={currentUser.role === 'qa_tester'}
                      rows={3}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        currentUser.role === 'qa_tester'
                          ? 'bg-gray-600 cursor-not-allowed'
                          : darkMode
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Projektbeschreibung..."
                    />
                  </div>
                </>
              )}

              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Notizen (optional) {currentUser.role === 'qa_tester' && '(änderbar)'}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Zusätzliche Notizen..."
                />
              </div>

              {showCreateModal && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Firma *
                  </label>
                  <select
                    value={formData.company_id}
                    onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                    disabled={currentUser.role === 'admin'}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Firma wählen...</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {showCreateModal && (
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-blue-900 bg-opacity-20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
                  <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                    💡 Die Projekt-ID wird automatisch generiert: [Firmenkürzel][Ihr Vorname-Initial][Ihr Nachname-Initial][Uhrzeit][Lfd-Nr]
                  </p>
                </div>
              )}
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
                onClick={showCreateModal ? handleCreateProject : handleUpdateProject}
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

      {/* Assign Tester Modal */}
      {showAssignModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className={`w-full max-w-md rounded-lg shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`flex items-center justify-between p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                QA-Tester zuweisen
              </h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode 
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Projekt: <strong>{selectedProject.title}</strong>
              </p>

              {getAvailableTesters().length === 0 ? (
                <div className="text-center py-8">
                  <Users className={`h-12 w-12 mx-auto mb-2 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                  <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                    Keine verfügbaren QA-Tester
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {getAvailableTesters().map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleAssignTester(user.id)}
                      className={`w-full p-3 rounded-lg border text-left transition-colors ${
                        darkMode
                          ? 'border-gray-700 hover:border-cyan-500 hover:bg-gray-750'
                          : 'border-gray-200 hover:border-cyan-500 hover:bg-cyan-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <div>
                          <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {user.username}
                          </div>
                          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {user.first_name} {user.last_name}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={`flex justify-end p-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={() => setShowAssignModal(false)}
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
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className={`w-full max-w-4xl rounded-lg shadow-xl max-h-[90vh] overflow-hidden flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${darkMode ? 'bg-purple-900' : 'bg-purple-100'}`}>
                  <Upload className={`h-6 w-6 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
                <div>
                  <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Projekte importieren
                  </h2>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Lade Templates herunter, fülle sie aus und importiere sie hier
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  resetImport();
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

            {/* Tabs */}
            <div className={`flex border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={() => setImportTab('csv')}
                className={`flex-1 px-6 py-3 font-medium transition-colors ${
                  importTab === 'csv'
                    ? darkMode
                      ? 'bg-cyan-900 text-cyan-400 border-b-2 border-cyan-400'
                      : 'bg-cyan-50 text-cyan-600 border-b-2 border-cyan-600'
                    : darkMode
                      ? 'text-gray-400 hover:text-white hover:bg-gray-750'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <FileSpreadsheet className="h-4 w-4 inline mr-2" />
                CSV/Excel Upload
              </button>
              <button
                onClick={() => setImportTab('json')}
                className={`flex-1 px-6 py-3 font-medium transition-colors ${
                  importTab === 'json'
                    ? darkMode
                      ? 'bg-cyan-900 text-cyan-400 border-b-2 border-cyan-400'
                      : 'bg-cyan-50 text-cyan-600 border-b-2 border-cyan-600'
                    : darkMode
                      ? 'text-gray-400 hover:text-white hover:bg-gray-750'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <FileJson className="h-4 w-4 inline mr-2" />
                JSON Upload
              </button>
              <button
                onClick={() => setImportTab('manual')}
                className={`flex-1 px-6 py-3 font-medium transition-colors ${
                  importTab === 'manual'
                    ? darkMode
                      ? 'bg-cyan-900 text-cyan-400 border-b-2 border-cyan-400'
                      : 'bg-cyan-50 text-cyan-600 border-b-2 border-cyan-600'
                    : darkMode
                      ? 'text-gray-400 hover:text-white hover:bg-gray-750'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Plus className="h-4 w-4 inline mr-2" />
                Manuelle Eingabe
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* CSV/JSON Upload Tab */}
              {(importTab === 'csv' || importTab === 'json') && (
                <div className="space-y-4">
                  {/* File Upload */}
                  <div className={`border-2 border-dashed rounded-lg p-8 text-center ${
                    darkMode ? 'border-gray-600 bg-gray-750' : 'border-gray-300 bg-gray-50'
                  }`}>
                    <Upload className={`h-12 w-12 mx-auto mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {importTab === 'csv' ? 'CSV/Excel-Datei' : 'JSON-Datei'} auswählen
                    </p>
                    <input
                      type="file"
                      accept={importTab === 'csv' ? '.csv,.xlsx' : '.json'}
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className={`inline-block px-6 py-3 rounded-lg font-medium cursor-pointer transition-colors ${
                        darkMode
                          ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                          : 'bg-cyan-500 hover:bg-cyan-600 text-white'
                      }`}
                    >
                      Datei auswählen
                    </label>
                    {importFile && (
                      <p className={`mt-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        📄 {importFile.name} ({(importFile.size / 1024).toFixed(2)} KB)
                      </p>
                    )}
                  </div>

                  {/* Preview */}
                  {importPreview.length > 0 && (
                    <div className="space-y-2">
                      <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Vorschau ({importPreview.length} Einträge)
                      </h3>
                      <div className={`border rounded-lg overflow-hidden ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <table className="w-full">
                          <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium uppercase">Zeile</th>
                              <th className="px-4 py-2 text-left text-xs font-medium uppercase">Titel</th>
                              <th className="px-4 py-2 text-left text-xs font-medium uppercase">Firma</th>
                              <th className="px-4 py-2 text-left text-xs font-medium uppercase">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-700">
                            {importPreview.map((item, idx) => (
                              <tr key={idx} className={item.is_duplicate ? (darkMode ? 'bg-yellow-900 bg-opacity-20' : 'bg-yellow-50') : ''}>
                                <td className={`px-4 py-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {item.row}
                                </td>
                                <td className={`px-4 py-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {item.data?.title || '-'}
                                </td>
                                <td className={`px-4 py-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {item.data?.company_id || '-'}
                                </td>
                                <td className={`px-4 py-2 text-sm`}>
                                  {item.is_duplicate ? (
                                    <span className="px-2 py-1 rounded text-xs bg-yellow-600 text-white">
                                      Duplikat - Übersprungen
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 rounded text-xs bg-green-600 text-white">
                                      Wird importiert
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Import Result */}
                  {importResult && (
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-green-900 bg-opacity-20 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
                      <p className={`font-semibold ${darkMode ? 'text-green-400' : 'text-green-700'}`}>
                        ✅ Import erfolgreich!
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-green-300' : 'text-green-600'}`}>
                        {importResult.imported} importiert, {importResult.skipped} übersprungen
                      </p>
                      {importResult.errors && importResult.errors.length > 0 && (
                        <div className="mt-2">
                          <p className={`text-sm font-medium ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                            Fehler:
                          </p>
                          <ul className="list-disc list-inside text-sm">
                            {importResult.errors.map((err: string, idx: number) => (
                              <li key={idx} className={darkMode ? 'text-red-300' : 'text-red-500'}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Manual Input Tab */}
              {importTab === 'manual' && (
                <div className={`p-6 rounded-lg text-center ${darkMode ? 'bg-gray-750' : 'bg-gray-50'}`}>
                  <Plus className={`h-12 w-12 mx-auto mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Für manuelle Projekterstellung bitte den "Neues Projekt" Button verwenden
                  </p>
                  <button
                    onClick={() => {
                      setShowImportModal(false);
                      openCreateModal();
                    }}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      darkMode
                        ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                        : 'bg-cyan-500 hover:bg-cyan-600 text-white'
                    }`}
                  >
                    Neues Projekt erstellen
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            {(importTab === 'csv' || importTab === 'json') && (
              <div className={`flex justify-between p-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    resetImport();
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
                  onClick={handleImport}
                  disabled={!importFile || importPreview.length === 0 || importLoading}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center ${
                    darkMode
                      ? 'bg-cyan-600 hover:bg-cyan-700 text-white disabled:bg-gray-700 disabled:text-gray-500'
                      : 'bg-cyan-500 hover:bg-cyan-600 text-white disabled:bg-gray-300 disabled:text-gray-500'
                  }`}
                >
                  {importLoading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Importiere...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Importieren ({importPreview.filter(p => !p.is_duplicate).length})
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagementV2;
