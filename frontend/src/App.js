import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import "./components/enhanced-components.css";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Card, CardHeader, CardContent, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import TableView from "./components/TableView";
import DraggableToast from "./components/DraggableToast";

// Import der neuen integrierten Komponente
import IntegratedFavOrg from "./components/IntegratedFavOrg";

// Import neue verbesserte Komponenten
import EnhancedStatusFilter from "./components/EnhancedStatusFilter";
import EnhancedBookmarkCard from "./components/EnhancedBookmarkCard";
import ImprovedBookmarkDialog from "./components/ImprovedBookmarkDialog";
import EnhancedCatchMouseGame from "./components/EnhancedCatchMouseGame";
import ComprehensiveHelpDialog from "./components/ComprehensiveHelpDialog";
import { 
  Settings, 
  HelpCircle, 
  Upload, 
  Search, 
  X, 
  ExternalLink, 
  Trash2, 
  RefreshCw, 
  Copy, 
  FolderOpen,
  Link as LinkIcon,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  TrendingUp,
  Activity,
  Target,
  Plus,
  Folder,
  ChevronRight,
  ChevronDown,
  Download,
  FileCheck,
  Zap,
  Clock,
  Edit,
  Edit2,
  Check,
  Move,
  FileText,
  FileSpreadsheet,
  Archive,
  Database,
  Table,
  Grid,
  BookOpen,
  Keyboard,
  Mouse,
  Monitor,
  Workflow,
  GripVertical,
  Lock,
  Unlock,
  LockKeyhole,
  LockKeyholeOpen,
  Info
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Objektorientierte Frontend-Services

class FavoritesService {
  constructor() {
    this.baseURL = BACKEND_URL;
  }

  async createSamples() {
    try {
      const response = await axios.post(`${this.baseURL}/api/bookmarks/create-samples`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to create samples');
    }
  }

  async createTestData() {
    try {
      const response = await axios.post(`${this.baseURL}/api/bookmarks/create-test-data`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to create test data');
    }
  }

  async getStatistics() {
    try {
      const response = await axios.get(`${this.baseURL}/api/statistics`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch statistics');
    }
  }

  async exportBookmarks(format, category = null) {
    try {
      const response = await axios.post(`${this.baseURL}/api/export`, {
        format: format,
        category: category
      }, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { 
        type: this.getContentType(format)
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = this.getFileName(format);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      return { message: `${format.toUpperCase()} Export erfolgreich` };
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Export failed');
    }
  }

  // Export für alle Browserformate
  async exportForAllBrowsers() {
    try {
      const formats = [
        { format: 'html', name: 'HTML (Chrome, Firefox, Edge)', extension: 'html' },
        { format: 'json', name: 'JSON (Chrome Bookmarks)', extension: 'json' },
        { format: 'xml', name: 'XML (Universal)', extension: 'xml' },
        { format: 'csv', name: 'CSV (Excel/Tabelle)', extension: 'csv' }
      ];

      for (const formatInfo of formats) {
        await this.exportBookmarks(formatInfo.format);
        // Kleine Verzögerung zwischen den Downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      return { message: 'Alle Browserformate erfolgreich exportiert' };
    } catch (error) {
      throw new Error('Multi-Format Export fehlgeschlagen: ' + error.message);
    }
  }

  getContentType(format) {
    const contentTypes = {
      'html': 'text/html',
      'json': 'application/json',
      'xml': 'application/xml',
      'csv': 'text/csv'
    };
    return contentTypes[format] || 'application/octet-stream';
  }

  getFileName(format) {
    const date = new Date().toISOString().split('T')[0];
    const fileNames = {
      'html': `favoriten_${date}.html`,
      'json': `favoriten_${date}.json`, 
      'xml': `favoriten_${date}.xml`,
      'csv': `favoriten_${date}.csv`
    };
    return fileNames[format] || `favoriten_${date}.${format}`;
  }

  async importBookmarks(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post(`${this.baseURL}/api/bookmarks/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Import failed');
    }
  }

  async getAllBookmarks() {
    try {
      const response = await axios.get(`${this.baseURL}/api/bookmarks`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch bookmarks');
    }
  }

  async getBookmarksByCategory(category, subcategory = null) {
    try {
      let url = `${this.baseURL}/api/bookmarks/category/${encodeURIComponent(category)}`;
      if (subcategory) {
        url += `?subcategory=${encodeURIComponent(subcategory)}`;
      }
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch bookmarks by category');
    }
  }

  async getAllCategories() {
    try {
      const response = await axios.get(`${this.baseURL}/api/categories`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch categories');
    }
  }

  async createBookmark(bookmarkData) {
    try {
      const response = await axios.post(`${this.baseURL}/api/bookmarks`, bookmarkData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to create bookmark');
    }
  }

  async updateBookmark(bookmarkId, updateData) {
    try {
      const response = await axios.put(`${this.baseURL}/api/bookmarks/${bookmarkId}`, updateData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to update bookmark');
    }
  }

  async updateBookmarkStatus(id, statusType) {
    try {
      const response = await axios.put(`${this.baseURL}/api/bookmarks/${id}/status`, { status_type: statusType });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to update bookmark status');
    }
  }

  async moveBookmarks(bookmarkIds, targetCategory, targetSubcategory = null) {
    try {
      const response = await axios.post(`${this.baseURL}/api/bookmarks/move`, {
        bookmark_ids: bookmarkIds,
        target_category: targetCategory,
        target_subcategory: targetSubcategory
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to move bookmarks');
    }
  }

  async validateLinks() {
    try {
      const response = await axios.post(`${this.baseURL}/api/bookmarks/validate`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to validate links');
    }
  }

  async removeDeadLinks() {
    try {
      const response = await axios.delete(`${this.baseURL}/api/bookmarks/dead-links`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to remove dead links');
    }
  }

  async removeDuplicates() {
    try {
      const response = await axios.post(`${this.baseURL}/api/bookmarks/remove-duplicates`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to remove duplicates');
    }
  }

  async findDuplicates() {
    try {
      const response = await axios.post(`${this.baseURL}/api/bookmarks/find-duplicates`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to find duplicates');
    }
  }

  async deleteDuplicates() {
    try {
      const response = await axios.delete(`${this.baseURL}/api/bookmarks/duplicates`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to delete duplicates');
    }
  }

  async deleteDuplicates() {
    try {
      const response = await axios.delete(`${this.baseURL}/api/bookmarks/duplicates`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to delete duplicates');
    }
  }

  async deleteAllBookmarks() {
    try {
      const response = await axios.delete(`${this.baseURL}/api/bookmarks/all`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to delete all bookmarks');
    }
  }

  async searchBookmarks(query) {
    try {
      const response = await axios.get(`${this.baseURL}/api/bookmarks/search/${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      throw new Error('Search failed');
    }
  }

  async deleteBookmark(bookmarkId) {
    try {
      const response = await axios.delete(`${this.baseURL}/api/bookmarks/${bookmarkId}`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to delete bookmark');
    }
  }
}

class UIStateManager {
  constructor() {
    this.state = {
      activeCategory: 'all',
      activeSubcategory: null,
      searchQuery: '',
      isLoading: false,
      showSettings: false,
      showHelp: false,
      showStatistics: false,
      statusFilter: 'all',
      selectedBookmarks: new Set()
    };
    this.listeners = [];
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.listeners.forEach(listener => listener(this.state));
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getState() {
    return this.state;
  }
}

// React Komponenten

const Header = ({ onSettingsClick, onHelpClick, onStatsToggle, onCreateBookmarkClick, onFileUploadClick, onExportClick, onValidateClick, onRemoveDuplicatesClick, onRemoveLocalhostClick, onDeleteAllClick, deadLinksCount, hasValidated, totalBookmarks, duplicateCount, localhostCount, hasDuplicatesMarked, filteredCount }) => {
  return (
    <header className="header-fixed">
      <div className="header-content">
        {/* Linkes Div: Logo und FavOrg */}
        <div className="header-left">
          <div className="logo-section">
            <div className="logo-icon">
              <LinkIcon className="w-6 h-6" />
            </div>
            <div className="app-info">
              <h1 className="app-title">
                FavOrg 
                <span className="bookmark-count">[{filteredCount !== null ? filteredCount : totalBookmarks}]</span>
              </h1>
              <p className="app-subtitle">Verwalten Sie Ihre Lesezeichen</p>
            </div>
          </div>
        </div>

        {/* Mittleres Div: Navigation */}
        <div className="header-center">
          <div className="header-actions">
            <Button 
              onClick={onCreateBookmarkClick} 
              className="action-btn create-btn"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Neu
            </Button>
            
            <Button 
              onClick={onFileUploadClick} 
              className="action-btn upload-btn"
              size="sm"
            >
              <Upload className="w-4 h-4 mr-2" />
              Datei wählen
            </Button>

            <Button 
              onClick={onExportClick} 
              className="action-btn export-btn"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Fav-Export
            </Button>
            
            <Button 
              onClick={onValidateClick} 
              className="action-btn check-btn"
              size="sm"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {deadLinksCount > 0 ? `TOTE Links [${deadLinksCount}]` : 'TOTE Links'}
            </Button>
            
            <Button 
              onClick={onRemoveDuplicatesClick} 
              className="action-btn duplicate-btn"
              size="sm"
            >
              <Copy className="w-4 h-4 mr-2" />
              {duplicateCount > 0 ? `Duplikate [${duplicateCount}]` : 'Duplikate'}
            </Button>
            
            <Button 
              onClick={onRemoveLocalhostClick} 
              className="action-btn localhost-btn"
              size="sm"
              style={{ 
                backgroundColor: 'white', 
                color: 'black', 
                border: '1px solid #ccc' 
              }}
            >
              <Monitor className="w-4 h-4 mr-2" />
              {localhostCount > 0 ? `Localhost [${localhostCount}]` : 'Localhost'}
            </Button>
          </div>
        </div>

        {/* Rechtes Div: Action Buttons */}
        <div className="header-right">
          <Button
            onClick={onHelpClick}
            className="header-btn"
            size="sm"
            title="Hilfe"
          >
            <HelpCircle className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={onStatsToggle}
            className="header-btn"
            size="sm"
            title="Statistiken ein-/ausblenden"
          >
            <BarChart3 className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={onSettingsClick}
            className="header-btn"
            size="sm" 
            title="System-Einstellungen"
          >
            <Settings className="w-4 h-4" />
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                className="action-btn delete-all-btn cleanup-btn"
                size="sm"
                title="Alle Favoriten löschen"
              >
                <X className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Alle Favoriten löschen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Diese Aktion kann nicht rückgängig gemacht werden. Alle Ihre Favoriten werden dauerhaft gelöscht.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction onClick={onDeleteAllClick}>
                  Löschen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </header>
  );
};

// Export Dialog Component
const ExportDialog = ({ isOpen, onClose, onExport }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('html');

  const exportFormats = [
    { value: 'html', label: 'HTML', description: 'Standard Browser-Format, kompatibel mit Chrome, Firefox, Edge, Safari', icon: '🌐' },
    { value: 'json', label: 'JSON', description: 'Chrome Bookmarks Format mit vollständigen Metadaten', icon: '📋' },
    { value: 'xml', label: 'XML', description: 'Strukturierte Daten mit Metainformationen, ideal für Re-Import', icon: '📄' },
    { value: 'csv', label: 'CSV', description: 'Tabellenformat, kompatibel mit Excel und Tabellenkalkulation', icon: '📊' }
  ];

  const handleSingleExport = async () => {
    setIsExporting(true);
    try {
      await onExport(selectedFormat, null);  // null für alle Kategorien
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleMultiExport = async () => {
    setIsExporting(true);
    try {
      // Exportiere alle Formate einzeln
      for (const format of exportFormats) {
        await onExport(format.value, null);
        // Kleine Pause zwischen den Downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      toast.success('Alle Formate erfolgreich exportiert! (HTML, JSON, XML, CSV)');
    } catch (error) {
      console.error('Multi-export error:', error);
      toast.error('Multi-Format Export fehlgeschlagen: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="export-dialog">
        <DialogHeader>
          <DialogTitle className="export-title">
            <Download className="w-5 h-5 mr-2" />
            📤 Favoriten Exportieren
          </DialogTitle>
        </DialogHeader>
        
        <div className="export-body">
          <p className="export-description">
            Wählen Sie das gewünschte Export-Format für Ihre Favoriten:
          </p>
          
          <div className="export-formats-grid">
            {exportFormats.map((format) => (
              <div 
                key={format.value}
                className={`export-format-card ${selectedFormat === format.value ? 'selected' : ''}`}
                onClick={() => setSelectedFormat(format.value)}
              >
                <div className="format-icon">{format.icon}</div>
                <div className="format-info">
                  <h4>{format.label}</h4>
                  <p>{format.description}</p>
                </div>
                <input
                  type="radio"
                  name="format"
                  value={format.value}
                  checked={selectedFormat === format.value}
                  onChange={() => setSelectedFormat(format.value)}
                  className="format-radio"
                />
              </div>
            ))}
          </div>
          
          <div className="export-actions">
            <Button
              onClick={handleSingleExport}
              disabled={isExporting}
              className="export-single-btn"
            >
              {isExporting ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {selectedFormat.toUpperCase()} exportieren
            </Button>
            
            <Button
              onClick={handleMultiExport}
              disabled={isExporting}
              className="export-all-btn"
              variant="outline"
            >
              {isExporting ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Archive className="w-4 h-4 mr-2" />
              )}
              Alle Formate exportieren
            </Button>
          </div>
          
          <div className="export-info">
            <p className="info-text">
              <strong>Tipp:</strong> Das HTML-Format wird von allen Browsern unterstützt und ist die beste Wahl für den Re-Import in andere Browser.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
const BookmarkDialog = ({ isOpen, onClose, bookmark, onSave, categories }) => {
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    category: 'Uncategorized'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (bookmark) {
      setFormData({
        title: bookmark.title || '',
        url: bookmark.url || '',
        category: bookmark.category || 'Uncategorized'
      });
    } else {
      setFormData({
        title: '',
        url: '',
        category: '' // Leer für Placeholder
      });
    }
    setErrors({});
  }, [bookmark, isOpen]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Titel ist erforderlich';
    }
    
    if (!formData.url.trim()) {
      newErrors.url = 'URL ist erforderlich';
    } else {
      try {
        new URL(formData.url);
      } catch {
        newErrors.url = 'Bitte geben Sie eine gültige URL ein';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      setErrors({ submit: 'Fehler beim Speichern. Bitte versuchen Sie es erneut.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Einzigartige Kategorien für Dropdown erstellen
  const uniqueCategories = [...new Set((categories || [])
    .map(cat => cat.name)
    .filter(name => name && name.trim() !== '') // Filter leere/undefined Namen
  )];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bookmark-dialog">
        <DialogHeader>
          <DialogTitle>
            📝 {bookmark ? 'Favorit bearbeiten' : 'Neuer Favorit'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="bookmark-form">
          <div className="form-group">
            <Label htmlFor="title">
              Titel *
              {errors.title && <span className="error-text"> - {errors.title}</span>}
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Titel des Favoriten"
              className={errors.title ? 'error' : ''}
              required
            />
          </div>
          
          <div className="form-group">
            <Label htmlFor="url">
              URL *
              {errors.url && <span className="error-text"> - {errors.url}</span>}
            </Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({...formData, url: e.target.value})}
              placeholder="https://example.com"
              className={errors.url ? 'error' : ''}
              required
            />
          </div>
          
          <div className="form-group">
            <Label htmlFor="category">Kategorie</Label>
            <Select 
              value={formData.category || ''} 
              onValueChange={(value) => setFormData({...formData, category: value})}
            >
              <SelectTrigger className="category-selector">
                <SelectValue placeholder="Kategorie auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Uncategorized">Nicht zugeordnet</SelectItem>
                {uniqueCategories.filter(cat => cat !== 'Uncategorized').map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="form-group">
            <Label htmlFor="description">Beschreibung (optional)</Label>
            <textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Kurze Beschreibung des Favoriten"
              className="form-textarea"
              rows="3"
            />
          </div>
          
          <div className="form-actions">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : bookmark ? (
                <Edit className="w-4 h-4 mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {bookmark ? 'Aktualisieren' : 'Erstellen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Temporary placeholder for CategoryManageDialog
const CategoryManageDialog = ({ isOpen, onClose, categories, onSave }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="category-manage-dialog-live">
        <DialogHeader>
          <DialogTitle className="category-manage-title">
            🏷️ Kategorien verwalten
          </DialogTitle>
          <p className="category-manage-subtitle">
            Kategorie-Management wird demnächst implementiert.
          </p>
        </DialogHeader>
        
        <div className="dialog-actions-minimal">
          <Button onClick={onClose} className="close-dialog-btn">
            <X className="w-4 h-4 mr-2" />
            Schließen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Help Dialog Component with comprehensive content and new hierarchical submenu system
const HelpDialog = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState('favorites-import');
  
  const menuSections = {
    // Favoriten Importieren und Exportieren als separate Punkte
    'favorites-import': 'Favoriten Importieren',
    'favorites-export': 'Favoriten Exportieren',
    'import-guide': 'Schritt-für-Schritt Anleitung',
    'import-formats': 'Unterstützte Dateiformate', 
    
    // Funktionen
    'link-validation': 'Link Validierung',
    'duplicate-management': 'Duplikat-Management',
    'category-management': 'Kategorien verwalten',
    
    // Shortcuts
    'shortcuts': 'Shortcuts',
    
    // Tipps und Tricks
    'supported-browsers': 'Unterstützte Browser',
    'installation-help': 'Installationshilfe',
    'tips-tricks': 'Tipps & Tricks',
    
    // Features Übersicht
    'features-overview': 'Features Übersicht'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="help-dialog">
        <DialogHeader>
          <DialogTitle className="help-title-inline">
            <HelpCircle className="w-5 h-5 mr-2" />
            FavOrg - Hilfe & Anleitung
          </DialogTitle>
        </DialogHeader>
        
        <div className="help-body-with-nav">
          {/* Navigation Menu mit hierarchischer Struktur */}
          <div className="help-navigation">
            <div className="nav-section">
              <h4 className="nav-section-title">📥 Import/Export</h4>
              <button
                className={`nav-menu-item ${activeSection === 'favorites-import' ? 'active' : ''}`}
                onClick={() => setActiveSection('favorites-import')}
              >
                Favoriten Importieren
              </button>
              <button
                className={`nav-menu-item ${activeSection === 'favorites-export' ? 'active' : ''}`}
                onClick={() => setActiveSection('favorites-export')}
              >
                Favoriten Exportieren
              </button>
              <button
                className={`nav-menu-item ${activeSection === 'import-guide' ? 'active' : ''}`}
                onClick={() => setActiveSection('import-guide')}
              >
                Schritt-für-Schritt Anleitung
              </button>
              <button
                className={`nav-menu-item ${activeSection === 'import-formats' ? 'active' : ''}`}
                onClick={() => setActiveSection('import-formats')}
              >
                Unterstützte Dateiformate
              </button>
            </div>

            <div className="nav-section">
              <h4 className="nav-section-title">⚙️ Funktionen</h4>
              <button
                className={`nav-menu-item ${activeSection === 'link-validation' ? 'active' : ''}`}
                onClick={() => setActiveSection('link-validation')}
              >
                Link Validierung
              </button>
              <button
                className={`nav-menu-item ${activeSection === 'duplicate-management' ? 'active' : ''}`}
                onClick={() => setActiveSection('duplicate-management')}
              >
                Duplikat-Management
              </button>
              <button
                className={`nav-menu-item ${activeSection === 'category-management' ? 'active' : ''}`}
                onClick={() => setActiveSection('category-management')}
              >
                Kategorien verwalten
              </button>
            </div>

            <div className="nav-section">
              <h4 className="nav-section-title">⌨️ Shortcuts</h4>
              <button
                className={`nav-menu-item ${activeSection === 'shortcuts' ? 'active' : ''}`}
                onClick={() => setActiveSection('shortcuts')}
              >
                Shortcuts
              </button>
            </div>

            <div className="nav-section">
              <h4 className="nav-section-title">💡 Tipps und Tricks</h4>
              <button
                className={`nav-menu-item ${activeSection === 'supported-browsers' ? 'active' : ''}`}
                onClick={() => setActiveSection('supported-browsers')}
              >
                Unterstützte Browser
              </button>
              <button
                className={`nav-menu-item ${activeSection === 'installation-help' ? 'active' : ''}`}
                onClick={() => setActiveSection('installation-help')}
              >
                Installationshilfe
              </button>
              <button
                className={`nav-menu-item ${activeSection === 'tips-tricks' ? 'active' : ''}`}
                onClick={() => setActiveSection('tips-tricks')}
              >
                Tipps & Tricks
              </button>
            </div>

            <div className="nav-section">
              <h4 className="nav-section-title">📋 Features Übersicht</h4>
              <button
                className={`nav-menu-item ${activeSection === 'features-overview' ? 'active' : ''}`}
                onClick={() => setActiveSection('features-overview')}
              >
                Features Übersicht
              </button>
            </div>
          </div>
          
          {/* Content Area */}
          <div className="help-content-area">
            {activeSection === 'favorites-import' && (
              <div className="help-section">
                <h4>Favoriten Importieren</h4>
                <p>
                  FavOrg unterstützt den Import aus verschiedenen Browsern und Formaten.
                  Die Anwendung erkennt automatisch das Format und importiert Ihre Favoriten
                  mit allen Kategorien und Hierarchien.
                </p>
                <ul>
                  <li><strong>Multi-Browser Unterstützung:</strong> Chrome, Firefox, Edge, Safari</li>
                  <li><strong>Automatische Erkennung:</strong> Format wird automatisch erkannt</li>
                  <li><strong>Duplikat-Schutz:</strong> Doppelte Einträge werden vermieden</li>
                  <li><strong>Kategoriestruktur:</strong> Ordnerhierarchie bleibt erhalten</li>
                </ul>
                <p><strong>Schritt-für-Schritt:</strong> Klicken Sie auf "Datei wählen" im Header und wählen Sie Ihre exportierte Browser-Datei aus.</p>
              </div>
            )}

            {activeSection === 'favorites-export' && (
              <div className="help-section">
                <h4>Favoriten Exportieren</h4>
                <p>Exportieren Sie Ihre Favoriten in verschiedene Formate für maximale Kompatibilität:</p>
                <ul>
                  <li><strong>HTML Export:</strong> Standard-Format für alle Browser (Chrome, Firefox, Edge, Safari)</li>
                  <li><strong>JSON Export:</strong> Chrome-kompatibles Format mit vollständigen Metadaten</li>
                  <li><strong>XML Export:</strong> Strukturierte Daten für Re-Import in FavOrg</li>
                  <li><strong>CSV Export:</strong> Tabellenformat für Excel und Tabellenkalkulation</li>
                  <li><strong>Alle Formate:</strong> Simultaner Export aller 4 Formate</li>
                </ul>
                <p><strong>Zugriff:</strong> Verwenden Sie den "Fav-Export" Button im Header oder über Einstellungen → Export-Optionen</p>
              </div>
            )}
            
            {activeSection === 'import-guide' && (
              <div className="help-section">
                <h4>Schritt-für-Schritt Anleitung</h4>
                <p>So importieren Sie Ihre Favoriten in wenigen Schritten:</p>
                <ul>
                  <li><strong>Schritt 1:</strong> Exportieren Sie Favoriten aus Ihrem Browser</li>
                  <li><strong>Schritt 2:</strong> Klicken Sie auf "Datei wählen" in FavOrg</li>
                  <li><strong>Schritt 3:</strong> Wählen Sie die exportierte Datei aus</li>
                  <li><strong>Schritt 4:</strong> FavOrg verarbeitet die Datei automatisch</li>
                  <li><strong>Schritt 5:</strong> Überprüfen Sie die importierten Favoriten</li>
                  <li><strong>Schritt 6:</strong> Nutzen Sie "Prüfen" um Links zu validieren</li>
                </ul>
              </div>
            )}
            
            {activeSection === 'import-formats' && (
              <div className="help-section">
                <h4>Unterstützte Dateiformate</h4>
                <p>FavOrg unterstützt verschiedene Importformate:</p>
                <ul>
                  <li><strong>HTML:</strong> Standard Browser-Export Format (.html)</li>
                  <li><strong>JSON:</strong> Chrome Bookmark Export (.json)</li>
                  <li><strong>CSV:</strong> Tabellenformat mit Titel, URL, Kategorie (.csv)</li>
                  <li><strong>XML:</strong> Strukturiertes Datenformat (.xml)</li>
                </ul>
                <p>Das HTML-Format wird am häufigsten verwendet und von allen Browsern unterstützt.</p>
              </div>
            )}

            {activeSection === 'link-validation' && (
              <div className="help-section">
                <h4>Link-Validierung</h4>
                <p>Der "Prüfen" Button überprüft alle Favoriten auf Erreichbarkeit:</p>
                <ul>
                  <li><strong>Aktiv (Grün):</strong> Link ist erreichbar und funktioniert</li>
                  <li><strong>Tot (Rot):</strong> Link ist nicht mehr erreichbar</li>
                  <li><strong>Localhost (Grau):</strong> Lokale Entwicklungslinks</li>
                  <li><strong>Timeout (Gelb):</strong> Link antwortet nicht rechtzeitig</li>
                  <li><strong>Ungeprüft (Weiß):</strong> Noch nicht validiert</li>
                </ul>
                <p>Nach der Validierung können tote Links automatisch entfernt werden.</p>
              </div>
            )}

            {activeSection === 'duplicate-management' && (
              <div className="help-section">
                <h4>Duplikat-Management</h4>
                <p>Finden und verwalten Sie doppelte Einträge:</p>
                <ul>
                  <li><strong>Automatische Erkennung:</strong> Basiert auf URL-Normalisierung</li>
                  <li><strong>Markierung:</strong> Duplikate werden orange markiert</li>
                  <li><strong>Bulk-Löschung:</strong> Alle markierten Duplikate entfernen</li>
                  <li><strong>Intelligente Auswahl:</strong> Neuester Eintrag wird beibehalten</li>
                </ul>
                <p>Zugriff über den "Duplikate" Button im Header</p>
              </div>
            )}

            {activeSection === 'category-management' && (
              <div className="help-section">
                <h4>Kategorien verwalten</h4>
                <p>Organisieren Sie Ihre Favoriten mit Kategorien:</p>
                <ul>
                  <li><strong>Hierarchische Struktur:</strong> Hauptkategorien und Unterkategorien</li>
                  <li><strong>Drag & Drop:</strong> Kategorien zwischen allen Ebenen verschieben</li>
                  <li><strong>Automatische Zählung:</strong> Anzahl der Favoriten pro Kategorie</li>
                  <li><strong>Sidebar-Größe:</strong> Kategorienbereich ist vergrößerbar</li>
                  <li><strong>Browser-basiert:</strong> Basierend auf Original-Browser-Ordnern</li>
                </ul>
              </div>
            )}
            
            {activeSection === 'shortcuts' && (
              <div className="help-section">
                <h4>Tastatur-Shortcuts</h4>
                <ul>
                  <li><strong>Escape:</strong> Suchfeld leeren</li>
                  <li><strong>Alt + F:</strong> Fokus auf Suchfeld</li>
                  <li><strong>Alt + N:</strong> Neuen Favorit erstellen</li>
                  <li><strong>Alt + I:</strong> Import-Dialog öffnen</li>
                  <li><strong>Alt + E:</strong> Export-Dialog öffnen</li>
                  <li><strong>F5:</strong> Statistiken aktualisieren</li>
                </ul>
                
                <h4>Maus-Aktionen</h4>
                <ul>
                  <li><strong>Doppelklick:</strong> Favorit in neuem Tab öffnen</li>
                  <li><strong>Status-Badge klicken:</strong> Status ändern</li>
                  <li><strong>Drag & Drop:</strong> Favoriten und Kategorien verschieben</li>
                  <li><strong>Spaltenränder ziehen:</strong> Spaltenbreite anpassen</li>
                </ul>
              </div>
            )}

            {activeSection === 'supported-browsers' && (
              <div className="help-section">
                <h4>Unterstützte Browser</h4>
                <p>FavOrg kann Favoriten aus allen gängigen Browsern importieren:</p>
                <ul>
                  <li><strong>Google Chrome:</strong> Bookmarks → Lesezeichen-Manager → Exportieren</li>
                  <li><strong>Mozilla Firefox:</strong> Lesezeichen → Alle Lesezeichen anzeigen → Exportieren</li>
                  <li><strong>Microsoft Edge:</strong> Favoriten → Favoriten verwalten → Exportieren</li>
                  <li><strong>Safari:</strong> Datei → Lesezeichen exportieren</li>
                  <li><strong>Opera:</strong> Lesezeichen → Lesezeichen exportieren</li>
                  <li><strong>Vivaldi:</strong> Lesezeichen → Lesezeichen exportieren</li>
                </ul>
              </div>
            )}
            
            {activeSection === 'installation-help' && (
              <div className="help-section">
                <h4>Installationshilfe</h4>
                <p>FavOrg ist eine webbasierte Anwendung, die keine lokale Installation erfordert.</p>
                
                <h5>Browser-Empfehlungen</h5>
                <ul>
                  <li><strong>Chrome/Edge:</strong> Beste Performance und Kompatibilität</li>
                  <li><strong>Firefox:</strong> Vollständig unterstützt</li>
                  <li><strong>Safari:</strong> Grundfunktionen verfügbar</li>
                  <li><strong>Mindestversion:</strong> Aktuelle Browser-Versionen empfohlen</li>
                </ul>
                
                <h5>System-Anforderungen</h5>
                <ul>
                  <li><strong>RAM:</strong> Minimum 4GB für große Sammlungen</li>
                  <li><strong>Bildschirmauflösung:</strong> 1280x720 oder höher</li>
                  <li><strong>Internet:</strong> Stabile Verbindung für Link-Validierung</li>
                  <li><strong>JavaScript:</strong> Muss aktiviert sein</li>
                </ul>
              </div>
            )}

            {activeSection === 'tips-tricks' && (
              <div className="help-section">
                <h4>Tipps & Tricks</h4>
                <ul>
                  <li><strong>Regelmäßige Validierung:</strong> Überprüfen Sie Links monatlich</li>
                  <li><strong>Kategorisierung:</strong> Nutzen Sie aussagekräftige Namen</li>
                  <li><strong>Export-Backup:</strong> Erstellen Sie regelmäßige Backups</li>
                  <li><strong>Duplikat-Bereinigung:</strong> Entfernen Sie regelmäßig Duplikate</li>
                  <li><strong>Localhost-Markierung:</strong> Markieren Sie Entwicklungslinks</li>
                </ul>
                
                <h4>Best Practices</h4>
                <ul>
                  <li><strong>Konsistente Kategorien:</strong> Entwickeln Sie ein Schema</li>
                  <li><strong>Aussagekräftige Titel:</strong> Verwenden Sie klare Beschreibungen</li>
                  <li><strong>Hierarchien nutzen:</strong> Unterkategorien für bessere Organisation</li>
                  <li><strong>Regelmäßige Wartung:</strong> Monatliche Bereinigung empfohlen</li>
                </ul>
              </div>
            )}
            
            {activeSection === 'features-overview' && (
              <div className="help-section">
                <h4>Features Übersicht</h4>
                <p>FavOrg bietet umfassende Funktionen für die Favoritenverwaltung:</p>
                <ul>
                  <li><strong>Multi-Format Import/Export:</strong> HTML, JSON, XML, CSV</li>
                  <li><strong>Link-Validierung:</strong> Automatische Überprüfung auf tote Links</li>
                  <li><strong>Duplikat-Erkennung:</strong> Intelligente Bereinigung</li>
                  <li><strong>Drag & Drop:</strong> Favoriten und Kategorien verschieben</li>
                  <li><strong>Kategorisierung:</strong> Hierarchische Organisation</li>
                  <li><strong>Suche:</strong> Durchsuchen von Titel, URL und Kategorien</li>
                  <li><strong>Status-Management:</strong> Verschiedene Link-Status</li>
                  <li><strong>Statistiken:</strong> Detaillierte Übersicht Ihrer Sammlung</li>
                  <li><strong>Responsive Design:</strong> Desktop, Tablet und Mobile</li>
                  <li><strong>Dark Theme:</strong> Angepasstes dunkles Design</li>
                </ul>
                
                <div className="version-info">
                  <p><strong>Version:</strong> 2.1.0</p>
                  <p><strong>Letzte Aktualisierung:</strong> Dezember 2024</p>
                  <p><strong>Neue Features:</strong> Multi-Format Export, Drag & Drop, erweiterte Kategorieverwaltung</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const StatisticsDialog = ({ isOpen, onClose, statistics, onRefresh }) => {
  if (!statistics) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="statistics-dialog" style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-primary)'
      }}>
        <DialogHeader>
          <DialogTitle className="dialog-title" style={{ 
            color: 'var(--text-primary)',
            fontSize: '18px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <BarChart3 className="w-5 h-5 mr-2" />
            Statistiken
          </DialogTitle>
        </DialogHeader>
        
        <div className="statistics-content" style={{
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)'
        }}>
          {/* Statistiken als vertikale Liste mit größeren Fonts */}
          <div className="stats-vertical-list" style={{ marginBottom: '24px' }}>
            <div className="stat-line" style={{ fontSize: '16px', marginBottom: '8px' }}>
              <span className="stat-icon-text">📊</span>
              <span className="stat-text">Gesamt Favoriten [{statistics.total_bookmarks}]</span>
            </div>
            
            <div className="stat-line" style={{ fontSize: '16px', marginBottom: '8px' }}>
              <span className="stat-icon-text">📁</span>
              <span className="stat-text">Kategorien [{statistics.total_categories}]</span>
            </div>
            
            <div className="stat-line" style={{ fontSize: '16px', marginBottom: '8px' }}>
              <span className="stat-icon-text">📈</span>
              <span className="stat-text">Status-Verteilung []</span>
            </div>
            
            <div className="stat-line" style={{ fontSize: '16px', marginBottom: '8px' }}>
              <span className="stat-icon-text">✅</span>
              <span className="stat-text">Aktiv [{statistics.active_links}]</span>
            </div>
            
            <div className="stat-line" style={{ fontSize: '16px', marginBottom: '8px' }}>
              <span className="stat-icon-text">❌</span>
              <span className="stat-text">Tot [{statistics.dead_links}]</span>
            </div>
            
            <div className="stat-line" style={{ fontSize: '16px', marginBottom: '8px' }}>
              <span className="stat-icon-text">🏠</span>
              <span className="stat-text">Localhost [{statistics.localhost_links || 0}]</span>
            </div>
            
            <div className="stat-line" style={{ fontSize: '16px', marginBottom: '8px' }}>
              <span className="stat-icon-text">🔄</span>
              <span className="stat-text">Duplikate [{statistics.duplicate_links || 0}]</span>
            </div>
            
            <div className="stat-line" style={{ fontSize: '16px', marginBottom: '8px' }}>
              <span className="stat-icon-text">⏱️</span>
              <span className="stat-text">Timeout [{statistics.timeout_links}]</span>
            </div>
            
            <div className="stat-line" style={{ fontSize: '16px', marginBottom: '24px' }}>
              <span className="stat-icon-text">❓</span>
              <span className="stat-text">Ungeprüft [{statistics.unchecked_links}]</span>
            </div>
          </div>
          
          <div className="dialog-actions" style={{ display: 'flex', gap: '12px' }}>
            <Button
              onClick={onRefresh}
              className="stats-refresh-btn"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Aktualisieren
            </Button>
            <Button variant="outline"  
            onClick={onClose} 
            className="stats-close-btn" 
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              borderColor: 'var(--border-primary)'
            }}>
              Schließen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Rekursive Komponente für Kategorie-Hierarchie - MUSS VOR CategorySidebar definiert werden
const CategoryNode = ({ category, level = 0, expandedCategories, onCategoryChange, activeCategory, activeSubcategory, onCategoryDragStart, onCategoryDragOver, onCategoryDragLeave, onCategoryDrop, onCategoryDragEnd, dragOverCategory, toggleCategory, organizedCategories }) => {
  const isExpanded = expandedCategories.has(category.name);
  const isActive = (level === 0 && activeCategory === category.name && !activeSubcategory) ||
                   (level > 0 && activeCategory && activeSubcategory === category.name);
  
  return (
    <div className="category-group">
      <div
        className={`category-item ${level === 0 ? 'main-category' : 'subcategory'} draggable ${isActive ? 'active' : ''} ${dragOverCategory?.id === category.id ? 'drag-over' : ''}`}
        style={{ marginLeft: `${level * 20}px` }}
        onClick={() => {
          if (level === 0) {
            onCategoryChange(category.name, null);
          } else {
            // Finde Parent-Kategorie für Subcategory
            const findParent = (cats, targetName, currentParent = null) => {
              for (const cat of cats) {
                if (cat.name === targetName && currentParent) {
                  return currentParent.name;
                }
                if (cat.children) {
                  const result = findParent(cat.children, targetName, cat);
                  if (result) return result;
                }
              }
              return null;
            };
            const parentName = findParent(organizedCategories, category.name);
            onCategoryChange(parentName || category.name, category.name);
          }
        }}
        draggable={category.name !== 'Alle'}
        onDragStart={(e) => onCategoryDragStart(e, category, level > 0)}
        onDragOver={(e) => onCategoryDragOver(e, category, level > 0)}
        onDragLeave={onCategoryDragLeave}
        onDrop={(e) => onCategoryDrop(e, category, level > 0)}
        onDragEnd={onCategoryDragEnd}
      >
        <div className="category-info">
          <GripVertical className="drag-handle" />
          
          {/* Expand/Collapse für Kategorien mit Kindern */}
          {category.children && category.children.length > 0 ? (
            isExpanded ? (
              <ChevronDown 
                className="expand-icon" 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCategory(category.name);
                }}
              />
            ) : (
              <ChevronRight 
                className="expand-icon" 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCategory(category.name);
                }}
              />
            )
          ) : (
            <div className="expand-icon-placeholder" />
          )}
          
          {/* Kategorie Icon basierend auf Level */}
          {level === 0 ? (
            category.name.startsWith('_') ? (
              <Folder className="category-icon inactive-icon" />
            ) : (
              <Folder className="category-icon active-icon" />
            )
          ) : (
            <Folder className="category-icon sub-icon" />
          )}
          
          <span className="category-name">
            {category.name} ({category.bookmark_count || 0})
          </span>
        </div>
      </div>
      
      {/* Rekursiv Kinder rendern */}
      {isExpanded && category.children && category.children.map(child => (
        <CategoryNode
          key={child.id}
          category={child}
          level={level + 1}
          expandedCategories={expandedCategories}
          onCategoryChange={onCategoryChange}
          activeCategory={activeCategory}
          activeSubcategory={activeSubcategory}
          onCategoryDragStart={onCategoryDragStart}
          onCategoryDragOver={onCategoryDragOver}
          onCategoryDragLeave={onCategoryDragLeave}
          onCategoryDrop={onCategoryDrop}
          onCategoryDragEnd={onCategoryDragEnd}
          dragOverCategory={dragOverCategory}
          toggleCategory={toggleCategory}
          organizedCategories={organizedCategories}
        />
      ))}
    </div>
  );
};

// Category Sidebar Component
const CategorySidebar = ({ categories, activeCategory, activeSubcategory, onCategoryChange, bookmarkCounts, statistics, onCategoryReorder, onBookmarkToCategory, onCategoryManage }) => {
  const [expandedCategories, setExpandedCategories] = useState(new Set(['Alle']));
  const [showBrowserInfo, setShowBrowserInfo] = useState(false);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [draggedCategory, setDraggedCategory] = useState(null);
  const [dragOverCategory, setDragOverCategory] = useState(null);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    return parseInt(localStorage.getItem('favorg-sidebar-width') || '280');
  });
  const [isResizing, setIsResizing] = useState(false);

  // Auflösungserkennung beim Programmstart und bei Änderungen
  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sidebar Width im LocalStorage speichern und CSS-Variable setzen
  useEffect(() => {
    localStorage.setItem('favorg-sidebar-width', sidebarWidth.toString());
    // CSS-Variable für main-content setzen
    document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
  }, [sidebarWidth]);

  // Resize Handler für Sidebar
  const handleMouseDown = (e) => {
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (e) => {
      const newWidth = Math.max(200, Math.min(500, startWidth + (e.clientX - startX)));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const toggleCategory = (categoryName) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const handleInfoClick = (event) => {
    const rect = event.target.getBoundingClientRect();
    const sidebarRect = event.target.closest('.sidebar').getBoundingClientRect();
    
    // Berechne Position basierend auf Auflösung
    let left = rect.right + 10; // Standardposition rechts vom Icon
    let top = rect.top;
    
    // Wenn nicht genug Platz rechts, positioniere innerhalb der Sidebar
    if (left + 200 > screenWidth) {
      left = sidebarRect.right - 220; // 200px Tooltip-Breite + 20px Margin
    }
    
    // Stelle sicher, dass Tooltip nicht über Bildschirmrand hinausgeht
    if (top + 60 > window.innerHeight) {
      top = window.innerHeight - 70;
    }
    
    setTooltipPosition({ top, left });
    setShowBrowserInfo(!showBrowserInfo);
  };

  // Drag & Drop Handlers für Kategorien
  const handleCategoryDragStart = (e, category, isSubcategory = false) => {
    setDraggedCategory({...category, isSubcategory});
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', category.id);
  };

  const handleCategoryDragOver = (e, category, isSubcategory = false) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCategory({...category, isSubcategory});
  };

  const handleCategoryDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverCategory(null);
    }
  };

  const handleCategoryDrop = (e, targetCategory, isTargetSubcategory = false) => {
    e.preventDefault();
    
    // Check if dragging a bookmark from main area to category
    const bookmarkData = e.dataTransfer.getData('application/json');
    if (bookmarkData) {
      try {
        const draggedBookmark = JSON.parse(bookmarkData);
        if (draggedBookmark && draggedBookmark.id && draggedBookmark.title) {
          // Call the main component's handler for bookmark to category
          if (onBookmarkToCategory) {
            onBookmarkToCategory(draggedBookmark, targetCategory, isTargetSubcategory);
          }
          return;
        }
      } catch (parseError) {
        console.log('Not a bookmark drag operation, checking for category...');
      }
    }
    
    // Original category-to-category logic
    if (draggedCategory && targetCategory && draggedCategory.id !== targetCategory.id) {
      // Hier würde normalerweise eine API-Anfrage an das Backend gemacht
      // Für jetzt loggen wir die Aktion
      const draggedType = draggedCategory.isSubcategory ? 'Unterkategorie' : 'Kategorie';
      const targetType = isTargetSubcategory ? 'Unterkategorie' : 'Kategorie';
      
      console.log(`${draggedType} "${draggedCategory.name}" zu ${targetType} "${targetCategory.name}" verschoben`);
      
      // Erweiterte Logik für alle Verschiebungs-Szenarien
      let moveDescription = '';
      
      if (draggedCategory.isSubcategory && isTargetSubcategory) {
        // Unterkategorie zu Unterkategorie
        moveDescription = `Unterkategorie "${draggedCategory.name}" zwischen Unterkategorien zu "${targetCategory.name}" verschoben`;
      } else if (draggedCategory.isSubcategory && !isTargetSubcategory) {
        // Unterkategorie zu Hauptkategorie
        moveDescription = `Unterkategorie "${draggedCategory.name}" zur Hauptkategorie "${targetCategory.name}" verschoben`;
      } else if (!draggedCategory.isSubcategory && isTargetSubcategory) {
        // Hauptkategorie zu Unterkategorie (wird zur Unterkategorie der Parent-Kategorie)
        moveDescription = `Kategorie "${draggedCategory.name}" zur Unterkategorie unter "${targetCategory.parent_category || 'Unbekannt'}" verschoben`;
      } else {
        // Hauptkategorie zu Hauptkategorie
        moveDescription = `Kategorie "${draggedCategory.name}" zu Kategorie "${targetCategory.name}" verschoben`;
      }
      
      // Simulate category reorder
      if (onCategoryReorder) {
        onCategoryReorder(draggedCategory, targetCategory);
      }
      
      toast.success(moveDescription);
    }
    
    setDraggedCategory(null);
    setDragOverCategory(null);
  };

  const handleCategoryDragEnd = () => {
    setDraggedCategory(null);
    setDragOverCategory(null);
  };

  // Organisiere Kategorien nach Hierarchie - UNBEGRENZTE EBENEN
  const organizeCategories = () => {
    const categoryMap = new Map();
    const rootCategories = [];
    
    // Erstelle Map aller Kategorien für schnelle Suche
    categories.forEach(category => {
      categoryMap.set(category.name, {
        ...category,
        children: []
      });
    });
    
    // Erstelle hierarchische Struktur
    categories.forEach(category => {
      const categoryObj = categoryMap.get(category.name);
      
      if (!category.parent_category) {
        // Hauptkategorie
        rootCategories.push(categoryObj);
      } else {
        // Unterkategorie - füge zu Parent hinzu
        const parent = categoryMap.get(category.parent_category);
        if (parent) {
          parent.children.push(categoryObj);
        } else {
          // Parent nicht gefunden - wird zu Hauptkategorie
          rootCategories.push(categoryObj);
        }
      }
    });
    
    return rootCategories;
  };

  const organizedCategories = organizeCategories();

  return (
    <div className="sidebar" style={{ width: `${sidebarWidth}px` }}>
      <div 
        className="sidebar-resizer"
        onMouseDown={handleMouseDown}
        style={{ cursor: isResizing ? 'ew-resize' : 'ew-resize' }}
      ></div>
      <div className="sidebar-content">
        <div className="sidebar-header">
          <div className="sidebar-title-section">
            <h3 className="sidebar-title">Kategorien</h3>
            <button
              className="category-manage-btn"
              onClick={() => onCategoryManage && onCategoryManage()}
              title="Kategorien verwalten"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="sidebar-info">
            <button
              className="info-link"
              onClick={handleInfoClick}
              title="Information über Kategorien"
            >
              <AlertTriangle className="w-4 h-4" />
            </button>
            {showBrowserInfo && (
              <div 
                className="info-tooltip info-tooltip-positioned"
                style={{
                  position: 'fixed',
                  top: `${tooltipPosition.top}px`,
                  left: `${tooltipPosition.left}px`,
                  zIndex: 9999
                }}
              >
                Basierend auf Browser-Ordnern
                <button 
                  className="tooltip-close"
                  onClick={() => setShowBrowserInfo(false)}
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="category-list">
          <div
            className={`category-item main-category ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => onCategoryChange('all', null)}
          >
            <div className="category-info">
              <FolderOpen className="category-icon all-icon" />
              <span className="category-name">Alle ({statistics?.total_bookmarks || 0})</span>
            </div>
          </div>
          
          {organizedCategories.map(category => (
            <CategoryNode
              key={category.id}
              category={category}
              level={0}
              expandedCategories={expandedCategories}
              onCategoryChange={onCategoryChange}
              activeCategory={activeCategory}
              activeSubcategory={activeSubcategory}
              onCategoryDragStart={handleCategoryDragStart}
              onCategoryDragOver={handleCategoryDragOver}
              onCategoryDragLeave={handleCategoryDragLeave}
              onCategoryDrop={handleCategoryDrop}
              onCategoryDragEnd={handleCategoryDragEnd}
              dragOverCategory={dragOverCategory}
              toggleCategory={toggleCategory}
              organizedCategories={organizedCategories}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const BookmarkList = ({ bookmarks, onDeleteBookmark, onEditBookmark, onToggleStatus, onBookmarkReorder }) => {
  const [draggedBookmark, setDraggedBookmark] = useState(null);
  const [dragOverBookmark, setDragOverBookmark] = useState(null);

  // Drag & Drop Handlers für Bookmarks
  const handleBookmarkDragStart = (e, bookmark) => {
    setDraggedBookmark(bookmark);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', bookmark.id);
    // Add JSON data for cross-component drag & drop
    e.dataTransfer.setData('application/json', JSON.stringify(bookmark));
  };

  const handleBookmarkDragOver = (e, bookmark) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverBookmark(bookmark);
  };

  const handleBookmarkDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverBookmark(null);
    }
  };

  const handleBookmarkDrop = (e, targetBookmark) => {
    e.preventDefault();
    
    if (draggedBookmark && targetBookmark && draggedBookmark.id !== targetBookmark.id) {
      console.log('Moving bookmark:', draggedBookmark.title, 'to position of', targetBookmark.title);
      
      // Simulate bookmark reorder
      if (onBookmarkReorder) {
        onBookmarkReorder(draggedBookmark, targetBookmark);
      }
      
      toast.success(`Favorit "${draggedBookmark.title}" wurde verschoben`);
    }
    
    setDraggedBookmark(null);
    setDragOverBookmark(null);
  };

  const handleBookmarkDragEnd = () => {
    setDraggedBookmark(null);
    setDragOverBookmark(null);
  };

  const getStatusBadge = (bookmark) => {
    const statusType = bookmark.status_type || (bookmark.is_dead_link ? 'dead' : 'active');
    
    const statusOptions = [
      { value: 'active', label: 'Aktiv', className: 'status-active' },
      { value: 'dead', label: 'Tot', className: 'status-dead' },
      { value: 'localhost', label: 'Localhost', className: 'status-localhost' },
      { value: 'duplicate', label: 'Duplikat', className: 'status-duplicate' },
      { value: 'unchecked', label: 'Ungeprüft', className: 'status-unchecked' }
    ];
    
    const currentStatus = statusOptions.find(s => s.value === statusType) || statusOptions[0];

    return (
      <div className="status-badge-dropdown" onClick={(e) => e.stopPropagation()}>
        <select 
          value={statusType || 'active'} 
          onChange={(e) => onToggleStatus(bookmark.id, e.target.value)}
          className={`status-badge ${currentStatus.className} status-select`}
        >
          {statusOptions.map(option => (
            <option 
              key={option.value} 
              value={option.value}
              className={`status-option ${option.className}`}
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const handleStatusToggle = (bookmark) => {
    // Alte Toggle-Logik: Dead -> Active
    onToggleStatus(bookmark.id, 'active');
  };

  if (bookmarks.length === 0) {
    return (
      <div className="empty-state">
        <LinkIcon className="empty-icon" />
        <h3>Keine Favoriten gefunden</h3>
        <p>Importieren Sie Ihre Browser-Favoriten oder fügen Sie neue hinzu.</p>
      </div>
    );
  }

  return (
    <div className="bookmark-list">
      {bookmarks.map(bookmark => (
        <Card 
          key={bookmark.id} 
          className={`bookmark-card draggable ${bookmark.is_dead_link ? 'dead-link' : 'active-link'} ${dragOverBookmark?.id === bookmark.id ? 'drag-over' : ''}`}
          draggable
          onDragStart={(e) => handleBookmarkDragStart(e, bookmark)}
          onDragOver={(e) => handleBookmarkDragOver(e, bookmark)}
          onDragLeave={handleBookmarkDragLeave}
          onDrop={(e) => handleBookmarkDrop(e, bookmark)}
          onDragEnd={handleBookmarkDragEnd}
        >
          <CardHeader className="bookmark-header">
            <div className="bookmark-title-row">
              <div className="bookmark-title-section">
                <GripVertical className="drag-handle bookmark-drag" />
                <CardTitle className="bookmark-title">
                  {bookmark.title}
                </CardTitle>
              </div>
              <div className="bookmark-actions">
                {getStatusBadge(bookmark)}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(bookmark.url, '_blank')}
                  className="edit-btn"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditBookmark(bookmark)}
                  className="edit-btn"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteBookmark(bookmark.id)}
                  className="delete-btn"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="bookmark-meta">
              <div className="bookmark-source">
                <Badge variant="outline" className="source-badge">
                  Chrome
                </Badge>
              </div>
              <div className="bookmark-url">
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bookmark-link"
                >
                  {bookmark.url}
                </a>
              </div>
            </div>
            
            <div className="bookmark-categories">
              <span className="category-label">Kategorie:</span>
              <span className="category-value">
                {bookmark.category}
                {bookmark.subcategory && ` → ${bookmark.subcategory}`}
              </span>
              <span className="date-added">
                Hinzugefügt: {new Date(bookmark.date_added).toLocaleDateString('de-DE')}
              </span>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
};

// Settings Dialog Component
const SettingsDialog = ({ isOpen, onClose, onExport, onCreateTestData, appSettings, onSettingsChange }) => {
  const [settings, setSettings] = useState({
    theme: 'dark',
    autoSync: true,
    notifications: true,
    linkTimeout: '10',
    autoValidate: false,
    duplicateHandling: 'ignore',
    showFavicons: true,
    itemsPerPage: '50',
    autoBackup: false
  });

  // Game Settings State
  const [gameSettings, setGameSettings] = useState(() => {
    const saved = localStorage.getItem('favorg-game-settings');
    return saved ? JSON.parse(saved) : {
      'M-Hidden-Zeit': 3
    };
  });

  // Settings laden beim Dialog öffnen
  useEffect(() => {
    if (isOpen) {
      try {
        const savedSettings = localStorage.getItem('favorg-settings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, [isOpen]);

  const [activeTab, setActiveTab] = useState('display');
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Theme anwenden
      if (settings.theme === 'light') {
        document.documentElement.classList.add('light-theme');
        document.documentElement.classList.remove('dark-theme');
      } else if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark-theme');
        document.documentElement.classList.remove('light-theme');
      } else {
        // Auto - system preference
        document.documentElement.classList.remove('light-theme', 'dark-theme');
      }
      
      // Einstellungen in localStorage speichern
      localStorage.setItem('favorg-settings', JSON.stringify(settings));
      
      // App-Settings aktualisieren
      const updatedAppSettings = {
        ...appSettings,
        theme: settings.theme,
        autoSync: settings.autoSync,
        notifications: settings.notifications
      };
      localStorage.setItem('favorg-app-settings', JSON.stringify(updatedAppSettings));
      onSettingsChange(updatedAppSettings);
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulation
      toast.success('Einstellungen erfolgreich gespeichert.');
      onClose();
    } catch (error) {
      toast.error('Fehler beim Speichern der Einstellungen.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async (format) => {
    setIsExporting(true);
    try {
      await onExport(format, null);
      toast.success(`${format.toUpperCase()}-Export erfolgreich heruntergeladen.`);
    } catch (error) {
      toast.error(`Export fehlgeschlagen: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAllFormats = async () => {
    setIsExporting(true);
    try {
      const favoritesService = new FavoritesService();
      await favoritesService.exportForAllBrowsers();
      toast.success('Alle Formate erfolgreich exportiert! (HTML, JSON, XML, CSV)');
    } catch (error) {
      toast.error('Multi-Format Export fehlgeschlagen: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreateTestData = async () => {
    setIsExporting(true);
    try {
      await onCreateTestData();
      // Dialog schließen und neu laden
      onClose(); 
    } catch (error) {
      toast.error(`Testdaten-Erstellung fehlgeschlagen: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const resetSettings = () => {
    setSettings({
      theme: 'dark',
      autoSync: true,
      notifications: true,
      linkTimeout: '10',
      autoValidate: false,
      duplicateHandling: 'ignore',
      showFavicons: true,
      itemsPerPage: '50',
      autoBackup: false
    });
    toast.success('Einstellungen zurückgesetzt.');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="settings-dialog-modern">
        <DialogHeader className="settings-header">
          <DialogTitle className="settings-title">
            <Settings className="w-5 h-5 mr-2" />
            System-Einstellungen
          </DialogTitle>
        </DialogHeader>
        
        <div className="settings-body">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="settings-tabs-modern">
            <TabsList className="settings-tab-list-modern">
              <TabsTrigger value="display" className="settings-tab-trigger">
                <span className="tab-icon">🎨</span>
                Darstellung
              </TabsTrigger>
              <TabsTrigger value="validation" className="settings-tab-trigger">
                <span className="tab-icon">🔍</span>
                Validierung
              </TabsTrigger>
              <TabsTrigger value="import-export" className="settings-tab-trigger">
                <span className="tab-icon">📁</span>
                Import/Export
              </TabsTrigger>
              <TabsTrigger value="advanced" className="settings-tab-trigger">
                <span className="tab-icon">⚙️</span>
                Erweitert
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="display" className="settings-tab-content-modern">
              <div className="settings-section">
                <h3 className="section-title">Erscheinungsbild</h3>
                
                <div className="setting-item">
                  <div className="setting-info">
                    <Label className="setting-label">Design-Theme</Label>
                    <span className="setting-description">Wählen Sie das Farbschema der Anwendung</span>
                  </div>
                  <Select value={settings.theme} onValueChange={(value) => setSettings({...settings, theme: value})}>
                    <SelectTrigger className="setting-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">🌙 Dunkel</SelectItem>
                      <SelectItem value="light">☀️ Hell</SelectItem>
                      <SelectItem value="auto">🔄 Automatisch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <Label className="setting-label">Favicons anzeigen</Label>
                    <span className="setting-description">Website-Icons bei Lesezeichen anzeigen</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.showFavicons}
                    onChange={(e) => setSettings({...settings, showFavicons: e.target.checked})}
                    className="setting-checkbox"
                  />
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <Label className="setting-label">Einträge pro Seite</Label>
                    <span className="setting-description">Anzahl der Lesezeichen pro Seite</span>
                  </div>
                  <Select value={settings.itemsPerPage} onValueChange={(value) => setSettings({...settings, itemsPerPage: value})}>
                    <SelectTrigger className="setting-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="all">Alle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="validation" className="settings-tab-content-modern">
              <div className="settings-section">
                <h3 className="section-title">Link-Validierung</h3>
                
                <div className="setting-item">
                  <div className="setting-info">
                    <Label className="setting-label">Timeout (Sekunden)</Label>
                    <span className="setting-description">Wartezeit für Link-Überprüfung</span>
                  </div>
                  <Select value={settings.linkTimeout} onValueChange={(value) => setSettings({...settings, linkTimeout: value})}>
                    <SelectTrigger className="setting-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 Sekunden</SelectItem>
                      <SelectItem value="10">10 Sekunden</SelectItem>
                      <SelectItem value="15">15 Sekunden</SelectItem>
                      <SelectItem value="30">30 Sekunden</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <Label className="setting-label">Automatische Validierung</Label>
                    <span className="setting-description">Links automatisch beim Import prüfen</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.autoValidate}
                    onChange={(e) => setSettings({...settings, autoValidate: e.target.checked})}
                    className="setting-checkbox"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="import-export" className="settings-tab-content-modern">
              {/* Navigation Menu für Import/Export */}
              <div className="import-export-nav">
                <button 
                  onClick={() => document.getElementById('import-section')?.scrollIntoView({behavior: 'smooth'})}
                  className="nav-btn"
                >
                  📥 Import
                </button>
                <button 
                  onClick={() => document.getElementById('export-section')?.scrollIntoView({behavior: 'smooth'})}
                  className="nav-btn"
                >
                  📤 Export
                </button>
                <button 
                  onClick={() => document.getElementById('testdata-section')?.scrollIntoView({behavior: 'smooth'})}
                  className="nav-btn"
                >
                  🧪 Testdaten
                </button>
              </div>

              <div id="import-section" className="settings-section">
                <h3 className="section-title">Import-Einstellungen</h3>
                
                <div className="setting-item">
                  <div className="setting-info">
                    <Label className="setting-label">Duplikat-Behandlung</Label>
                    <span className="setting-description">Verhalten bei doppelten Einträgen</span>
                  </div>
                  <Select value={settings.duplicateHandling} onValueChange={(value) => setSettings({...settings, duplicateHandling: value})}>
                    <SelectTrigger className="setting-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ignore">❌ Ignorieren</SelectItem>
                      <SelectItem value="replace">🔄 Ersetzen</SelectItem>
                      <SelectItem value="keep-both">📝 Beide behalten</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="import-formats-info">
                  <h4>Unterstützte Browser-Formate:</h4>
                  <div className="browser-list">
                    <span className="browser-item">🦊 Firefox (JSON/HTML)</span>
                    <span className="browser-item">🌐 Chrome (HTML)</span>
                    <span className="browser-item">🔷 Edge (HTML)</span>
                    <span className="browser-item">🍎 Safari (HTML)</span>
                    <span className="browser-item">📄 CSV-Dateien</span>
                    <span className="browser-item">📋 XML-Dateien</span>
                  </div>
                </div>
              </div>

              <div id="export-section" className="settings-section">
                <h3 className="section-title">Export-Optionen</h3>
                <p className="section-description">
                  Exportieren Sie alle Ihre Favoriten in verschiedene Dateiformate.
                </p>
                
                <div className="export-buttons-modern">
                  <Button
                    onClick={() => handleExport('html')}
                    disabled={isExporting}
                    className="export-btn-modern html-btn-modern"
                  >
                    {isExporting ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4 mr-2" />
                    )}
                    HTML exportieren
                  </Button>

                  <Button
                    onClick={() => handleExport('json')}
                    disabled={isExporting}
                    className="export-btn-modern json-btn-modern"
                  >
                    {isExporting ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Database className="w-4 h-4 mr-2" />
                    )}
                    JSON exportieren
                  </Button>
                  
                  <Button
                    onClick={() => handleExport('xml')}
                    disabled={isExporting}
                    className="export-btn-modern xml-btn-modern"
                  >
                    {isExporting ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4 mr-2" />
                    )}
                    XML exportieren
                  </Button>
                  
                  <Button
                    onClick={() => handleExport('csv')}
                    disabled={isExporting}
                    className="export-btn-modern csv-btn-modern"
                  >
                    {isExporting ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                    )}
                    CSV exportieren
                  </Button>

                  <Button
                    onClick={() => handleExportAllFormats()}
                    disabled={isExporting}
                    className="export-btn-modern all-formats-btn-modern"
                  >
                    {isExporting ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Archive className="w-4 h-4 mr-2" />
                    )}
                    Alle Formate exportieren
                  </Button>
                </div>

                <div className="export-info-modern">
                  <div className="info-item-modern">
                    <FileText className="w-4 h-4 text-orange-500" />
                    <div>
                      <strong>HTML:</strong> Standard Browserformat, kompatibel mit Chrome, Firefox, Edge, Safari
                    </div>
                  </div>
                  <div className="info-item-modern">
                    <Database className="w-4 h-4 text-purple-500" />
                    <div>
                      <strong>JSON:</strong> Chrome Bookmarks Format mit vollständigen Metadaten
                    </div>
                  </div>
                  <div className="info-item-modern">
                    <FileText className="w-4 h-4 text-green-500" />
                    <div>
                      <strong>XML:</strong> Strukturierte Daten mit Metainformationen, ideal für Re-Import
                    </div>
                  </div>
                  <div className="info-item-modern">
                    <FileSpreadsheet className="w-4 h-4 text-blue-500" />
                    <div>
                      <strong>CSV:</strong> Tabellenformat, kompatibel mit Excel und anderen Tabellenkalkulationen
                    </div>
                  </div>
                  <div className="info-item-modern">
                    <Archive className="w-4 h-4 text-cyan-500" />
                    <div>
                      <strong>Alle Formate:</strong> Exportiert gleichzeitig HTML, JSON, XML und CSV für maximale Kompatibilität
                    </div>
                  </div>
                </div>
              </div>

              <div id="testdata-section" className="settings-section">
                <h3 className="section-title">Testdaten</h3>
                <p className="section-description">
                  Erstellen Sie Testdaten mit 50 Favoriten (inkl. Duplikate und tote Links) für Entwicklung und Tests.
                </p>
                
                <Button
                  onClick={handleCreateTestData}
                  disabled={isExporting}
                  className="test-data-btn-modern"
                >
                  {isExporting ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Database className="w-4 h-4 mr-2" />
                  )}
                  50 Testdaten erstellen
                </Button>
                
                <div className="test-data-info">
                  <div className="info-item-modern">
                    <Database className="w-4 h-4 text-yellow-500" />
                    <div>
                      <strong>Testdaten:</strong> 50 Favoriten mit verschiedenen Kategorien, 10 Duplikate und 15 tote Links für umfassende Tests
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="advanced" className="settings-tab-content-modern">
              <div className="settings-section">
                <h3 className="section-title">Erweiterte Einstellungen</h3>
                
                <div className="setting-item">
                  <div className="setting-info">
                    <Label className="setting-label">Meldungen Delay</Label>
                    <span className="setting-description">Meldungen mit X-Button zeigen statt automatisch ausblenden (default: False)</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={appSettings.melungenDelay}
                    onChange={(e) => {
                      const updated = {...appSettings, melungenDelay: e.target.checked};
                      onSettingsChange(updated);
                      localStorage.setItem('favorg-app-settings', JSON.stringify(updated));
                    }}
                    className="setting-checkbox"
                  />
                </div>
                
                <div className="setting-item">
                  <div className="setting-info">
                    <Label className="setting-label">Automatische Synchronisation</Label>
                    <span className="setting-description">Änderungen automatisch speichern</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.autoSync}
                    onChange={(e) => setSettings({...settings, autoSync: e.target.checked})}
                    className="setting-checkbox"
                  />
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <Label className="setting-label">Benachrichtigungen</Label>
                    <span className="setting-description">Desktop-Benachrichtigungen aktivieren</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.notifications}
                    onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
                    className="setting-checkbox"
                  />
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <Label className="setting-label">Automatisches Backup</Label>
                    <span className="setting-description">Tägliche Sicherung erstellen</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.autoBackup}
                    onChange={(e) => setSettings({...settings, autoBackup: e.target.checked})}
                    className="setting-checkbox"
                  />
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <Label className="setting-label">S-Time</Label>
                    <span className="setting-description">System-Timer Konfiguration (1-10)</span>
                  </div>
                  <div className="setting-input-group">
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={gameSettings['S-Time'] || 3}
                      onChange={(e) => {
                        const newValue = Math.max(1, Math.min(10, parseInt(e.target.value) || 3));
                        setGameSettings(prev => ({
                          ...prev,
                          'S-Time': newValue
                        }));
                        localStorage.setItem('favorg-advanced-settings', JSON.stringify({
                          ...gameSettings,
                          'S-Time': newValue
                        }));
                      }}
                      className="setting-number-input"
                    />
                  </div>
                </div>

                <div className="settings-danger-zone">
                  <h4 className="danger-title">Gefahrenbereich</h4>
                  <p className="danger-description">
                    Diese Aktionen können nicht rückgängig gemacht werden.
                  </p>
                  <Button 
                    onClick={resetSettings}
                    variant="outline"
                    className="danger-btn"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Einstellungen zurücksetzen
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="settings-footer">
          <Button variant="outline" onClick={onClose}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="save-btn-modern">
            {isSaving ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Speichern
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};



// BookmarkCard Component für einzelne Bookmark-Karten
const BookmarkCard = ({ bookmark, onDelete, onEdit, onToggleStatus }) => {
  const getStatusColor = (bookmark) => {
    if (bookmark.is_locked) return 'text-yellow-600';
    if (bookmark.status_type === 'dead' || bookmark.is_dead_link) return 'text-red-600';
    if (bookmark.status_type === 'localhost') return 'text-gray-600';
    if (bookmark.status_type === 'duplicate') return 'text-orange-600';
    return 'text-green-600';
  };

  const getStatusIcon = (bookmark) => {
    if (bookmark.is_locked) return <Lock className="w-4 h-4" />;
    if (bookmark.status_type === 'dead' || bookmark.is_dead_link) return <XCircle className="w-4 h-4" />;
    if (bookmark.status_type === 'localhost') return <Monitor className="w-4 h-4" />;
    if (bookmark.status_type === 'duplicate') return <Copy className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  const handleStatusToggle = () => {
    if (bookmark.is_locked) return; // Gesperrte Bookmarks können nicht geändert werden
    
    const currentStatus = bookmark.status_type || (bookmark.is_dead_link ? 'dead' : 'active');
    const newStatus = currentStatus === 'dead' ? 'localhost' : 'dead';
    onToggleStatus(bookmark.id, newStatus);
  };

  return (
    <Card className="bookmark-card">
      <CardContent className="bookmark-card-content">
        <div className="bookmark-header">
          <div className="bookmark-title">
            <a 
              href={bookmark.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="bookmark-link"
              title={bookmark.url}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {bookmark.title || 'Untitled'}
            </a>
          </div>
          
          <div className="bookmark-actions">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStatusToggle}
              className={`status-btn ${getStatusColor(bookmark)}`}
              title={`Status: ${bookmark.status_type || 'active'}`}
              disabled={bookmark.is_locked}
            >
              {getStatusIcon(bookmark)}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(bookmark)}
              className="edit-btn"
              title="Bearbeiten"
            >
              <Edit className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(bookmark.id)}
              className="delete-btn"
              title="Löschen"
              disabled={bookmark.is_locked}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="bookmark-meta">
          <div className="bookmark-category">
            <Folder className="w-3 h-3 mr-1" />
            {bookmark.category || 'Uncategorized'}
          </div>
          <div className="bookmark-url">
            {bookmark.url}
          </div>
        </div>
        
        {bookmark.description && (
          <div className="bookmark-description">
            {bookmark.description}
          </div>
        )}
      </CardContent>
    </Card>
  );
};



const MainContent = ({ searchQuery, onSearchChange, onClearSearch, statusFilter, onStatusFilterChange, bookmarks, onDeleteBookmark, onEditBookmark, onToggleStatus, onFileSelected, viewMode, onViewModeChange, onBookmarkReorder, onHelpClick, onStatsToggle, onSettingsClick, onDeleteAllClick, statistics }) => {
  return (
    <main className="main-content">
      <div className="main-header">
        <input
          type="file"
          id="file-upload"
          accept=".html,.json,.xml,.csv,.jsonlz4"
          onChange={onFileSelected}
          style={{ display: 'none' }}
        />
      </div>
      
      <div className="search-section">
        <div className="search-container">
          <div className="search-input-wrapper">
            <Search className="search-icon" />
            <Input
              type="text"
              placeholder="Favoriten durchsuchen..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  onClearSearch();
                }
              }}
              className="search-input"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSearch}
                className="clear-search-btn"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          <div className="status-filter-wrapper">
            <EnhancedStatusFilter 
              value={statusFilter}
              onChange={onStatusFilterChange}
              statistics={statistics}
            />
          </div>
        </div>
      </div>

      <div className="content-area">
        <div className="content-header">
          <div className="view-toggle">
            <button
              className={`view-toggle-btn-compact ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => onViewModeChange('cards')}
              title="Karten-Ansicht"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              className={`view-toggle-btn-compact ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => onViewModeChange('table')}
              title="Tabellen-Ansicht"
            >
              <Table className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {viewMode === 'table' ? (
          <TableView
            bookmarks={bookmarks}
            onDeleteBookmark={onDeleteBookmark}
            onEditBookmark={onEditBookmark}
            onToggleStatus={onToggleStatus}
            onBookmarkReorder={onBookmarkReorder}
            headerButtons={
              <div className="table-header-actions-compact">
                <Button
                  onClick={onHelpClick}
                  className="table-header-btn"
                  size="sm"
                  title="Hilfe"
                >
                  <HelpCircle className="w-4 h-4" />
                </Button>
                
                <Button
                  onClick={onStatsToggle}
                  className="table-header-btn"
                  size="sm"
                  title="Statistiken ein-/ausblenden"
                >
                  <BarChart3 className="w-4 h-4" />
                </Button>
                
                <Button
                  onClick={onSettingsClick}
                  className="table-header-btn"
                  size="sm" 
                  title="System-Einstellungen"
                >
                  <Settings className="w-4 h-4" />
                </Button>
                
                <Button 
                  onClick={onDeleteAllClick}
                  className="table-header-btn delete-btn"
                  size="sm"
                  title="Alle Favoriten löschen"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            }
          />
        ) : (
          <BookmarkList
            bookmarks={bookmarks}
            onDeleteBookmark={onDeleteBookmark}
            onEditBookmark={onEditBookmark}
            onToggleStatus={onToggleStatus}
            onBookmarkReorder={onBookmarkReorder}
          />
        )}
        
        {bookmarks && bookmarks.length > 0 && (
          <div className="content-footer">
            <p className="bookmark-count">
              {bookmarks.length} Favoriten angezeigt
            </p>
          </div>
        )}
      </div>
    </main>
  );
};

// Impressum Dialog Component
const ImpressumDialog = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="impressum-dialog" style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-primary)',
        maxWidth: '600px'
      }}>
        <DialogHeader>
          <DialogTitle className="dialog-title" style={{ 
            color: 'var(--text-primary)',
            fontSize: '18px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <FileText className="w-5 h-5 mr-2" />
            Impressum
          </DialogTitle>
        </DialogHeader>
        
        <div className="impressum-content" style={{
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          lineHeight: '1.6'
        }}>
          <div className="impressum-section" style={{ marginBottom: '20px' }}>
            <h3 style={{ color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '8px' }}>
              Angaben gemäß § 5 TMG
            </h3>
            <p style={{ margin: '4px 0' }}>
              <strong>Jörg Renelt</strong><br/>
              id2.de<br/>
              Hamburg<br/>
              Deutschland
            </p>
          </div>
          
          <div className="impressum-section" style={{ marginBottom: '20px' }}>
            <h3 style={{ color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '8px' }}>
              Software-Information
            </h3>
            <p style={{ margin: '4px 0' }}>
              <strong>FavOrg</strong> - Bookmark Manager<br/>
              Version: V2.3.0<br/>
              Copyright © 2025 Jörg Renelt
            </p>
          </div>
          
          <div className="impressum-section" style={{ marginBottom: '20px' }}>
            <h3 style={{ color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '8px' }}>
              Haftungsausschluss
            </h3>
            <p style={{ margin: '4px 0', fontSize: '14px' }}>
              Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. 
              Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte 
              können wir jedoch keine Gewähr übernehmen.
            </p>
          </div>
          
          <div className="dialog-actions" style={{ 
            display: 'flex', 
            justifyContent: 'flex-end',
            marginTop: '24px'
          }}>
            <Button 
              onClick={onClose} 
              className="impressum-close-btn" 
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                borderColor: 'var(--border-primary)'
              }}
            >
              Schließen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Hauptkomponente
function App() {
  // Core State Management
  const [bookmarks, setBookmarks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // UI State
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSubcategory, setActiveSubcategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('favorg-view-mode') || 'cards';
  });

  // Dialog States
  const [showBookmarkDialog, setShowBookmarkDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showCategoryManageDialog, setShowCategoryManageDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImpressum, setShowImpressum] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [selectedBookmarks, setSelectedBookmarks] = useState(new Set());

  // Application Settings mit Meldungen Delay
  const [appSettings, setAppSettings] = useState(() => {
    const saved = localStorage.getItem('favorg-app-settings');
    return saved ? JSON.parse(saved) : {
      melungenDelay: false, // Neue Einstellung für Toast-Verhalten
      theme: 'dark',
      autoSync: true,
      notifications: true
    };
  });

  // Toast-System basierend auf Meldungen Delay konfigurieren
  const showSuccess = (message) => {
    if (appSettings.melungenDelay) {
      toast.success(message, {
        closeButton: true,
        duration: Infinity // Bleibt bis manuell geschlossen
      });
    } else {
      toast.success(message); // Standard Verhalten
    }
  };

  const showError = (message) => {
    if (appSettings.melungenDelay) {
      toast.error(message, {
        closeButton: true,
        duration: Infinity // Bleibt bis manuell geschlossen
      });
    } else {
      toast.error(message); // Standard Verhalten
    }
  };

  // Service Instanzen
  const favoritesService = new FavoritesService();
  
  // Load initial data
  useEffect(() => {
    loadBookmarks();
    refreshCategories();
    loadStatistics();
  }, []);

  // Reload when category or status filter changes
  useEffect(() => {
    loadBookmarks();
  }, [activeCategory, activeSubcategory, statusFilter]);

  const loadBookmarks = async () => {
    try {
      setIsLoading(true);
      let response;
      
      if (activeCategory === 'all') {
        response = await favoritesService.getAllBookmarks();
      } else {
        response = await favoritesService.getBookmarksByCategory(activeCategory, activeSubcategory);
      }
      
      setBookmarks(response);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      showError('Fehler beim Laden der Favoriten');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCategories = async () => {
    try {
      const response = await favoritesService.getAllCategories();
      setCategories(response);
    } catch (error) {
      console.error('Error loading categories:', error);
      showError('Fehler beim Laden der Kategorien');
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await favoritesService.getStatistics();
      setStatistics(response);
    } catch (error) {
      console.error('Error loading statistics:', error);
      showError('Fehler beim Laden der Statistiken');
    }
  };

  // Event Handlers
  const handleCreateBookmark = () => {
    setEditingBookmark(null);
    setShowBookmarkDialog(true);
  };

  const handleEditBookmark = (bookmark) => {
    setEditingBookmark(bookmark);
    setShowBookmarkDialog(true);
  };

  const handleSaveBookmark = async (bookmarkData) => {
    try {
      if (editingBookmark) {
        await favoritesService.updateBookmark(editingBookmark.id, bookmarkData);
        showSuccess('Favorit erfolgreich aktualisiert');
      } else {
        await favoritesService.createBookmark(bookmarkData);
        showSuccess('Favorit erfolgreich erstellt');
      }
      
      setShowBookmarkDialog(false);
      setEditingBookmark(null);
      await loadBookmarks();
      await loadStatistics();
    } catch (error) {
      console.error('Error saving bookmark:', error);
      showError('Fehler beim Speichern des Favoriten');
      throw error;
    }
  };

  const handleDeleteBookmark = async (bookmarkId) => {
    try {
      await favoritesService.deleteBookmark(bookmarkId);
      showSuccess('Favorit erfolgreich gelöscht');
      await loadBookmarks();
      await loadStatistics();
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      showError('Fehler beim Löschen des Favoriten');
    }
  };

  const handleToggleStatus = async (bookmarkId, newStatus) => {
    try {
      await favoritesService.updateBookmarkStatus(bookmarkId, newStatus);
      showSuccess(`Status zu "${newStatus}" geändert`);
      await loadBookmarks();
      await loadStatistics();
    } catch (error) {
      console.error('Error updating status:', error);
      showError('Fehler beim Aktualisieren des Status');
    }
  };

  const handleValidateLinks = async () => {
    // Wenn bereits tote Links gefunden wurden, frage nach
    if (deadLinksCount > 0) {
      const confirmed = window.confirm(
        `Es wurden ${deadLinksCount} tote Links gefunden.\n\nMöchten Sie diese jetzt löschen?`
      );
      
      if (confirmed) {
        try {
          setIsLoading(true);
          const result = await favoritesService.removeDeadLinks();
          showSuccess(`${result.removed_count} tote Links erfolgreich entfernt`);
          await loadBookmarks();
          await loadStatistics();
        } catch (error) {
          console.error('Error removing dead links:', error);
          showError('Fehler beim Entfernen toter Links');
        } finally {
          setIsLoading(false);
        }
      }
    } else {
      // Sonst führe Validierung durch (sortiert ein, löscht NICHT)
      try {
        setIsLoading(true);
        const result = await favoritesService.validateLinks();
        showSuccess(`Validierung abgeschlossen: ${result.dead_links_found} tote Links gefunden von ${result.total_checked} geprüften Links`);
        await loadBookmarks();
        await loadStatistics();
      } catch (error) {
        console.error('Error validating links:', error);
        showError('Fehler bei der Link-Validierung');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleToggleLock = async (bookmarkId, isCurrentlyLocked) => {
    try {
      const newLockStatus = !isCurrentlyLocked;
      await favoritesService.updateBookmarkLock(bookmarkId, newLockStatus);
      showSuccess(`Favorit ${newLockStatus ? 'gesperrt' : 'entsperrt'}`);
      await loadBookmarks();
      await loadStatistics();
    } catch (error) {
      console.error('Error toggling lock:', error);
      showError('Fehler beim Ändern des Sperr-Status');
    }
  };
    // Wenn bereits Localhost-Links gefunden wurden, frage nach
    if (localhostCount > 0) {
      const confirmed = window.confirm(
        `Es wurden ${localhostCount} Localhost-Links gefunden.\n\nMöchten Sie diese jetzt löschen?`
      );
      
      if (confirmed) {
        try {
          // Lösche alle Bookmarks mit status_type = 'localhost'
          const localhostBookmarks = bookmarks.filter(b => b.status_type === 'localhost');
          let removedCount = 0;
          
          for (const bookmark of localhostBookmarks) {
            await favoritesService.deleteBookmark(bookmark.id);
            removedCount++;
          }
          
          showSuccess(`${removedCount} Localhost-Links erfolgreich entfernt`);
          await loadBookmarks();
          await loadStatistics();
        } catch (error) {
          console.error('Error removing localhost links:', error);
          showError('Fehler beim Entfernen der Localhost-Links');
        }
      }
    } else {
      // Sonst führe Localhost-Suche durch (markiert alle localhost-Links)
      try {
        const localhostBookmarks = bookmarks.filter(b => 
          b.url && (b.url.includes('localhost') || b.url.includes('127.0.0.1') || b.url.includes('::1'))
        );
        
        if (localhostBookmarks.length > 0) {
          // Markiere als localhost
          for (const bookmark of localhostBookmarks) {
            await favoritesService.updateBookmarkStatus(bookmark.id, 'localhost');
          }
          
          showSuccess(`${localhostBookmarks.length} Localhost-Links gefunden und markiert`);
        } else {
          showSuccess('Keine Localhost-Links gefunden');
        }
        
        await loadBookmarks();
        await loadStatistics();
      } catch (error) {
        console.error('Error finding localhost links:', error);
        showError('Fehler bei der Localhost-Suche');
      }
    }
  };

  const handleToggleLock = async (bookmarkId, isCurrentlyLocked) => {
    try {
      const newLockStatus = !isCurrentlyLocked;
      await favoritesService.updateBookmarkLock(bookmarkId, newLockStatus);
      showSuccess(`Favorit ${newLockStatus ? 'gesperrt' : 'entsperrt'}`);
      await loadBookmarks();
      await loadStatistics();
    } catch (error) {
      console.error('Error toggling lock:', error);
      showError('Fehler beim Ändern des Sperr-Status');
    }
  };

  const handleRemoveDuplicates = async () => {
    // Wenn bereits Duplikate gefunden wurden, frage nach
    if (duplicateCount > 0) {
      const confirmed = window.confirm(
        `Es wurden ${duplicateCount} Duplikate gefunden.\n\nMöchten Sie diese jetzt löschen?`
      );
      
      if (confirmed) {
        try {
          const result = await favoritesService.deleteDuplicates();
          showSuccess(`${result.removed_count} Duplikate erfolgreich entfernt`);
          await loadBookmarks();
          await loadStatistics();
        } catch (error) {
          console.error('Error deleting duplicates:', error);
          showError('Fehler beim Entfernen der Duplikate');
        }
      }
    } else {
      // Sonst führe Duplikat-Suche durch (sortiert ein, löscht NICHT)
      try {
        const result = await favoritesService.findDuplicates();
        if (result.marked_count > 0) {
          showSuccess(`${result.marked_count} Duplikate gefunden und markiert`);
        } else {
          showSuccess('Keine Duplikate gefunden');
        }
        await loadBookmarks();
        await loadStatistics();
      } catch (error) {
        console.error('Error finding duplicates:', error);
        showError('Fehler bei der Duplikat-Suche');
      }
    }
  };

  const handleFileSelected = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const result = await favoritesService.importBookmarks(file);
      showSuccess(`Import erfolgreich: ${result.imported_count} Favoriten importiert`);
      await loadBookmarks();
      await refreshCategories();
      await loadStatistics();
    } catch (error) {
      console.error('Error importing file:', error);
      showError('Fehler beim Importieren der Datei');
    } finally {
      setIsLoading(false);
      event.target.value = ''; // Reset file input
    }
  };

  const handleExport = async (format, category = null) => {
    try {
      await favoritesService.exportBookmarks(format, category);
      showSuccess(`${format.toUpperCase()}-Export erfolgreich heruntergeladen`);
    } catch (error) {
      console.error('Export error:', error);
      showError(`Export fehlgeschlagen: ${error.message}`);
    }
  };

  const handleDeleteAll = async () => {
    try {
      await favoritesService.deleteAllBookmarks();
      showSuccess('Alle Favoriten erfolgreich gelöscht');
      await loadBookmarks();
      await refreshCategories();
      await loadStatistics();
    } catch (error) {
      console.error('Error deleting all bookmarks:', error);
      showError('Fehler beim Löschen aller Favoriten');
    }
  };

  const handleCreateTestData = async () => {
    try {
      const result = await favoritesService.createTestData();
      showSuccess(`Testdaten erfolgreich erstellt: ${result.created_count || 50} Favoriten hinzugefügt`);
      await loadBookmarks();
      await refreshCategories();
      await loadStatistics();
    } catch (error) {
      console.error('Error creating test data:', error);
      showError('Fehler beim Erstellen der Testdaten');
    }
  };

  const handleCategoryChange = (category, subcategory = null) => {
    setActiveCategory(category);
    setActiveSubcategory(subcategory);
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleStatusFilterChange = (filter) => {
    setStatusFilter(filter);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('favorg-view-mode', mode);
  };

  // Filter bookmarks based on search and status
  const filteredBookmarks = bookmarks.filter(bookmark => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        bookmark.title?.toLowerCase().includes(searchLower) ||
        bookmark.url?.toLowerCase().includes(searchLower) ||
        bookmark.category?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter !== 'all') {
      const bookmarkStatus = bookmark.status_type || (bookmark.is_dead_link ? 'dead' : 'active');
      if (statusFilter === 'locked' && !bookmark.is_locked) return false;
      if (statusFilter === 'active' && bookmarkStatus !== 'active') return false;
      if (statusFilter === 'dead' && bookmarkStatus !== 'dead') return false;
      if (statusFilter === 'localhost' && bookmarkStatus !== 'localhost') return false;
      if (statusFilter === 'duplicate' && bookmarkStatus !== 'duplicate') return false;
      if (statusFilter === 'unchecked' && bookmarkStatus !== 'unchecked') return false;
    }

    return true;
  });

  // Calculate counts for various statuses
  const deadLinksCount = bookmarks.filter(b => b.status_type === 'dead' || b.is_dead_link).length;
  const duplicateCount = bookmarks.filter(b => b.status_type === 'duplicate').length;
  const localhostCount = bookmarks.filter(b => b.status_type === 'localhost').length;
  const lockedCount = bookmarks.filter(b => b.is_locked).length;
  
  // Check if duplicates have been marked
  const hasDuplicatesMarked = duplicateCount > 0;

  return (
    <div className="app-container">
      <Toaster 
        position="top-center"
        richColors 
        closeButton={appSettings.melungenDelay}
      />
      
      <Header
        onSettingsClick={() => setShowSettings(true)}
        onHelpClick={() => setShowHelp(true)}
        onStatsToggle={() => setShowStatistics(!showStatistics)}
        onCreateBookmarkClick={handleCreateBookmark}
        onFileUploadClick={() => document.getElementById('file-upload').click()}
        onExportClick={() => setShowExportDialog(true)}
        onValidateClick={handleValidateLinks}
        onRemoveDuplicatesClick={handleRemoveDuplicates}
        onRemoveLocalhostClick={handleRemoveLocalhost}
        onDeleteAllClick={handleDeleteAll}
        deadLinksCount={deadLinksCount}
        duplicateCount={duplicateCount}
        localhostCount={localhostCount}
        totalBookmarks={bookmarks.length}
        filteredCount={filteredBookmarks.length}
        hasValidated={statistics?.total_bookmarks > 0}
        hasDuplicatesMarked={hasDuplicatesMarked}
      />

      <div className="app-body">
        <CategorySidebar
          categories={categories}
          activeCategory={activeCategory}
          activeSubcategory={activeSubcategory}
          onCategoryChange={handleCategoryChange}
          statistics={statistics}
          onCategoryManage={() => setShowCategoryManageDialog(true)}
        />

        <MainContent
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onClearSearch={handleClearSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          bookmarks={filteredBookmarks}
          onDeleteBookmark={handleDeleteBookmark}
          onEditBookmark={handleEditBookmark}
          onToggleStatus={handleToggleStatus}
          onFileSelected={handleFileSelected}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          statistics={statistics}
        />
      </div>

      {/* App-Fußzeile - außerhalb der app-body */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-left">
            <span className="footer-copyright">
              &copy; Jörg Renelt id2.de Hamburg 2025 Version V2.3.0
            </span>
          </div>
          
          <div className="footer-center">
            <span className="footer-stats">
              {statistics ? (
                <>
                  {statistics.active_links || 0} Aktiv • 
                  {statistics.dead_links || 0} Tot • 
                  {statistics.total_categories || 0} Kategorien
                </>
              ) : (
                'Lade Statistiken...'
              )}
            </span>
          </div>
          
          <div className="footer-right">
            <button 
              onClick={() => setShowImpressum(true)}
              className="footer-link"
              title="Impressum"
            >
              <FileText className="w-4 h-4 mr-1" />
              Impressum
            </button>
          </div>
        </div>
      </footer>

      {/* Dialoge */}
      <BookmarkDialog
        isOpen={showBookmarkDialog}
        onClose={() => {
          setShowBookmarkDialog(false);
          setEditingBookmark(null);
        }}
        bookmark={editingBookmark}
        onSave={handleSaveBookmark}
        categories={categories}
      />

      <SettingsDialog
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onExport={handleExport}
        onCreateTestData={handleCreateTestData}
        appSettings={appSettings}
        onSettingsChange={setAppSettings}
      />

      <HelpDialog
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />

      <StatisticsDialog
        isOpen={showStatistics}
        onClose={() => setShowStatistics(false)}
        statistics={statistics}
        onRefresh={loadStatistics}
      />

      <CategoryManageDialog
        isOpen={showCategoryManageDialog}
        onClose={() => setShowCategoryManageDialog(false)}
        categories={categories}
        onSave={refreshCategories}
      />

      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={handleExport}
      />

      <ImpressumDialog
        isOpen={showImpressum}
        onClose={() => setShowImpressum(false)}
      />

      {/* Hidden file input */}
      <input
        type="file"
        id="file-upload"
        accept=".html,.json,.xml,.csv,.jsonlz4"
        onChange={handleFileSelected}
        style={{ display: 'none' }}
      />
    </div>
  );
}

export default App;
