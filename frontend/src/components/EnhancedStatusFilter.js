import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const EnhancedStatusFilter = ({ value, onChange, lockedCount = 0 }) => {
  const statusOptions = [
    { value: 'all', label: 'Alle Status', icon: '📊', count: null },
    { value: 'active', label: 'Aktiv', icon: '✅', count: null },
    { value: 'dead', label: 'Tot', icon: '❌', count: null }, 
    { value: 'localhost', label: 'Localhost', icon: '🏠', count: null },
    { value: 'duplicate', label: 'Duplikate', icon: '🔄', count: null },
    { value: 'locked', label: 'Gesperrt', icon: '🔒', count: lockedCount },
    { value: 'timeout', label: 'Timeout', icon: '⏱️', count: null },
    { value: 'unchecked', label: 'Ungeprüft', icon: '❓', count: null }
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