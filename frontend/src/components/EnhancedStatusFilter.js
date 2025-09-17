import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const EnhancedStatusFilter = ({ value, onChange, statistics = {} }) => {
  // Sicherstellen, dass statistics nie null ist
  const safeStats = statistics || {};
  
  // Status-Icon als Inline-SVG basierend auf dem angehängten Bild
  const StatusIcon = () => (
    <svg width="16" height="16" viewBox="0 0 32 16" className="status-filter-icon">
      {/* Roter Bereich mit X */}
      <rect x="0" y="0" width="16" height="16" fill="#dc2626" rx="2"/>
      <path d="M4 4 L12 12 M12 4 L4 12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      
      {/* Grüner Bereich mit Häkchen */}
      <rect x="16" y="0" width="16" height="16" fill="#16a34a" rx="2"/>
      <path d="M20 8 L24 12 L30 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
  
  const statusOptions = [
    { value: 'all', label: 'Status', icon: <StatusIcon />, showCount: false },
    { value: 'active', label: 'Aktiv', icon: '✅', showCount: false }, 
    { value: 'dead', label: 'Tot', icon: '❌', showCount: false },
    { value: 'localhost', label: 'Localhost', icon: '🏠', showCount: false },
    { value: 'duplicate', label: 'Duplikate', icon: '🔄', showCount: false },
    { value: 'locked', label: 'Gesperrt', icon: '🔒', showCount: false },
    { value: 'timeout', label: 'Timeout', icon: '⏱️', showCount: false },
    { value: 'unchecked', label: 'Ungeprüft', icon: '❓', showCount: false }
  ];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="status-filter-select w-48">
        <SelectValue placeholder="Status wählen" />
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map(option => (
          <SelectItem key={option.value} value={option.value}>
            <span className="flex items-center gap-2">
              <span>{option.icon}</span>
              <span>{option.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default EnhancedStatusFilter;