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
      const res = await api.get('/tests/feedback');
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

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Student Feedback</h2>
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
