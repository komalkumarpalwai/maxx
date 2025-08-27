import React from 'react';

const statusStyles = {
  Active: 'bg-green-100 text-green-800',
  Upcoming: 'bg-blue-100 text-blue-800',
  Expired: 'bg-gray-200 text-gray-700',
  Draft: 'bg-yellow-100 text-yellow-800',
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${statusStyles[status] || ''}`}>
      {status}
    </span>
  );
}

export default StatusBadge;
