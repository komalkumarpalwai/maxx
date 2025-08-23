import React, { useState, useEffect } from 'react';
import api from '../services/api';
import CreateTestForm from '../components/CreateTestForm';
import ManageTestsTable from '../components/ManageTestsTable';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminPanel = () => {
  const { user } = useAuth();
  const [section, setSection] = useState('create');
  const [users, setUsers] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (section === 'users') {
      setLoading(true);
      setError('');
      Promise.all([
        api.get('/profile/users'),
        api.get('/tests/results/all')
      ])
        .then(([usersRes, resultsRes]) => {
          setUsers(usersRes.data.users || []);
          setResults(resultsRes.data.results || []);
        })
        .catch((err) => {
          setError('Failed to fetch user activity');
        })
        .finally(() => setLoading(false));
    }
  }, [section]);

  if (!user || user.role !== 'admin') {
    return <Navigate to="/admin-login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded shadow p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Panel</h1>
        <div className="flex justify-center mb-8 space-x-4">
          <button className={`px-4 py-2 rounded ${section === 'create' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} onClick={() => setSection('create')}>Create Tests</button>
          <button className={`px-4 py-2 rounded ${section === 'manage' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} onClick={() => setSection('manage')}>Manage Tests</button>
          <button className={`px-4 py-2 rounded ${section === 'users' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} onClick={() => setSection('users')}>Users & Activity</button>
        </div>
        <div>
          {section === 'create' && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Create Test</h2>
              <CreateTestForm />
            </div>
          )}
          {section === 'manage' && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Manage & Update Tests</h2>
              <ManageTestsTable />
            </div>
          )}
          {section === 'users' && (
            <div>
              <h2 className="text-xl font-semibold mb-2">User Activity</h2>
              {loading ? (
                <p>Loading...</p>
              ) : error ? (
                <p className="text-red-600">{error}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border px-2 py-1">Name</th>
                        <th className="border px-2 py-1">Email</th>
                        <th className="border px-2 py-1">Roll No</th>
                        <th className="border px-2 py-1">Branch</th>
                        <th className="border px-2 py-1">Active?</th>
                        <th className="border px-2 py-1">Tests Taken</th>
                        <th className="border px-2 py-1">Last Activity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => {
                        const userResults = results.filter(r => r.student && (r.student._id === user.id || r.student === user.id));
                        const lastActivity = userResults.length > 0 ? new Date(userResults[0].createdAt).toLocaleString() : '—';
                        return (
                          <tr key={user.id}>
                            <td className="border px-2 py-1">{user.name}</td>
                            <td className="border px-2 py-1">{user.email}</td>
                            <td className="border px-2 py-1">{user.rollNo}</td>
                            <td className="border px-2 py-1">{user.branch || '—'}</td>
                            <td className="border px-2 py-1">{user.isActive ? 'Yes' : 'No'}</td>
                            <td className="border px-2 py-1">{userResults.length}</td>
                            <td className="border px-2 py-1">{lastActivity}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
