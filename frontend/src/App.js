import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Badge } from "./components/ui/badge";
import { Trash2, Edit2, Plus, Upload, Download, RefreshCw, Shield, Link, Folder, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "./components/ui/alert";
import { Switch } from "./components/ui/switch";
import { Separator } from "./components/ui/separator";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FavOrg = () => {
  const [favorites, setFavorites] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Dialog states
  const [showAddFavorite, setShowAddFavorite] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingFavorite, setEditingFavorite] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  // Form states
  const [favoriteForm, setFavoriteForm] = useState({
    title: "", url: "", description: "", category_id: "", tags: "", is_protected: false
  });
  const [categoryForm, setCategoryForm] = useState({
    name: "", parent_id: ""
  });
  const [importForm, setImportForm] = useState({
    browser_name: "", bookmarks_data: ""
  });

  // Load data
  useEffect(() => {
    loadCategories();
    loadFavorites();
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [selectedStatus, selectedCategory]);

  const loadCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      setError("Fehler beim Laden der Kategorien: " + error.message);
    }
  };

  const loadFavorites = async () => {
    try {
      setIsLoading(true);
      const params = {};
      
      if (selectedCategory !== "all") {
        params.category_id = selectedCategory;
      }
      
      if (selectedStatus !== "all") {
        params.status = selectedStatus;
      }

      const response = await axios.get(`${API}/favorites`, { params });
      setFavorites(response.data);
    } catch (error) {
      setError("Fehler beim Laden der Favoriten: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFavorite = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...favoriteForm,
        tags: favoriteForm.tags.split(",").map(t => t.trim()).filter(t => t)
      };
      
      if (editingFavorite) {
        await axios.put(`${API}/favorites/${editingFavorite.id}`, data);
        setEditingFavorite(null);
      } else {
        await axios.post(`${API}/favorites`, data);
      }
      
      setFavoriteForm({ title: "", url: "", description: "", category_id: "", tags: "", is_protected: false });
      setShowAddFavorite(false);
      loadFavorites();
    } catch (error) {
      setError("Fehler beim Speichern: " + error.response?.data?.detail || error.message);
    }
  };

  const handleDeleteFavorite = async (id) => {
    try {
      await axios.delete(`${API}/favorites/${id}`);
      loadFavorites();
    } catch (error) {
      setError("Fehler beim Löschen: " + error.response?.data?.detail || error.message);
    }
  };

  const handleEditFavorite = (favorite) => {
    setEditingFavorite(favorite);
    setFavoriteForm({
      title: favorite.title,
      url: favorite.url,
      description: favorite.description || "",
      category_id: favorite.category_id || "",
      tags: favorite.tags.join(", "),
      is_protected: favorite.is_protected || false
    });
    setShowAddFavorite(true);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await axios.put(`${API}/categories/${editingCategory.id}`, categoryForm);
        setEditingCategory(null);
      } else {
        await axios.post(`${API}/categories`, categoryForm);
      }
      
      setCategoryForm({ name: "", parent_id: "" });
      setShowAddCategory(false);
      loadCategories();
    } catch (error) {
      setError("Fehler beim Speichern der Kategorie: " + error.response?.data?.detail || error.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await axios.delete(`${API}/categories/${id}`);
      loadCategories();
    } catch (error) {
      setError("Fehler beim Löschen der Kategorie: " + error.response?.data?.detail || error.message);
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      parent_id: category.parent_id || ""
    });
    setShowAddCategory(true);
  };

  const handleImport = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await axios.post(`${API}/import/browser`, importForm);
      setImportForm({ browser_name: "", bookmarks_data: "" });
      setShowImport(false);
      loadCategories();
      loadFavorites();
      setError(""); // Clear any previous errors
      alert("Import erfolgreich!");
    } catch (error) {
      setError("Import fehlgeschlagen: " + error.response?.data?.detail || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (browserName) => {
    try {
      const response = await axios.post(`${API}/export/${browserName}`);
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `bookmarks_${browserName}_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (error) {
      setError("Export fehlgeschlagen: " + error.message);
    }
  };

  const handleAnalyzeLinks = async () => {
    try {
      setIsLoading(true);
      await axios.post(`${API}/analyze/links`);
      loadFavorites();
      alert("Link-Analyse abgeschlossen!");
    } catch (error) {
      setError("Analyse fehlgeschlagen: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : "Keine Kategorie";
  };

  const buildCategoryTree = (parentId = null, level = 0) => {
    return categories
      .filter(cat => cat.parent_id === parentId)
      .map(cat => ({
        ...cat,
        children: buildCategoryTree(cat.id, level + 1),
        level
      }));
  };

  const renderCategoryOptions = (categories, level = 0) => {
    const indent = "  ".repeat(level);
    return categories.map(cat => (
      <React.Fragment key={cat.id}>
        <SelectItem value={cat.id}>{indent}{cat.name}</SelectItem>
        {cat.children && renderCategoryOptions(cat.children, level + 1)}
      </React.Fragment>
    ));
  };

  const getStatusBadge = (favorite) => {
    const badges = [];
    
    if (favorite.is_duplicate) {
      badges.push(<Badge key="dup" variant="destructive" className="mr-1">Duplikat</Badge>);
    }
    if (favorite.is_broken) {
      badges.push(<Badge key="broken" variant="destructive" className="mr-1">Defekt</Badge>);
    }
    if (favorite.is_localhost) {
      badges.push(<Badge key="local" variant="secondary" className="mr-1">Localhost</Badge>);
    }
    if (favorite.is_protected) {
      badges.push(<Badge key="protected" variant="outline" className="mr-1"><Shield className="w-3 h-3 mr-1"/>Geschützt</Badge>);
    }
    
    return badges;
  };

  const categoryTree = buildCategoryTree();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">FavOrg - Favoriten Manager</h1>
          <p className="text-gray-600">Verwalten Sie Ihre Browser-Favoriten zentral und organisiert</p>
        </div>

        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="favorites" className="space-y-4">
          <TabsList>
            <TabsTrigger value="favorites">Favoriten</TabsTrigger>
            <TabsTrigger value="categories">Kategorien</TabsTrigger>
            <TabsTrigger value="import-export">Import/Export</TabsTrigger>
          </TabsList>

          <TabsContent value="favorites" className="space-y-4">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-2">
                <Select value={selectedStatus || "all"} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Status filtern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Status</SelectItem>
                    <SelectItem value="duplicates">Doppelte Favoriten</SelectItem>
                    <SelectItem value="broken">Defekte Links</SelectItem>
                    <SelectItem value="localhost">Localhost</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedCategory || "all"} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Kategorie filtern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Kategorien</SelectItem>
                    {renderCategoryOptions(categoryTree)}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAnalyzeLinks} variant="outline" disabled={isLoading}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Links analysieren
                </Button>
                
                <Dialog open={showAddFavorite} onOpenChange={setShowAddFavorite}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { 
                      setEditingFavorite(null); 
                      setFavoriteForm({ title: "", url: "", description: "", category_id: "", tags: "", is_protected: false }); 
                      setShowAddFavorite(true);
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Favorit hinzufügen
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>{editingFavorite ? "Favorit bearbeiten" : "Neuer Favorit"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddFavorite} className="space-y-4">
                      <div>
                        <Label htmlFor="title">Titel</Label>
                        <Input
                          id="title"
                          value={favoriteForm.title}
                          onChange={(e) => setFavoriteForm({...favoriteForm, title: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="url">URL</Label>
                        <Input
                          id="url"
                          type="url"
                          value={favoriteForm.url}
                          onChange={(e) => setFavoriteForm({...favoriteForm, url: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Kategorie</Label>
                        <Select value={favoriteForm.category_id || ""} onValueChange={(value) => setFavoriteForm({...favoriteForm, category_id: value === "" ? null : value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Kategorie wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Keine Kategorie</SelectItem>
                            {renderCategoryOptions(categoryTree)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="description">Beschreibung</Label>
                        <Textarea
                          id="description"
                          value={favoriteForm.description}
                          onChange={(e) => setFavoriteForm({...favoriteForm, description: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="tags">Tags (durch Komma getrennt)</Label>
                        <Input
                          id="tags"
                          value={favoriteForm.tags}
                          onChange={(e) => setFavoriteForm({...favoriteForm, tags: e.target.value})}
                          placeholder="tag1, tag2, tag3"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="protected"
                          checked={favoriteForm.is_protected}
                          onCheckedChange={(checked) => setFavoriteForm({...favoriteForm, is_protected: checked})}
                        />
                        <Label htmlFor="protected">Schreibschutz</Label>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" className="flex-1">Speichern</Button>
                        <Button type="button" variant="outline" onClick={() => setShowAddFavorite(false)}>Abbrechen</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="grid gap-4">
              {isLoading ? (
                <div className="text-center py-8">Lade Favoriten...</div>
              ) : favorites.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <h3 className="text-lg font-medium mb-2">Keine Favoriten gefunden</h3>
                    <p className="text-gray-600 mb-4">Importieren Sie Ihre Browser-Favoriten oder fügen Sie neue hinzu.</p>
                  </CardContent>
                </Card>
              ) : (
                favorites.map((favorite) => (
                  <Card key={favorite.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Link className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <h3 className="font-medium text-gray-900 truncate">{favorite.title}</h3>
                            {getStatusBadge(favorite)}
                          </div>
                          
                          <a 
                            href={favorite.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline block truncate mb-2"
                          >
                            {favorite.url}
                          </a>
                          
                          {favorite.description && (
                            <p className="text-sm text-gray-600 mb-2">{favorite.description}</p>
                          )}
                          
                          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                            <span>Kategorie: {getCategoryName(favorite.category_id)}</span>
                            {favorite.tags.length > 0 && (
                              <span>Tags: {favorite.tags.join(", ")}</span>
                            )}
                            {favorite.browser_source && (
                              <span>Quelle: {favorite.browser_source}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditFavorite(favorite)}
                            disabled={favorite.is_protected}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteFavorite(favorite.id)}
                            disabled={favorite.is_protected}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Kategorien verwalten</h2>
              <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
                <DialogTrigger asChild>
                  <Button onClick={() => { 
                    setEditingCategory(null); 
                    setCategoryForm({ name: "", parent_id: "" });
                    setShowAddCategory(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Kategorie hinzufügen
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingCategory ? "Kategorie bearbeiten" : "Neue Kategorie"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddCategory} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="parent">Übergeordnete Kategorie</Label>
                      <Select value={categoryForm.parent_id || ""} onValueChange={(value) => setCategoryForm({...categoryForm, parent_id: value === "" ? null : value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Hauptkategorie" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Hauptkategorie</SelectItem>
                          {renderCategoryOptions(categoryTree)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">Speichern</Button>
                      <Button type="button" variant="outline" onClick={() => setShowAddCategory(false)}>Abbrechen</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {categoryTree.map((category) => (
                <CategoryTreeNode 
                  key={category.id} 
                  category={category} 
                  onEdit={handleEditCategory}
                  onDelete={handleDeleteCategory}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="import-export" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Import
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Dialog open={showImport} onOpenChange={setShowImport}>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full"
                        onClick={() => {
                          setImportForm({ browser_name: "", bookmarks_data: "" });
                          setShowImport(true);
                        }}
                      >
                        Browser-Favoriten importieren
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Favoriten importieren</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleImport} className="space-y-4">
                        <div>
                          <Label htmlFor="browser_name">Browser</Label>
                          <Select value={importForm.browser_name || ""} onValueChange={(value) => setImportForm({...importForm, browser_name: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Browser wählen" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Chrome">Google Chrome</SelectItem>
                              <SelectItem value="Firefox">Mozilla Firefox</SelectItem>
                              <SelectItem value="Edge">Microsoft Edge</SelectItem>
                              <SelectItem value="Safari">Safari</SelectItem>
                              <SelectItem value="Opera">Opera</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="bookmarks_data">Bookmark-Daten (JSON)</Label>
                          <Textarea
                            id="bookmarks_data"
                            value={importForm.bookmarks_data}
                            onChange={(e) => setImportForm({...importForm, bookmarks_data: e.target.value})}
                            placeholder="Fügen Sie hier die JSON-Daten Ihrer Browser-Favoriten ein..."
                            rows={8}
                            required
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" className="flex-1" disabled={isLoading}>
                            {isLoading ? "Importiere..." : "Importieren"}
                          </Button>
                          <Button type="button" variant="outline" onClick={() => setShowImport(false)}>Abbrechen</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    Export
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {["Chrome", "Firefox", "Edge", "Safari", "Opera"].map((browser) => (
                    <Button
                      key={browser}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleExport(browser)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Für {browser} exportieren
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Helper component for recursive category display
const CategoryTreeNode = ({ category, onEdit, onDelete, level = 0 }) => {
  const indent = level * 20;
  
  return (
    <div style={{ marginLeft: `${indent}px` }}>
      <Card className="mb-2">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-blue-600" />
              <span className="font-medium">{category.name}</span>
              <Badge variant="outline">Level {category.level}</Badge>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onEdit(category)}>
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onDelete(category.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {category.children?.map((child) => (
        <CategoryTreeNode
          key={child.id}
          category={child}
          onEdit={onEdit}
          onDelete={onDelete}
          level={level + 1}
        />
      ))}
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<FavOrg />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;