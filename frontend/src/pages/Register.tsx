import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/register', { username, email, password });
      alert('Account created! Welcome to the archive.');
      navigate('/login');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg2)', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '40px', background: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--br)', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>📝</div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--tx)', marginBottom: '8px' }}>Join RwandaLib</h1>
        <p style={{ fontSize: '14px', color: 'var(--txm)', marginBottom: '32px' }}>Start contributing to the national archive.</p>
        
        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txm)', marginBottom: '8px', display: 'block' }}>Username</label>
            <input 
              type="text" 
              className="search-input"
              style={{ width: '100%', padding: '10px', border: '1.5px solid var(--br2)', borderRadius: '8px', background: 'var(--bg)', color: 'var(--tx)' }}
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txm)', marginBottom: '8px', display: 'block' }}>Email</label>
            <input 
              type="email" 
              className="search-input"
              style={{ width: '100%', padding: '10px', border: '1.5px solid var(--br2)', borderRadius: '8px', background: 'var(--bg)', color: 'var(--tx)' }}
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required
            />
          </div>
          <div style={{ marginBottom: '32px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--txm)', marginBottom: '8px', display: 'block' }}>Password</label>
            <input 
              type="password" 
              className="search-input"
              style={{ width: '100%', padding: '10px', border: '1.5px solid var(--br2)', borderRadius: '8px', background: 'var(--bg)', color: 'var(--tx)' }}
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required
            />
          </div>
          <button type="submit" className="nav-btn" style={{ width: '100%', padding: '12px', fontSize: '15px' }} disabled={loading}>
            {loading ? 'Initializing...' : 'Create Account'}
          </button>
        </form>
        
        <div style={{ marginTop: '32px', fontSize: '14px', borderTop: '1px solid var(--br)', paddingTop: '24px' }}>
          <span style={{ color: 'var(--txm)' }}>Already a member? </span>
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Login here</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
