import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit, Trash2, Users, FolderOpen, X, Save, Download, FileDown, Upload } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
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
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Companies vom Backend laden
  const loadCompanies = async () => {
    try {
      setLoading(true);
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://test-result-dash.preview.emergentagent.com';
      const response = await fetch(`${backendUrl}/api/companies/`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
        localStorage.setItem('qa_companies', JSON.stringify(data));
        console.log(`✅ ${data.length} Companies vom Backend geladen`);
      } else {
        console.error('❌ Fehler beim Laden der Companies:', response.status);
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden der Companies:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Companies beim Öffnen laden
  useEffect(() => {
    if (isOpen && authToken) {
      loadCompanies();
    }
  }, [isOpen, authToken]);
  
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('qa_projects');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Fehler beim Laden der Projekte:', e);
      }
    }
    // KEIN Fallback mehr - leeres Array wenn keine Projekte vorhanden
    console.log('Keine Projekte in localStorage gefunden - leeres Array');
    return [];
  });
  
  // Projekte in localStorage synchronisieren
  React.useEffect(() => {
    localStorage.setItem('qa_projects', JSON.stringify(projects));
  }, [projects]);
  
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newCompany, setNewCompany] = useState({
    name: '',
    description: '',
    logoUrl: ''
  });
  const [newProject, setNewProject] = useState<{
    companyId: string;
    name: string;
    description: string;
    notes: string;
    status: 'active' | 'completed' | 'archived';
  }>({
    companyId: '',
    name: '',
    description: '',
    notes: '',
    status: 'active'
  });

  // Admin: Firma zur Bearbeitung/Ansicht auswählen (MUSS vor return stehen!)
  const [selectedCompanyForEdit, setSelectedCompanyForEdit] = useState<string>('');
  // Aktive Firma (für visuelle Hervorhebung)
  const [activeCompanyId, setActiveCompanyId] = useState<string>('');
  
  // Wenn aktive Firma gesetzt ist und zum Projekt-Tab gewechselt wird, selectedCompanyForEdit synchronisieren
  React.useEffect(() => {
    if (activeTab === 'projects' && activeCompanyId && !selectedCompanyForEdit) {
      setSelectedCompanyForEdit(activeCompanyId);
    }
  }, [activeTab, activeCompanyId, selectedCompanyForEdit]);

  if (!isOpen) return null;

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'sysop';
  const userCompanyId = currentUser?.companyId || 'comp-1';

  // Filter companies and projects based on user role
  const visibleCompanies = isAdmin ? companies : companies.filter(c => c.id === userCompanyId);
  
  // Admin kann Firma auswählen, deren Projekte bearbeitet werden sollen
  const visibleProjects = isAdmin 
    ? (selectedCompanyForEdit ? projects.filter(p => p.companyId === selectedCompanyForEdit) : projects)
    : projects.filter(p => p.companyId === userCompanyId);

  const handleCreateCompany = async () => {
    if (!isAdmin) {
      alert('Nur Administratoren können Firmen erstellen');
      return;
    }

    // Schutz vor Überschreibung von ID2
    if (newCompany.name.includes('ID2') || newCompany.name.includes('Jörg Renelt')) {
      alert('❌ Fehler: Administrator-Daten (ID2, Jörg Renelt) sind schreibgeschützt und können nicht überschrieben werden.');
      return;
    }

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://test-result-dash.preview.emergentagent.com';
      const response = await fetch(`${backendUrl}/api/companies/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newCompany.name,
          description: newCompany.description,
          logo_url: newCompany.logoUrl || null
        })
      });

      if (response.ok) {
        const createdCompany = await response.json();
        console.log('✅ Firma erstellt:', createdCompany);
        await loadCompanies(); // Neu laden
        setNewCompany({ name: '', description: '', logoUrl: '' });
        setShowCompanyForm(false);
        alert(`✅ Firma "${newCompany.name}" erfolgreich erstellt.`);
      } else {
        const error = await response.json();
        console.error('❌ Fehler beim Erstellen der Firma:', error);
        alert(`❌ Fehler beim Erstellen der Firma: ${error.detail || 'Unbekannter Fehler'}`);
      }
    } catch (error) {
      console.error('❌ Fehler beim Erstellen der Firma:', error);
      alert(`❌ Fehler beim Erstellen der Firma: ${error}`);
    }
  };

  const handleCreateProject = () => {
    const project: Project = {
      id: `PROJ${Date.now()}`,  // Konsistentes Format
      companyId: newProject.companyId || userCompanyId,
      name: newProject.name,
      description: newProject.description,
      notes: newProject.notes,
      createdBy: currentUser?.username || 'unknown',
      createdAt: new Date().toISOString(),
      status: newProject.status
    };

    // Projekte aktualisieren und in localStorage speichern
    const updatedProjects = [...projects, project];
    setProjects(updatedProjects);
    localStorage.setItem('qa_projects', JSON.stringify(updatedProjects));
    console.log('Projekt gespeichert in localStorage:', project.id);
    
    // Standard Test-Suites für neues Projekt erstellen
    const defaultTestSuites = [
      { id: '1', name: 'Allgemeines Design', icon: 'palette', totalTests: 0, passedTests: 0, failedTests: 0, openTests: 0 },
      { id: '2', name: 'Testfall Kopfzeile', icon: 'menu', totalTests: 0, passedTests: 0, failedTests: 0, openTests: 0 },
      { id: '3', name: 'Navigation Bereich', icon: 'navigation', totalTests: 0, passedTests: 0, failedTests: 0, openTests: 0 },
      { id: '4', name: 'Suchfeld Bereich', icon: 'search', totalTests: 0, passedTests: 0, failedTests: 0, openTests: 0 },
      { id: '5', name: 'Sidebar Bereich', icon: 'sidebar', totalTests: 0, passedTests: 0, failedTests: 0, openTests: 0 },
      { id: '6', name: 'Hauptinhalt Bereich', icon: 'file', totalTests: 0, passedTests: 0, failedTests: 0, openTests: 0 },
      { id: '7', name: 'Footer Bereich', icon: 'footer', totalTests: 0, passedTests: 0, failedTests: 0, openTests: 0 },
      { id: '8', name: 'Dialoge und Modale', icon: 'dialog', totalTests: 0, passedTests: 0, failedTests: 0, openTests: 0 },
      { id: '9', name: 'Formular Eingaben', icon: 'form', totalTests: 0, passedTests: 0, failedTests: 0, openTests: 0 },
      { id: '10', name: 'Loading und Feedback', icon: 'loading', totalTests: 0, passedTests: 0, failedTests: 0, openTests: 0 },
      { id: '11', name: 'Responsive Design', icon: 'responsive', totalTests: 0, passedTests: 0, failedTests: 0, openTests: 0 },
    ];
    
    // Test-Suites und leere Test-Cases für neues Projekt in localStorage speichern
    const suiteKey = `qa_suites_${project.id}`;
    const casesKey = `qa_cases_${project.id}`;
    localStorage.setItem(suiteKey, JSON.stringify(defaultTestSuites));
    localStorage.setItem(casesKey, JSON.stringify([]));
    console.log(`Standard Test-Suites erstellt für neues Projekt ${project.id}`);
    
    // Update company project count
    setCompanies(companies.map(c => 
      c.id === project.companyId 
        ? { ...c, projectsCount: c.projectsCount + 1 }
        : c
    ));

    setNewProject({ companyId: '', name: '', description: '', notes: '', status: 'active' });
    setShowProjectForm(false);
  };

  // Helper function für Test-ID Generierung aus Titel
  const generateTestIdFromTitle = (title: string): string => {
    return title
      .split(/[\s\/&\-\+\=\(\)\[\]\{\}\<\>\,\.\;\:\!\?\@\#\$\%\^\*\|\\\"\']+/) // Sonderzeichen als Trenner
      .filter(word => word.length > 0) // Leere Strings entfernen
      .map(word => word.charAt(0).toUpperCase()) // Erster Buchstabe jedes Wortes
      .join('') // Zusammenfügen
      .padEnd(3, '0') // Mindestens 3 Zeichen, mit 0 auffüllen
      .substring(0, 6); // Maximal 6 Zeichen
  };

  const handleImportTests = (importedData: any) => {
    try {
      let importedTests: any[] = [];
      
      if (importedData.testBereiche) {
        // Format: { testBereiche: [...] }
        importedData.testBereiche.forEach((bereich: any) => {
          bereich.tests?.forEach((test: any) => {
            importedTests.push({
              ...test,
              suiteId: bereich.id || `suite-${bereich.name.toLowerCase().replace(/\s+/g, '-')}`,
              suiteName: bereich.name
            });
          });
        });
      } else if (Array.isArray(importedData)) {
        // Format: [{title: '', description: '', suite: ''}, ...]
        importedTests = importedData;
      } else if (importedData.tests) {
        // Format: { tests: [...] }
        importedTests = importedData.tests;
      }
      
      // Test-IDs generieren falls nicht vorhanden
      const processedTests = importedTests.map(test => ({
        id: test.id || `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        test_id: test.id || generateTestIdFromTitle(test.title || test.name || 'Test'),
        title: test.title || test.name || 'Unbenannter Test',
        description: test.description || '',
        suite_id: test.suiteId || test.suite_id || 'default-suite',
        status: test.status || 'pending',
        note: `[IMPORTIERT ${new Date().toLocaleDateString()}] ${test.note || ''}`,
        created_by: currentUser?.username || 'import'
      }));
      
      alert(`Erfolgreich ${processedTests.length} Tests importiert.\n\nTest-IDs wurden automatisch aus den Titeln generiert.\n\nBeispiele:\n${processedTests.slice(0, 3).map(t => `${t.title} → ${t.test_id}`).join('\n')}`);
      
      return processedTests;
    } catch (error) {
      console.error('Import Fehler:', error);
      alert(`Fehler beim Importieren: ${error instanceof Error ? error.message : error}`);
      return [];
    }
  };

  // Funktion zum Generieren der Test-ID aus dem Titel
  // Regel: Erste Buchstaben jedes Wortes (ohne Sonderzeichen) + laufende Nummer
  const generateTestId = (title: string, index: number): string => {
    // Sonderzeichen entfernen und in Wörter aufteilen
    const words = title
      .replace(/[!&%/\-_.,;:]/g, ' ') // Sonderzeichen durch Leerzeichen ersetzen
      .split(/\s+/) // An Leerzeichen aufteilen
      .filter(word => word.length > 0); // Leere Einträge entfernen
    
    // Erste Buchstaben sammeln
    const initials = words
      .map(word => word.charAt(0).toUpperCase())
      .join('');
    
    // 4-stellige laufende Nummer
    const number = String(index + 1).padStart(4, '0');
    
    return `${initials}${number}`;
  };

  // Template-Import Handler
  const handleTemplateImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        let data;
        
        if (file.name.endsWith('.json')) {
          data = JSON.parse(content);
        } else if (file.name.endsWith('.csv')) {
          // CSV Parser (vereinfacht)
          const lines = content.split('\n').filter(line => line.trim());
          if (lines.length < 2) {
            alert('CSV-Datei ist leer oder ungültig');
            return;
          }
          const headers = lines[0].split(',').map(h => h.trim());
          data = {
            testBereiche: []
          };
          // CSV zu JSON konvertieren - wird in handleImportTests verarbeitet
        } else {
          alert('Nur JSON- und CSV-Dateien werden unterstützt');
          return;
        }
        
        // Import verarbeiten
        if (data && data.testBereiche) {
          const targetCompanyId = selectedCompanyForEdit || currentUser?.companyId || companies[0]?.id;
          
          if (!targetCompanyId) {
            alert('Keine Firma ausgewählt oder verfügbar!');
            return;
          }
          
          // Neues Projekt erstellen für Import
          // Prüfe ob Projektname bereits existiert und füge _1, _2, etc. hinzu
          let projectName = data.projectName || 'Importiertes Projekt';
          let counter = 1;
          const existingNames = projects.map(p => p.name);
          let finalProjectName = projectName;
          
          while (existingNames.includes(finalProjectName)) {
            finalProjectName = `${projectName}_${counter}`;
            counter++;
          }
          
          if (finalProjectName !== projectName) {
            console.log(`Projektname existiert bereits. Umbenannt zu: ${finalProjectName}`);
          }
          
          const newProject = {
            id: `PROJ${Date.now()}`,  // Konsistentes Format mit anderen Projekten
            companyId: targetCompanyId,
            name: finalProjectName,
            description: data.description || 'Aus Template importiert',
            notes: '',
            status: 'active' as const,
            testSuitesCount: data.testBereiche.length,
            lastModified: new Date().toISOString(),
            createdBy: currentUser?.username || 'system',
            createdAt: new Date().toISOString()
          };
          
          // Projekte aktualisieren und in localStorage speichern
          const updatedProjects = [...projects, newProject];
          setProjects(updatedProjects);
          localStorage.setItem('qa_projects', JSON.stringify(updatedProjects));
          console.log('Projekt gespeichert in localStorage:', newProject.id);
          
          // Test-Suites für das neue Projekt erstellen und in localStorage speichern
          const importedTestSuites = data.testBereiche.map((bereich: any, index: number) => ({
            id: String(index + 1),
            name: bereich.name || `Testbereich ${index + 1}`,
            icon: bereich.icon || 'file',
            description: bereich.description || '',
            created_by: currentUser?.username || 'system',
            created_at: new Date().toISOString(),
            totalTests: bereich.tests?.length || 0,
            passedTests: 0,
            failedTests: 0,
            openTests: bereich.tests?.length || 0
          }));
          
          // Test-Cases für das neue Projekt erstellen
          const importedTestCases: any[] = [];
          data.testBereiche.forEach((bereich: any, suiteIndex: number) => {
            if (bereich.tests && Array.isArray(bereich.tests)) {
              bereich.tests.forEach((test: any, testIndex: number) => {
                importedTestCases.push({
                  id: `test-${Date.now()}-${suiteIndex}-${testIndex}`,
                  test_id: test.testId || test.test_id || `T${String(testIndex + 1).padStart(4, '0')}`,
                  suite_id: String(suiteIndex + 1),
                  title: test.title || test.name || `Test ${testIndex + 1}`,
                  description: test.description || test.beschreibung || '',
                  status: 'pending' as const,
                  note: ''
                });
              });
            }
          });
          
          // Test-Suites und Test-Cases in localStorage speichern für das neue Projekt
          const suiteKey = `qa_suites_${newProject.id}`;
          const casesKey = `qa_cases_${newProject.id}`;
          localStorage.setItem(suiteKey, JSON.stringify(importedTestSuites));
          localStorage.setItem(casesKey, JSON.stringify(importedTestCases));
          console.log(`Test-Suites gespeichert für Projekt ${newProject.id}:`, importedTestSuites.length);
          console.log(`Test-Cases gespeichert für Projekt ${newProject.id}:`, importedTestCases.length);
          
          // Update company project count
          setCompanies(companies.map(c => 
            c.id === targetCompanyId 
              ? { ...c, projectsCount: c.projectsCount + 1 }
              : c
          ));
          
          // Testfälle verarbeiten
          let totalTests = 0;
          data.testBereiche.forEach((bereich: any) => {
            totalTests += bereich.tests?.length || 0;
          });
          
          alert(`✅ Import erfolgreich!\n\n` +
            `Projekt: ${newProject.name}\n` +
            `Firma: ${companies.find(c => c.id === targetCompanyId)?.name}\n` +
            `Testbereiche: ${importedTestSuites.length}\n` +
            `Testfälle: ${importedTestCases.length}\n\n` +
            `Das Projekt wurde der ausgewählten Firma zugeordnet.\n` +
            `Wählen Sie das Projekt im Dashboard aus, um die Testfälle zu sehen.`);
        } else {
          alert('Ungültiges Template-Format!\n\nErwartet:\n{\n  "projectName": "...",\n  "testBereiche": [...]\n}');
        }
      } catch (error) {
        console.error('Import Fehler:', error);
        alert(`❌ Fehler beim Importieren:\n\n${error instanceof Error ? error.message : String(error)}\n\nBitte prüfen Sie das Dateiformat.`);
      }
    };
    reader.readAsText(file);
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
            { id: generateTestId("Logo Darstellung", 0), title: "Logo Darstellung", description: "Logo wird korrekt angezeigt" },
            { id: generateTestId("Navigation", 1), title: "Navigation", description: "Hauptnavigation funktional" }
          ]
        },
        {
          name: "Sidebar Navigation",
          description: "Tests für Seitennavigation", 
          tests: [
            { id: generateTestId("Menü Struktur", 0), title: "Menü Struktur", description: "Menüstruktur korrekt dargestellt" },
            { id: generateTestId("Responsive Verhalten", 1), title: "Responsive Verhalten", description: "Sidebar auf mobilen Geräten" }
          ]
        },
        {
          name: "Hauptinhalt",
          description: "Tests für Main-Content-Bereich",
          tests: [
            { id: generateTestId("Content Layout", 0), title: "Content Layout", description: "Inhaltsdarstellung optimiert" },
            { id: generateTestId("Formulare", 1), title: "Formulare", description: "Eingabefelder funktional" }
          ]
        },
        {
          name: "Fußzeile",
          description: "Tests für Footer-Bereich",
          tests: [
            { id: generateTestId("Links", 0), title: "Links", description: "Footer-Links funktional" },
            { id: generateTestId("Copyright", 1), title: "Copyright", description: "Copyright-Informationen korrekt" }
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
                <div 
                  key={company.id} 
                  onClick={() => {
                    setActiveCompanyId(company.id);
                    setSelectedCompanyForEdit(company.id);
                  }}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    activeCompanyId === company.id
                      ? (darkMode ? 'bg-cyan-900 border-cyan-500 ring-2 ring-cyan-500' : 'bg-cyan-50 border-cyan-500 ring-2 ring-cyan-400')
                      : (darkMode ? 'bg-gray-700 border-gray-600 hover:border-cyan-500' : 'bg-gray-50 border-gray-200 hover:border-cyan-400')
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-3">
                      {/* Logo anzeigen falls vorhanden */}
                      {company.logoUrl && (
                        <img 
                          src={company.logoUrl} 
                          alt={`${company.name} Logo`} 
                          className="h-10 w-10 object-contain"
                        />
                      )}
                      <div>
                        <h4 className={`font-semibold ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        } ${activeCompanyId === company.id ? 'text-cyan-400' : ''}`}>
                          {company.name}
                          {activeCompanyId === company.id && (
                            <span className="ml-2 text-xs bg-cyan-500 text-white px-2 py-0.5 rounded">
                              Aktiv
                            </span>
                          )}
                        </h4>
                        {company.description && (
                          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {company.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => {
                          setEditingCompany(company);
                          setNewCompany({
                            name: company.name,
                            description: company.description || '',
                            logoUrl: company.logoUrl || ''
                          });
                          setShowCompanyForm(true);
                        }}
                        className="text-blue-500 hover:text-blue-700"
                        title="Bearbeiten"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {/* Delete Button - nur für Firmen außer ID2 (geschützt) */}
                      {company.id !== 'ID2' && (
                        <button 
                          onClick={() => {
                            if (confirm(`Firma "${company.name}" wirklich löschen?\n\nAlle ${company.projectsCount} Projekte dieser Firma werden ebenfalls gelöscht!`)) {
                              // 1. Firma aus Liste entfernen
                              setCompanies(companies.filter(c => c.id !== company.id));
                              
                              // 2. Alle Projekte dieser Firma finden und löschen
                              const companyProjects = projects.filter(p => p.companyId === company.id);
                              
                              // 3. Für jedes Projekt: Test-Suites und Test-Cases aus localStorage löschen
                              companyProjects.forEach(project => {
                                localStorage.removeItem(`qa_suites_${project.id}`);
                                localStorage.removeItem(`qa_cases_${project.id}`);
                                console.log(`Projekt ${project.id} und zugehörige Testdaten gelöscht`);
                              });
                              
                              // 4. Projekte aus State und localStorage entfernen
                              const remainingProjects = projects.filter(p => p.companyId !== company.id);
                              setProjects(remainingProjects);
                              localStorage.setItem('qa_projects', JSON.stringify(remainingProjects));
                              
                              console.log(`Firma ${company.id} gelöscht: ${companyProjects.length} Projekte entfernt`);
                              
                              // 5. Active States zurücksetzen wenn nötig
                              if (activeCompanyId === company.id) {
                                setActiveCompanyId('');
                                setSelectedCompanyForEdit('');
                              }
                            }
                          }}
                          className="text-red-500 hover:text-red-700"
                          title="Löschen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
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
            {/* Admin: Company Selection */}
            {isAdmin && (
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Firma auswählen (zum Bearbeiten der Projekte):
                </label>
                <select
                  value={selectedCompanyForEdit}
                  onChange={(e) => setSelectedCompanyForEdit(e.target.value)}
                  className={`w-full max-w-md p-2 border rounded ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="">Alle Projekte anzeigen</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>
                      {company.name} ({company.projectsCount} Projekte)
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {isAdmin ? (selectedCompanyForEdit ? `Projekte von ${companies.find(c => c.id === selectedCompanyForEdit)?.name}` : 'Alle Projekte') : 'Meine Projekte'}
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => document.getElementById('project-import-input')?.click()}
                  disabled={!selectedCompanyForEdit && isAdmin}
                  className={`px-4 py-2 rounded-lg flex items-center ${
                    (!selectedCompanyForEdit && isAdmin)
                      ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                  title={(!selectedCompanyForEdit && isAdmin) ? 'Bitte erst eine Firma auswählen' : 'Template importieren'}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </button>
                <input
                  id="project-import-input"
                  type="file"
                  accept=".json,.csv"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleTemplateImport(file);
                    }
                  }}
                />
                {/* Template Download */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const btn = e.currentTarget;
                      const menu = btn.nextElementSibling as HTMLElement;
                      if (menu) {
                        menu.classList.toggle('hidden');
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center"
                    title="Template downloaden"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Template
                  </button>
                  {/* Dropdown Menu */}
                  <div className={`hidden absolute left-0 mt-2 w-40 rounded-lg shadow-lg z-50 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                    <a
                      href="/test-template-klein.csv"
                      download="qa-template.csv"
                      className={`block px-4 py-2 text-sm hover:bg-gray-700 rounded-t-lg ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
                      onClick={() => {
                        setTimeout(() => {
                          document.querySelectorAll('.hidden').forEach(el => el.classList.add('hidden'));
                        }, 100);
                      }}
                    >
                      📊 CSV (Standard)
                    </a>
                    <a
                      href="/test-template-klein.json"
                      download="qa-template.json"
                      className={`block px-4 py-2 text-sm hover:bg-gray-700 rounded-b-lg ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}
                      onClick={() => {
                        setTimeout(() => {
                          document.querySelectorAll('.hidden').forEach(el => el.classList.add('hidden'));
                        }, 100);
                      }}
                    >
                      📄 JSON
                    </a>
                  </div>
                </div>
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
                        <button 
                          onClick={() => {
                            setEditingProject(project);
                            setNewProject({
                              companyId: project.companyId,
                              name: project.name,
                              description: project.description,
                              notes: project.notes,
                              status: project.status
                            });
                            setShowProjectForm(true);
                          }}
                          className="text-blue-500 hover:text-blue-700"
                          title="Bearbeiten"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm(`Projekt "${project.name}" wirklich löschen?`)) {
                              // Projekt aus Liste entfernen
                              const updatedProjects = projects.filter(p => p.id !== project.id);
                              setProjects(updatedProjects);
                              
                              // Projekt aus localStorage entfernen
                              localStorage.setItem('qa_projects', JSON.stringify(updatedProjects));
                              
                              // Test-Suites und Test-Cases für dieses Projekt aus localStorage löschen
                              localStorage.removeItem(`qa_suites_${project.id}`);
                              localStorage.removeItem(`qa_cases_${project.id}`);
                              console.log(`Projekt ${project.id} und zugehörige Daten aus localStorage gelöscht`);
                              
                              // Update company project count
                              setCompanies(companies.map(c => 
                                c.id === project.companyId 
                                  ? { ...c, projectsCount: Math.max(0, c.projectsCount - 1) }
                                  : c
                              ));
                            }
                          }}
                          className="text-red-500 hover:text-red-700"
                          title="Löschen"
                        >
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
                {editingCompany ? 'Firma bearbeiten' : 'Neue Firma erstellen'}
              </h3>
              <div className="space-y-4">
                {/* Firmenname */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Firmenname *
                  </label>
                  <input
                    type="text"
                    placeholder="Firmenname"
                    value={newCompany.name}
                    onChange={(e) => setNewCompany({...newCompany, name: e.target.value})}
                    className={`w-full p-2 border rounded ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
                
                {/* Beschreibung */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Beschreibung (optional)
                  </label>
                  <textarea
                    placeholder="Firmenbeschreibung..."
                    value={newCompany.description}
                    onChange={(e) => setNewCompany({...newCompany, description: e.target.value})}
                    rows={3}
                    className={`w-full p-2 border rounded ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>

                {/* Logo Upload */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Firmen-Logo (optional)
                  </label>
                  <div className="space-y-2">
                    {/* Logo Preview */}
                    {newCompany.logoUrl && (
                      <div className={`p-3 border rounded ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
                        <img 
                          src={newCompany.logoUrl} 
                          alt="Logo Preview" 
                          className="h-16 max-w-full object-contain mx-auto"
                        />
                        <button
                          onClick={() => setNewCompany({...newCompany, logoUrl: ''})}
                          className="mt-2 text-xs text-red-500 hover:text-red-700 block mx-auto"
                        >
                          Logo entfernen
                        </button>
                      </div>
                    )}
                    
                    {/* File Input */}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Größen-Check (max 2MB)
                          if (file.size > 2 * 1024 * 1024) {
                            alert('❌ Logo ist zu groß. Maximale Größe: 2MB');
                            return;
                          }
                          
                          // Konvertiere zu Base64
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const base64String = event.target?.result as string;
                            setNewCompany({...newCompany, logoUrl: base64String});
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className={`w-full text-sm ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    />
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Unterstützte Formate: PNG, JPG, SVG (max. 2MB)
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCompanyForm(false);
                    setEditingCompany(null);
                    setNewCompany({ name: '', description: '', logoUrl: '' });
                  }}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleCreateCompany}
                  disabled={!newCompany.name.trim()}
                  className={`px-4 py-2 rounded ${
                    !newCompany.name.trim()
                      ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                      : 'bg-cyan-600 hover:bg-cyan-700 text-white'
                  }`}
                >
                  {editingCompany ? 'Aktualisieren' : 'Erstellen'}
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