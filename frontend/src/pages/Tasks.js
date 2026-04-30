import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    api.get(`/tasks?${params}`).then(r => setTasks(r.data)).finally(() => setLoading(false));
  }, [filters]);

  const filtered = tasks.filter(t => !filters.priority || t.priority === filters.priority);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">All Tasks</h1>
          <p className="page-subtitle">Across all your projects</p>
        </div>
      </div>

      <div style={{display:'flex', gap:12, marginBottom:24}}>
        <select className="form-control" style={{width:'auto'}} value={filters.status} onChange={e => setFilters(f=>({...f, status:e.target.value}))}>
          <option value="">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select className="form-control" style={{width:'auto'}} value={filters.priority} onChange={e => setFilters(f=>({...f, priority:e.target.value}))}>
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      {loading ? <div className="loading">Loading tasks…</div> : filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">✅</div><p>No tasks match your filters.</p></div>
      ) : filtered.map(t => {
        const isOverdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done';
        return (
          <div key={t.id} className={`task-item ${isOverdue ? 'overdue' : ''}`} style={{cursor:'pointer'}} onClick={() => navigate(`/projects/${t.project_id}`)}>
            <div style={{display:'flex', justifyContent:'space-between'}}>
              <div className="task-title">{t.title}</div>
              <span style={{fontSize:12, color:'var(--text-muted)'}}>{t.project_name}</span>
            </div>
            <div className="task-meta">
              <span className={`badge badge-${t.status}`}>{t.status.replace('_',' ')}</span>
              <span className={`badge badge-${t.priority}`}>{t.priority}</span>
              {t.assignee_name && <span>→ {t.assignee_name}</span>}
              {t.due_date && <span style={{color: isOverdue ? 'var(--danger)' : 'inherit'}}>📅 {new Date(t.due_date).toLocaleDateString()}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
