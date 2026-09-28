import React, { useState, useEffect } from 'react';
import {
  fetchUsers,
  createUser,
  updateUser,
  updateUserPassword,
  toggleUserStatus,
  deleteUser
} from './apiClient';

export default function UsersDashboard({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Add User Form State
  const [addForm, setAddForm] = useState({
    email: '',
    fullName: '',
    password: '',
    role: 'User'
  });
  const [isAdding, setIsAdding] = useState(false);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    email: '',
    fullName: '',
    role: 'User',
    status: 'Active'
  });

  // Password Modal State
  const [passwordModalUser, setPasswordModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const loadAllUsers = async () => {
    setIsLoading(true);
    try {
      const data = await fetchUsers();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setErrorMsg('Could not load user accounts from backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllUsers();
  }, []);

  const handleAddSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!addForm.email.trim() || !addForm.fullName.trim() || !addForm.password.trim()) {
      alert('Please fill Email, Full name, and Initial password.');
      return;
    }

    setIsAdding(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const newUser = await createUser({
        email: addForm.email.trim(),
        fullName: addForm.fullName.trim(),
        password: addForm.password.trim(),
        role: addForm.role,
        channel: ''
      });

      setUsers((prev) => [...prev, newUser]);
      setAddForm({
        email: '',
        fullName: '',
        password: '',
        role: 'User'
      });
      setSuccessMsg(`User ${newUser.email} added successfully!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to add user.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleOpenEdit = (u) => {
    setEditingUser(u);
    setEditForm({
      email: u.email,
      fullName: u.fullName,
      role: u.role || 'User',
      status: u.status || 'Active'
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    try {
      const updated = await updateUser(editingUser.id, editForm);
      setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? updated : u)));
      setEditingUser(null);
      setSuccessMsg(`User ${updated.email} updated successfully!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to update user.');
    }
  };

  const handleOpenPassword = (u) => {
    setPasswordModalUser(u);
    setNewPassword('');
  };

  const handleSavePassword = async () => {
    if (!passwordModalUser || !newPassword.trim()) {
      alert('Please enter a new password.');
      return;
    }
    try {
      await updateUserPassword(passwordModalUser.id, newPassword.trim());
      alert(`Password updated successfully for ${passwordModalUser.email}`);
      setPasswordModalUser(null);
      setNewPassword('');
    } catch (err) {
      alert(err.message || 'Failed to update password.');
    }
  };

  const handleToggleStatus = async (u) => {
    const nextStatus = u.status === 'Active' ? 'Disabled' : 'Active';
    const confirmMsg = `Are you sure you want to change status of ${u.email} to ${nextStatus}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const updated = await toggleUserStatus(u.id, nextStatus);
      setUsers((prev) => prev.map((item) => (item.id === u.id ? updated : item)));
      setSuccessMsg(`Status updated to ${nextStatus} for ${u.email}`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err.message || 'Failed to change status.');
    }
  };

  const handleDelete = async (u) => {
    if (u.email === currentUser?.email) {
      alert('You cannot delete your own logged-in admin account.');
      return;
    }
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete user "${u.fullName || u.email}"?`
    );
    if (!confirmDelete) return;

    try {
      await deleteUser(u.id);
      setUsers((prev) => prev.filter((item) => item.id !== u.id));
      setSuccessMsg(`User ${u.email} deleted successfully.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err.message || 'Failed to delete user.');
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Title & Subtitle */}
      <div style={{ marginBottom: '18px' }}>
        <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: 'bold', color: '#0f172a' }}>
          Users
        </h2>
        <div style={{ fontSize: '13px', color: '#64748b' }}>
          Plant-floor accounts &amp; roles
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px', fontWeight: 'bold' }}>
          ✓ {successMsg}
        </div>
      )}

      {/* ADD USER CARD (Matching Image 2) */}
      <div
        style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '22px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', letterSpacing: '0.6px', marginBottom: '10px' }}>
          ADD USER
        </div>
        <form
          onSubmit={handleAddSubmit}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center'
          }}
        >
          <input
            type="email"
            placeholder="Email"
            value={addForm.email}
            onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
            required
            style={{
              flex: '1.2',
              minWidth: '180px',
              padding: '8px 12px',
              fontSize: '13px',
              border: '1px solid #cbd5e1',
              borderRadius: '5px',
              backgroundColor: '#ffffff',
              outline: 'none'
            }}
          />

          <input
            type="text"
            placeholder="Full name"
            value={addForm.fullName}
            onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })}
            required
            style={{
              flex: '1.2',
              minWidth: '180px',
              padding: '8px 12px',
              fontSize: '13px',
              border: '1px solid #cbd5e1',
              borderRadius: '5px',
              backgroundColor: '#ffffff',
              outline: 'none'
            }}
          />

          <input
            type="password"
            placeholder="Initial password"
            value={addForm.password}
            onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
            required
            style={{
              flex: '1',
              minWidth: '150px',
              padding: '8px 12px',
              fontSize: '13px',
              border: '1px solid #cbd5e1',
              borderRadius: '5px',
              backgroundColor: '#ffffff',
              outline: 'none'
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Operator:</span>
            <select
              value={addForm.role}
              onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
              style={{
                minWidth: '120px',
                padding: '8px 12px',
                fontSize: '13px',
                border: '1px solid #cbd5e1',
                borderRadius: '5px',
                backgroundColor: '#ffffff',
                outline: 'none',
                fontWeight: '500'
              }}
            >
              <option value="User">User</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
            <button
              type="submit"
              disabled={isAdding}
              style={{
                backgroundColor: '#005a9c',
                color: '#ffffff',
                border: 'none',
                padding: '8px 22px',
                borderRadius: '5px',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: isAdding ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              {isAdding ? 'Adding...' : '+ Add User'}
            </button>
          </div>
        </form>
      </div>

      {/* USERS TABLE (Matching Image 2) */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', color: '#475569', borderBottom: '1px solid #e2e8f0', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <th style={{ padding: '12px 16px' }}>Email</th>
              <th style={{ padding: '12px 16px' }}>Name</th>
              <th style={{ padding: '12px 16px' }}>Role</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                  No user accounts found. Add a user above.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', color: '#0f172a' }}>
                    {u.email}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#002b49' }}>
                    {u.fullName}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontWeight: 'bold',
                        backgroundColor: u.role === 'Admin' ? '#eff6ff' : '#f1f5f9',
                        color: u.role === 'Admin' ? '#1d4ed8' : '#475569',
                        border: u.role === 'Admin' ? '1px solid #bfdbfe' : '1px solid #cbd5e1'
                      }}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontWeight: 'bold',
                        backgroundColor: u.status === 'Active' ? '#dcfce7' : '#fee2e2',
                        color: u.status === 'Active' ? '#15803d' : '#b91c1c'
                      }}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(u)}
                        style={{
                          backgroundColor: '#f8fafc',
                          color: '#334155',
                          border: '1px solid #cbd5e1',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11.5px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                        title="Edit User"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenPassword(u)}
                        style={{
                          backgroundColor: '#f8fafc',
                          color: '#334155',
                          border: '1px solid #cbd5e1',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11.5px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                        title="Change Password"
                      >
                        Password
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(u)}
                        style={{
                          backgroundColor: u.status === 'Active' ? '#fef3c7' : '#dcfce7',
                          color: u.status === 'Active' ? '#b45309' : '#15803d',
                          border: u.status === 'Active' ? '1px solid #fde68a' : '1px solid #bbf7d0',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11.5px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                        title={u.status === 'Active' ? 'Disable Account' : 'Activate Account'}
                      >
                        {u.status === 'Active' ? 'Disable' : 'Enable'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(u)}
                        disabled={u.email === currentUser?.email}
                        style={{
                          backgroundColor: '#fee2e2',
                          color: '#b91c1c',
                          border: '1px solid #fecaca',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '11.5px',
                          fontWeight: 'bold',
                          cursor: u.email === currentUser?.email ? 'not-allowed' : 'pointer',
                          opacity: u.email === currentUser?.email ? 0.5 : 1
                        }}
                        title={u.email === currentUser?.email ? 'Cannot delete logged in user' : 'Delete User'}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', width: '100%', maxWidth: '420px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#002b49', fontSize: '18px' }}>
              Edit User: {editingUser.email}
            </h3>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Full Name</label>
              <input
                type="text"
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Email</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Operator</label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              >
                <option value="User">User</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                style={{ padding: '7px 14px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                style={{ padding: '7px 16px', borderRadius: '4px', border: 'none', backgroundColor: '#005a9c', color: '#ffffff', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {passwordModalUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', width: '100%', maxWidth: '380px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 14px 0', color: '#002b49', fontSize: '17px' }}>
              Change Password
            </h3>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
              Set new initial or temporary password for <strong>{passwordModalUser.email}</strong>.
            </div>

            <div style={{ marginBottom: '18px' }}>
              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', fontSize: '14px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setPasswordModalUser(null)}
                style={{ padding: '7px 14px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePassword}
                style={{ padding: '7px 16px', borderRadius: '4px', border: 'none', backgroundColor: '#005a9c', color: '#ffffff', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
