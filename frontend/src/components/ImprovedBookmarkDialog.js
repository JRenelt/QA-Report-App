import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { RefreshCw, Plus, Edit, X, LockKeyhole, Shield } from 'lucide-react';

const ImprovedBookmarkDialog = ({ 
  isOpen, 
  onClose, 
  bookmark, 
  onSave, 
  categories 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    category: '',
    subcategory: '',
    description: '',
    tags: '',
    is_locked: false,
    is_protected: false
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableSubcategories, setAvailableSubcategories] = useState([]);

  useEffect(() => {
    if (bookmark) {
      setFormData({
        title: bookmark.title || '',
        url: bookmark.url || '',
        category: bookmark.category || '',
        subcategory: bookmark.subcategory || '',
        description: bookmark.description || '',
        tags: (bookmark.tags || []).join(', '),
        is_locked: bookmark.is_locked || bookmark.status_type === 'locked' || false,
        is_protected: bookmark.is_protected || false
      });
    } else {
      setFormData({
        title: '',
        url: '',
        category: '',
        subcategory: '',
        description: '',
        tags: '',
        is_locked: false,
        is_protected: false
      });
    }
    setErrors({});
  }, [bookmark, isOpen]);

  // Update subcategories when category changes
  useEffect(() => {
    if (formData.category && categories) {
      const subcats = categories
        .filter(cat => cat.parent_category === formData.category)
        .map(cat => cat.name)
        .sort(); // Alphabetisch sortieren
      setAvailableSubcategories(subcats);
      
      // Reset subcategory if it's not valid for the selected category
      if (formData.subcategory && !subcats.includes(formData.subcategory)) {
        setFormData(prev => ({ ...prev, subcategory: '' }));
      }
    } else {
      setAvailableSubcategories([]);
    }
  }, [formData.category, categories]);

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
      const submitData = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        category: formData.category || 'Uncategorized'
      };
      
      await onSave(submitData);
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      setErrors({ submit: 'Fehler beim Speichern. Bitte versuchen Sie es erneut.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get unique main categories (alphabetically sorted)
  const mainCategories = [...new Set(
    (categories || [])
      .filter(cat => !cat.parent_category)
      .map(cat => cat.name)
      .filter(name => name && name.trim() !== '')
  )].sort();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="improved-bookmark-dialog max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {bookmark ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {bookmark ? 'Favorit bearbeiten' : 'Neuer Favorit'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Grundlegende Informationen */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Grundlegende Informationen</h4>
            
            <div>
              <Label htmlFor="title">
                Titel *
                {errors.title && <span className="text-red-500 text-sm"> - {errors.title}</span>}
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Titel des Favoriten"
                className={errors.title ? 'border-red-500' : ''}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="url">
                URL *
                {errors.url && <span className="text-red-500 text-sm"> - {errors.url}</span>}
              </Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({...formData, url: e.target.value})}
                placeholder="https://example.com"
                className={errors.url ? 'border-red-500' : ''}
                required
              />
            </div>
          </div>

          <Separator />

          {/* Kategorisierung */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Kategorisierung</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Hauptkategorie</Label>
                <Select 
                  value={formData.category || ''} 
                  onValueChange={(value) => setFormData({...formData, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kategorie auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uncategorized">Nicht zugeordnet</SelectItem>
                    {mainCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="subcategory">Unterkategorie</Label>
                <Select 
                  value={formData.subcategory || ''} 
                  onValueChange={(value) => setFormData({...formData, subcategory: value})}
                  disabled={!formData.category || availableSubcategories.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue 
                      placeholder={
                        !formData.category 
                          ? "Zuerst Hauptkategorie wählen" 
                          : availableSubcategories.length === 0
                          ? "Keine Unterkategorien verfügbar"
                          : "Unterkategorie auswählen"
                      } 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Keine Unterkategorie</SelectItem>
                    {availableSubcategories.map(subcat => (
                      <SelectItem key={subcat} value={subcat}>{subcat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableSubcategories.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {availableSubcategories.length} Unterkategorie(n) verfügbar
                  </p>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="tags">Tags (durch Komma getrennt)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                placeholder="tag1, tag2, tag3"
              />
            </div>
          </div>

          <Separator />

          {/* Beschreibung */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Beschreibung</h4>
            
            <div>
              <Label htmlFor="description" className="text-gray-900 font-medium">
                Optionale Beschreibung
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Kurze Beschreibung des Favoriten..."
                className="text-gray-900 bg-white border border-gray-300"
                style={{ color: '#000000' }} // Explizit schwarz setzen
                rows={3}
              />
              <p className="text-xs text-gray-600 mt-1">
                📝 Die Beschreibung wird in der Kartenansicht als Extra-Info-Fenster angezeigt
              </p>
            </div>
          </div>

          <Separator />

          {/* Erweiterte Einstellungen - Alphabetisch sortiert und kategorisiert */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Erweiterte Einstellungen</h4>
            
            {/* Sicherheits-Einstellungen */}
            <div className="space-y-3">
              <h5 className="text-sm font-medium text-gray-700">🔒 Sicherheits-Einstellungen</h5>
              
              <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <LockKeyhole className="w-4 h-4 text-gray-600" />
                  <div>
                    <Label htmlFor="is_locked" className="font-medium">Favorit sperren</Label>
                    <p className="text-sm text-gray-500">Favorit kann nicht bearbeitet oder gelöscht werden</p>
                  </div>
                </div>
                <Switch
                  id="is_locked"
                  checked={formData.is_locked}
                  onCheckedChange={(checked) => setFormData({...formData, is_locked: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-600" />
                  <div>
                    <Label htmlFor="is_protected" className="font-medium">Schreibschutz</Label>
                    <p className="text-sm text-gray-500">Zusätzlicher Schutz vor versehentlichen Änderungen</p>
                  </div>
                </div>
                <Switch
                  id="is_protected"
                  checked={formData.is_protected}
                  onCheckedChange={(checked) => setFormData({...formData, is_protected: checked})}
                />
              </div>
            </div>

            {/* Anzeige-Einstellungen */}
            <div className="space-y-3">
              <h5 className="text-sm font-medium text-gray-700">👁️ Anzeige-Einstellungen</h5>
              
              <div className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded">
                <div>
                  <Label className="font-medium">Extra Info, Kartenansicht sichtbar</Label>
                  <p className="text-sm text-gray-500">0 = versteckt, 1 = sichtbar (Standard: 0 - versteckt)</p>
                </div>
                <div className="text-sm font-mono bg-white px-2 py-1 rounded border">
                  0
                </div>
              </div>
              <p className="text-xs text-gray-500">
                ℹ️ Diese Einstellung bestimmt, ob Beschreibungen automatisch in der Kartenansicht angezeigt werden
              </p>
            </div>
          </div>
          
          {errors.submit && (
            <div className="text-red-500 text-sm bg-red-50 p-2 rounded">
              {errors.submit}
            </div>
          )}
          
          <div className="flex gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              <X className="w-4 h-4 mr-2" />
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
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

export default ImprovedBookmarkDialog;