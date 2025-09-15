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

// V2.3.0 Enhanced Components
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

const Header = ({ onSettingsClick, onHelpClick, onStatsToggle, onCreateBookmarkClick, onFileUploadClick, onExportClick, onValidateClick, onRemoveDuplicatesClick, onDeleteAllClick, onGameClick, deadLinksCount, hasValidated, totalBookmarks, duplicateCount, hasDuplicatesMarked, filteredCount }) => {
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
              {deadLinksCount > 0 ? `Prüfen [${deadLinksCount}]` : 'Prüfen'}
            </Button>
            
            <Button 
              onClick={onRemoveDuplicatesClick} 
              className="action-btn duplicate-btn"
              size="sm"
            >
              <Copy className="w-4 h-4 mr-2" />
              {duplicateCount > 0 ? `Duplikate [${duplicateCount}]` : 'Duplikate'}
            </Button>
            
            {/* Spiel-Button entfernt - nur noch Easter Egg über Copyright */}
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
    category: 'Uncategorized',
    is_locked: false
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (bookmark) {
      setFormData({
        title: bookmark.title || '',
        url: bookmark.url || '',
        category: bookmark.category || 'Uncategorized',
        is_locked: bookmark.is_locked || false
      });
    } else {
      setFormData({
        title: '',
        url: '',
        category: '', // Leer für Placeholder
        is_locked: false
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
          
          <div className="form-group">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_locked"
                checked={formData.is_locked}
                onChange={(e) => setFormData({...formData, is_locked: e.target.checked})}
                className="checkbox"
              />
              <Label htmlFor="is_locked" className="flex items-center space-x-2">
                <LockKeyhole className="w-4 h-4" />
                <span>Favorit sperren (gegen Löschung schützen)</span>
              </Label>
            </div>
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

// Live-Editing Category Management Dialog Component
const CategoryManageDialog = ({ isOpen, onClose, categories, onSave }) => {
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [selectedParentCategory, setSelectedParentCategory] = useState('');

  // Organisiere Kategorien hierarchisch - UNBEGRENZTE EBENEN
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

  // Rekursive Funktion zum Rendern von Kategorien aller Ebenen
  const renderCategoryTree = (cats, level = 0, visited = new Set()) => {
    // Schutz gegen unendliche Rekursion
    if (level > 10) {
      console.warn('Maximum category nesting level reached (10)');
      return null;
    }
    
    return cats.map(category => {
      // Schutz gegen zirkuläre Referenzen
      if (visited.has(category.name)) {
        console.warn(`Circular reference detected for category: ${category.name}`);
        return null;
      }
      
      const newVisited = new Set(visited);
      newVisited.add(category.name);
      
      return (
        <div key={category.id} className="category-live-group">
          {/* Hauptkategorie */}
          <div className="category-live-item main-category" style={{ marginLeft: `${level * 20}px` }}>
            <div className="category-live-info">
              <span className="category-level-icon">
                {level === 0 ? '📁' : `${'└─'.repeat(level)}📂`}
              </span>
              {editingCategory === category.id ? (
                <Input
                  defaultValue={category.name}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleRenameCategory(category, e.target.value);
                    } else if (e.key === 'Escape') {
                      setEditingCategory(null);
                    }
                  }}
                  onBlur={(e) => handleRenameCategory(category, e.target.value)}
                  className="category-edit-input"
                  autoFocus
                />
              ) : (
                <span 
                  className="category-name-editable"
                  onClick={() => setEditingCategory(category.id)}
                >
                  {category.name} ({category.bookmark_count || 0})
                </span>
              )}
            </div>
            <div className="category-live-actions">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditingCategory(category.id)}
                className="edit-category-btn-live"
                title="Bearbeiten"
              >
                <Edit2 className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDeleteCategory(category)}
                className="delete-category-btn-live"
                title="Löschen"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Rekursiv Kinder rendern */}
          {category.children && category.children.length > 0 && 
            renderCategoryTree(category.children, level + 1, newVisited)
          }
        </div>
      );
    });
  };

  // Live-Editing: Neue Kategorie erstellen
  const handleCreateCategory = async (e) => {
    if (e.key === 'Enter' && newCategoryName.trim()) {
      try {
        const newCategory = {
          name: newCategoryName.trim(),
          parent_category: null
        };
        
        // API Call zum Backend
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/categories`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newCategory)
        });
        
        if (response.ok) {
          toast.success(`Neue Kategorie "${newCategoryName}" erstellt`);
          setNewCategoryName('');
          await loadCategories(); // Kategorien neu laden
        } else {
          throw new Error('Kategorie konnte nicht erstellt werden');
        }
      } catch (error) {
        console.error('Create category error:', error);
        toast.error('Fehler beim Erstellen der Kategorie: ' + error.message);
      }
    }
  };

  // Live-Editing: Neue Unterkategorie erstellen
  const handleCreateSubcategory = async (e) => {
    if (e.key === 'Enter' && newSubcategoryName.trim() && selectedParentCategory) {
      try {
        const newSubcategory = {
          name: newSubcategoryName.trim(),
          parent_category: selectedParentCategory
        };
        
        // API Call zum Backend
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/categories`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newSubcategory)
        });
        
        if (response.ok) {
          toast.success(`Neue Unterkategorie "${newSubcategoryName}" unter "${selectedParentCategory}" erstellt`);
          setNewSubcategoryName('');
          setSelectedParentCategory('');
          await loadCategories(); // Kategorien neu laden
        } else {
          throw new Error('Unterkategorie konnte nicht erstellt werden');
        }
      } catch (error) {
        console.error('Create subcategory error:', error);
        toast.error('Fehler beim Erstellen der Unterkategorie: ' + error.message);
      }
    }
  };

  // Live-Editing: Kategorie umbenennen
  const handleRenameCategory = async (category, newName) => {
    if (newName.trim() && newName !== category.name) {
      try {
        const updatedCategory = {
          ...category,
          name: newName.trim()
        };
        
        // API Call zum Backend
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/categories/${category.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedCategory)
        });
        
        if (response.ok) {
          toast.success(`Kategorie "${category.name}" zu "${newName}" umbenannt`);
          setEditingCategory(null);
          await loadCategories(); // Kategorien neu laden
        } else {
          throw new Error('Kategorie konnte nicht umbenannt werden');
        }
      } catch (error) {
        console.error('Rename category error:', error);
        toast.error('Fehler beim Umbenennen der Kategorie: ' + error.message);
      }
    }
  };

  // Live-Editing: Kategorie löschen
  const handleDeleteCategory = async (category) => {
    if (window.confirm(`Sind Sie sicher, dass Sie die Kategorie "${category.name}" löschen möchten? Alle Lesezeichen werden auf "Uncategorized" verschoben.`)) {
      try {
        // API Call zum Backend
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/categories/${category.id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          toast.success(`Kategorie "${category.name}" gelöscht`);
          await loadCategories(); // Kategorien neu laden
          await loadBookmarks(); // Bookmarks neu laden (falls sich Zuordnungen geändert haben)
        } else {
          throw new Error('Kategorie konnte nicht gelöscht werden');
        }
      } catch (error) {
        console.error('Delete category error:', error);
        toast.error('Fehler beim Löschen der Kategorie: ' + error.message);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="category-manage-dialog-live">
        <DialogHeader>
          <DialogTitle className="category-manage-title">
            🏷️ Kategorien verwalten
          </DialogTitle>
          <p className="category-manage-subtitle">
            Live-Bearbeitung - Änderungen mit Enter bestätigen
          </p>
        </DialogHeader>
        
        <div className="category-manage-live-content">
          {/* Neue Kategorie erstellen */}
          <div className="new-category-section">
            <div className="new-category-row">
              <div className="new-category-icon">➕</div>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={handleCreateCategory}
                placeholder="+ Neue Kategorie (Enter zum Erstellen)"
                className="new-category-input"
              />
            </div>
          </div>

          {/* Neue Unterkategorie erstellen */}
          <div className="new-subcategory-section">
            <div className="new-subcategory-row">
              <div className="new-subcategory-icon">└─➕</div>
              <Select 
                value={selectedParentCategory} 
                onValueChange={setSelectedParentCategory}
              >
                <SelectTrigger className="parent-category-select">
                  <SelectValue placeholder="Übergeordnete Kategorie wählen" />
                </SelectTrigger>
                <SelectContent>
                  {/* Alle Kategorien flach für Parent-Auswahl */}
                  {categories.map(cat => (
                    <SelectItem key={cat.name} value={cat.name}>
                      {cat.parent_category ? `${cat.parent_category} → ${cat.name}` : cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={newSubcategoryName}
                onChange={(e) => setNewSubcategoryName(e.target.value)}
                onKeyDown={handleCreateSubcategory}
                placeholder="+ Neue Unterkategorie (Enter zum Erstellen)"
                className="new-subcategory-input"
                disabled={!selectedParentCategory}
              />
            </div>
          </div>

          {/* Bestehende Kategorien */}
          <div className="existing-categories-section">
            <h4 className="section-title">Bestehende Kategorien</h4>
            <div className="categories-live-list">
              {renderCategoryTree(organizedCategories)}
            </div>
          </div>
        </div>
        
        {/* Minimale Aktionen - nur Schließen Button */}
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
            FavOrg - ❓ Hilfe & Anleitung
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
          <DialogTitle className="dialog-title" style={{ color: 'var(--text-primary)' }}>
            <BarChart3 className="w-5 h-5 mr-2" />
            📊 Statistiken
          </DialogTitle>
        </DialogHeader>
        
        <div className="statistics-content" style={{
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)'
        }}>
          {/* Statistiken als vertikale Liste */}
          <div className="stats-vertical-list">
            <div className="stat-line">
              <span className="stat-icon-text">📊</span>
              <span className="stat-text">Gesamt Favoriten [{statistics.total_bookmarks}]</span>
            </div>
            
            <div className="stat-line">
              <span className="stat-icon-text">📁</span>
              <span className="stat-text">Kategorien [{statistics.total_categories}]</span>
            </div>
            
            <div className="stat-line">
              <span className="stat-icon-text">📈</span>
              <span className="stat-text">Status-Verteilung []</span>
            </div>
            
            <div className="stat-line">
              <span className="stat-icon-text">✅</span>
              <span className="stat-text">Aktiv [{statistics.active_links}]</span>
            </div>
            
            <div className="stat-line">
              <span className="stat-icon-text">❌</span>
              <span className="stat-text">Tot [{statistics.dead_links}]</span>
            </div>
            
            <div className="stat-line">
              <span className="stat-icon-text">🏠</span>
              <span className="stat-text">Localhost [{statistics.localhost_links || 0}]</span>
            </div>
            
            <div className="stat-line">
              <span className="stat-icon-text">🔄</span>
              <span className="stat-text">Duplikate [{statistics.duplicate_links || 0}]</span>
            </div>
            
            <div className="stat-line">
              <span className="stat-icon-text">⏱️</span>
              <span className="stat-text">Timeout [{statistics.timeout_links}]</span>
            </div>
            
            <div className="stat-line">
              <span className="stat-icon-text">❓</span>
              <span className="stat-text">Ungeprüft [{statistics.unchecked_links}]</span>
            </div>
          </div>
          
          <div className="dialog-actions">
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

  // Use organizeCategories from the CategoryManageDialog scope
  const organizedCategories = [];

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

const BookmarkList = ({ bookmarks, onDeleteBookmark, onEditBookmark, onToggleStatus, onToggleLock, onBookmarkReorder }) => {
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
                  disabled={bookmark.is_locked}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleLock(bookmark.id, !bookmark.is_locked)}
                  className="lock-btn"
                  title={bookmark.is_locked ? "Entsperren" : "Sperren"}
                >
                  {bookmark.is_locked ? 
                    <LockKeyhole className="w-4 h-4 text-red-600" /> : 
                    <LockKeyholeOpen className="w-4 h-4 text-green-600" />
                  }
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteBookmark(bookmark.id)}
                  className="delete-btn"
                  disabled={bookmark.is_locked}
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
const SettingsDialog = ({ isOpen, onClose, onExport, onCreateTestData }) => {
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
            🔧 System-Einstellungen
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



const MainContent = ({ searchQuery, onSearchChange, onClearSearch, statusFilter, onStatusFilterChange, bookmarks, onDeleteBookmark, onEditBookmark, onToggleStatus, onToggleLock, onFileSelected, viewMode, onViewModeChange, onBookmarkReorder, onHelpClick, onStatsToggle, onSettingsClick, onDeleteAllClick }) => {
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
            {/* Enhanced Status Filter V2.3.0 */}
            <EnhancedStatusFilter
              value={statusFilter}
              onChange={onStatusFilterChange}
              lockedCount={bookmarks.filter(b => b.is_locked || b.status_type === 'locked').length}
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
            onToggleLock={onToggleLock}
            onBookmarkReorder={onBookmarkReorder}
          />
        )}
      </div>
    </main>
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
  const [showExportDialog, setShowExportDialog] = useState(false); // Neu: Export Dialog
  const [showCategoryManageDialog, setShowCategoryManageDialog] = useState(false); // Neu: Category Management
  const [showGameDialog, setShowGameDialog] = useState(false); // V2.3.0: Spielteppich-Spiel
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [showExtraInfo, setShowExtraInfo] = useState(false); // V2.3.0: Extra Info Kartenansicht

  // Clear all toasts function
  const clearAllToasts = () => {
    // Remove all toast elements from DOM
    const toastContainer = document.querySelector('.draggable-toast-container');
    if (toastContainer) {
      const toasts = toastContainer.querySelectorAll('.draggable-toast');
      toasts.forEach(toast => {
        toast.style.opacity = '0';
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 200);
      });
    }
  };

  // Easter Egg Game State
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [mouseHidden, setMouseHidden] = useState(false);
  
  // Fahrzeug-Bewegungen State
  const [vehiclePositions, setVehiclePositions] = useState({
    bus: { x: 10, y: 45, direction: 1 }, // 1 = rechts, -1 = links
    car: { x: 80, y: 35, direction: -1 }
  });
  const [hideTimeLeft, setHideTimeLeft] = useState(0);
  const [gameTimer, setGameTimer] = useState(null);
  const [moveTimer, setMoveTimer] = useState(null);
  const [vehicleTimer, setVehicleTimer] = useState(null);
  const [personPosition, setPersonPosition] = useState({ x: 10, y: 90 });
  const [personDirection, setPersonDirection] = useState(1); // 1 = rechts, -1 = links

  // Game elements positions - Komplexe Stadtszene mit Straßen-Layout
  const hideSpots = [
    // Gebäude-Cluster oben links
    { type: '🏠', x: 15, y: 20, width: 8, height: 10 },
    { type: '🏢', x: 25, y: 15, width: 10, height: 12 },
    { type: '🏬', x: 8, y: 35, width: 12, height: 8 },
    
    // Zentrale Gebäude um Kreuzung
    { type: '🏛️', x: 45, y: 25, width: 12, height: 10 }, // Rathaus
    { type: '🏥', x: 60, y: 20, width: 10, height: 12 }, // Krankenhaus
    { type: '🏫', x: 35, y: 40, width: 15, height: 10 }, // Schule
    
    // Rechte Seite
    { type: '🏪', x: 75, y: 15, width: 8, height: 8 },   // Shop
    { type: '🏨', x: 85, y: 25, width: 10, height: 15 }, // Hotel
    { type: '🏭', x: 80, y: 45, width: 12, height: 10 }, // Fabrik
    
    // Untere Reihe
    { type: '⛪', x: 20, y: 65, width: 10, height: 12 }, // Kirche
    { type: '🏤', x: 40, y: 70, width: 12, height: 8 },  // Post
    { type: '🏦', x: 65, y: 65, width: 10, height: 10 }, // Bank
    
    // Natur-Elemente
    { type: '🌳', x: 30, y: 55, width: 6, height: 8 },   // Park-Baum
    { type: '🌳', x: 70, y: 55, width: 6, height: 8 },   // Straßen-Baum
    { type: '⛲', x: 50, y: 50, width: 8, height: 8 },   // Zentral-Brunnen
    { type: '🌿', x: 15, y: 80, width: 8, height: 6 },   // Parkanlage
    { type: '🌻', x: 85, y: 75, width: 4, height: 4 },   // Blumen
    
    // Verkehrs-Elemente (statisch)
    { type: '🚏', x: 25, y: 45, width: 3, height: 6 },   // Bushaltestelle
  ];

  // Straßen-Layout (wird als CSS-Pattern gerendert)
  const streetLayout = {
    // Hauptstraße horizontal
    horizontal: [
      { x: 0, y: 45, width: 100, height: 8 },
      { x: 0, y: 35, width: 100, height: 6 },
    ],
    // Hauptstraße vertikal  
    vertical: [
      { x: 45, y: 0, width: 8, height: 100 },
      { x: 25, y: 0, width: 6, height: 100 },
      { x: 70, y: 0, width: 6, height: 100 },
    ],
    // Kreuzungen
    intersections: [
      { x: 40, y: 40, width: 18, height: 18 }, // Zentrale Kreuzung
      { x: 20, y: 40, width: 15, height: 15 }, // Links
      { x: 65, y: 40, width: 15, height: 15 }, // Rechts
    ]
  };

  // Game settings - versteckt als S-Time in erweiterten Einstellungen
  const [gameSettings, setGameSettings] = useState(() => {
    const saved = localStorage.getItem('favorg-advanced-settings');
    return saved ? JSON.parse(saved) : {
      'S-Time': 3 // Versteckt als System-Time
    };
  });

  // Easter Egg Game Logic
  const startMouseGame = () => {
    setShowEasterEgg(true);
    setGameActive(true);
    setScore(0);
    setTimeLeft(30);
    setMouseHidden(false);
    setHideTimeLeft(0);
    
    // Reset vehicle positions
    setVehiclePositions({
      bus: { x: 10, y: 45, direction: 1 },
      car: { x: 80, y: 35, direction: -1 }
    });
    
    moveMouseToRandomPosition();
    
    // Game timer
    const newGameTimer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameActive(false);
          clearInterval(newGameTimer);
          if (moveTimer) clearInterval(moveTimer);
          if (newVehicleTimer) clearInterval(newVehicleTimer);
          // Rufe handleGameOver auf
          setTimeout(() => {
            handleGameOver(score);
          }, 1000); // 1 Sekunde Delay für bessere UX
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setGameTimer(newGameTimer);
    
    // Auto move timer für Maus
    const newMoveTimer = setInterval(() => {
      if (!mouseHidden) {
        moveMouseToRandomPosition();
      }
    }, 2000); // Maus bewegt sich alle 2 Sekunden
    setMoveTimer(newMoveTimer);
    
    // Person animation timer
    const personTimer = setInterval(() => {
      setPersonPosition(prev => {
        const newX = prev.x + (personDirection * 2); // 2% pro Schritt
        
        // Richtungsänderung an den Rändern
        if (newX >= 90) {
          setPersonDirection(-1);
          return { x: 90, y: prev.y };
        } else if (newX <= 5) {
          setPersonDirection(1);
          return { x: 5, y: prev.y };
        }
        
        return { x: newX, y: prev.y };
      });
    }, 1500); // Person bewegt sich alle 1.5 Sekunden
    
    // Start vehicle movement - SPORADISCH horizontal UND vertikal auf Straßennetz
    const newVehicleTimer = setInterval(() => {
      setVehiclePositions(prev => {
        const newBus = { ...prev.bus };
        const newCar = { ...prev.car };
        
        // Bus bewegt sich komplex auf Straßennetz (horizontal + vertikal)
        const busRandom = Math.random();
        if (busRandom < 0.7) {
          // 70% horizontal movement (Hauptstraßen)
          newBus.x += newBus.direction * (0.5 + Math.random() * 0.8);
          if (newBus.x >= 85) {
            newBus.direction = -1;
          } else if (newBus.x <= 15) {
            newBus.direction = 1;
          }
        } else {
          // 30% vertikale Bewegung auf Kreuzungen
          newBus.y += (Math.random() - 0.5) * 1.5;
          // Bleibe auf Straßennetz (y zwischen 20-80)
          newBus.y = Math.max(20, Math.min(80, newBus.y));
        }
        
        // Auto bewegt sich agiler und wechselt oft Richtung
        const carRandom = Math.random();
        if (carRandom < 0.6) {
          // 60% horizontal movement (schneller als Bus)
          newCar.x += newCar.direction * (0.8 + Math.random() * 1.2);
          if (newCar.x >= 80) {
            newCar.direction = -1;
          } else if (newCar.x <= 20) {
            newCar.direction = 1;
          }
        } else if (carRandom < 0.9) {
          // 30% vertikal auf Nebenstraßen
          newCar.y += (Math.random() - 0.5) * 2;
          newCar.y = Math.max(25, Math.min(75, newCar.y));
        } else {
          // 10% Richtungswechsel
          newCar.direction *= -1;
        }
        
        return { bus: newBus, car: newCar };
      });
    }, 150); // Schnellere Updates für flüssigere Bewegung
    
    // Store timers
    setVehicleTimer(newVehicleTimer);
    
    // Cleanup function
    const cleanup = () => {
      if (newGameTimer) clearInterval(newGameTimer);
      if (newMoveTimer) clearInterval(newMoveTimer);
      if (personTimer) clearInterval(personTimer);
      if (newVehicleTimer) clearInterval(newVehicleTimer);
    };
    
    return cleanup;
  };

  const moveMouseToRandomPosition = () => {
    const newX = Math.random() * 80 + 10; // 10% bis 90% der Breite
    const newY = Math.random() * 70 + 15; // 15% bis 85% der Höhe
    setMousePosition({ x: newX, y: newY });
    
    // Check if mouse moved to hide spot
    const inHideSpot = hideSpots.some(spot => 
      newX >= spot.x && newX <= spot.x + spot.width &&
      newY >= spot.y && newY <= spot.y + spot.height
    );
    
    if (inHideSpot && Math.random() < 0.3) { // 30% Chance zu verstecken
      setMouseHidden(true);
      const hideTime = gameSettings['S-Time'] || 3; // Aus versteckten Einstellungen oder 3 Sek Standard
      setHideTimeLeft(hideTime);
      
      const hideTimer = setInterval(() => {
        setHideTimeLeft(prev => {
          if (prev <= 1) {
            setMouseHidden(false);
            clearInterval(hideTimer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const catchMouse = () => {
    if (gameActive && !mouseHidden) {
      setScore(prev => prev + 1);
      moveMouseToRandomPosition();
      showCustomToast(`🐭 Maus gefangen! Score: ${score + 1}`, 'warning', 3000); // Gelb, 3 Sek
    } else if (mouseHidden) {
      showCustomToast(`🏠 Die Maus ist versteckt!`, 'warning', 2000); // Gelb, 2 Sek
    }
  };

  const closeEasterEgg = () => {
    setShowEasterEgg(false);
    setGameActive(false);
    if (gameTimer) clearInterval(gameTimer);
    if (moveTimer) clearInterval(moveTimer);
    if (vehicleTimer) clearInterval(vehicleTimer);
    setGameTimer(null);
    setMoveTimer(null);
    setVehicleTimer(null);
  };

  // State für Highscore-Liste
  const [showHighscoreList, setShowHighscoreList] = useState(false);
  const [currentGameScore, setCurrentGameScore] = useState(0);
  const [highscoreList, setHighscoreList] = useState([]);

  // Game Over mit verbesserter Siegerliste
  const handleGameOver = (finalScore) => {
    // Bestehende Scores laden
    const savedScores = JSON.parse(localStorage.getItem('favorg-game-scores') || '[]');
    
    // Neuen Score hinzufügen
    const newScore = {
      score: finalScore,
      date: new Date().toLocaleDateString('de-DE'),
      time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    };
    
    savedScores.push(newScore);
    
    // Top 5 sortiert speichern
    savedScores.sort((a, b) => b.score - a.score);
    const top5 = savedScores.slice(0, 5);
    localStorage.setItem('favorg-game-scores', JSON.stringify(top5));
    
    // Setze State für Highscore-Anzeige
    setCurrentGameScore(finalScore);
    setHighscoreList(top5);
    setShowHighscoreList(true);
  };

  // Helper function für Element-Titel
  const getElementTitle = (type) => {
    const titles = {
      '🏠': 'Wohnhaus', '🏢': 'Bürogebäude', '🏬': 'Geschäft', '🏛️': 'Rathaus',
      '🏥': 'Krankenhaus', '🏫': 'Schule', '🏪': 'Laden', '🏨': 'Hotel',
      '🏭': 'Fabrik', '⛪': 'Kirche', '🏤': 'Postamt', '🏦': 'Bank',
      '🌳': 'Baum', '⛲': 'Brunnen', '🌿': 'Park', '🌻': 'Blumen',
      '🚏': 'Bushaltestelle', '🚗': 'Auto', '🚌': 'Bus'
    };
    return titles[type] || 'Stadt-Element';
  };

  // Validation and Duplicates
  const [hasValidated, setHasValidated] = useState(false);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [hasDuplicatesMarked, setHasDuplicatesMarked] = useState(false);

  // Additional UI State
  const [filteredBookmarks, setFilteredBookmarks] = useState([]);
  const [bookmarkCounts, setBookmarkCounts] = useState({ total: 0 });

  // Toast Management
  const [toasts, setToasts] = useState([]);
  
  // Undo/Redo System States
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [toastIdCounter, setToastIdCounter] = useState(0);

  const favoritesService = new FavoritesService();
  const uiStateManager = new UIStateManager();

  // Custom Toast System
  const showCustomToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = toastIdCounter + 1;
    setToastIdCounter(id);
    
    const newToast = {
      id,
      message,
      type,
      duration
    };
    
    setToasts(prev => [...prev, newToast]);
  }, [toastIdCounter]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // View Mode Management
  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
    localStorage.setItem('favorg-view-mode', mode);
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Escape key to clear search
      if (event.key === 'Escape') {
        setSearchQuery('');
        return;
      }
      
      // Alt+F to focus search
      if (event.altKey && event.key === 'f') {
        event.preventDefault();
        const searchInput = document.querySelector('.search-input');
        if (searchInput) searchInput.focus();
        return;
      }
      
      // Alt+N to create new bookmark
      if (event.altKey && event.key === 'n') {
        event.preventDefault();
        handleCreateBookmark();
        return;
      }
      
      // Alt+I for Import
      if (event.altKey && event.key === 'i') {
        event.preventDefault();
        handleFileUpload();
        return;
      }
      
      // Alt+E for Export
      if (event.altKey && event.key === 'e') {
        event.preventDefault();
        setShowExportDialog(true);
        return;
      }
      
      // Alt+G for Game (Easter Egg)
      if (event.altKey && event.key === 'g') {
        event.preventDefault();
        startMouseGame();
        return;
      }
      
      // F5 to refresh statistics
      if (event.key === 'F5') {
        event.preventDefault();
        loadStatistics();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load functions definiert vor useEffect
  const loadBookmarks = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await favoritesService.getAllBookmarks();
      setBookmarks(data || []);
      setBookmarkCounts({ total: (data || []).length });
      
      // Duplikate automatisch zählen
      const duplicates = (data || []).filter(bookmark => bookmark.status_type === 'duplicate');
      setDuplicateCount(duplicates.length);
      if (duplicates.length > 0) {
        setHasDuplicatesMarked(true);
      }
    } catch (error) {
      console.warn('No bookmarks found or error loading bookmarks:', error);
      setBookmarks([]);
      setBookmarkCounts({ total: 0 });
      // Keine Toast-Fehlermeldung bei leeren Daten
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filter-Logik in Hauptkomponente
  useEffect(() => {
    let filtered = bookmarks;

    // Kategorie-Filter
    if (activeCategory && activeCategory !== 'Alle' && activeCategory !== 'all') {
      filtered = filtered.filter(bookmark => 
        bookmark.category === activeCategory &&
        (!activeSubcategory || bookmark.subcategory === activeSubcategory)
      );
    }

    // Status-Filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(bookmark => {
        const statusType = bookmark.status_type || (bookmark.is_dead_link ? 'dead' : 'active');
        
        switch (statusFilter) {
          case 'active': return statusType === 'active';
          case 'dead': return statusType === 'dead';
          case 'localhost': return statusType === 'localhost';
          case 'duplicate': return statusType === 'duplicate';
          case 'unchecked': return !bookmark.last_checked;
          default: return true;
        }
      });
    }

    // Such-Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(bookmark =>
        bookmark.title.toLowerCase().includes(query) ||
        bookmark.url.toLowerCase().includes(query) ||
        bookmark.category.toLowerCase().includes(query) ||
        (bookmark.subcategory && bookmark.subcategory.toLowerCase().includes(query))
      );
    }

    // Duplikate nach URL sortieren
    if (statusFilter === 'duplicate') {
      filtered = filtered.sort((a, b) => a.url.localeCompare(b.url));
    }

    setFilteredBookmarks(filtered);
  }, [bookmarks, activeCategory, activeSubcategory, statusFilter, searchQuery]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await favoritesService.getAllCategories();
      
      // Versuche gespeicherte Kategorien-Reihenfolge aus localStorage zu laden
      const savedCategoryOrder = localStorage.getItem('favorg-category-order');
      if (savedCategoryOrder) {
        try {
          const categoryOrder = JSON.parse(savedCategoryOrder);
          
          // Merge Backend-Daten mit lokaler Reihenfolge
          const mergedCategories = data.map(backendCat => {
            const savedCat = categoryOrder.find(saved => saved.id === backendCat.id);
            if (savedCat) {
              return {
                ...backendCat,
                parent_category: savedCat.parent_category
              };
            }
            return backendCat;
          });
          
          setCategories(mergedCategories);
          console.log('✅ Kategorien mit lokaler Reihenfolge geladen');
        } catch (parseError) {
          console.warn('Fehler beim Parsen der gespeicherten Kategorien-Reihenfolge:', parseError);
          setCategories(data);
        }
      } else {
        setCategories(data);
      }
    } catch (error) {
      toast.error('Fehler beim Laden der Kategorien: ' + error.message);
    }
  }, []);

  const loadStatistics = useCallback(async () => {
    try {
      const data = await favoritesService.getStatistics();
      setStatistics(data);
    } catch (error) {
      console.error('Fehler beim Laden der Statistiken:', error);
    }
  }, []);

  // Initial Load und Focus
  useEffect(() => {
    loadBookmarks();
    loadCategories();
    loadStatistics();
    
    // Suchfeld beim Seitenstart fokussieren
    const timer = setTimeout(() => {
      const searchInput = document.querySelector('input[placeholder="Favoriten durchsuchen..."]');
      if (searchInput) {
        searchInput.focus();
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [loadBookmarks, loadCategories, loadStatistics]);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      // STRG+Z (Undo)
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // STRG+Y (Redo)
      else if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [undoStack, redoStack, bookmarks]);



  const handleCreateTestData = async () => {
    try {
      setIsLoading(true);
      const result = await favoritesService.createTestData();
      toast.success(`Testdaten erfolgreich erstellt: ${result.created_count} Favoriten mit ${result.duplicates} Duplikaten und ${result.dead_links} toten Links.`);
      // Daten neu laden
      await loadBookmarks();
      await loadCategories(); 
      await loadStatistics();
    } catch (error) {
      console.error('Testdaten creation error:', error);
      toast.error('Testdaten-Erstellung fehlgeschlagen: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format, category) => {
    try {
      setIsLoading(true);
      const result = await favoritesService.exportBookmarks(format, category);
      toast.success(result.message);
    } catch (error) {
      toast.error('Export fehlgeschlagen: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateLinks = async () => {
    try {
      setIsLoading(true);
      
      if (!hasValidated) {
        // Erste Klick: Validierung durchführen
        const result = await favoritesService.validateLinks();
        showCustomToast(`Validierung abgeschlossen: ${result.dead_links_found} tote Links gefunden von ${result.total_checked} geprüften Links.`, 'warning');
        setHasValidated(true);
        await loadBookmarks();
        await loadStatistics();
      } else {
        // Zweiter Klick: Tote Links entfernen
        const result = await favoritesService.removeDeadLinks();
        showCustomToast(`${result.removed_count} tote Links wurden entfernt.`, 'warning');
        setHasValidated(false);
        await loadBookmarks();
        await loadCategories();
        await loadStatistics();
      }
    } catch (error) {
      showCustomToast('Aktion fehlgeschlagen: ' + error.message, 'error');
      setHasValidated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveDuplicates = async () => {
    try {
      if (!hasDuplicatesMarked) {
        // First click: Find and mark duplicates
        const result = await favoritesService.findDuplicates();
        setDuplicateCount(result.marked_count || 0);
        setHasDuplicatesMarked(true);
        showCustomToast(`${result.duplicate_groups} Duplikat-Gruppen gefunden. ${result.marked_count} als Duplikat markiert.`, 'warning');
        await loadBookmarks();
        await loadStatistics();
      } else {
        // Second click: Delete marked duplicates
        const result = await favoritesService.deleteDuplicates();
        showCustomToast(`${result.removed_count} Duplikate wurden entfernt.`, 'warning');
        setDuplicateCount(0);
        setHasDuplicatesMarked(false);
        await loadBookmarks();
        await loadCategories();
        await loadStatistics();
      }
    } catch (error) {
      showCustomToast('Duplikat-Operation fehlgeschlagen: ' + error.message, 'error');
    }
  };



  const handleDeleteAll = async () => {
    try {
      setIsLoading(true);
      const result = await favoritesService.deleteAllBookmarks();
      toast.success(`${result.deleted_count} Favoriten gelöscht.`);
      await loadBookmarks();
      await loadCategories();
      await loadStatistics();
    } catch (error) {
      toast.error('Löschen fehlgeschlagen: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = (category, subcategory) => {
    setActiveCategory(category);
    setActiveSubcategory(subcategory);
  };

  // V2.3.0: Handler für neue Features
  const handleGameClick = () => {
    clearAllToasts();
    setShowGameDialog(true);
  };

  const handleToggleLock = async (bookmarkId, shouldLock) => {
    try {
      await favoritesService.updateBookmark(bookmarkId, { is_locked: shouldLock });
      showCustomToast(shouldLock ? 'Favorit gesperrt 🔒' : 'Favorit entsperrt 🔓', 'success');
      await loadBookmarks();
      await loadStatistics();
    } catch (error) {
      showCustomToast('Fehler beim Ändern des Sperr-Status: ' + error.message, 'error');
    }
  };

  const handleToggleExtraInfo = () => {
    setShowExtraInfo(!showExtraInfo);
  };

  const handleDeleteBookmark = async (bookmarkId) => {
    try {
      // Save current state to undo stack
      saveToUndoStack();
      
      await favoritesService.deleteBookmark(bookmarkId);
      toast.success('Favorit gelöscht.');
      await loadBookmarks();
      await loadCategories();
      await loadStatistics();
    } catch (error) {
      toast.error('Löschen fehlgeschlagen: ' + error.message);
    }
  };

  const handleToggleStatus = async (bookmarkId, statusType) => {
    try {
      await favoritesService.updateBookmarkStatus(bookmarkId, statusType);
      const statusLabel = {
        'active': 'Aktiv',
        'dead': 'Tot', 
        'localhost': 'Localhost',
        'duplicate': 'Duplikat'
      }[statusType] || statusType;
      toast.success(`Link-Status auf "${statusLabel}" gesetzt.`);
      
      // Kleine Verzögerung und dann Daten neu laden
      setTimeout(async () => {
        await loadBookmarks();
        await loadStatistics();
      }, 500);
    } catch (error) {
      console.error('Status toggle error:', error);
      toast.error('Status-Update fehlgeschlagen: ' + error.message);
    }
  };

  // Drag & Drop Handler für Kategorien (erweitert für echte Verschiebung)
  const handleCategoryReorder = async (draggedCategory, targetCategory) => {
    try {
      console.log(`Kategorie "${draggedCategory.name}" zu "${targetCategory.name}" verschoben`);
      console.log('Dragged Category:', draggedCategory);
      console.log('Target Category:', targetCategory);
      
      // WICHTIG: Bestimme das richtige Ziel basierend auf dem Szenario
      let newParentCategory = null;
      let moveDescription = '';
      
      if (draggedCategory.isSubcategory && !targetCategory.isSubcategory) {
        // Unterkategorie zu Hauptkategorie -> wird Unterkategorie der Hauptkategorie
        newParentCategory = targetCategory.name;
        moveDescription = `Unterkategorie "${draggedCategory.name}" zur Hauptkategorie "${targetCategory.name}" verschoben`;
      } else if (draggedCategory.isSubcategory && targetCategory.isSubcategory) {
        // Unterkategorie zu Unterkategorie -> nimmt die gleiche Parent-Kategorie
        newParentCategory = targetCategory.parent_category;
        moveDescription = `Unterkategorie "${draggedCategory.name}" zur Gruppe "${targetCategory.parent_category}" verschoben`;
      } else if (!draggedCategory.isSubcategory && targetCategory.isSubcategory) {
        // Hauptkategorie zu Unterkategorie -> wird Unterkategorie der Parent-Kategorie
        newParentCategory = targetCategory.parent_category;
        moveDescription = `Kategorie "${draggedCategory.name}" zur Unterkategorie unter "${targetCategory.parent_category}" verschoben`;
      } else {
        // Hauptkategorie zu Hauptkategorie -> bleibt Hauptkategorie
        newParentCategory = null;
        moveDescription = `Kategorien "${draggedCategory.name}" und "${targetCategory.name}" getauscht`;
      }
      
      // ⚠️ TEMPORÄRE WARNUNG: Kategorie-Verschiebung ist nur visuell
      showCustomToast(`⚠️ ${moveDescription} (nur visuell - noch nicht im Backend gespeichert)`, 'warning', 5000);
      
      // Visuelle Aktualisierung für bessere UX
      const updatedCategories = categories.map(cat => {
        if (cat.id === draggedCategory.id) {
          return {
            ...cat,
            parent_category: newParentCategory,
            // Markiere als "visuell verschoben" für später
            __visuallyMoved: true
          };
        }
        return cat;
      });
      
      // State aktualisieren
      setCategories(updatedCategories);
      
      // Lokale Speicherung für Session-Persistenz
      const categoryOrder = updatedCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        parent_category: cat.parent_category,
        __visuallyMoved: cat.__visuallyMoved || false
      }));
      localStorage.setItem('favorg-category-order', JSON.stringify(categoryOrder));
      
      // NUR Statistiken aktualisieren (nicht Categories neu laden!)
      setTimeout(async () => {
        await loadStatistics(); // Statistiken aktualisieren
      }, 100);
      
    } catch (error) {
      console.error('Category reorder error:', error);
      showCustomToast('Kategorien-Verschiebung fehlgeschlagen: ' + error.message, 'error');
    }
  };

  // Drag & Drop Handler für Bookmarks
  const handleBookmarkReorder = async (draggedBookmark, targetBookmark) => {
    try {
      // Hier würde normalerweise eine API-Anfrage an das Backend gemacht
      // Für jetzt simulieren wir die Neuordnung lokal
      console.log(`Bookmark "${draggedBookmark.title}" zu "${targetBookmark.title}" verschoben`);
      
      // Optional: Lokale Neuordnung der Bookmarks
      const newBookmarks = [...bookmarks];
      const draggedIndex = newBookmarks.findIndex(bm => bm.id === draggedBookmark.id);
      const targetIndex = newBookmarks.findIndex(bm => bm.id === targetBookmark.id);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        // Element entfernen und an neuer Position einfügen
        const [draggedItem] = newBookmarks.splice(draggedIndex, 1);
        newBookmarks.splice(targetIndex, 0, draggedItem);
        setBookmarks(newBookmarks);
        
        // Speichere Sortierung im localStorage
        const bookmarkOrder = newBookmarks.map(bm => bm.id);
        localStorage.setItem('favorg-bookmark-order', JSON.stringify(bookmarkOrder));
      }
      
      toast.success(`Favorit "${draggedBookmark.title}" wurde neu sortiert`);
    } catch (error) {
      console.error('Bookmark reorder error:', error);
      toast.error('Favoriten-Sortierung fehlgeschlagen: ' + error.message);
    }
  };

  // Handler für Bookmark zu Kategorie verschieben
  const handleBookmarkToCategory = async (bookmark, targetCategory, isTargetSubcategory = false) => {
    try {
      const targetCategoryName = targetCategory.name;
      const targetSubcategoryName = isTargetSubcategory ? targetCategory.name : null;
      
      // Verwende die FavoritesService moveBookmarks Methode
      await favoritesService.moveBookmarks([bookmark.id], targetCategoryName, targetSubcategoryName);
      
      // Aktualisiere lokale Daten
      await loadBookmarks();
      await loadCategories();
      
      const moveDescription = isTargetSubcategory 
        ? `Favorit "${bookmark.title}" zur Unterkategorie "${targetCategory.name}" verschoben`
        : `Favorit "${bookmark.title}" zur Kategorie "${targetCategory.name}" verschoben`;
      
      toast.success(moveDescription);
    } catch (error) {
      console.error('Bookmark to category move error:', error);
      toast.error('Favorit-Verschiebung fehlgeschlagen: ' + error.message);
    }
  };

  const handleEditBookmark = (bookmark) => {
    setEditingBookmark(bookmark);
    setShowBookmarkDialog(true);
  };

  const handleToggleBookmarkLock = async (bookmarkId, isLocked) => {
    try {
      // Save current state to undo stack
      saveToUndoStack();
      
      const updateData = { is_locked: isLocked };
      await favoritesService.updateBookmark(bookmarkId, updateData);
      
      // Lokale Liste aktualisieren
      setBookmarks(bookmarks.map(bookmark => 
        bookmark.id === bookmarkId 
          ? { ...bookmark, is_locked: isLocked, status_type: isLocked ? 'locked' : 'active' }
          : bookmark
      ));
      
      toast.success(isLocked ? 'Favorit gesperrt.' : 'Favorit entsperrt.');
    } catch (error) {
      console.error('Error toggling bookmark lock:', error);
      toast.error(`Fehler beim ${isLocked ? 'Sperren' : 'Entsperren'} des Favoriten.`);
    }
  };

  // Undo/Redo Functions
  const saveToUndoStack = () => {
    const currentState = {
      bookmarks: [...bookmarks],
      categories: [...categories],
      timestamp: Date.now()
    };
    
    setUndoStack(prev => [...prev.slice(-19), currentState]); // Keep last 20 states
    setRedoStack([]); // Clear redo stack when new action is performed
  };

  const handleUndo = () => {
    if (undoStack.length === 0) {
      toast.info('Nichts rückgängig zu machen.');
      return;
    }

    const currentState = {
      bookmarks: [...bookmarks],
      categories: [...categories],
      timestamp: Date.now()
    };

    const previousState = undoStack[undoStack.length - 1];
    
    setRedoStack(prev => [...prev, currentState]);
    setUndoStack(prev => prev.slice(0, -1));
    
    setBookmarks(previousState.bookmarks);
    setCategories(previousState.categories);
    
    toast.success('Aktion rückgängig gemacht.');
  };

  const handleRedo = () => {
    if (redoStack.length === 0) {
      toast.info('Nichts wiederherzustellen.');
      return;
    }

    const currentState = {
      bookmarks: [...bookmarks],
      categories: [...categories],
      timestamp: Date.now()
    };

    const nextState = redoStack[redoStack.length - 1];
    
    setUndoStack(prev => [...prev, currentState]);
    setRedoStack(prev => prev.slice(0, -1));
    
    setBookmarks(nextState.bookmarks);
    setCategories(nextState.categories);
    
    toast.success('Aktion wiederhergestellt.');
  };

  const handleCreateBookmark = () => {
    clearAllToasts(); // Schließe alle Toasts beim Öffnen des Dialogs
    setEditingBookmark(null);
    setShowBookmarkDialog(true);
  };

  const handleSaveBookmark = async (formData) => {
    try {
      const bookmarkData = {
        title: formData.title,
        url: formData.url,
        category: formData.category,
        subcategory: (formData.subcategory && formData.subcategory !== "__none__") ? formData.subcategory : null,
        description: formData.description || null
      };
      
      if (editingBookmark) {
        await favoritesService.updateBookmark(editingBookmark.id, bookmarkData);
        toast.success('Favorit aktualisiert');
      } else {
        // Beim Erstellen: Hauptbookmark speichern
        const response = await favoritesService.createBookmark(bookmarkData);
        
        // Zusätzliche Unterkategorien erstellen (wenn mehr als eine)
        if (formData.subcategories && formData.subcategories.length > 1) {
          for (let i = 1; i < formData.subcategories.length; i++) {
            const additionalSubcategory = formData.subcategories[i];
            const additionalBookmarkData = {
              ...bookmarkData,
              subcategory: additionalSubcategory
            };
            await favoritesService.createBookmark(additionalBookmarkData);
          }
          toast.success(`Favorit mit ${formData.subcategories.length} Unterkategorien erstellt`);
        } else {
          toast.success('Favorit erstellt');
        }
      }
      
      await loadBookmarks();
      await loadCategories();
      await loadStatistics();
    } catch (error) {
      console.error('Save bookmark error:', error);
      toast.error('Favorit speichern fehlgeschlagen: ' + error.message);
    }
  };

  // Handler für Kategorie-Management
  const handleSaveCategories = async (categoryList) => {
    try {
      // Hier würde normalerweise eine API-Anfrage an das Backend gemacht
      // Für jetzt loggen wir die Änderungen und aktualisieren lokal
      console.log('Kategorien gespeichert:', categoryList);
      
      // Simuliere Speicherung durch lokale Aktualisierung
      const validCategories = categoryList
        .filter(cat => cat.newName && cat.newName.trim() !== '')
        .map(cat => ({
          ...cat,
          name: cat.newName,
          editing: false
        }));
      
      setCategories(validCategories);
      
      // Lokale Speicherung
      localStorage.setItem('favorg-categories', JSON.stringify(validCategories));
      
      await loadCategories();
      await loadBookmarks();
      await loadStatistics();
      
      toast.success('Kategorien erfolgreich gespeichert');
    } catch (error) {
      console.error('Save categories error:', error);
      toast.error('Kategorien speichern fehlgeschlagen: ' + error.message);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleFileUpload = async () => {
    const fileInput = document.getElementById('file-upload');
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleFileSelected = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const result = await favoritesService.importBookmarks(file);
      showCustomToast(
        `Import erfolgreich: ${result.imported_count} Favoriten importiert`,
        'success'
      );
      await loadBookmarks();
      await loadCategories();
      await loadStatistics();
    } catch (error) {
      showCustomToast('Import fehlgeschlagen: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div className="app">
      <Header
        onSettingsClick={() => { clearAllToasts(); setShowSettings(true); }}
        onHelpClick={() => { clearAllToasts(); setShowHelp(true); }}
        onStatsToggle={() => { clearAllToasts(); setShowStatistics(true); }}
        onCreateBookmarkClick={handleCreateBookmark}
        onFileUploadClick={handleFileUpload}
        onExportClick={() => { clearAllToasts(); setShowExportDialog(true); }}
        onValidateClick={handleValidateLinks}
        onRemoveDuplicatesClick={handleRemoveDuplicates}
        onDeleteAllClick={handleDeleteAll}
        onGameClick={handleGameClick}
        deadLinksCount={statistics?.dead_links || 0}
        hasValidated={hasValidated}
        totalBookmarks={statistics?.total_bookmarks || 0}
        duplicateCount={duplicateCount}
        hasDuplicatesMarked={hasDuplicatesMarked}
        filteredCount={filteredBookmarks.length}
      />

      <div className="app-content">
        <CategorySidebar
          categories={categories}
          activeCategory={activeCategory}
          activeSubcategory={activeSubcategory}
          onCategoryChange={handleCategoryChange}
          bookmarkCounts={bookmarkCounts}
          statistics={statistics}
          onCategoryReorder={handleCategoryReorder}
          onBookmarkToCategory={handleBookmarkToCategory}
          onCategoryManage={() => setShowCategoryManageDialog(true)}
        />
        


        <MainContent
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClearSearch={handleClearSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          bookmarks={filteredBookmarks}
          onDeleteBookmark={handleDeleteBookmark}
          onEditBookmark={handleEditBookmark}
          onToggleStatus={handleToggleStatus}
          onToggleLock={handleToggleBookmarkLock}
          onFileSelected={handleFileSelected}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onBookmarkReorder={handleBookmarkReorder}
          onHelpClick={() => setShowHelp(true)}
          onStatsToggle={() => setShowStatistics(true)}
          onSettingsClick={() => setShowSettings(true)}
          onDeleteAllClick={handleDeleteAll}
        />
      </div>

      <footer className="footer">
        <p 
          onClick={startMouseGame} 
          className="copyright-game-trigger"
        >
          &copy; 2025 Jörg Renelt – Version 2.1.0 – Alle Rechte vorbehalten.
        </p>
        <p className="made-with">Made with Emergent</p>
      </footer>

      {/* Custom Draggable Toasts */}
      {toasts.map(toast => (
        <DraggableToast
          key={toast.id}
          id={toast.id.toString()}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      {/* Easter Egg Game */}
      {showEasterEgg && (
        <div className="easter-egg-game">
          <div className="game-overlay">
            <div className="game-header">
              <h2>🐭 Fang die Maus!</h2>
              <div className="game-stats">
                <span>Score: {score}</span>
                <span>Zeit: {timeLeft}s</span>
                <button onClick={closeEasterEgg} className="close-game-btn">✕</button>
              </div>
            </div>
            <div className="game-area">
              {/* Straßen-Layout (über CSS gerendert) wird automatisch angezeigt */}
              
              {/* Spazierender Mensch */}
              <div
                className="walking-person"
                style={{
                  left: `${personPosition.x}%`,
                  top: `${personPosition.y}%`,
                  transform: `scaleX(${personDirection})` // Spiegelt Person je nach Richtung
                }}
                title="Spazierender Bürger"
              >
                🚶
              </div>
              
              {/* Bewegliche Fahrzeuge */}
              <div
                className="moving-vehicle bus"
                style={{
                  left: `${vehiclePositions.bus.x}%`,
                  top: `${vehiclePositions.bus.y}%`,
                  transform: `scaleX(${vehiclePositions.bus.direction})`
                }}
                title="Stadtbus"
              >
                🚌
              </div>
              
              <div
                className="moving-vehicle car"
                style={{
                  left: `${vehiclePositions.car.x}%`,
                  top: `${vehiclePositions.car.y}%`,
                  transform: `scaleX(${vehiclePositions.car.direction})`
                }}
                title="Auto"
              >
                🚗
              </div>
              
              {/* Stadt-Elemente - Gebäude, Natur, Verkehr */}
              {hideSpots.map((spot, index) => (
                <div
                  key={index}
                  className="city-element"
                  style={{
                    left: `${spot.x}%`,
                    top: `${spot.y}%`,
                    width: `${spot.width}%`,
                    height: `${spot.height}%`
                  }}
                  title={getElementTitle(spot.type)}
                >
                  {spot.type}
                </div>
              ))}
              
              {gameActive && !mouseHidden && (
                <div 
                  className="game-mouse"
                  style={{
                    left: `${mousePosition.x}%`,
                    top: `${mousePosition.y}%`
                  }}
                  onClick={catchMouse}
                  title="Klick mich! 🐭"
                >
                  🐭
                </div>
              )}
              
              {mouseHidden && (
                <div className="mouse-hidden-indicator">
                  <div className="hidden-message">
                    🏠 Maus versteckt sich! 
                    <br />
                    <small>Kommt in {hideTimeLeft}s raus</small>
                  </div>
                </div>
              )}
              
              {/* Highscore-Liste Dialog - wird nach Spielende angezeigt */}
              {showHighscoreList && (
                <div className="highscore-modal">
                  <div className="highscore-dialog">
                    <h2>🏁 Spiel beendet!</h2>
                    <h3>Gefangene Mäuse: <span className="score-highlight">{currentGameScore}</span></h3>
                    
                    <div className="highscore-table-container">
                      <h4>🏆 Siegerliste</h4>
                      <table className="highscore-table">
                        <thead>
                          <tr>
                            <th>Platz</th>
                            <th>Mäuse</th>
                            <th>Datum</th>
                            <th>Zeit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {highscoreList.map((entry, index) => (
                            <tr key={index} className={entry.score === currentGameScore ? 'current-score' : ''}>
                              <td>{index + 1}</td>
                              <td>{entry.score}</td>
                              <td>{entry.date}</td>
                              <td>{entry.time}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="highscore-actions">
                      <button 
                        onClick={() => {
                          setShowHighscoreList(false);
                          startMouseGame();
                        }} 
                        className="restart-game-btn-highscore"
                      >
                        🔄 Nochmal spielen
                      </button>
                      <button 
                        onClick={() => {
                          setShowHighscoreList(false);
                          closeEasterEgg();
                        }} 
                        className="close-game-btn-highscore"
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setShowHighscoreList(false);
                            closeEasterEgg();
                          }
                        }}
                      >
                        ✕ Schließen
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={handleExport}
      />

      <SettingsDialog
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onExport={handleExport}
        onCreateTestData={handleCreateTestData}
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
        onSave={handleSaveCategories}
      />

      {/* V2.3.0: Enhanced Game Dialog */}
      <EnhancedCatchMouseGame
        isOpen={showGameDialog}
        onClose={() => setShowGameDialog(false)}
      />

      {/* V2.3.0: Enhanced Help Dialog */}
      <ComprehensiveHelpDialog
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />

      {/* Sonner Toaster - kept as fallback */}
      <Toaster 
        position="top-center" 
        offset="140px"
        closeButton={true}
        duration={4000}
        visibleToasts={3}
      />
    </div>
  );
}

export default App;