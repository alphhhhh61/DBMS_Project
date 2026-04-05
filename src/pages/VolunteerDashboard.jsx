// src/pages/VolunteerDashboard.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

import VTabProfile       from '../components/volunteer/VTabProfile'
import VTabMyTasks       from '../components/volunteer/VTabMyTasks'
import VTabTaskUpdates   from '../components/volunteer/VTabTaskUpdates'
import VTabNotifications from '../components/volunteer/VTabNotifications'

const TABS = [
  { id: 'profile',       icon: '👤', label: 'My Profile'    },
  { id: 'tasks',         icon: '📋', label: 'My Tasks'       },
  { id: 'updates',       icon: '🔄', label: 'Task Updates'   },
  { id: 'notifications', icon: '🔔', label: 'Notifications'  },
]

export default function VolunteerDashboard() {
  const { signOut, session } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile')
  const [unread, setUnread] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const volunteerName = session?.user?.user_metadata?.full_name || 'Volunteer'
  const initials = volunteerName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  // Track unread notification count
  useEffect(() => {
    if (!session?.user?.id) return
    fetchUnread()

    const ch = supabase.channel('vd-unread')
      .on('postgres_changes', {
        event: '*', schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${session.user.id}`,
      }, fetchUnread)
      .subscribe()

    return () => supabase.removeChannel(ch)
  }, [session?.user?.id])

  async function fetchUnread() {
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', session.user.id)
      .eq('is_read', false)
    setUnread(count || 0)
  }

  function handleTabClick(id) {
    setActiveTab(id)
    setMobileMenuOpen(false)
    // Clear unread when opening notifications tab
    if (id === 'notifications') setTimeout(fetchUnread, 500)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="vd-layout" id="volunteer-dashboard">
      {/* ── Top Navbar ── */}
      <header className="vd-topnav" id="vd-navbar">
        {/* Brand */}
        <div className="vd-brand">
          <span className="vd-brand-icon">🤝</span>
          <span className="vd-brand-name">DMIS</span>
          <span className="vd-brand-tag">Volunteer</span>
        </div>

        {/* Desktop Tabs */}
        <nav className="vd-tabs" aria-label="Volunteer navigation">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`vd-tab-btn${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => handleTabClick(tab.id)}
              id={`vd-tab-${tab.id}`}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <span className="vd-tab-icon">{tab.icon}</span>
              <span className="vd-tab-label">{tab.label}</span>
              {tab.id === 'notifications' && unread > 0 && (
                <span className="vd-tab-badge">{unread > 9 ? '9+' : unread}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Right — user + sign out */}
        <div className="vd-nav-right">
          <div className="vd-nav-user">
            <div className="vd-nav-avatar">{initials}</div>
            <div className="vd-nav-userinfo">
              <p className="vd-nav-name">{volunteerName}</p>
              <p className="vd-nav-role">Volunteer</p>
            </div>
          </div>
          <button className="vd-signout-btn" onClick={handleSignOut} id="vol-signout-btn" title="Sign out">
            🚪 Sign Out
          </button>
          {/* Mobile hamburger */}
          <button
            className="vd-hamburger"
            onClick={() => setMobileMenuOpen(o => !o)}
            aria-label="Toggle menu"
            id="vd-hamburger"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* Mobile nav menu */}
      {mobileMenuOpen && (
        <div className="vd-mobile-menu">
          {TABS.map(tab => (
            <button key={tab.id} className={`vd-mobile-tab${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => handleTabClick(tab.id)}>
              {tab.icon} {tab.label}
              {tab.id === 'notifications' && unread > 0 && (
                <span className="vd-tab-badge">{unread}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Content ── */}
      <main className="vd-main" id="vd-main">
        {/* Page title */}
        <div className="vd-page-header">
          <h1 className="vd-page-title">
            {TABS.find(t => t.id === activeTab)?.icon}{' '}
            {TABS.find(t => t.id === activeTab)?.label}
          </h1>
          <p className="vd-page-sub">
            Welcome back, <strong>{volunteerName}</strong>
          </p>
        </div>

        {/* Tab content */}
        <div className="vd-content">
          {activeTab === 'profile'       && <VTabProfile       />}
          {activeTab === 'tasks'         && <VTabMyTasks        />}
          {activeTab === 'updates'       && <VTabTaskUpdates    />}
          {activeTab === 'notifications' && <VTabNotifications  />}
        </div>
      </main>
    </div>
  )
}
