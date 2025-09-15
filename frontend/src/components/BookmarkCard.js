import React from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { ExternalLink, Edit2, Trash2, Lock, Unlock, Info } from 'lucide-react';

const BookmarkCard = ({ 
  bookmark, 
  onEdit, 
  onDelete, 
  onToggleLock, 
  onShowDescription,
  showDescription = false 
}) => {
  const getStatusBadge = (bookmark) => {
    const badges = [];
    
    if (bookmark.status_type === 'duplicate' || bookmark.is_duplicate) {
      badges.push(<Badge key="dup" variant="destructive" className="mr-1">🔄 Duplikat</Badge>);
    }
    if (bookmark.status_type === 'dead' || bookmark.is_dead_link) {
      badges.push(<Badge key="dead" variant="destructive" className="mr-1">❌ Tot</Badge>);
    }
    if (bookmark.status_type === 'localhost') {
      badges.push(<Badge key="local" variant="secondary" className="mr-1">🏠 Localhost</Badge>);
    }
    if (bookmark.status_type === 'locked' || bookmark.is_locked) {
      badges.push(<Badge key="locked" variant="outline" className="mr-1">🔒 Gesperrt</Badge>);
    }
    if (bookmark.status_type === 'timeout') {
      badges.push(<Badge key="timeout" variant="secondary" className="mr-1">⏱️ Timeout</Badge>);
    }
    if (!bookmark.status_type || bookmark.status_type === 'unchecked') {
      badges.push(<Badge key="unchecked" variant="outline" className="mr-1">❓ Ungeprüft</Badge>);
    }
    if (bookmark.status_type === 'active') {
      badges.push(<Badge key="active" variant="default" className="mr-1">✅ Aktiv</Badge>);
    }
    
    return badges;
  };

  const isLocked = bookmark.status_type === 'locked' || bookmark.is_locked;
  const isProtected = bookmark.is_protected;

  return (
    <Card className="bookmark-card hover:shadow-md transition-shadow">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <ExternalLink className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <h3 className="font-medium text-gray-900 truncate">{bookmark.title}</h3>
              {getStatusBadge(bookmark)}
            </div>
            
            <a 
              href={bookmark.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline block truncate mb-2"
            >
              {bookmark.url}
            </a>
            
            {bookmark.description && showDescription && (
              <div className="bg-gray-50 p-2 rounded text-sm text-gray-700 mb-2">
                {bookmark.description}
              </div>
            )}
            
            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
              <span>Kategorie: {bookmark.category || 'Nicht zugeordnet'}</span>
              {bookmark.subcategory && (
                <span>→ {bookmark.subcategory}</span>
              )}
              {bookmark.tags && bookmark.tags.length > 0 && (
                <span>Tags: {bookmark.tags.join(", ")}</span>
              )}
              {bookmark.browser_source && (
                <span>Quelle: {bookmark.browser_source}</span>
              )}
            </div>
          </div>
          
          <div className="flex gap-1 ml-4 flex-shrink-0">
            {bookmark.description && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onShowDescription && onShowDescription(bookmark.id)}
                className="h-8 w-8 p-0"
                title="Beschreibung anzeigen"
              >
                <Info className="w-4 h-4" />
              </Button>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onToggleLock && onToggleLock(bookmark.id, !isLocked)}
              className="h-8 w-8 p-0"
              title={isLocked ? "Entsperren" : "Sperren"}
            >
              {isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit && onEdit(bookmark)}
              disabled={isLocked || isProtected}
              className="h-8 w-8 p-0"
              title="Bearbeiten"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete && onDelete(bookmark.id)}
              disabled={isLocked || isProtected}
              className="h-8 w-8 p-0"
              title="Löschen"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookmarkCard;