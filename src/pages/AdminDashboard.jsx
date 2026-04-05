// src/pages/AdminDashboard.jsx
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

// ─── Sub-components imports ───────────────────────────────
import TabOverview       from '../components/admin/TabOverview'
import TabDisasters      from '../components/admin/TabDisasters'
import TabAreas          from '../components/admin/TabAreas'
import TabResources      from '../components/admin/TabResources'
import TabTasks          from '../components/admin/TabTasks'
import TabVolunteers     from '../components/admin/TabVolunteers'
import TabAssignments    from '../components/admin/TabAssignments'
import TabNotifications  from '../components/admin/TabNotifications'
import TabReports        from '../components/admin/TabReports'

const TABS = [
  { id: 'overview',       icon: '📊', label: 'Dashboard Overview' },
  { id: 'disasters',      icon: '🌪️', label: 'Disaster Management' },
  { id: 'areas',          icon: '📍', label: 'Affected Areas' },
  { id: 'resources',      icon: '📦', label: 'Resource Management' },
  { id: 'tasks',          icon: '✅', label: 'Task Management' },
  { id: 'volunteers',     icon: '👤', label: 'Volunteer Management' },
  { id: 'assignments',    icon: '🔗', label: 'Assignment & Matching' },
  { id: 'notifications',  icon: '🔔', label: 'Notifications' },
  { id: 'reports',        icon: '📈', label: 'Reports & Analytics' },
]

export default function AdminDashboard() {
  const { signOut, session } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const adminName = session?.user?.user_metadata?.full_name || 'Admin'

  return (
    <div className="ad-layout">
      {/* ── Sidebar ── */}
      <aside className={`ad-sidebar${sidebarOpen ? '' : ' collapsed'}`} id="admin-sidebar">
        <div className="ad-sidebar-header">
          <div className="ad-brand">
            <span className="ad-brand-icon">🛡️</span>
            {sidebarOpen && <span className="ad-brand-name">DMIS</span>}
          </div>
          <button
            className="ad-collapse-btn"
            onClick={() => setSidebarOpen(o => !o)}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="ad-nav" aria-label="Admin navigation">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`ad-nav-item${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              id={`nav-${tab.id}`}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              title={!sidebarOpen ? tab.label : undefined}
            >
              <span className="ad-nav-icon">{tab.icon}</span>
              {sidebarOpen && <span className="ad-nav-label">{tab.label}</span>}
            </button>
          ))}
        </nav>

        <div className="ad-sidebar-footer">
          {sidebarOpen && (
            <div className="ad-user-info">
              <div className="ad-user-avatar">🔐</div>
              <div>
                <p className="ad-user-name">{adminName}</p>
                <p className="ad-user-role">Administrator</p>
              </div>
            </div>
          )}
          <button className="ad-signout-btn" onClick={handleSignOut} id="admin-signout-btn" title="Sign out">
            🚪{sidebarOpen && ' Sign Out'}
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="ad-main" id="admin-main">
        <header className="ad-topbar">
          <div className="ad-topbar-left">
            <h1 className="ad-page-title">
              {TABS.find(t => t.id === activeTab)?.icon}{' '}
              {TABS.find(t => t.id === activeTab)?.label}
            </h1>
          </div>
          <div className="ad-topbar-right">
            <div className="ad-status-pill">
              <span className="ad-status-dot" />
              Live
            </div>
          </div>
        </header>

        <div className="ad-content">
          {activeTab === 'overview'      && <TabOverview      />}
          {activeTab === 'disasters'     && <TabDisasters     />}
          {activeTab === 'areas'         && <TabAreas         />}
          {activeTab === 'resources'     && <TabResources     />}
          {activeTab === 'tasks'         && <TabTasks         />}
          {activeTab === 'volunteers'    && <TabVolunteers    />}
          {activeTab === 'assignments'   && <TabAssignments   />}
          {activeTab === 'notifications' && <TabNotifications />}
          {activeTab === 'reports'       && <TabReports       />}
        </div>
      </main>
    </div>
  )
}
