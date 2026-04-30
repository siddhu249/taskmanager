import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/users').then(r => setUsers(r.data)).finally(() => setLoading(false));
  }, []);

  const deleteUser = async id => {
    if (!window.confirm('Delete this user?')) return;
    await api.delete(`/users/${id}`);
    setUsers(us => us.filter(u => u.id !== id));
  };

  if (loading) return <div className="loading">Loading team…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Team</h1>
          <p className="page-subtitle">{users.length} member{users.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="card">
        {users.map(u => (
          <div key={u.id} className="member-row">
            <div style={{display:'flex', alignItems:'center', gap:14}}>
              <div style={{
                width:40, height:40, borderRadius:'50%',
                background: `hsl(${u.id * 67 % 360}, 60%, 40%)`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:16, color:'#fff', flexShrink:0
              }}>
                {u.name[0].toUpperCase()}
              </div>
              <div className="member-info">
                <span className="member-name">{u.name} {u.id === user?.id && <span style={{fontSize:11,color:'var(--text-muted)'}}>(you)</span>}</span>
                <span className="member-email">{u.email}</span>
              </div>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:10}}>
              <span className={`badge badge-${u.role}`}>{u.role}</span>
              <span style={{fontSize:12, color:'var(--text-dim)'}}>
                Joined {new Date(u.created_at).toLocaleDateString()}
              </span>
              {user?.role === 'admin' && u.id !== user?.id && (
                <button className="btn btn-sm btn-danger" onClick={() => deleteUser(u.id)}>Delete</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
