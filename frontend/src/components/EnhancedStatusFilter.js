import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const EnhancedStatusFilter = ({ value, onChange, statistics = {} }) => {
  const statusOptions = [
    { value: 'all', label: 'Alle Status', icon: '📊', count: statistics.total_bookmarks },
    { value: 'active', label: 'Aktiv', icon: '✅', count: statistics.active_links }, 
    { value: 'dead', label: 'Tot', icon: '❌', count: statistics.dead_links },
    { value: 'localhost', label: 'Localhost', icon: '🏠', count: statistics.localhost_links },
    { value: 'duplicate', label: 'Duplikate', icon: '🔄', count: statistics.duplicate_links },
    { value: 'locked', label: 'Gesperrt', icon: '🔒', count: statistics.locked_links },
    { value: 'timeout', label: 'Timeout', icon: '⏱️', count: null },
    { value: 'unchecked', label: 'Ungeprüft', icon: '❓', count: statistics.unchecked_links }
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
                {option.count !== null && option.count > 0 && (
                  <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1 rounded">
                    {option.count}
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