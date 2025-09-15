import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const StatusFilter = ({ value, onChange }) => {
  const statusOptions = [
    { value: 'all', label: 'Alle Status', icon: '📊' },
    { value: 'active', label: 'Aktiv', icon: '✅' },
    { value: 'dead', label: 'Tot', icon: '❌' }, 
    { value: 'localhost', label: 'Localhost', icon: '🏠' },
    { value: 'duplicate', label: 'Duplikate', icon: '🔄' },
    { value: 'locked', label: 'Gesperrt', icon: '🔒' },
    { value: 'timeout', label: 'Timeout', icon: '⏱️' },
    { value: 'unchecked', label: 'Ungeprüft', icon: '❓' }
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

export default StatusFilter;