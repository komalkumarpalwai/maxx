
import React, { useState, useEffect, lazy, Suspense } from 'react';
import api from '../services/api';
import CreateTestForm from '../components/CreateTestForm';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import AdminExamResults from './AdminExamResults';
import UserManagement from './UserManagement';
import TestAnalytics from './TestAnalytics';
import SuperAdminPanel from './SuperAdminPanel';
const ManageTestsTable = lazy(() => import('../components/ManageTestsTable'));


const sidebarItems = [
  { key: 'create', label: 'Create Test' },
  { key: 'manage', label: 'Manage Tests' },
  { key: 'users', label: 'User Activity' },
  { key: 'userMgmt', label: 'User Management' },
  { key: 'results', label: 'Exam Results' },
  { key: 'analytics', label: 'Test Analytics' },
  { key: 'auditLogs', label: 'Audit Logs' },
];


const AdminPanel = () => {

  const { user, logout } = useAuth();
  const [section, setSection] = useState('create');
  // Audit logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');

  // Fetch audit logs when section is selected
  useEffect(() => {
    if (section === 'auditLogs') {
      setAuditLoading(true);
      setAuditError('');
      api.get('/audit-logs?limit=30')
        .then(res => setAuditLogs(res.data.logs || []))
        .catch(() => setAuditError('Failed to fetch audit logs'))
        .finally(() => setAuditLoading(false));
    }
  }, [section]);
  const [pwOld, setPwOld] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [results, setResults] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  // User details modal state
  const [selectedUser, setSelectedUser] = useState(null);

  // ...existing code...

  // Pagination logic (moved below for bulk actions)

  // Bulk selection state
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // Pagination logic (moved below for bulk actions)

  // allSelected must be after paginatedUsers is defined (keep only one definition after paginatedUsers)

  // Bulk action handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUserIds(paginatedUsers.map(u => u._id));
    } else {
      setSelectedUserIds([]);
    }
  };
  const handleSelectUser = (id) => {
    setSelectedUserIds(prev => prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]);
  };
  const handleBulkActivate = async () => {
    for (const id of selectedUserIds) {
      await api.put(`/profile/${id}/status`, { isActive: true });
    }
    setSelectedUserIds([]);
    window.location.reload();
  };
  const handleBulkDeactivate = async () => {
    for (const id of selectedUserIds) {
      await api.put(`/profile/${id}/status`, { isActive: false });
    }
    setSelectedUserIds([]);
    window.location.reload();
  };
  const handleBulkDelete = async () => {
    if (!window.confirm('Are you sure you want to delete selected users?')) return;
    for (const id of selectedUserIds) {
      await api.delete(`/profile/${id}`);
    }
    setSelectedUserIds([]);
    window.location.reload();
  };

  // Fetch users and tests on initial load and when needed
  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([
      api.get('/users'),
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
  }, []);

  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return <Navigate to="/admin-login" replace />;
  }

  // Dashboard stats
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isActive).length;
  const totalTests = results.length;
  const recentUsers = users.slice(0, 5);

  // Search/filter users
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.rollNo.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const allSelected = paginatedUsers.length > 0 && paginatedUsers.every(u => selectedUserIds.includes(u._id));



  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white shadow md:h-screen flex flex-row md:flex-col justify-between md:justify-between fixed md:static z-20 top-0 left-0 md:relative" aria-label="Admin sidebar navigation">
        <div className="w-full">
          <h1 className="text-2xl font-bold text-center py-4 border-b" aria-label="Maxx Solutions Admin Panel">Maxx Solutions</h1>
          <div className="text-center text-xs text-gray-500 mb-2">Admin Panel</div>
          <nav className="flex flex-row md:flex-col gap-1 p-2 md:p-4 overflow-x-auto md:overflow-x-visible" aria-label="Sidebar navigation" role="navigation">
            {sidebarItems.map(item => (
              <button
                key={item.key}
                className={`text-left px-4 py-2 rounded transition-all ${section === item.key ? 'bg-blue-600 text-white font-semibold' : 'hover:bg-blue-100 text-gray-700'}`}
                onClick={() => setSection(item.key)}
                aria-label={item.label}
                tabIndex={0}
              >
                {item.label}
              </button>
            ))}
            {user?.role === 'superadmin' && (
              <button
                className={`text-left px-4 py-2 rounded transition-all ${section === 'superadmin' ? 'bg-purple-700 text-white font-semibold' : 'hover:bg-purple-100 text-gray-700'}`}
                onClick={() => setSection('superadmin')}
                aria-label="Superadmin section"
                tabIndex={0}
              >
                Superadmin
              </button>
            )}
            <button
              className={`text-left px-4 py-2 rounded transition-all ${section === 'changepw' ? 'bg-green-600 text-white font-semibold' : 'hover:bg-green-100 text-gray-700'}`}
              onClick={() => setSection('changepw')}
              aria-label="Change Password"
              tabIndex={0}
            >
              Change Password
            </button>
          </nav>
        </div>
        <div className="p-4 border-t">
          <Button variant="danger" className="w-full" onClick={logout} aria-label="Logout">Logout</Button>
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-2 md:p-8 overflow-y-auto mt-20 md:mt-0" aria-label="Admin main content" role="main">
        {/* Dashboard Overview */}
        {section === 'create' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded shadow p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">{totalUsers}</div>
                <div className="text-gray-600">Total Users</div>
              </div>
              <div className="bg-white rounded shadow p-4 text-center">
                <div className="text-3xl font-bold text-green-600">{activeUsers}</div>
                <div className="text-gray-600">Active Users</div>
              </div>
              <div className="bg-white rounded shadow p-4 text-center">
                <div className="text-3xl font-bold text-purple-600">{totalTests}</div>
                <div className="text-gray-600">Total Tests</div>
              </div>
              <div className="bg-white rounded shadow p-4 text-center">
                <div className="text-3xl font-bold text-orange-600">{recentUsers.length}</div>
                <div className="text-gray-600">Recent Users</div>
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-4">Create Test</h2>
            <CreateTestForm />
          </div>
        )}
        {section === 'manage' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Manage & Update Tests</h2>
            <Suspense fallback={<div className="flex items-center justify-center py-8" role="status" aria-live="polite"><svg className="animate-spin h-8 w-8 text-blue-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg><span>Loading tests...</span></div>}>
              <ManageTestsTable />
            </Suspense>
          </div>
        )}
        {section === 'users' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">User Activity</h2>
            <input
              type="text"
              className="border rounded px-3 py-2 mb-4 w-full max-w-xs"
              placeholder="Search by name, email, or roll no"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              aria-label="Search users"
            />
            {loading ? (
              <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
                <svg className="animate-spin h-8 w-8 text-blue-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                <span>Loading users...</span>
              </div>
            ) : error ? (
              <p className="text-red-600">{error}</p>
            ) : (
              <>
                {/* Bulk Actions */}
                <div className="flex flex-wrap gap-2 mb-2" role="group" aria-label="Bulk actions">
                  <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={handleBulkActivate} disabled={selectedUserIds.length === 0} tabIndex={0} aria-label="Activate selected users">Activate</button>
                  <button className="bg-yellow-600 text-white px-3 py-1 rounded" onClick={handleBulkDeactivate} disabled={selectedUserIds.length === 0} tabIndex={0} aria-label="Deactivate selected users">Deactivate</button>
                  <button className="bg-red-600 text-white px-3 py-1 rounded" onClick={handleBulkDelete} disabled={selectedUserIds.length === 0} tabIndex={0} aria-label="Delete selected users">Delete</button>
                  <span className="text-xs text-gray-500 ml-2">{selectedUserIds.length} selected</span>
                </div>
                <div className="overflow-x-auto w-full">
                  <table className="min-w-full border text-xs md:text-sm" aria-label="User list">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border px-2 py-1">
                          <input type="checkbox" aria-label="Select all users" checked={allSelected} onChange={handleSelectAll} tabIndex={0} />
                        </th>
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
                      {paginatedUsers.map((user, idx) => {
                        const userResults = results.filter(r => r.student && (r.student._id === user._id || r.student === user._id));
                        const lastActivity = userResults.length > 0 ? new Date(userResults[0].createdAt).toLocaleString() : '—';
                        return (
                          <tr key={user._id} className="cursor-pointer hover:bg-blue-50 focus-within:bg-blue-100" tabIndex={0} aria-label={`User ${user.name}`} onKeyDown={e => {if(e.key==='Enter'){setSelectedUser(user);}}} role="row">
                            <td className="border px-2 py-1 text-center">
                              <input type="checkbox" aria-label={`Select user ${user.name}`} checked={selectedUserIds.includes(user._id)} onChange={() => handleSelectUser(user._id)} tabIndex={0} />
                            </td>
                            <td className="border px-2 py-1" tabIndex={0}>{user.name}</td>
                            <td className="border px-2 py-1" tabIndex={0}>{user.email}</td>
                            <td className="border px-2 py-1" tabIndex={0}>{user.rollNo}</td>
                            <td className="border px-2 py-1" tabIndex={0}>{user.branch || '—'}</td>
                            <td className="border px-2 py-1" tabIndex={0}>{user.isActive ? 'Yes' : 'No'}</td>
                            <td className="border px-2 py-1" tabIndex={0}>{userResults.length}</td>
                            <td className="border px-2 py-1" tabIndex={0}>{lastActivity}</td>
                          </tr>
                        );
                      })}
        {/* User Details Modal */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" role="dialog" aria-modal="true" aria-label="User Details Modal">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl"
                onClick={() => setSelectedUser(null)}
                aria-label="Close user details modal"
                tabIndex={0}
              >
                &times;
              </button>
              <h3 className="text-lg font-bold mb-4">User Details</h3>
              <div className="space-y-2">
                <div><span className="font-semibold">Name:</span> {selectedUser.name}</div>
                <div><span className="font-semibold">Email:</span> {selectedUser.email}</div>
                <div><span className="font-semibold">Roll No:</span> {selectedUser.rollNo}</div>
                <div><span className="font-semibold">Branch:</span> {selectedUser.branch || '—'}</div>
                <div><span className="font-semibold">Role:</span> {selectedUser.role}</div>
                <div><span className="font-semibold">Active:</span> {selectedUser.isActive ? 'Yes' : 'No'}</div>
                <div><span className="font-semibold">Created At:</span> {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : '—'}</div>
                <div><span className="font-semibold">Updated At:</span> {selectedUser.updatedAt ? new Date(selectedUser.updatedAt).toLocaleString() : '—'}</div>
                {/* Add more fields as needed */}
              </div>
            </div>
          </div>
        )}
                    </tbody>
                  </table>
                </div>
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <button
                      className="px-3 py-1 rounded border bg-white disabled:opacity-50"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        className={`px-3 py-1 rounded border ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-white'}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      className="px-3 py-1 rounded border bg-white disabled:opacity-50"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        {section === 'results' && (
          <div>
            <AdminExamResults />
          </div>
        )}
        {section === 'userMgmt' && (
          <div>
            <UserManagement />
          </div>
        )}
        {section === 'analytics' && (
          <div>
            <TestAnalytics />
          </div>
        )}
        {section === 'superadmin' && user?.role === 'superadmin' && (
          <div>
            <SuperAdminPanel />
          </div>
        )}
        {section === 'changepw' && (
          <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
            <h2 className="text-lg font-semibold mb-4">Change Password</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setPwMsg('');
                // Validation
                if (!pwOld || !pwNew || !pwConfirm) {
                  setPwMsg('All fields are required.');
                  return;
                }
                if (pwNew !== pwConfirm) {
                  setPwMsg('New passwords do not match.');
                  return;
                }
                if (pwNew.length < 8 ||
                  !/[A-Z]/.test(pwNew) ||
                  !/[a-z]/.test(pwNew) ||
                  !/\d/.test(pwNew) ||
                  !/[!@#$%^&*(),.?":{}|<>]/.test(pwNew)
                ) {
                  setPwMsg('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
                  return;
                }
                setPwLoading(true);
                try {
                  const res = await api.post('/users/change-password', {
                    oldPassword: pwOld,
                    newPassword: pwNew
                  });
                  setPwMsg(res.data.message || 'Password changed successfully.');
                  setPwOld(''); setPwNew(''); setPwConfirm('');
                } catch (err) {
                  setPwMsg(err.response?.data?.message || 'Failed to change password.');
                } finally {
                  setPwLoading(false);
                }
              }}
            >
              <div className="mb-3">
                <label className="block mb-1 font-medium">Old Password</label>
                <input type="password" className="w-full border rounded px-3 py-2" value={pwOld} onChange={e => setPwOld(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label className="block mb-1 font-medium">New Password</label>
                <input type="password" className="w-full border rounded px-3 py-2" value={pwNew} onChange={e => setPwNew(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label className="block mb-1 font-medium">Confirm New Password</label>
                <input type="password" className="w-full border rounded px-3 py-2" value={pwConfirm} onChange={e => setPwConfirm(e.target.value)} required />
              </div>
              {pwMsg && <div className={`mb-2 text-sm ${pwMsg.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{pwMsg}</div>}
              <button type="submit" className="w-full bg-green-600 text-white py-2 rounded" disabled={pwLoading}>{pwLoading ? 'Changing...' : 'Change Password'}</button>
            </form>
          </div>
        )}
        {section === 'auditLogs' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Audit Logs</h2>
            {auditLoading ? (
              <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
                <svg className="animate-spin h-8 w-8 text-blue-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                <span>Loading audit logs...</span>
              </div>
            ) : auditError ? (
              <div className="bg-yellow-100 text-yellow-800 p-4 rounded mb-4">
                <p className="font-semibold">Audit log feature will be released for Admin and Faculty soon.</p>
                <p className="text-xs">(Technical: {auditError})</p>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="text-gray-500 text-center py-8">No audit logs found.</div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="min-w-full border text-xs md:text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-2 py-1">Action</th>
                      <th className="border px-2 py-1">Performed By</th>
                      <th className="border px-2 py-1">Role</th>
                      <th className="border px-2 py-1">Details</th>
                      <th className="border px-2 py-1">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map(log => (
                      <tr key={log._id}>
                        <td className="border px-2 py-1">{log.action}</td>
                        <td className="border px-2 py-1">{log.performedBy ? `${log.performedBy.name} (${log.performedBy.email})` : '—'}</td>
                        <td className="border px-2 py-1">{log.performedBy ? log.performedBy.role : '—'}</td>
                        <td className="border px-2 py-1 text-xs">{log.details ? JSON.stringify(log.details) : '—'}</td>
                        <td className="border px-2 py-1">{new Date(log.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
