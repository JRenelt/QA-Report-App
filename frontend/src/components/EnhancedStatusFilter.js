import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Filter, FilterX } from 'lucide-react';

const EnhancedStatusFilter = ({ value, onChange, statistics = {} }) => {
  // Sicherstellen, dass statistics nie null ist
  const safeStats = statistics || {};
  
  const statusOptions = [
    // "Alle" Option als erste Option (MIT Anzahl) - verwendet funnel-x für Filter-Auflösung
    { value: 'all', label: 'Alle', icon: <FilterX className="w-4 h-4" />, count: safeStats.total_bookmarks || 0 },
    // Die 7 verschiedenen Status-Optionen mit [Anzahl]
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
      <SelectTrigger className="status-filter-select" style={{ width: 'auto', minWidth: '120px' }}>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <SelectValue placeholder="Filter" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map(option => (
          <SelectItem key={option.value} value={option.value}>
            <span className="flex items-center gap-2">
              <span>{option.icon}</span>
              <span>
                {option.label}
                <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1 rounded">
                  [{option.count}]
                </span>
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default EnhancedStatusFilter;