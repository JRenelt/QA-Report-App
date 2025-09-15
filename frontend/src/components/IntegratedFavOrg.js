import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Plus, Settings, HelpCircle, BarChart3, MousePointer } from 'lucide-react';
import { toast } from 'sonner';

// Import der neuen Komponenten
import EnhancedStatusFilter from './EnhancedStatusFilter';
import EnhancedBookmarkCard from './EnhancedBookmarkCard';
import ImprovedBookmarkDialog from './ImprovedBookmarkDialog';
import EnhancedCatchMouseGame from './EnhancedCatchMouseGame';
import ComprehensiveHelpDialog from './ComprehensiveHelpDialog';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const IntegratedFavOrg = () => {
  // States
  const [bookmarks, setBookmarks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showExtraInfo, setShowExtraInfo] = useState(false); // Extra Info Kartenansicht = 0 (versteckt)

  // Dialog States
  const [showBookmarkDialog, setShowBookmarkDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showGameDialog, setShowGameDialog] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState(null);

  // Load initial data
  useEffect(() => {
    loadBookmarks();
    loadCategories();
    loadStatistics();
  }, []);

  // Reload bookmarks when filter changes
  useEffect(() => {
    loadBookmarks();
  }, [statusFilter]);

  const loadBookmarks = async () => {
    try {
      setIsLoading(true);
      const params = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      const response = await axios.get(`${BACKEND_URL}/api/bookmarks`, { params });
      setBookmarks(response.data);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      toast.error('Fehler beim Laden der Favoriten');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Fehler beim Laden der Kategorien');
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/statistics`);
      setStatistics(response.data);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleSaveBookmark = async (bookmarkData) => {
    try {
      if (editingBookmark) {
        await axios.put(`${BACKEND_URL}/api/bookmarks/${editingBookmark.id}`, bookmarkData);
        toast.success('Favorit erfolgreich aktualisiert');
      } else {
        await axios.post(`${BACKEND_URL}/api/bookmarks`, bookmarkData);
        toast.success('Favorit erfolgreich erstellt');
      }
      
      loadBookmarks();
      loadStatistics();
      setEditingBookmark(null);
    } catch (error) {
      console.error('Error saving bookmark:', error);
      toast.error('Fehler beim Speichern des Favoriten');
      throw error;
    }
  };

  const handleEditBookmark = (bookmark) => {
    setEditingBookmark(bookmark);
    setShowBookmarkDialog(true);
  };

  const handleDeleteBookmark = async (bookmarkId) => {
    if (!window.confirm('Sind Sie sicher, dass Sie diesen Favoriten löschen möchten?')) {
      return;
    }

    try {
      await axios.delete(`${BACKEND_URL}/api/bookmarks/${bookmarkId}`);
      toast.success('Favorit erfolgreich gelöscht');
      loadBookmarks();
      loadStatistics();
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      toast.error('Fehler beim Löschen des Favoriten');
    }
  };

  const handleToggleLock = async (bookmarkId, shouldLock) => {
    try {
      await axios.put(`${BACKEND_URL}/api/bookmarks/${bookmarkId}`, {
        is_locked: shouldLock
      });
      
      toast.success(shouldLock ? 'Favorit gesperrt' : 'Favorit entsperrt');
      loadBookmarks();
      loadStatistics();
    } catch (error) {
      console.error('Error toggling lock:', error);
      toast.error('Fehler beim Ändern des Sperr-Status');
    }
  };

  const handleNewBookmark = () => {
    setEditingBookmark(null);
    setShowBookmarkDialog(true);
  };

  const getLockedCount = () => {
    return bookmarks.filter(b => b.is_locked || b.status_type === 'locked').length;
  };

  const filteredBookmarks = bookmarks.filter(bookmark => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'locked') return bookmark.is_locked || bookmark.status_type === 'locked';
    if (statusFilter === 'active') return bookmark.status_type === 'active';
    if (statusFilter === 'dead') return bookmark.status_type === 'dead' || bookmark.is_dead_link;
    if (statusFilter === 'localhost') return bookmark.status_type === 'localhost';
    if (statusFilter === 'duplicate') return bookmark.status_type === 'duplicate' || bookmark.is_duplicate;
    if (statusFilter === 'timeout') return bookmark.status_type === 'timeout';
    if (statusFilter === 'unchecked') return !bookmark.status_type || bookmark.status_type === 'unchecked';
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                FavOrg V2.3.0 
                <span className="text-lg text-gray-600 ml-2">[{filteredBookmarks.length}]</span>
              </h1>
              <p className="text-gray-600">Erweiterte Favoriten-Verwaltung mit Lock-System</p>
            </div>
            
            <div className="flex gap-2">
              <Dialog open={showGameDialog} onOpenChange={setShowGameDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MousePointer className="w-4 h-4 mr-2" />
                    Spiel
                  </Button>
                </DialogTrigger>
              </Dialog>
              
              <Button onClick={() => setShowHelpDialog(true)} variant="outline" size="sm">
                <HelpCircle className="w-4 h-4 mr-2" />
                Hilfe
              </Button>
              
              <Button onClick={loadStatistics} variant="outline" size="sm">
                <BarChart3 className="w-4 h-4 mr-2" />
                Statistiken
              </Button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-4 items-center">
            <EnhancedStatusFilter 
              value={statusFilter} 
              onChange={setStatusFilter}
              lockedCount={getLockedCount()}
            />
            
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">
                Extra Info sichtbar:
              </label>
              <button
                onClick={() => setShowExtraInfo(!showExtraInfo)}
                className={`px-2 py-1 text-xs rounded border ${
                  showExtraInfo 
                    ? 'bg-blue-100 text-blue-800 border-blue-300' 
                    : 'bg-gray-100 text-gray-600 border-gray-300'
                }`}
              >
                {showExtraInfo ? '1' : '0'}
              </button>
            </div>
          </div>

          <Button onClick={handleNewBookmark}>
            <Plus className="w-4 h-4 mr-2" />
            Neuer Favorit
          </Button>
        </div>

        {/* Statistics Banner */}
        {statistics && (
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <div className="grid grid-cols-4 md:grid-cols-8 gap-4 text-center">
              <div className="text-sm">
                <div className="text-2xl font-bold text-blue-600">📊</div>
                <div className="text-xs text-gray-500">Gesamt</div>
                <div className="font-semibold">{statistics.total_bookmarks}</div>
              </div>
              <div className="text-sm">
                <div className="text-2xl font-bold text-green-600">✅</div>
                <div className="text-xs text-gray-500">Aktiv</div>
                <div className="font-semibold">{statistics.active_links}</div>
              </div>
              <div className="text-sm">
                <div className="text-2xl font-bold text-red-600">❌</div>
                <div className="text-xs text-gray-500">Tot</div>
                <div className="font-semibold">{statistics.dead_links}</div>
              </div>
              <div className="text-sm">
                <div className="text-2xl font-bold text-yellow-600">🏠</div>
                <div className="text-xs text-gray-500">Localhost</div>
                <div className="font-semibold">{statistics.localhost_links || 0}</div>
              </div>
              <div className="text-sm">
                <div className="text-2xl font-bold text-purple-600">🔄</div>
                <div className="text-xs text-gray-500">Duplikate</div>
                <div className="font-semibold">{statistics.duplicate_links || 0}</div>
              </div>
              <div className="text-sm">
                <div className="text-2xl font-bold text-blue-800">🔒</div>
                <div className="text-xs text-gray-500">Gesperrt</div>
                <div className="font-semibold">{statistics.locked_links || 0}</div>
              </div>
              <div className="text-sm">
                <div className="text-2xl font-bold text-orange-600">⏱️</div>
                <div className="text-xs text-gray-500">Timeout</div>
                <div className="font-semibold">{statistics.timeout_links || 0}</div>
              </div>
              <div className="text-sm">
                <div className="text-2xl font-bold text-gray-600">❓</div>
                <div className="text-xs text-gray-500">Ungeprüft</div>
                <div className="font-semibold">{statistics.unchecked_links || 0}</div>
              </div>
            </div>
          </div>
        )}

        {/* Bookmarks Grid */}
        <div className="grid gap-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Lade Favoriten...</div>
            </div>
          ) : filteredBookmarks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                {statusFilter === 'all' 
                  ? 'Noch keine Favoriten vorhanden' 
                  : `Keine Favoriten mit Status "${statusFilter}" gefunden`
                }
              </div>
              <Button onClick={handleNewBookmark} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Ersten Favoriten hinzufügen
              </Button>
            </div>
          ) : (
            filteredBookmarks.map((bookmark) => (
              <EnhancedBookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onEdit={handleEditBookmark}
                onDelete={handleDeleteBookmark}
                onToggleLock={handleToggleLock}
                showExtraInfo={showExtraInfo}
              />
            ))
          )}
        </div>

        {/* Dialogs */}
        <ImprovedBookmarkDialog
          isOpen={showBookmarkDialog}
          onClose={() => {
            setShowBookmarkDialog(false);
            setEditingBookmark(null);
          }}
          bookmark={editingBookmark}
          onSave={handleSaveBookmark}
          categories={categories}
        />

        <ComprehensiveHelpDialog
          isOpen={showHelpDialog}
          onClose={() => setShowHelpDialog(false)}
        />

        <EnhancedCatchMouseGame
          isOpen={showGameDialog}
          onClose={() => setShowGameDialog(false)}
        />
      </div>
    </div>
  );
};

export default IntegratedFavOrg;