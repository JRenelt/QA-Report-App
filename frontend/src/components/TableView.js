import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  ExternalLink, 
  Edit, 
  Trash2,
  GripVertical
} from 'lucide-react';

const TableView = ({ bookmarks, onDeleteBookmark, onEditBookmark, onToggleStatus, onBookmarkReorder, headerButtons }) => {
  const [columnWidths, setColumnWidths] = useState(() => {
    const saved = localStorage.getItem('favorg-column-widths');
    return saved ? JSON.parse(saved) : {
      title: 300,
      url: 350,
      category: 200,
      status: 120,
      actions: 120
    };
  });

  const [isResizing, setIsResizing] = useState(false);
  const [resizingColumn, setResizingColumn] = useState(null);
  const [draggedBookmark, setDraggedBookmark] = useState(null);
  const [dragOverBookmark, setDragOverBookmark] = useState(null);
  const tableRef = useRef(null);
  const startX = useRef(0);
  const startWidth = useRef(0);

  useEffect(() => {
    localStorage.setItem('favorg-column-widths', JSON.stringify(columnWidths));
  }, [columnWidths]);

  const handleMouseDown = (e, column) => {
    setIsResizing(true);
    setResizingColumn(column);
    startX.current = e.clientX;
    startWidth.current = columnWidths[column];
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isResizing || !resizingColumn) return;
    
    const diff = e.clientX - startX.current;
    const newWidth = Math.max(80, startWidth.current + diff);
    
    setColumnWidths(prev => ({
      ...prev,
      [resizingColumn]: newWidth
    }));
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    setResizingColumn(null);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Drag & Drop Handlers für Table Bookmarks
  const handleBookmarkDragStart = (e, bookmark) => {
    setDraggedBookmark(bookmark);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', bookmark.id);
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
      if (onBookmarkReorder) {
        onBookmarkReorder(draggedBookmark, targetBookmark);
      }
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
      <div onClick={(e) => e.stopPropagation()}>
        <select 
          value={statusType || 'active'} 
          onChange={(e) => onToggleStatus(bookmark.id, e.target.value)}
          className={`status-badge ${currentStatus.className} status-select table-status-select`}
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

  if (bookmarks.length === 0) {
    return (
      <div className="empty-state">
        <h3>Keine Favoriten gefunden</h3>
        <p>Importieren Sie Ihre Browser-Favoriten oder fügen Sie neue hinzu.</p>
      </div>
    );
  }

  return (
    <div className="table-view" ref={tableRef}>
      <div className="table-container">
        <table className="bookmarks-table">
          <thead>
            <tr>
              <th style={{ width: columnWidths.title }}>
                <div className="table-header">
                  <span>Titel</span>
                  <div 
                    className="column-resizer"
                    onMouseDown={(e) => handleMouseDown(e, 'title')}
                  />
                </div>
              </th>
              <th style={{ width: columnWidths.url }}>
                <div className="table-header">
                  <span>URL</span>
                  <div 
                    className="column-resizer"
                    onMouseDown={(e) => handleMouseDown(e, 'url')}
                  />
                </div>
              </th>
              <th style={{ width: columnWidths.category }}>
                <div className="table-header">
                  <span>Kategorie</span>
                  <div 
                    className="column-resizer"
                    onMouseDown={(e) => handleMouseDown(e, 'category')}
                  />
                </div>
              </th>
              <th style={{ width: columnWidths.status }}>
                <div className="table-header">
                  <span>Status</span>
                  <div 
                    className="column-resizer"
                    onMouseDown={(e) => handleMouseDown(e, 'status')}
                  />
                </div>
              </th>
              <th style={{ width: columnWidths.actions }}>
                <div className="table-header actions-header">
                  <span>Aktionen</span>
                  {/* Header-Buttons über Aktionen-Spalte */}
                  {headerButtons && (
                    <div className="table-header-buttons">
                      {headerButtons}
                    </div>
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {bookmarks.map(bookmark => (
              <tr 
                key={bookmark.id} 
                className={`bookmark-row table-row draggable ${bookmark.is_dead_link ? 'dead-link' : 'active-link'} ${dragOverBookmark?.id === bookmark.id ? 'drag-over' : ''}`}
                draggable
                onDragStart={(e) => handleBookmarkDragStart(e, bookmark)}
                onDragOver={(e) => handleBookmarkDragOver(e, bookmark)}
                onDragLeave={handleBookmarkDragLeave}
                onDrop={(e) => handleBookmarkDrop(e, bookmark)}
                onDragEnd={handleBookmarkDragEnd}
              >
                <td style={{ width: columnWidths.title }}>
                  <div className="cell-content title-cell">
                    <GripVertical className="drag-handle table-drag" />
                    <span className="bookmark-title-table" title={bookmark.title}>
                      {bookmark.title}
                    </span>
                    <Badge variant="outline" className="source-badge">
                      Chrome
                    </Badge>
                  </div>
                </td>
                <td style={{ width: columnWidths.url }}>
                  <div className="cell-content url-cell">
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bookmark-link-table"
                      title={bookmark.url}
                    >
                      {bookmark.url}
                    </a>
                  </div>
                </td>
                <td style={{ width: columnWidths.category }}>
                  <div className="cell-content category-cell">
                    <span className="category-text">
                      {bookmark.category}
                      {bookmark.subcategory && ` → ${bookmark.subcategory}`}
                    </span>
                  </div>
                </td>
                <td style={{ width: columnWidths.status }}>
                  <div className="cell-content status-cell">
                    {getStatusBadge(bookmark)}
                  </div>
                </td>
                <td style={{ width: columnWidths.actions }}>
                  <div className="cell-content actions-cell">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(bookmark.url, '_blank')}
                      className="table-action-btn"
                      title="Öffnen"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditBookmark(bookmark)}
                      className="table-action-btn"
                      title="Bearbeiten"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteBookmark(bookmark.id)}
                      className="table-action-btn delete-action"
                      title="Löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableView;