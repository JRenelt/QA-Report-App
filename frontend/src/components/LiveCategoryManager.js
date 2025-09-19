import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { 
  Folder, 
  FolderPlus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  ChevronRight, 
  ChevronDown,
  Plus,
  Search
} from 'lucide-react';

const LiveCategoryManager = ({ isOpen, onClose, categories, onSave }) => {
  const [treeData, setTreeData] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState(new Set(['root']));
  const [editingNode, setEditingNode] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [newCategoryInputs, setNewCategoryInputs] = useState({});
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  
  const handleCreateMainCategory = () => {
    const newCategoryName = prompt('Name der neuen Hauptkategorie:');
    if (newCategoryName && newCategoryName.trim()) {
      // Hier würde normalerweise ein API-Call erfolgen
      console.log('Creating main category:', newCategoryName.trim());
      // Nach erfolgreichem Erstellen das Dialog schließen oder aktualisieren
    }
  };

  useEffect(() => {
    if (categories) {
      const tree = buildCategoryTree(categories);
      setTreeData(tree);
      // Auto-expand first level
      const firstLevelNames = tree.map(cat => cat.name);
      setExpandedNodes(new Set(['root', ...firstLevelNames]));
    }
  }, [categories]);

  const buildCategoryTree = (flatCategories) => {
    const categoryMap = new Map();
    const rootCategories = [];

    // Create all category objects first
    flatCategories.forEach(category => {
      categoryMap.set(category.name, {
        ...category,
        children: [],
        level: 1,
        path: [category.name]
      });
    });

    // Build hierarchy
    categoryMap.forEach((category, name) => {
      if (category.parent_category && categoryMap.has(category.parent_category)) {
        const parent = categoryMap.get(category.parent_category);
        parent.children.push(category);
        category.level = parent.level + 1;
        category.path = [...parent.path, category.name];
      } else {
        rootCategories.push(category);
      }
    });

    // Sort all levels
    const sortChildren = (cats) => {
      cats.sort((a, b) => a.name.localeCompare(b.name));
      cats.forEach(cat => {
        if (cat.children) sortChildren(cat.children);
      });
    };
    
    sortChildren(rootCategories);
    return rootCategories;
  };

  // Filter-Funktion für Kategorien basierend auf Suchterm
  const filterCategories = (categories, searchTerm) => {
    if (!searchTerm.trim()) return categories;
    
    const searchLower = searchTerm.toLowerCase();
    
    const filterNode = (node) => {
      const nameMatches = node.name.toLowerCase().includes(searchLower);
      const filteredChildren = node.children ? node.children.map(filterNode).filter(Boolean) : [];
      
      // Zeige Node wenn Name matcht oder wenn Kinder matchen
      if (nameMatches || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren,
          isHighlighted: nameMatches // Für gelbe Markierung
        };
      }
      
      return null;
    };
    
    return categories.map(filterNode).filter(Boolean);
  };

  // Highlighted Text Renderer
  const renderHighlightedText = (text, searchTerm) => {
    if (!searchTerm.trim()) return text;
    
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return (
      <span>
        {parts.map((part, index) =>
          part.toLowerCase() === searchTerm.toLowerCase() ? (
            <span key={index} className="bg-yellow-200 dark:bg-yellow-600 px-1 rounded">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </span>
    );
  };
  };

  const toggleExpanded = (nodeName) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeName)) {
      newExpanded.delete(nodeName);
    } else {
      newExpanded.add(nodeName);
    }
    setExpandedNodes(newExpanded);
  };

  const startEdit = (node) => {
    setEditingNode(node.name);
    setEditValue(node.name);
  };

  const saveEdit = async () => {
    // Erlaube auch leere Namen, aber normalisiere sie
    const normalizedValue = editValue.trim() || 'Unbenannt';
    
    try {
      await onSave({
        action: 'update',
        oldName: editingNode,
        newName: normalizedValue
      });
      
      toast.success(`Kategorie umbenannt`);
      setEditingNode(null);
      setEditValue('');
    } catch (error) {
      toast.error(`Fehler: ${error.message}`);
    }
  };

  const cancelEdit = () => {
    setEditingNode(null);
    setEditValue('');
  };

  const deleteCategory = async (categoryName) => {
    if (!confirm(`Kategorie "${categoryName}" wirklich löschen?\nAlle Unterkategorien werden ebenfalls gelöscht.`)) {
      return;
    }

    try {
      await onSave({
        action: 'delete',
        categoryName
      });
      
      toast.success(`Kategorie gelöscht`);
    } catch (error) {
      toast.error(`Fehler: ${error.message}`);
    }
  };

  const showNewCategoryInput = (parentName = null) => {
    const key = parentName || 'root';
    setNewCategoryInputs({
      ...newCategoryInputs,
      [key]: true
    });
  };

  const hideNewCategoryInput = (parentName = null) => {
    const key = parentName || 'root';
    const newInputs = { ...newCategoryInputs };
    delete newInputs[key];
    setNewCategoryInputs(newInputs);
  };

  const createCategory = async (parentName = null, categoryName) => {
    if (!categoryName.trim()) {
      toast.error('Name darf nicht leer sein');
      return;
    }

    try {
      await onSave({
        action: 'create',
        categoryName: categoryName.trim(),
        parentCategory: parentName
      });
      
      toast.success(`Kategorie "${categoryName}" erstellt`);
      hideNewCategoryInput(parentName);
      
      // Auto-expand parent to show new category
      if (parentName) {
        setExpandedNodes(prev => new Set([...prev, parentName]));
      }
    } catch (error) {
      toast.error(`Fehler: ${error.message}`);
    }
  };

  const NewCategoryInput = ({ parentName = null, level = 1 }) => {
    const [inputValue, setInputValue] = useState('');
    const inputKey = parentName || 'root';
    
    if (!newCategoryInputs[inputKey]) return null;

    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        createCategory(parentName, inputValue);
        setInputValue('');
      } else if (e.key === 'Escape') {
        hideNewCategoryInput(parentName);
        setInputValue('');
      }
    };

    return (
      <div 
        className="new-category-input"
        style={{ 
          paddingLeft: `${level * 20}px`,
          marginTop: '4px',
          marginBottom: '4px'
        }}
      >
        <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border-2 border-blue-200 dark:border-blue-700">
          <Folder className="w-4 h-4 text-blue-500" />
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={`Neue ${parentName ? 'Unter' : ''}kategorie...`}
            className="flex-1 h-8"
            autoFocus
          />
          <Button
            size="sm"
            onClick={() => createCategory(parentName, inputValue)}
            disabled={!inputValue.trim()}
          >
            <Save className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => hideNewCategoryInput(parentName)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  const renderCategoryNode = (node, level = 1) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.name);
    const isEditing = editingNode === node.name;
    const indent = level * 20;

    return (
      <div key={node.name}>
        <div 
          className="category-node"
          style={{ paddingLeft: `${indent}px` }}
        >
          <div className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded group">
            {/* Expand/Collapse Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleExpanded(node.name)}
              className="w-6 h-6 p-0"
            >
              {hasChildren ? (
                isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
              ) : (
                <div className="w-4 h-4" />
              )}
            </Button>

            {/* Folder Icon */}
            <Folder className="w-4 h-4 text-blue-500" />

            {/* Category Name / Edit Input */}
            {isEditing ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit();
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  className="flex-1 h-8"
                  autoFocus
                />
                <Button size="sm" onClick={saveEdit}>
                  <Save className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={cancelEdit}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <span className="flex-1 font-medium">
                {node.name}
                <span className="ml-2 text-xs text-gray-500">
                  ({node.count || 0})
                </span>
                <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                  Level {level}
                </span>
              </span>
            )}

            {/* Action Buttons */}
            {!isEditing && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => showNewCategoryInput(node.name)}
                  title="Unterkategorie hinzufügen"
                  className="w-8 h-8 p-0"
                >
                  <Plus className="w-4 h-4 text-green-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEdit(node)}
                  title="Bearbeiten"
                  className="w-8 h-8 p-0"
                >
                  <Edit2 className="w-4 h-4 text-blue-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteCategory(node.name)}
                  title="Löschen"
                  className="w-8 h-8 p-0"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* New Category Input for this node */}
        <NewCategoryInput parentName={node.name} level={level + 1} />

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="category-children">
            {node.children.map(child => renderCategoryNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="category-manage-title">
            🏷️ Live Kategorien-Verwaltung
          </DialogTitle>
          
          {/* Help Link und Zurück zur Startseite */}
          <div className="category-help-links">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                // Öffne Hilfe-Dialog im Parent
                if (window.parent && window.parent.setShowHelp) {
                  window.parent.setShowHelp(true);
                } else {
                  // Fallback: Neues Fenster
                  alert('Bitte öffnen Sie das Handbuch über das Hilfe-Menü');
                }
              }}
              className="help-link-btn"
            >
              📚 Handbuch öffnen
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onClose()}
              className="home-link-btn"
            >
              🏠 Zurück zur Startseite
            </Button>
          </div>
        </DialogHeader>
        
        {/* Kompakte Toolbar */}
        <div className="category-toolbar">
          {/* Suchfeld (1/3 Platz) */}
          <div className="category-search-section-compact">
            <div className="category-search-wrapper">
              <Search className="w-4 h-4 category-search-icon" />
              <Input
                value={categorySearchTerm}
                onChange={(e) => setCategorySearchTerm(e.target.value)}
                placeholder="Kategorie suchen..."
                className="category-search-input-compact"
              />
            </div>
          </div>
          
          {/* Neue Hauptkategorie Button (rechts) */}
          <div className="new-main-category-section">
            <Button
              onClick={() => handleCreateMainCategory()}
              size="sm"
              className="new-main-category-btn"
            >
              <Plus className="w-4 h-4 mr-1" />
              Neue Hauptkategorie
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {/* Hyperlink zum Handbuch statt Text */}
          <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
            <div className="text-center">
              <a 
                href="#help-categories" 
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:underline font-medium"
                onClick={(e) => {
                  e.preventDefault();
                  // Öffne Hilfe-Dialog
                  alert('Handbuch wird geöffnet - Live-Bearbeitung Features erklärt');
                }}
              >
                📚 Live-Bearbeitung Features im Handbuch nachlesen
              </a>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Alle Kategorien</h3>
            <Button
              onClick={() => showNewCategoryInput()}
              className="flex items-center gap-2"
            >
              <FolderPlus className="w-4 h-4" />
              Neue Hauptkategorie
            </Button>
          </div>

          <div className="category-tree border rounded-lg overflow-y-auto max-h-96 bg-white dark:bg-gray-900">
            <div className="p-4">
              {/* New Root Category Input */}
              <NewCategoryInput level={1} />
              
              {/* Existing Categories */}
              {treeData.length > 0 ? (
                treeData.map(node => renderCategoryNode(node, 1))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Folder className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Keine Kategorien vorhanden</p>
                  <p className="text-sm">Klicken Sie oben auf "Neue Hauptkategorie"</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Schließen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LiveCategoryManager;