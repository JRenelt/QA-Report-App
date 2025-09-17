import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const EnhancedStatusFilter = ({ value, onChange, statistics = {} }) => {
  // Sicherstellen, dass statistics nie null ist
  const safeStats = statistics || {};
  
  // Status-Icon als schwarz-weiße Lucide-ähnliche Grafik (nochmal doppelt so groß = 64x64)
  const StatusIcon = () => (
    <svg width="64" height="64" viewBox="0 0 64 64" className="status-filter-icon" fill="currentColor">
      {/* Schwarz-weiße Lucide-ähnliche Darstellung - sehr groß */}
      <circle cx="16" cy="32" r="12" fill="none" stroke="currentColor" strokeWidth="3"/>
      <path d="M10 32L16 38L22 32" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      
      <circle cx="48" cy="32" r="12" fill="none" stroke="currentColor" strokeWidth="3"/>
      <path d="M42 30L46 34L54 26" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
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