import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Button from '../components/Button';

const roles = [
  { value: 'admin', label: 'Admin' },
  { value: 'faculty', label: 'Faculty' }
];


const branchOptions = [
  { value: '', label: 'Select Branch' },
  { value: 'Computer Science', label: 'Computer Science' },
  { value: 'Electrical', label: 'Electrical' },
  { value: 'Mechanical', label: 'Mechanical' },
  { value: 'Civil', label: 'Civil' },
  { value: 'Electronics', label: 'Electronics' }
];

const SuperAdminPanel = () => {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', rollNo: '', branch: '', role: 'admin', isActive: true, password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/users/admins');
      setAdmins(res.data.admins || []);
    } catch {
      setError('Failed to fetch admins');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (editId) {
        // Only allow editing non-password fields for now
        await api.put(`/profile/${editId}`, { ...form, password: undefined });
        setSuccess('Admin updated successfully!');
      } else {
        // Require password for new admin/faculty
        if (!form.password || form.password.length < 8) {
          setError('Password is required and must be at least 8 characters.');
          setLoading(false);
          return;
        }
        await api.post('/profile/users', form);
        setSuccess('Admin/Faculty created successfully!');
      }
      setForm({ name: '', email: '', rollNo: '', branch: '', role: 'admin', isActive: true, password: '' });
      setEditId(null);
      fetchAdmins();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save admin');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (admin) => {
    setForm({
      name: admin.name,
      email: admin.email,
      rollNo: admin.rollNo,
      branch: admin.branch,
      role: admin.role,
      isActive: admin.isActive,
      password: ''
    });
    setEditId(admin._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.delete(`/users/admin/${id}`);
      setSuccess('Admin deleted successfully!');
      fetchAdmins();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete admin');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'superadmin') {
    return <div className="p-8 text-center text-red-600">Access denied. Superadmin only.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Superadmin: Admin Management</h1>
      <form className="bg-white rounded shadow p-6 mb-8" onSubmit={handleCreateOrUpdate}>
        <h2 className="text-lg font-semibold mb-4">Create New Admin/Faculty</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className="border rounded px-3 py-2" placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <input className="border rounded px-3 py-2" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          <input className="border rounded px-3 py-2" placeholder="Roll No" value={form.rollNo} onChange={e => setForm(f => ({ ...f, rollNo: e.target.value }))} required />
          <select className="border rounded px-3 py-2" value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))} required>
            {branchOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select className="border rounded px-3 py-2" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
            {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} /> Active</label>
          {!editId && (
            <input className="border rounded px-3 py-2" type="password" placeholder="Password (min 8 chars)" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          )}
        </div>
        <div className="flex justify-end mt-6">
          {editId && (
            <Button type="button" variant="outline" className="mr-2" onClick={() => { setEditId(null); setForm({ name: '', email: '', rollNo: '', branch: '', role: 'admin', isActive: true, password: '' }); }}>Cancel</Button>
          )}
          <Button type="submit" disabled={loading}>{loading ? (editId ? 'Updating...' : 'Creating...') : (editId ? 'Update Admin' : 'Create Admin')}</Button>
        </div>
        {error && <p className="text-red-600 mt-2">{error}</p>}
        {success && <p className="text-green-600 mt-2">{success}</p>}
      </form>
      <div className="bg-white rounded shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Current Admins/Faculty</h2>
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">Name</th>
              <th className="border px-2 py-1">Email</th>
              <th className="border px-2 py-1">Role</th>
              <th className="border px-2 py-1">Active?</th>
              <th className="border px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map(a => (
              <tr key={a._id}>
                <td className="border px-2 py-1">{a.name}</td>
                <td className="border px-2 py-1">{a.email}</td>
                <td className="border px-2 py-1">{a.role}</td>
                <td className="border px-2 py-1">{a.isActive ? 'Yes' : 'No'}</td>
                <td className="border px-2 py-1 space-x-2">
                  <Button size="sm" variant="secondary" onClick={() => handleEdit(a)}>Edit</Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(a._id)}>Delete</Button>
                </td>
              </tr>
            ))}
            {admins.length === 0 && <tr><td colSpan={4} className="text-center py-4">No admins found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SuperAdminPanel;
