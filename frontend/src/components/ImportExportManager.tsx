import React, { useState } from 'react';
import { Download, Upload, FileText, Database, AlertCircle, CheckCircle, X } from 'lucide-react';

interface ImportExportManagerProps {
  authToken: string;
  language: 'de' | 'en';
  onClose: () => void;
}

const ImportExportManager: React.FC<ImportExportManagerProps> = ({ authToken, language, onClose }) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const translations = {
    de: {
      title: 'Import & Export',
      exportTab: 'Export',
      importTab: 'Import', 
      templateGeneration: 'Template-Generierung',
      dataExport: 'Daten-Export',
      templateType: 'Template-Typ',
      emptyTemplate: 'Leeres Template',
      currentData: 'Aktuelle Daten',
      favorgMigration: 'FavOrg Migration',
      format: 'Format',
      generateTemplate: 'Template generieren',
      exportCurrent: 'Daten exportieren',
      fileUpload: 'Datei-Upload',
      selectFile: 'Datei auswählen',
      importOptions: 'Import-Optionen',
      overwriteExisting: 'Bestehende Einträge überschreiben',
      validateOnly: 'Nur validieren (nicht importieren)',
      startImport: 'Import starten',
      importResults: 'Import-Ergebnisse',
      validationSuccess: 'Validierung erfolgreich',
      importCompleted: 'Import abgeschlossen',
      validationFailed: 'Validierung fehlgeschlagen',
      errors: 'Fehler',
      warnings: 'Warnungen',
      created: 'Erstellt',
      updated: 'Aktualisiert',
      skipped: 'Übersprungen',
      companies: 'Firmen',
      projects: 'Projekte',
      testSuites: 'Test-Suiten',
      testCases: 'Testfälle',
      close: 'Schließen',
      downloading: 'Download läuft...',
      uploading: 'Upload läuft...',
      processing: 'Verarbeitung läuft...',
    },
    en: {
      title: 'Import & Export',
      exportTab: 'Export',
      importTab: 'Import',
      templateGeneration: 'Template Generation',
      dataExport: 'Data Export',
      templateType: 'Template Type',
      emptyTemplate: 'Empty Template',
      currentData: 'Current Data',
      favorgMigration: 'FavOrg Migration',
      format: 'Format',
      generateTemplate: 'Generate Template',
      exportCurrent: 'Export Data',
      fileUpload: 'File Upload',
      selectFile: 'Select File',
      importOptions: 'Import Options',
      overwriteExisting: 'Overwrite existing entries',
      validateOnly: 'Validate only (do not import)',
      startImport: 'Start Import',
      importResults: 'Import Results',
      validationSuccess: 'Validation successful',
      importCompleted: 'Import completed',
      validationFailed: 'Validation failed',
      errors: 'Errors',
      warnings: 'Warnings',
      created: 'Created',
      updated: 'Updated',
      skipped: 'Skipped',
      companies: 'Companies',
      projects: 'Projects',
      testSuites: 'Test Suites',
      testCases: 'Test Cases',
      close: 'Close',
      downloading: 'Downloading...',
      uploading: 'Uploading...',
      processing: 'Processing...',
    }
  };

  const t = translations[language];

  const handleTemplateGeneration = async (templateType: string, format: string) => {
    setLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/import-export/template/generate?template_type=${templateType}&format_type=${format}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qa-template-${templateType}-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Template generation failed');
      }
    } catch (error) {
      console.error('Template generation error:', error);
      alert('Fehler beim Generieren des Templates');
    } finally {
      setLoading(false);
    }
  };

  const handleDataExport = async (format: string, includeResults: boolean = false) => {
    setLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/import-export/export/current?format_type=${format}&include_results=${includeResults}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qa-export-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Data export failed');
      }
    } catch (error) {
      console.error('Data export error:', error);
      alert('Fehler beim Exportieren der Daten');
    } finally {
      setLoading(false);
    }
  };

  const handleFileImport = async (validateOnly: boolean = false, overwriteExisting: boolean = false) => {
    if (!selectedFile) return;

    setLoading(true);
    setImportResult(null);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('overwrite_existing', overwriteExisting.toString());
      formData.append('validate_only', validateOnly.toString());

      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/import-export/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setImportResult(result);
      } else {
        throw new Error('Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Fehler beim Importieren der Datei');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'validation_success':
      case 'import_completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'validation_failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-qa-gray-900">{t.title}</h2>
          <button onClick={onClose} className="text-qa-gray-400 hover:text-qa-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-qa-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('export')}
              className={`py-3 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'export'
                  ? 'border-qa-primary-500 text-qa-primary-600'
                  : 'border-transparent text-qa-gray-500 hover:text-qa-gray-700'
              }`}
            >
              <Download className="inline h-4 w-4 mr-2" />
              {t.exportTab}
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`py-3 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'import'
                  ? 'border-qa-primary-500 text-qa-primary-600'
                  : 'border-transparent text-qa-gray-500 hover:text-qa-gray-700'
              }`}
            >
              <Upload className="inline h-4 w-4 mr-2" />
              {t.importTab}
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'export' ? (
            <div className="space-y-8">
              {/* Template Generation */}
              <div>
                <h3 className="text-lg font-semibold text-qa-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  {t.templateGeneration}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="card p-4">
                    <h4 className="font-medium text-qa-gray-900 mb-2">{t.emptyTemplate}</h4>
                    <p className="text-sm text-qa-gray-600 mb-4">Leere Vorlage zum Ausfüllen</p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleTemplateGeneration('empty', 'json')}
                        disabled={loading}
                        className="w-full btn-secondary text-sm py-2"
                      >
                        JSON {loading ? t.downloading : t.generateTemplate}
                      </button>
                      <button
                        onClick={() => handleTemplateGeneration('empty', 'csv')}
                        disabled={loading}
                        className="w-full btn-secondary text-sm py-2"
                      >
                        CSV {loading ? t.downloading : t.generateTemplate}
                      </button>
                      <button
                        onClick={() => handleTemplateGeneration('empty', 'excel')}
                        disabled={loading}
                        className="w-full btn-secondary text-sm py-2"
                      >
                        Excel {loading ? t.downloading : t.generateTemplate}
                      </button>
                    </div>
                  </div>

                  <div className="card p-4">
                    <h4 className="font-medium text-qa-gray-900 mb-2">{t.favorgMigration}</h4>
                    <p className="text-sm text-qa-gray-600 mb-4">Vorgefüllte FavOrg Testfälle</p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleTemplateGeneration('favorg', 'json')}
                        disabled={loading}
                        className="w-full btn-primary text-sm py-2"
                      >
                        JSON {loading ? t.downloading : t.generateTemplate}
                      </button>
                      <button
                        onClick={() => handleTemplateGeneration('favorg', 'csv')}
                        disabled={loading}
                        className="w-full btn-primary text-sm py-2"
                      >
                        CSV {loading ? t.downloading : t.generateTemplate}
                      </button>
                      <button
                        onClick={() => handleTemplateGeneration('favorg', 'excel')}
                        disabled={loading}
                        className="w-full btn-primary text-sm py-2"
                      >
                        Excel {loading ? t.downloading : t.generateTemplate}
                      </button>
                    </div>
                  </div>

                  <div className="card p-4">
                    <h4 className="font-medium text-qa-gray-900 mb-2">{t.currentData}</h4>
                    <p className="text-sm text-qa-gray-600 mb-4">Template mit Ihren aktuellen Daten</p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleTemplateGeneration('current', 'json')}
                        disabled={loading}
                        className="w-full btn-secondary text-sm py-2"
                      >
                        JSON {loading ? t.downloading : t.generateTemplate}
                      </button>
                      <button
                        onClick={() => handleTemplateGeneration('current', 'csv')}
                        disabled={loading}
                        className="w-full btn-secondary text-sm py-2"
                      >
                        CSV {loading ? t.downloading : t.generateTemplate}
                      </button>
                      <button
                        onClick={() => handleTemplateGeneration('current', 'excel')}
                        disabled={loading}
                        className="w-full btn-secondary text-sm py-2"
                      >
                        Excel {loading ? t.downloading : t.generateTemplate}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Export */}
              <div>
                <h3 className="text-lg font-semibold text-qa-gray-900 mb-4 flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  {t.dataExport}
                </h3>
                
                <div className="card p-4">
                  <p className="text-sm text-qa-gray-600 mb-4">
                    Exportieren Sie Ihre vollständigen QA-Daten inklusive Test-Ergebnisse
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      onClick={() => handleDataExport('json', true)}
                      disabled={loading}
                      className="btn-primary"
                    >
                      JSON {loading ? t.downloading : t.exportCurrent}
                    </button>
                    <button
                      onClick={() => handleDataExport('csv', false)}
                      disabled={loading}
                      className="btn-secondary"
                    >
                      CSV {loading ? t.downloading : t.exportCurrent}
                    </button>
                    <button
                      onClick={() => handleDataExport('excel', true)}
                      disabled={loading}
                      className="btn-primary"
                    >
                      Excel {loading ? t.downloading : t.exportCurrent}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* File Upload */}
              <div>
                <h3 className="text-lg font-semibold text-qa-gray-900 mb-4">{t.fileUpload}</h3>
                
                <div className="card p-4 mb-4">
                  <input
                    type="file"
                    accept=".json,.csv,.xlsx,.xls"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full p-3 border-2 border-dashed border-qa-gray-300 rounded-lg text-center cursor-pointer hover:border-qa-primary-400"
                  />
                  {selectedFile && (
                    <p className="mt-2 text-sm text-qa-gray-600">
                      Ausgewählte Datei: {selectedFile.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Import Options */}
              {selectedFile && (
                <div>
                  <h3 className="text-lg font-semibold text-qa-gray-900 mb-4">{t.importOptions}</h3>
                  
                  <div className="card p-4 space-y-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="overwrite"
                        className="rounded"
                      />
                      <label htmlFor="overwrite" className="text-sm text-qa-gray-700">
                        {t.overwriteExisting}
                      </label>
                    </div>
                    
                    <div className="flex space-x-4">
                      <button
                        onClick={() => handleFileImport(true, false)}
                        disabled={loading}
                        className="flex-1 btn-secondary"
                      >
                        {loading ? t.processing : 'Nur validieren'}
                      </button>
                      <button
                        onClick={() => handleFileImport(false, false)}
                        disabled={loading}
                        className="flex-1 btn-primary"
                      >
                        {loading ? t.processing : t.startImport}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Import Results */}
              {importResult && (
                <div>
                  <h3 className="text-lg font-semibold text-qa-gray-900 mb-4 flex items-center">
                    {getStatusIcon(importResult.status)}
                    <span className="ml-2">{t.importResults}</span>
                  </h3>
                  
                  <div className="card p-4">
                    <div className="mb-4">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        importResult.status === 'validation_success' || importResult.status === 'import_completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {importResult.status === 'validation_success' && t.validationSuccess}
                        {importResult.status === 'import_completed' && t.importCompleted}
                        {importResult.status === 'validation_failed' && t.validationFailed}
                      </div>
                    </div>

                    {importResult.errors && importResult.errors.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-red-800 mb-2">{t.errors}:</h4>
                        <ul className="list-disc list-inside text-sm text-red-700">
                          {importResult.errors.map((error: string, index: number) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {importResult.warnings && importResult.warnings.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-yellow-800 mb-2">{t.warnings}:</h4>
                        <ul className="list-disc list-inside text-sm text-yellow-700">
                          {importResult.warnings.map((warning: string, index: number) => (
                            <li key={index}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {importResult.summary && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center p-2 bg-qa-gray-50 rounded">
                          <div className="font-semibold">{importResult.summary.companies}</div>
                          <div className="text-qa-gray-600">{t.companies}</div>
                        </div>
                        <div className="text-center p-2 bg-qa-gray-50 rounded">
                          <div className="font-semibold">{importResult.summary.projects}</div>
                          <div className="text-qa-gray-600">{t.projects}</div>
                        </div>
                        <div className="text-center p-2 bg-qa-gray-50 rounded">
                          <div className="font-semibold">{importResult.summary.test_suites}</div>
                          <div className="text-qa-gray-600">{t.testSuites}</div>
                        </div>
                        <div className="text-center p-2 bg-qa-gray-50 rounded">
                          <div className="font-semibold">{importResult.summary.test_cases}</div>
                          <div className="text-qa-gray-600">{t.testCases}</div>
                        </div>
                      </div>
                    )}

                    {importResult.result && (
                      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center p-2 bg-green-50 rounded">
                          <div className="font-semibold text-green-800">
                            {Object.values(importResult.result.created as Record<string, number>).reduce((sum, value) => sum + value, 0)}
                          </div>
                          <div className="text-green-600">{t.created}</div>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <div className="font-semibold text-blue-800">
                            {Object.values(importResult.result.updated as Record<string, number>).reduce((sum, value) => sum + value, 0)}
                          </div>
                          <div className="text-blue-600">{t.updated}</div>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="font-semibold text-gray-800">
                            {Object.values(importResult.result.skipped as Record<string, number>).reduce((sum, value) => sum + value, 0)}
                          </div>
                          <div className="text-gray-600">{t.skipped}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportExportManager;