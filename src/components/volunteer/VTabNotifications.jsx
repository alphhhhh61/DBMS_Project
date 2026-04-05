// src/components/volunteer/VTabNotifications.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'

const EVENT_STYLE = {
  task_assigned:  { icon: '📋', color: 'notif-blue',   label: 'Task Assigned'  },
  resource_alert: { icon: '📦', color: 'notif-red',    label: 'Resource Alert' },
  broadcast:      { icon: '📢', color: 'notif-purple', label: 'Broadcast'      },
  general:        { icon: '💬', color: 'notif-gray',   label: 'General'        },
  default:        { icon: '🔔', color: 'notif-gray',   label: 'Notification'   },
}

function getStyle(event_type) {
  return EVENT_STYLE[event_type] || EVENT_STYLE.default
}

function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts)) / 1000
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(ts).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

export default function VTabNotifications() {
  const { session } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()

    // Realtime: listen for new notifications
    const ch = supabase.channel('vol-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${session?.user?.id}`,
      }, () => fetchNotifications())
      .subscribe()

    return () => supabase.removeChannel(ch)
  }, [])

  async function fetchNotifications() {
    setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', session?.user?.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setNotifications(data || [])
    setLoading(false)
  }

  async function markRead(id) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  async function markAllRead() {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length === 0) return
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (loading) return <div className="ad-loading"><div className="ad-spinner" /></div>

  return (
    <div className="tab-section">
      {/* Header */}
      <div className="vd-notif-header">
        <div className="vd-notif-title-row">
          <h3 className="vd-notif-title">
            📬 Inbox
            {unreadCount > 0 && <span className="vd-unread-badge">{unreadCount}</span>}
          </h3>
          <p className="vd-notif-sub">{notifications.length} message{notifications.length !== 1 ? 's' : ''}</p>
        </div>
        {unreadCount > 0 && (
          <button className="vd-mark-all-btn" onClick={markAllRead} id="notif-mark-all">
            ✓ Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <p>📭 Your inbox is empty. Notifications will appear here when admin sends updates.</p>
        </div>
      ) : (
        <div className="vd-notif-list">
          {notifications.map(n => {
            const style = getStyle(n.event_type)
            return (
              <div
                key={n.id}
                className={`vd-notif-item ${!n.is_read ? 'vd-notif-unread' : ''} ${n.event_type === 'task_assigned' ? 'vd-notif-highlight' : ''}`}
              >
                <div className={`vd-notif-icon-wrap ${style.color}`}>
                  <span>{style.icon}</span>
                </div>
                <div className="vd-notif-body">
                  <div className="vd-notif-row">
                    <span className={`vd-notif-type-badge ${style.color}`}>{style.label}</span>
                    {!n.is_read && <span className="vd-unread-dot" />}
                  </div>
                  <p className="vd-notif-message">{n.message}</p>
                  <p className="vd-notif-time">{timeAgo(n.created_at)}</p>
                </div>
                {!n.is_read && (
                  <button
                    className="vd-notif-read-btn"
                    onClick={() => markRead(n.id)}
                    title="Mark as read"
                    id={`mark-read-${n.id}`}
                  >
                    ✓
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
