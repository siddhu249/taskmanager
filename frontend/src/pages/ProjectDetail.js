import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function TaskModal({ projectId, members, task, onClose, onSave }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    due_date: task?.due_date ? task.due_date.split('T')[0] : '',
    assignee_id: task?.assignee_id || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const payload = { ...form, project_id: projectId, assignee_id: form.assignee_id || null };
      const { data } = task
        ? await api.put(`/tasks/${task.id}`, payload)
        : await api.post('/tasks', payload);
      onSave(data, !!task);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save task');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{task ? 'Edit Task' : 'New Task'}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input className="form-control" name="title" value={form.title} onChange={h} required placeholder="Task title" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-control" name="description" rows={2} value={form.description} onChange={h} placeholder="Optional details…" />
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" name="status" value={form.status} onChange={h}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-control" name="priority" value={form.priority} onChange={h}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input className="form-control" type="date" name="due_date" value={form.due_date} onChange={h} />
            </div>
            <div className="form-group">
              <label className="form-label">Assignee</label>
              <select className="form-control" name="assignee_id" value={form.assignee_id} onChange={h}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end', marginTop:8}}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Save Task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddMemberModal({ projectId, onClose, onAdd }) {
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get('/users').then(r => setUsers(r.data)); }, []);

  const submit = async e => {
    e.preventDefault();
    if (!userId) return;
    setLoading(true);
    try {
      await api.post(`/projects/${projectId}/members`, { user_id: parseInt(userId), role });
      onAdd();
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Add Member</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">User</label>
            <select className="form-control" value={userId} onChange={e => setUserId(e.target.value)} required>
              <option value="">Select a user…</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-control" value={role} onChange={e => setRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Adding…' : 'Add Member'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [taskModal, setTaskModal] = useState(null); // null | 'new' | task object
  const [memberModal, setMemberModal] = useState(false);

  const load = async () => {
    const [proj, tasks] = await Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/tasks?project_id=${id}`)
    ]);
    setProject(proj.data);
    setTasks(tasks.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const deleteTask = async taskId => {
    if (!window.confirm('Delete this task?')) return;
    await api.delete(`/tasks/${taskId}`);
    setTasks(ts => ts.filter(t => t.id !== taskId));
  };

  const isAdmin = project?.members?.find(m => m.id === user?.id)?.role === 'admin' || project?.owner_id === user?.id || user?.role === 'admin';

  const filteredTasks = tasks.filter(t => tab === 'all' || t.status === tab);

  if (loading) return <div className="loading">Loading project…</div>;
  if (!project) return <div className="loading">Project not found</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{fontSize:13, color:'var(--text-muted)', marginBottom:4, cursor:'pointer'}} onClick={() => navigate('/projects')}>← Projects</div>
          <h1 className="page-title">{project.name}</h1>
          {project.description && <p className="page-subtitle">{project.description}</p>}
        </div>
        <button className="btn btn-primary" onClick={() => setTaskModal('new')}>+ Add Task</button>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 280px', gap:24}}>
        {/* Tasks column */}
        <div>
          <div className="tabs">
            {[['all','All'],['todo','To Do'],['in_progress','In Progress'],['done','Done']].map(([v,l]) => (
              <button key={v} className={`tab ${tab===v?'active':''}`} onClick={() => setTab(v)}>{l}</button>
            ))}
          </div>

          {filteredTasks.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">✅</div><p>No tasks here yet.</p></div>
          ) : filteredTasks.map(t => {
            const isOverdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done';
            return (
              <div key={t.id} className={`task-item ${isOverdue ? 'overdue' : ''}`}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                  <div className="task-title">{t.title}</div>
                  <div style={{display:'flex', gap:6}}>
                    <button className="btn btn-sm btn-secondary" onClick={() => setTaskModal(t)}>Edit</button>
                    {isAdmin && <button className="btn btn-sm btn-danger" onClick={() => deleteTask(t.id)}>Delete</button>}
                  </div>
                </div>
                {t.description && <p style={{fontSize:13, color:'var(--text-muted)', margin:'6px 0'}}>{t.description}</p>}
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

        {/* Members column */}
        <div className="card" style={{alignSelf:'start'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
            <h3 className="section-title" style={{marginBottom:0}}>Members</h3>
            {isAdmin && <button className="btn btn-sm btn-secondary" onClick={() => setMemberModal(true)}>+ Add</button>}
          </div>
          {project.members?.map(m => (
            <div key={m.id} className="member-row">
              <div className="member-info">
                <span className="member-name">{m.name}</span>
                <span className="member-email">{m.email}</span>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:6}}>
                <span className={`badge badge-${m.role}`}>{m.role}</span>
                {isAdmin && m.id !== user?.id && (
                  <button className="btn btn-sm btn-danger" onClick={async () => {
                    await api.delete(`/projects/${id}/members/${m.id}`);
                    load();
                  }}>✕</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {taskModal && (
        <TaskModal
          projectId={parseInt(id)}
          members={project.members || []}
          task={taskModal === 'new' ? null : taskModal}
          onClose={() => setTaskModal(null)}
          onSave={(saved, isEdit) => {
            setTasks(ts => isEdit ? ts.map(t => t.id === saved.id ? saved : t) : [saved, ...ts]);
            setTaskModal(null);
          }}
        />
      )}
      {memberModal && <AddMemberModal projectId={id} onClose={() => setMemberModal(false)} onAdd={() => { setMemberModal(false); load(); }} />}
    </div>
  );
}
