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
            </button>
          ))}
        </nav>
      </aside>
      <div className="page-shell">
        <header className="topbar">
          <div className="topbar-badge">Task management made simple</div>
          <div className="topbar-actions">
            <div className="user-pill">
              <span>{user?.name}</span>
              <strong>{user?.role}</strong>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={logout}>Sign Out</button>
          </div>
        </header>
        <main className="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
