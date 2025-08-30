import React, { useEffect, useState } from 'react';
import api from '../services/api';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/audit-logs?limit=50');
        setLogs(res.data.logs || []);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to fetch audit logs');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Audit Logs</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && (
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">Action</th>
              <th className="border px-4 py-2">Performed By</th>
              <th className="border px-4 py-2">Details</th>
              <th className="border px-4 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log._id}>
                <td className="border px-4 py-2">{log.action}</td>
                <td className="border px-4 py-2">{log.performedBy?.name || 'Unknown'}<br/>{log.performedBy?.email}</td>
                <td className="border px-4 py-2"><pre className="whitespace-pre-wrap text-xs">{JSON.stringify(log.details, null, 2)}</pre></td>
                <td className="border px-4 py-2">{new Date(log.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AuditLogs;
