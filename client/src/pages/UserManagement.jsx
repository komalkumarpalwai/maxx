import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

const roles = [
  { value: 'student', label: 'Student' },
  { value: 'faculty', label: 'Faculty' },
  { value: 'admin', label: 'Admin' },
  { value: 'superadmin', label: 'Super Admin' }
];

const UserForm = ({ open, onClose, onSave, user }) => {
  const { user: currentUser } = useAuth();
  const [form, setForm] = useState(user || { name: '', email: '', rollNo: '', branch: '', isActive: true, role: 'student', password: '' });
  const [errors, setErrors] = useState({});
  useEffect(() => { setForm(user || { name: '', email: '', rollNo: '', branch: '', isActive: true, role: 'student', password: '' }); setErrors({}); }, [user]);
  if (!open) return null;

  const validate = () => {
    const newErrors = {};
    if (!form.name || form.name.length < 2) newErrors.name = 'Name is required (min 2 chars)';
    if (!form.email) newErrors.email = 'Email is required';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) newErrors.email = 'Invalid email';
    if (!form.rollNo) newErrors.rollNo = 'Roll number is required';
    else if (!/^[a-zA-Z0-9]+$/.test(form.rollNo)) newErrors.rollNo = 'Roll number must be alphanumeric';
    if (!form.branch) newErrors.branch = 'Branch is required';
    // Only require password for new user (not edit)
    if (!user && !form.password) newErrors.password = 'Password is required';
    if (!user && form.password && (
      form.password.length < 8 ||
      !/[A-Z]/.test(form.password) ||
      !/[a-z]/.test(form.password) ||
      !/\d/.test(form.password) ||
      !/[!@#$%^&*(),.?":{}|<>]/.test(form.password)
    )) {
      newErrors.password = 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    // Only send password if creating new user
    const submitForm = { ...form };
    if (user) delete submitForm.password;
    onSave(submitForm);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{user ? 'Edit User' : 'Add User'}</h2>
        <div className="space-y-3">
          <input className="border rounded px-3 py-2 w-full" placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          {errors.name && <div className="text-red-600 text-xs">{errors.name}</div>}
          <input className="border rounded px-3 py-2 w-full" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          {errors.email && <div className="text-red-600 text-xs">{errors.email}</div>}
          <input className="border rounded px-3 py-2 w-full" placeholder="Roll No" value={form.rollNo} onChange={e => setForm(f => ({ ...f, rollNo: e.target.value }))} />
          {errors.rollNo && <div className="text-red-600 text-xs">{errors.rollNo}</div>}
          <select
            className="border rounded px-3 py-2 w-full"
            value={form.branch}
            onChange={e => setForm(f => ({ ...f, branch: e.target.value }))}
          >
            <option value="">Select Branch</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Electrical">Electrical</option>
            <option value="Mechanical">Mechanical</option>
            <option value="Civil">Civil</option>
            <option value="Electronics">Electronics</option>
          </select>
          {errors.branch && <div className="text-red-600 text-xs">{errors.branch}</div>}
          {!user && (
            <>
              <input className="border rounded px-3 py-2 w-full" type="password" placeholder="Password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              {errors.password && <div className="text-red-600 text-xs">{errors.password}</div>}
            </>
          )}
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} /> Active</label>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>{user ? 'Save' : 'Add'}</Button>
        </div>
      </div>
    </div>
  );
};

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/users');
      setUsers(res.data.users || []);
    } catch (e) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const canEditOrDelete = (targetUser) => {
    if (!currentUser) return false;
    if (currentUser.role === 'superadmin') return true;
    // Admin cannot edit/delete other admins or superadmins
    if (targetUser.role === 'admin' || targetUser.role === 'superadmin') return false;
    return true;
  };

  const handleDeactivate = async (id, isActive, role) => {
    if (!canEditOrDelete({ role })) return;
    if (!window.confirm(`Are you sure you want to ${isActive ? 'deactivate' : 'activate'} this user?`)) return;
    setLoading(true);
    try {
      await api.put(`/profile/${id}/status`, { isActive: !isActive, role });
      fetchUsers();
    } catch {
      setError('Failed to update user status');
      setLoading(false);
    }
  };

  // Reset password modal state
  const [resetUserId, setResetUserId] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetPwError, setResetPwError] = useState('');
  const [resetPwSuccess, setResetPwSuccess] = useState('');
  const [resetPwLoading, setResetPwLoading] = useState(false);

  const validatePassword = (pw) => {
    if (pw.length < 8) return 'At least 8 characters';
    if (!/[A-Z]/.test(pw)) return 'At least one uppercase letter';
    if (!/[a-z]/.test(pw)) return 'At least one lowercase letter';
    if (!/\d/.test(pw)) return 'At least one number';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pw)) return 'At least one special character';
    return '';
  };

  const handleResetPassword = (id, role) => {
    if (!canEditOrDelete({ role })) return;
    setResetUserId(id);
    setResetPassword('');
    setResetPwError('');
    setResetPwSuccess('');
  };

  const submitResetPassword = async () => {
    setResetPwError('');
    setResetPwSuccess('');
    const error = validatePassword(resetPassword);
    if (error) {
      setResetPwError(error);
      return;
    }
    setResetPwLoading(true);
    try {
      await api.put(`/profile/${resetUserId}/reset-password`, { password: resetPassword });
      setResetPwSuccess('Password reset successfully!');
      setTimeout(() => setResetUserId(null), 1200);
    } catch {
      setResetPwError('Failed to reset password');
    } finally {
      setResetPwLoading(false);
    }
  };

  const handleSaveUser = async (form) => {
    setLoading(true);
    try {
      if (editUser) {
        await api.put(`/profile/${editUser._id}`, form);
      } else {
        await api.post('/profile/users', form);
      }
      setShowForm(false);
      setEditUser(null);
      fetchUsers();
    } catch {
      setError('Failed to save user');
      setLoading(false);
    }
  };

  const filtered = users.filter(u =>
    (u.name && u.name.toLowerCase().includes(search.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
    (u.rollNo && u.rollNo.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <input
          type="text"
          className="border rounded px-3 py-2"
          placeholder="Search by name, email, or roll no"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {currentUser?.role === 'superadmin' && (
          <Button onClick={() => { setEditUser(null); setShowForm(true); }}>Add User</Button>
        )}
      </div>
      {loading ? <p>Loading...</p> : error ? <p className="text-red-600">{error}</p> : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1">Name</th>
                <th className="border px-2 py-1">Email</th>
                <th className="border px-2 py-1">Roll No</th>
                <th className="border px-2 py-1">Branch</th>
                <th className="border px-2 py-1">Role</th>
                <th className="border px-2 py-1">Active?</th>
                <th className="border px-2 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user._id}>
                  <td className="border px-2 py-1">{user.name}</td>
                  <td className="border px-2 py-1">{user.email}</td>
                  <td className="border px-2 py-1">{user.rollNo}</td>
                  <td className="border px-2 py-1">{user.branch || '—'}</td>
                  <td className="border px-2 py-1">{user.role}</td>
                  <td className="border px-2 py-1">{user.isActive ? 'Yes' : 'No'}</td>
                  <td className="border px-2 py-1">
                    {canEditOrDelete(user) && (
                      <div className="relative inline-block text-left">
                        <select
                          className="border rounded px-2 py-1 bg-white text-sm"
                          onChange={e => {
                            const action = e.target.value;
                            if (action === 'edit') { setEditUser(user); setShowForm(true); }
                            if (action === 'activate') handleDeactivate(user._id, user.isActive, user.role);
                            if (action === 'deactivate') handleDeactivate(user._id, user.isActive, user.role);
                            if (action === 'resetpw') handleResetPassword(user._id, user.role);
                            e.target.selectedIndex = 0;
                          }}
                          defaultValue=""
                        >
                          <option value="" disabled>Actions</option>
                          <option value="edit">Edit</option>
                          <option value={user.isActive ? 'deactivate' : 'activate'}>{user.isActive ? 'Deactivate' : 'Activate'}</option>
                          <option value="resetpw">Reset Password</option>
                        </select>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-4">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetUserId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl" onClick={() => setResetUserId(null)}>&times;</button>
            <h3 className="text-lg font-bold mb-4">Reset Password</h3>
            <input
              type="password"
              className="border rounded px-3 py-2 w-full mb-2"
              placeholder="Enter new password"
              value={resetPassword}
              onChange={e => { setResetPassword(e.target.value); setResetPwError(''); setResetPwSuccess(''); }}
              autoFocus
            />
            <ul className="text-xs text-gray-600 mb-2 pl-4 list-disc">
              <li className={resetPassword.length >= 8 ? 'text-green-600' : ''}>At least 8 characters</li>
              <li className={/[A-Z]/.test(resetPassword) ? 'text-green-600' : ''}>At least one uppercase letter</li>
              <li className={/[a-z]/.test(resetPassword) ? 'text-green-600' : ''}>At least one lowercase letter</li>
              <li className={/\d/.test(resetPassword) ? 'text-green-600' : ''}>At least one number</li>
              <li className={/[!@#$%^&*(),.?":{}|<>]/.test(resetPassword) ? 'text-green-600' : ''}>At least one special character</li>
            </ul>
            {resetPwError && <div className="text-red-600 text-xs mb-2">{resetPwError}</div>}
            {resetPwSuccess && <div className="text-green-600 text-xs mb-2">{resetPwSuccess}</div>}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setResetUserId(null)}>Cancel</Button>
              <Button onClick={submitResetPassword} disabled={resetPwLoading}>{resetPwLoading ? 'Resetting...' : 'Reset Password'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Notice */}
      <div className="mt-12 flex flex-col items-center">
        <hr className="w-full max-w-2xl border-t border-gray-300 mb-4" />
        <blockquote className="italic text-center text-gray-600 max-w-2xl mb-2 px-2">
          "Admins must act professionally and are responsible for any data errors. All admin actions are recorded in backend audit logs."
        </blockquote>
        <div className="text-xs text-gray-400 text-center">&copy; {new Date().getFullYear()} Maxx Solutions. All rights reserved.</div>
      </div>

      <UserForm open={showForm} onClose={() => { setShowForm(false); setEditUser(null); }} onSave={handleSaveUser} user={editUser} />
    </div>
  );
};

export default UserManagement;