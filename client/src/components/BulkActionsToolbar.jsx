import React from 'react';

function BulkActionsToolbar({ selectedCount, onActivate, onDeactivate, onDelete }) {
  return (
    <div className="flex flex-wrap gap-2 mb-2 items-center">
      <button className="px-3 py-1 bg-green-600 text-white rounded text-xs" disabled={selectedCount === 0} onClick={onActivate}>Bulk Activate</button>
      <button className="px-3 py-1 bg-red-600 text-white rounded text-xs" disabled={selectedCount === 0} onClick={onDeactivate}>Bulk Deactivate</button>
      <button className="px-3 py-1 bg-gray-800 text-white rounded text-xs" disabled={selectedCount === 0} onClick={onDelete}>Bulk Delete</button>
      <span className="text-xs text-gray-500">{selectedCount} selected</span>
    </div>
  );
}

export default BulkActionsToolbar;
