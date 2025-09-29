import React, { useState } from 'react';
import { ChevronDown, User, Building2, FolderOpen, TestTube } from 'lucide-react';
import './App.css';

function App() {
  const [currentLanguage, setCurrentLanguage] = useState<'de' | 'en'>('de');
  const [currentUser] = useState('Demo User');
  const [currentRole] = useState('QA-Tester');

  const translations = {
    de: {
      appTitle: 'QA-Report-App',
      dashboard: 'Dashboard',
      companies: 'Firmen',
      projects: 'Projekte', 
      testSuites: 'Test-Suiten',
      reports: 'Berichte',
      archive: 'Archiv',
      settings: 'Einstellungen',
      logout: 'Abmelden',
      welcome: 'Willkommen bei der QA-Report-App',
      subtitle: 'Verwalten Sie Ihre Qualitätssicherungs-Berichte effizient',
      getStarted: 'Loslegen',
      selectCompany: 'Firma auswählen',
      createProject: 'Projekt erstellen',
      manageTests: 'Tests verwalten'
    },
    en: {
      appTitle: 'QA-Report-App',
      dashboard: 'Dashboard',
      companies: 'Companies',
      projects: 'Projects',
      testSuites: 'Test Suites', 
      reports: 'Reports',
      archive: 'Archive',
      settings: 'Settings',
      logout: 'Logout',
      welcome: 'Welcome to QA-Report-App',
      subtitle: 'Manage your quality assurance reports efficiently',
      getStarted: 'Get Started',
      selectCompany: 'Select Company',
      createProject: 'Create Project',
      manageTests: 'Manage Tests'
    }
  };

  const t = translations[currentLanguage];

  const toggleLanguage = () => {
    setCurrentLanguage(prev => prev === 'de' ? 'en' : 'de');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-qa-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <TestTube className="h-8 w-8 text-qa-primary-600" />
                <span className="ml-2 text-xl font-bold text-qa-gray-900">{t.appTitle}</span>
              </div>
              
              {/* Main Navigation */}
              <div className="hidden md:ml-8 md:flex md:space-x-8">
                <button className="nav-link-active border-b-2 border-qa-primary-600 py-2 px-1 text-sm">
                  {t.dashboard}
                </button>
                <button className="nav-link py-2 px-1 text-sm">
                  {t.companies}
                </button>
                <button className="nav-link py-2 px-1 text-sm">
                  {t.projects}
                </button>
                <button className="nav-link py-2 px-1 text-sm">
                  {t.testSuites}
                </button>
                <button className="nav-link py-2 px-1 text-sm">
                  {t.reports}
                </button>
                <button className="nav-link py-2 px-1 text-sm">
                  {t.archive}
                </button>
              </div>
            </div>

            {/* Right side navigation */}
            <div className="flex items-center space-x-4">
              {/* Language Toggle */}
              <button 
                onClick={toggleLanguage}
                className="text-sm font-medium text-qa-gray-600 hover:text-qa-primary-600 bg-qa-gray-100 px-3 py-1 rounded-md transition-colors"
              >
                {currentLanguage.toUpperCase()}
              </button>

              {/* User Menu */}
              <div className="relative flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-qa-gray-400" />
                  <div className="text-sm">
                    <div className="font-medium text-qa-gray-900">{currentUser}</div>
                    <div className="text-qa-gray-500">{currentRole}</div>
                  </div>
                </div>
                <button className="flex items-center text-qa-gray-400 hover:text-qa-gray-600">
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-qa-gray-900 sm:text-5xl">
              {t.welcome}
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-qa-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              {t.subtitle}
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <button className="btn-primary w-full flex items-center justify-center px-8 py-3 text-base md:py-4 md:text-lg md:px-10">
                  {t.getStarted}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mt-12">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Company Management Card */}
            <div className="card p-6">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-qa-primary-600" />
                <h3 className="ml-3 text-lg font-medium text-qa-gray-900">{t.companies}</h3>
              </div>
              <p className="mt-2 text-sm text-qa-gray-500">
                {t.selectCompany}
              </p>
              <div className="mt-4">
                <button className="btn-secondary text-sm">
                  {t.selectCompany}
                </button>
              </div>
            </div>

            {/* Project Management Card */}
            <div className="card p-6">
              <div className="flex items-center">
                <FolderOpen className="h-8 w-8 text-qa-primary-600" />
                <h3 className="ml-3 text-lg font-medium text-qa-gray-900">{t.projects}</h3>
              </div>
              <p className="mt-2 text-sm text-qa-gray-500">
                {t.createProject}
              </p>
              <div className="mt-4">
                <button className="btn-secondary text-sm">
                  {t.createProject}
                </button>
              </div>
            </div>

            {/* Test Management Card */}
            <div className="card p-6">
              <div className="flex items-center">
                <TestTube className="h-8 w-8 text-qa-primary-600" />
                <h3 className="ml-3 text-lg font-medium text-qa-gray-900">{t.testSuites}</h3>
              </div>
              <p className="mt-2 text-sm text-qa-gray-500">
                {t.manageTests}
              </p>
              <div className="mt-4">
                <button className="btn-secondary text-sm">
                  {t.manageTests}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Status Section */}
        <SystemStatus />
      </main>
    </div>
  );
}

export default App;
