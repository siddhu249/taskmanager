import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '⬛' },
  { path: '/projects', label: 'Projects', icon: '📁' },
  { path: '/tasks', label: 'All Tasks', icon: '✅' },
  { path: '/users', label: 'Team', icon: '👥' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">Task<span>Flow</span></div>
        <nav>
          {navItems.map(item => (
            <button
              key={item.path}
              className={`nav-item ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
              {item.path === '/users' && user?.role !== 'admin' ? null : null}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <strong>{user?.name}</strong>
            <span className={`badge badge-${user?.role}`}>{user?.role}</span>
          </div>
          <button className="btn btn-secondary btn-sm" style={{width:'100%'}} onClick={logout}>
            Sign Out
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
