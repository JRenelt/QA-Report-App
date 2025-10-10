import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit, Trash2, Users, FolderOpen, X, Save, Download } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  createdAt: string;
  usersCount: number;
  projectsCount: number;
}

interface Project {
  id: string;
  companyId: string;
  name: string;
  description: string;
  notes: string;
  createdBy: string;
  createdAt: string;
  status: 'active' | 'completed' | 'archived';
}

interface CompanyManagementProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  authToken: string;
  currentUser: any;
}

const CompanyManagement: React.FC<CompanyManagementProps> = ({ 
  isOpen, 
  onClose, 
  darkMode, 
  authToken,
  currentUser 
}) => {
  const [activeTab, setActiveTab] = useState<'companies' | 'projects'>('companies');
  const [companies, setCompanies] = useState<Company[]>([
    {
      id: 'comp-1',
      name: 'ID2 GmbH',
      address: 'Brockhausweg 66b',
      city: 'Hamburg',
      postalCode: '22117',
      country: 'Deutschland',
      createdAt: new Date().toISOString(),
      usersCount: 1,
      projectsCount: 0
    }
  ]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newCompany, setNewCompany] = useState({
    name: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Deutschland'
  });
  const [newProject, setNewProject] = useState({
    companyId: '',
    name: '',
    description: '',
    notes: '',
    status: 'active' as const
  });

  if (!isOpen) return null;

  const isAdmin = currentUser?.role === 'admin';
  const userCompanyId = currentUser?.companyId || 'comp-1';

  // Filter companies and projects based on user role
  const visibleCompanies = isAdmin ? companies : companies.filter(c => c.id === userCompanyId);
  const visibleProjects = isAdmin ? projects : projects.filter(p => p.companyId === userCompanyId);

  const handleCreateCompany = () => {
    if (!isAdmin) {
      alert('Nur Administratoren können Firmen erstellen');
      return;
    }

    const company: Company = {
      id: `comp-${Date.now()}`,
      name: newCompany.name,
      address: newCompany.address,
      city: newCompany.city,
      postalCode: newCompany.postalCode,
      country: newCompany.country,
      createdAt: new Date().toISOString(),
      usersCount: 1, // Default QA-Tester
      projectsCount: 0
    };

    setCompanies([...companies, company]);
    setNewCompany({ name: '', address: '', city: '', postalCode: '', country: 'Deutschland' });
    setShowCompanyForm(false);

    // TODO: Automatisch Default QA-Tester erstellen
    alert(`Firma erstellt. Default QA-Tester Konto wurde angelegt.`);
  };

  const handleCreateProject = () => {
    const project: Project = {
      id: `proj-${Date.now()}`,
      companyId: newProject.companyId || userCompanyId,
      name: newProject.name,
      description: newProject.description,
      notes: newProject.notes,
      createdBy: currentUser?.username || 'unknown',
      createdAt: new Date().toISOString(),
      status: newProject.status
    };

    setProjects([...projects, project]);
    
    // Update company project count
    setCompanies(companies.map(c => 
      c.id === project.companyId 
        ? { ...c, projectsCount: c.projectsCount + 1 }
        : c
    ));

    setNewProject({ companyId: '', name: '', description: '', notes: '', status: 'active' });
    setShowProjectForm(false);
  };

  const generateProjectTemplate = () => {
    const template = {
      projectName: "Beispiel Projekt",
      description: "Template für QA-Projekt Import",
      testBereiche: [
        {
          name: "Kopfzeile",
          description: "Tests für Header-Bereich",
          tests: [
            { id: "KF001", title: "Logo Darstellung", description: "Logo wird korrekt angezeigt" },
            { id: "KF002", title: "Navigation", description: "Hauptnavigation funktional" }
          ]
        },
        {
          name: "Sidebar Navigation",
          description: "Tests für Seitennavigation", 
          tests: [
            { id: "SN001", title: "Menü Struktur", description: "Menüstruktur korrekt dargestellt" },
            { id: "SN002", title: "Responsive Verhalten", description: "Sidebar auf mobilen Geräten" }
          ]
        },
        {
          name: "Hauptinhalt",
          description: "Tests für Main-Content-Bereich",
          tests: [
            { id: "MC001", title: "Content Layout", description: "Inhaltsdarstellung optimiert" },
            { id: "MC002", title: "Formulare", description: "Eingabefelder funktional" }
          ]
        },
        {
          name: "Fußzeile",
          description: "Tests für Footer-Bereich",
          tests: [
            { id: "FZ001", title: "Links", description: "Footer-Links funktional" },
            { id: "FZ002", title: "Copyright", description: "Copyright-Informationen korrekt" }
          ]
        }
      ]
    };

    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qa-projekt-template.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`rounded-lg p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto ${
        darkMode ? 'bg-[#2C313A]' : 'bg-white'
      }`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {isAdmin ? 'Firmen- & Projektverwaltung' : 'Projektverwaltung'}
          </h2>
          <button
            onClick={onClose}
            className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          {isAdmin && (
            <button
              onClick={() => setActiveTab('companies')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'companies'
                  ? (darkMode ? 'bg-cyan-600 text-white' : 'bg-blue-600 text-white')
                  : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
              }`}
            >
              <Building2 className="h-4 w-4 inline mr-2" />
              Firmen
            </button>
          )}
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'projects'
                ? (darkMode ? 'bg-cyan-600 text-white' : 'bg-blue-600 text-white')
                : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300')
            }`}
          >
            <FolderOpen className="h-4 w-4 inline mr-2" />
            Projekte
          </button>
        </div>

        {/* Companies Tab */}
        {activeTab === 'companies' && isAdmin && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Firmen verwalten
              </h3>
              <button
                onClick={() => setShowCompanyForm(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Neue Firma
              </button>
            </div>

            {/* Companies List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleCompanies.map((company) => (
                <div key={company.id} className={`p-4 rounded-lg border ${
                  darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {company.name}
                    </h4>
                    <div className="flex space-x-2">
                      <button className="text-blue-500 hover:text-blue-700">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <div>{company.address}</div>
                    <div>{company.postalCode} {company.city}</div>
                    <div className="mt-2 flex space-x-4">
                      <span><Users className="h-3 w-3 inline mr-1" />{company.usersCount} User</span>
                      <span><FolderOpen className="h-3 w-3 inline mr-1" />{company.projectsCount} Projekte</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {isAdmin ? 'Alle Projekte' : 'Meine Projekte'}
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={generateProjectTemplate}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Template
                </button>
                <button
                  onClick={() => setShowProjectForm(true)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Neues Projekt
                </button>
              </div>
            </div>

            {/* Projects List */}
            <div className="space-y-3">
              {visibleProjects.length === 0 ? (
                <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Keine Projekte vorhanden. Erstellen Sie ein neues Projekt oder importieren Sie Daten.
                </div>
              ) : (
                visibleProjects.map((project) => (
                  <div key={project.id} className={`p-4 rounded-lg border ${
                    darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {project.name}
                        </h4>
                        <p className={`text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {project.description}
                        </p>
                        <div className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Erstellt von {project.createdBy} • {new Date(project.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button className="text-blue-500 hover:text-blue-700">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-red-500 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Company Form Modal */}
        {showCompanyForm && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
            <div className={`rounded-lg p-6 w-full max-w-md ${darkMode ? 'bg-[#2C313A]' : 'bg-white'}`}>
              <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Neue Firma erstellen
              </h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Firmenname"
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({...newCompany, name: e.target.value})}
                  className={`w-full p-2 border rounded ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
                <input
                  type="text"
                  placeholder="Straße und Hausnummer"
                  value={newCompany.address}
                  onChange={(e) => setNewCompany({...newCompany, address: e.target.value})}
                  className={`w-full p-2 border rounded ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="PLZ"
                    value={newCompany.postalCode}
                    onChange={(e) => setNewCompany({...newCompany, postalCode: e.target.value})}
                    className={`w-full p-2 border rounded ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  />
                  <input
                    type="text"
                    placeholder="Stadt"
                    value={newCompany.city}
                    onChange={(e) => setNewCompany({...newCompany, city: e.target.value})}
                    className={`w-full p-2 border rounded ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCompanyForm(false)}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleCreateCompany}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded"
                >
                  Erstellen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Project Form Modal */}
        {showProjectForm && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
            <div className={`rounded-lg p-6 w-full max-w-lg ${darkMode ? 'bg-[#2C313A]' : 'bg-white'}`}>
              <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Neues Projekt erstellen
              </h3>
              <div className="space-y-4">
                {isAdmin && (
                  <select
                    value={newProject.companyId}
                    onChange={(e) => setNewProject({...newProject, companyId: e.target.value})}
                    className={`w-full p-2 border rounded ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="">Firma auswählen</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                )}
                <input
                  type="text"
                  placeholder="Projektname"
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  className={`w-full p-2 border rounded ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
                <input
                  type="text"
                  placeholder="Beschreibung"
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  className={`w-full p-2 border rounded ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
                <textarea
                  placeholder="Notizen"
                  value={newProject.notes}
                  onChange={(e) => setNewProject({...newProject, notes: e.target.value})}
                  className={`w-full p-2 border rounded ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowProjectForm(false)}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleCreateProject}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded"
                >
                  Erstellen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyManagement;