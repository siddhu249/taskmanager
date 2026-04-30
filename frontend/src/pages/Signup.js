import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/signup', form);
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div className="auth-logo">Task<span>Flow</span></div>
        <p className="auth-subtitle">Create your account</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-control" name="name" value={form.name} onChange={handle} placeholder="Jane Doe" required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-control" name="email" type="email" value={form.email} onChange={handle} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-control" name="password" type="password" value={form.password} onChange={handle} placeholder="Min. 6 characters" required />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-control" name="role" value={form.role} onChange={handle}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button className="btn btn-primary" style={{width:'100%', marginTop:8}} type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
