import React from 'react';

function DeleteConfirmationModal({ open, testName, input, error, loading, onInput, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
        <h3 className="font-semibold mb-2 text-red-700">Confirm Delete</h3>
        <p className="mb-2">To delete <b>{testName}</b>, type the test name below to confirm. This action cannot be undone.</p>
        <input
          className="input w-full border-gray-300 mb-2"
          placeholder="Type test name to confirm"
          value={input}
          onChange={e => onInput(e.target.value)}
          aria-label="Type test name to confirm deletion"
          autoFocus
        />
        {error && <div className="text-red-600 text-xs mb-2">{error}</div>}
        <div className="flex gap-2 mt-2 justify-end">
          <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={onConfirm} disabled={loading}>Delete</button>
          <button className="px-4 py-2 bg-gray-400 text-white rounded" onClick={onCancel} disabled={loading}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmationModal;
