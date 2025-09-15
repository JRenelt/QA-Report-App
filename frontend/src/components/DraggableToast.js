import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

const DraggableToast = ({ 
  message, 
  type = 'info', 
  onClose, 
  duration = 5000,
  id 
}) => {
  const [position, setPosition] = useState(() => {
    // Für neue Toasts: IMMER Monitor-zentriert (nicht LocalStorage verwenden)
    const toastWidth = 320;  // Toast-Breite
    const centerX = (window.innerWidth - toastWidth) / 2;  // Exakte Monitor-Mitte
    const centerY = 120;  // Etwas unter dem Header
    
    return { x: Math.max(20, centerX), y: centerY };  // Mindestens 20px vom Rand
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(true);
  const toastRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(`favorg-toast-position-${id || 'default'}`, JSON.stringify(position));
  }, [position, id]);

  useEffect(() => {
    if (duration > 0) {
      timeoutRef.current = setTimeout(() => {
        handleClose();
      }, duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [duration]);

  const handleMouseDown = (e) => {
    if (e.target.closest('.toast-close-btn')) return;
    
    setIsDragging(true);
    const rect = toastRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newX = Math.max(0, Math.min(window.innerWidth - 320, e.clientX - dragOffset.x));
    const newY = Math.max(0, Math.min(window.innerHeight - 80, e.clientY - dragOffset.y));
    
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleClose = (e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();  // Verhindert Event-Bubbling
      e.preventDefault();
    }
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 200);
  };

  const getToastTypeClass = () => {
    switch (type) {
      case 'success': return 'toast-success';
      case 'error': return 'toast-error';
      case 'warning': return 'toast-warning';
      default: return 'toast-info';
    }
  };

  if (!isVisible) return null;

  return (
    <div
      ref={toastRef}
      className={`draggable-toast ${getToastTypeClass()} ${isDragging ? 'dragging' : ''} ${isVisible ? 'visible' : ''}`}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 10000,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="toast-content">
        <div className="toast-message">{message}</div>
        <button
          className="toast-close-btn"
          onClick={handleClose}
          title="Schließen"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="toast-drag-indicator">
        <div className="drag-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
};

export default DraggableToast;