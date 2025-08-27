import React from 'react';

function SearchFilterBar({ search, onSearch, categoryOptions, filterCategory, onFilterCategory, filterStatus, onFilterStatus, filterDate, onFilterDate }) {
  return (
    <div className="flex flex-wrap gap-2 mb-3 items-center">
      <input
        className="input border-gray-300 text-sm"
        style={{ minWidth: 180 }}
        placeholder="Search by title..."
        value={search}
        onChange={e => onSearch(e.target.value)}
        aria-label="Search by title"
      />
      <select className="input border-gray-300 text-sm" value={filterCategory} onChange={e => onFilterCategory(e.target.value)} aria-label="Filter by category">
        <option value="">All Categories</option>
        {categoryOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}
      </select>
      <select className="input border-gray-300 text-sm" value={filterStatus} onChange={e => onFilterStatus(e.target.value)} aria-label="Filter by status">
        <option value="">All Status</option>
        <option value="Active">Active</option>
        <option value="Upcoming">Upcoming</option>
        <option value="Expired">Expired</option>
        <option value="Draft">Draft</option>
      </select>
      <input
        className="input border-gray-300 text-sm"
        type="date"
        value={filterDate}
        onChange={e => onFilterDate(e.target.value)}
        aria-label="Filter by date"
      />
    </div>
  );
}

export default SearchFilterBar;
