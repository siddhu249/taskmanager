import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function StatusDot({ status }) {
  const colors = { todo: '#7a839e', in_progress: '#6c63ff', done: '#00d4aa' };
  return <span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background: colors[status] || '#7a839e', marginRight:6 }} />;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tasks/dashboard').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard…</div>;

  const byStatus = { todo: 0, in_progress: 0, done: 0 };
  data?.byStatus?.forEach(s => { byStatus[s.status] = parseInt(s.count); });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here's what's happening across your projects</p>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-num" style={{color:'var(--text)'}}>{data?.total || 0}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{color:'var(--text-muted)'}}>{byStatus.todo}</div>
          <div className="stat-label">To Do</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{color:'var(--accent)'}}>{byStatus.in_progress}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{color:'var(--success)'}}>{byStatus.done}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{color:'var(--danger)'}}>{data?.overdue?.length || 0}</div>
          <div className="stat-label">Overdue</div>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:24}}>
        <div className="card">
          <h3 className="section-title">My Open Tasks</h3>
          {data?.myTasks?.length === 0 && (
            <div style={{color:'var(--text-muted)', fontSize:14}}>No open tasks assigned to you 🎉</div>
          )}
          {data?.myTasks?.map(t => (
            <div key={t.id} className="task-item" style={{cursor:'pointer'}} onClick={() => navigate(`/projects/${t.project_id}`)}>
              <div className="task-title">
                <StatusDot status={t.status} />{t.title}
              </div>
              <div className="task-meta">
                <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                <span>{t.project_name}</span>
                {t.due_date && <span>Due {new Date(t.due_date).toLocaleDateString()}</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 className="section-title" style={{color:'var(--danger)'}}>⚠ Overdue Tasks</h3>
          {data?.overdue?.length === 0 && (
            <div style={{color:'var(--text-muted)', fontSize:14}}>No overdue tasks ✓</div>
          )}
          {data?.overdue?.map(t => (
            <div key={t.id} className="task-item overdue" style={{cursor:'pointer'}} onClick={() => navigate(`/projects/${t.project_id}`)}>
              <div className="task-title">{t.title}</div>
              <div className="task-meta">
                <span>{t.project_name}</span>
                {t.assignee_name && <span>→ {t.assignee_name}</span>}
                <span style={{color:'var(--danger)'}}>Due {new Date(t.due_date).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
