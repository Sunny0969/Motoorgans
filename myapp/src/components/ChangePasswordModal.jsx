import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ChangePasswordModal({ isOpen, onClose }) {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    const result = changePassword(currentPassword, newPassword);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    alert(result.message);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
    }}>
      <div style={{
        backgroundColor: '#fff', border: '2px solid #999', padding: '20px',
        width: '360px', fontFamily: 'Segoe UI, Tahoma, sans-serif',
      }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>Change Password</h3>
        <form onSubmit={handleSubmit}>
          <label style={{ fontSize: '12px', fontWeight: 600 }}>Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            style={{ width: '100%', marginBottom: '10px', padding: '6px', border: '1px solid #999' }}
            required
          />
          <label style={{ fontSize: '12px', fontWeight: 600 }}>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={{ width: '100%', marginBottom: '10px', padding: '6px', border: '1px solid #999' }}
            required
          />
          <label style={{ fontSize: '12px', fontWeight: 600 }}>Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{ width: '100%', marginBottom: '10px', padding: '6px', border: '1px solid #999' }}
            required
          />
          {error && <div style={{ color: '#c62828', fontSize: '12px', marginBottom: '8px' }}>{error}</div>}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '6px 14px', border: '1px solid #999' }}>Cancel</button>
            <button type="submit" style={{ padding: '6px 14px', border: '1px solid #666', backgroundColor: '#90EE90' }}>Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
