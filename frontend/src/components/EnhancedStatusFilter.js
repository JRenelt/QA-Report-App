import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const EnhancedStatusFilter = ({ value, onChange, statistics = {} }) => {
  // Sicherstellen, dass statistics nie null ist
  const safeStats = statistics || {};
  
  // Status-Icon als schwarz-weiße Lucide-ähnliche Grafik
  const StatusIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" className="status-filter-icon" fill="currentColor">
      {/* Schwarz-weiße Lucide-ähnliche Darstellung */}
      <circle cx="4" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M2.5 8L4 9.5L5.5 8" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      
      <circle cx="12" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10.5 7.5L11.5 8.5L13.5 6.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
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