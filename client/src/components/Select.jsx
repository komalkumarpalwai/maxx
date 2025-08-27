import React from 'react';

const Select = ({ 
  label, 
  options = [], 
  error, 
  className = '', 
  ...props 
}) => {
  const selectClasses = `input-field ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`;
  
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-secondary-700">
          {label}
        </label>
      )}
      <select 
        className={selectClasses}
        {...props}
      >
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Select;





