import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = login(username, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    const redirectTo = location.state?.from?.pathname || '/';
    navigate(redirectTo, { replace: true });
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#4a4a4a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Segoe UI, Tahoma, sans-serif',
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: '#fff',
        border: '3px solid #999',
        width: '100%',
        maxWidth: '420px',
        padding: '24px',
      }}>
        <div style={{
          backgroundColor: '#ff8c00',
          color: '#fff',
          textAlign: 'center',
          padding: '12px',
          marginBottom: '20px',
          fontSize: '22px',
          fontWeight: 'bold',
        }}>
          Moto Organs Traders
        </div>
        <h2 style={{ textAlign: 'center', margin: '0 0 6px', fontSize: '18px' }}>Login</h2>
        <p style={{ textAlign: 'center', color: '#666', fontSize: '12px', marginBottom: '20px' }}>
          Trade Management System
        </p>

        <form onSubmit={handleLogin}>
          <label style={{ fontSize: '12px', fontWeight: 600 }}>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            style={{ width: '100%', padding: '8px', marginBottom: '12px', border: '1px solid #999', boxSizing: 'border-box' }}
          />
          <label style={{ fontSize: '12px', fontWeight: 600 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '8px', marginBottom: '12px', border: '1px solid #999', boxSizing: 'border-box' }}
          />
          {error && (
            <div style={{ color: '#c62828', fontSize: '12px', marginBottom: '12px', padding: '8px', background: '#ffebee' }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#2d5016',
              color: '#fff',
              border: 'none',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
