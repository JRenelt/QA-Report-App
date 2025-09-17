import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const EnhancedStatusFilter = ({ value, onChange, statistics = {} }) => {
  // Sicherstellen, dass statistics nie null ist
  const safeStats = statistics || {};
  
  // Status-Icon als schwarz-weiße Lucide-ähnliche Grafik (doppelt so groß)
  const StatusIcon = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" className="status-filter-icon" fill="currentColor">
      {/* Schwarz-weiße Lucide-ähnliche Darstellung - größer */}
      <circle cx="8" cy="16" r="6" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M5 16L8 19L11 16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      
      <circle cx="24" cy="16" r="6" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M21 15L23 17L27 13" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  
  const statusOptions = [
    { value: 'all', label: 'Status', icon: <StatusIcon />, count: safeStats.total_bookmarks || 0 },
    { value: 'active', label: 'Aktiv', icon: '✅', count: safeStats.active_links || 0 }, 
    { value: 'dead', label: 'Tot', icon: '❌', count: safeStats.dead_links || 0 },
    { value: 'localhost', label: 'Localhost', icon: '🏠', count: safeStats.localhost_links || 0 },
    { value: 'duplicate', label: 'Duplikate', icon: '🔄', count: safeStats.duplicate_links || 0 },
    { value: 'locked', label: 'Gesperrt', icon: '🔒', count: safeStats.locked_links || 0 },
    { value: 'timeout', label: 'Timeout', icon: '⏱️', count: safeStats.timeout_links || 0 },
    { value: 'unchecked', label: 'Ungeprüft', icon: '❓', count: safeStats.unchecked_links || 0 }
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
              <span>
                {option.label}
                {option.count !== null && option.count >= 0 && (
                  <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1 rounded">
                    [{option.count}]
                  </span>
                )}
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default EnhancedStatusFilter;