import React, { useEffect, useState } from 'react';
import api from '../services/api';

const AdminFeedbackTable = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/feedback');
      if (res.data.success) {
        setFeedbacks(res.data.feedbacks);
      } else {
        setError('Failed to fetch feedback.');
      }
    } catch {
      setError('Failed to fetch feedback.');
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    if (!feedbacks || feedbacks.length === 0) return;
    const headers = ['Name', 'Email', 'Message', 'Date'];
    const rows = feedbacks.map(fb => [
      fb.name || '',
      fb.email || '',
      (fb.message || '').replace(/\r?\n/g, ' '),
      fb.createdAt ? new Date(fb.createdAt).toLocaleString() : ''
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'feedback.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Student Feedback</h2>
        <div className="flex items-center gap-2">
          <button onClick={fetchFeedbacks} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded">Refresh</button>
          <button onClick={exportCsv} className="px-3 py-1.5 text-sm bg-gray-100 border rounded" disabled={feedbacks.length === 0}>Export CSV</button>
        </div>
      </div>
      {loading ? (
        <div>Loading feedback...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : feedbacks.length === 0 ? (
        <div className="text-gray-500">No feedback submitted yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1">Name</th>
                <th className="border px-2 py-1">Email</th>
                <th className="border px-2 py-1">Message</th>
                <th className="border px-2 py-1">Date</th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.map(fb => (
                <tr key={fb._id}>
                  <td className="border px-2 py-1">{fb.name}</td>
                  <td className="border px-2 py-1">{fb.email}</td>
                  <td className="border px-2 py-1">{fb.message}</td>
                  <td className="border px-2 py-1">{new Date(fb.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminFeedbackTable;
