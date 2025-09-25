import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { Folder, FolderPlus, Edit, Trash2, ChevronRight, ChevronDown } from 'lucide-react';

const AdvancedCategoryManager = ({ isOpen, onClose, categories, onSave }) => {
  const [treeData, setTreeData] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [selectedNode, setSelectedNode] = useState(null);
  
  // Neue Kategorie States
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryParent, setNewCategoryParent] = useState('');
  const [newCategoryLevel, setNewCategoryLevel] = useState(1);
  
  // Edit States
  const [editingNode, setEditingNode] = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    if (categories) {
      const tree = buildCategoryTree(categories);
      setTreeData(tree);
    }
  }, [categories]);

  // Baue Kategorie-Baum aus flacher Liste
  const buildCategoryTree = (flatCategories) => {
    const categoryMap = new Map();
    const rootCategories = [];

    // Erst alle Kategorien in Map einfügen
    flatCategories.forEach(category => {
      categoryMap.set(category.name, {
        ...category,
        children: [],
        level: getLevel(category.name),
        path: getCategoryPath(category.name)
      });
    });

    // Dann Hierarchie aufbauen
    categoryMap.forEach((category, name) => {
      if (category.parent_category) {
        const parent = categoryMap.get(category.parent_category);
        if (parent) {
          parent.children.push(category);
        } else {
          // Parent nicht gefunden, als Root behandeln
          rootCategories.push(category);
        }
      } else {
        rootCategories.push(category);
      }
    });

    return rootCategories.sort((a, b) => a.name.localeCompare(b.name));
  };

  const getLevel = (categoryName) => {
    // Zähle die Anzahl der Parent-Referenzen um Level zu bestimmen
    let level = 1;
    let current = categories.find(cat => cat.name === categoryName);
    
    while (current && current.parent_category) {
      level++;
      current = categories.find(cat => cat.name === current.parent_category);
      if (level > 10) break; // Verhindere Endlosschleifen
    }
    
    return level;
  };

  const getCategoryPath = (categoryName) => {
    const path = [];
    let current = categories.find(cat => cat.name === categoryName);
    
    while (current) {
      path.unshift(current.name);
      current = categories.find(cat => cat.name === current.parent_category);
    }
    
    return path;
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

  const renderTreeNode = (node, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.name);
    const indent = depth * 20;

    return (
      <div key={node.name} className="category-tree-node">
        <div 
          className={`category-item ${selectedNode === node.name ? 'selected' : ''}`}
          style={{ paddingLeft: `${indent}px` }}
        >
          <div className="category-item-content">
            {hasChildren ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleExpanded(node.name)}
                className="expand-btn"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
            ) : (
              <div className="w-8"></div>
            )}
            
            <Folder className="w-4 h-4 text-blue-500" />
            
            <span className="category-name">{node.name}</span>
            <span className="category-count">({node.count})</span>
            <span className="category-level">Level {node.level}</span>
            
            <div className="category-actions">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startEdit(node)}
                title="Bearbeiten"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteCategory(node.name)}
                title="Löschen"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => createSubcategory(node.name)}
                title="Unterkategorie erstellen"
              >
                <FolderPlus className="w-4 h-4 text-green-500" />
              </Button>
            </div>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="category-children">
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const startEdit = (node) => {
    setEditingNode(node.name);
    setEditName(node.name);
  };

  const saveEdit = async () => {
    if (!editName.trim()) {
      toast.error('Name darf nicht leer sein');
      return;
    }

    try {
      // Implementierung für Backend-Update
      await onSave({
        action: 'update',
        oldName: editingNode,
        newName: editName.trim()
      });
      
      toast.success(`Kategorie "${editingNode}" wurde zu "${editName}" umbenannt`);
      setEditingNode(null);
      setEditName('');
    } catch (error) {
      toast.error(`Fehler beim Umbenennen: ${error.message}`);
    }
  };

  const deleteCategory = async (categoryName) => {
    if (!window.confirm(`Kategorie "${categoryName}" wirklich löschen?`)) return;

    try {
      await onSave({
        action: 'delete',
        categoryName
      });
      
      toast.success(`Kategorie "${categoryName}" wurde gelöscht`);
    } catch (error) {
      toast.error(`Fehler beim Löschen: ${error.message}`);
    }
  };

  const createSubcategory = (parentName) => {
    setNewCategoryParent(parentName);
    setNewCategoryLevel(getLevel(parentName) + 1);
  };

  const createNewCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Name darf nicht leer sein');
      return;
    }

    try {
      await onSave({
        action: 'create',
        categoryName: newCategoryName.trim(),
        parentCategory: newCategoryParent || null,
        level: newCategoryLevel
      });
      
      toast.success(`Kategorie "${newCategoryName}" wurde erstellt`);
      setNewCategoryName('');
      setNewCategoryParent('');
      setNewCategoryLevel(1);
    } catch (error) {
      toast.error(`Fehler beim Erstellen: ${error.message}`);
    }
  };

  const getAllPossibleParents = () => {
    const parents = [];
    const addParents = (nodes, path = []) => {
      nodes.forEach(node => {
        parents.push({
          name: node.name,
          path: [...path, node.name].join(' → '),
          level: node.level
        });
        if (node.children) {
          addParents(node.children, [...path, node.name]);
        }
      });
    };
    addParents(treeData);
    return parents;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Erweiterte Kategorien-Verwaltung</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bereich 1: Neue Kategorien erstellen */}
          <div className="category-creation-section">
            <h3 className="text-lg font-semibold mb-4">Neue Kategorie erstellen</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Kategorie-Name</label>
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="z.B. Web Development"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Übergeordnete Kategorie (optional)</label>
                <Select value={newCategoryParent} onValueChange={setNewCategoryParent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Hauptkategorie (Level 1)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Hauptkategorie (Level 1)</SelectItem>
                    {getAllPossibleParents().map(parent => (
                      <SelectItem key={parent.name} value={parent.name}>
                        {parent.path} (Level {parent.level})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="text-sm text-gray-500">
                Wird erstellt als: <strong>Level {newCategoryParent ? getLevel(newCategoryParent) + 1 : 1}</strong>
              </div>

              <Button onClick={createNewCategory} className="w-full">
                <FolderPlus className="w-4 h-4 mr-2" />
                Kategorie erstellen
              </Button>
            </div>
          </div>

          {/* Bereich 2: Bestehende Kategorien (RUD) */}
          <div className="category-management-section">
            <h3 className="text-lg font-semibold mb-4">Bestehende Kategorien</h3>
            
            <div className="category-tree max-h-96 overflow-y-auto border rounded p-4">
              {treeData.length > 0 ? (
                treeData.map(node => renderTreeNode(node))
              ) : (
                <p className="text-gray-500 text-center">Keine Kategorien vorhanden</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline" onClick={onClose}>
            Schließen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdvancedCategoryManager;