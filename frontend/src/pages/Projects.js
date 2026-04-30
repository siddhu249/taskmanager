import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

function ProjectModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/projects', form);
      onSave(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">New Project</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Project Name</label>
            <input className="form-control" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Website Redesign" required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-control" rows={3} value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} placeholder="What's this project about?" />
          </div>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating…' : 'Create Project'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/projects').then(r => setProjects(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading projects…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <p>No projects yet. Create your first one!</p>
        </div>
      ) : (
        <div className="card-grid">
          {projects.map(p => (
            <div key={p.id} className="card" style={{cursor:'pointer'}} onClick={() => navigate(`/projects/${p.id}`)}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12}}>
                <h3 style={{fontSize:17, fontFamily:'Syne, sans-serif'}}>{p.name}</h3>
                <span className={`badge badge-${p.my_role || 'member'}`}>{p.my_role || 'member'}</span>
              </div>
              {p.description && <p style={{color:'var(--text-muted)', fontSize:13, marginBottom:12}}>{p.description}</p>}
              <div style={{display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-muted)'}}>
                <span>👤 {p.owner_name}</span>
                <span>✅ {p.task_count} tasks</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <ProjectModal onClose={() => setShowModal(false)} onSave={p => { setProjects(ps => [p,...ps]); setShowModal(false); navigate(`/projects/${p.id}`); }} />}
    </div>
  );
}
