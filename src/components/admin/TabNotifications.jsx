// src/components/admin/TabNotifications.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function TabNotifications() {
  const [volunteers, setVolunteers] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ recipient_id: 'all', message: '', event_type: 'broadcast' })
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [vRes, nRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name').eq('role', 'volunteer'),
      supabase.from('notifications').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(50),
    ])
    setVolunteers(vRes.data || [])
    setNotifications(nRes.data || [])
    setLoading(false)
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!form.message.trim()) { setError('Message cannot be empty.'); return }
    setSending(true); setError(''); setSuccess('')

    let rows
    if (form.recipient_id === 'all') {
      rows = volunteers.map(v => ({ recipient_id: v.id, message: form.message, event_type: form.event_type }))
    } else {
      rows = [{ recipient_id: form.recipient_id, message: form.message, event_type: form.event_type }]
    }

    const { error: err } = await supabase.from('notifications').insert(rows)
    setSending(false)
    if (err) { setError(err.message); return }
    setSuccess(`✅ Sent to ${rows.length} volunteer${rows.length > 1 ? 's' : ''}.`)
    setForm(p => ({ ...p, message: '' }))
    fetchAll()
  }

  return (
    <div className="tab-section">
      {/* Send form */}
      <div className="notif-compose-card">
        <h3 className="notif-compose-title">📣 Send Notification</h3>
        {error && <div className="form-error">⚠️ {error}</div>}
        {success && <div className="form-success">{success}</div>}
        <form className="modal-form" onSubmit={handleSend}>
          <div className="form-row">
            <div className="form-group">
              <label>Recipient</label>
              <select value={form.recipient_id} onChange={e => setForm(p => ({...p, recipient_id: e.target.value}))}>
                <option value="all">📢 All Volunteers (Broadcast)</option>
                {volunteers.map(v => <option key={v.id} value={v.id}>{v.full_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Event Type</label>
              <select value={form.event_type} onChange={e => setForm(p => ({...p, event_type: e.target.value}))}>
                <option value="broadcast">Broadcast</option>
                <option value="task_assigned">Task Assigned</option>
                <option value="resource_alert">Resource Alert</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Message *</label>
            <textarea rows={3} placeholder="Type your notification message…" value={form.message}
              onChange={e => setForm(p => ({...p, message: e.target.value}))} required />
          </div>
          <div className="modal-actions">
            <button type="submit" className="btn-primary" disabled={sending} id="notif-send-btn">
              {sending ? 'Sending…' : '📣 Send Notification'}
            </button>
          </div>
        </form>
      </div>

      {/* Recent notifications log */}
      <h3 className="section-subtitle">Recent Notifications</h3>
      {loading ? <div className="ad-loading"><div className="ad-spinner" /></div> : (
        notifications.length === 0
          ? <div className="empty-state"><p>No notifications sent yet.</p></div>
          : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>ID</th><th>Recipient</th><th>Message</th><th>Type</th><th>Read</th><th>Sent At</th></tr>
                </thead>
                <tbody>
                  {notifications.map(n => (
                    <tr key={n.id}>
                      <td className="td-id">#{n.id}</td>
                      <td><strong>{n.profiles?.full_name}</strong></td>
                      <td className="td-desc">{n.message}</td>
                      <td><span className="tag-skill">{n.event_type}</span></td>
                      <td>{n.is_read ? '✅' : '🔵'}</td>
                      <td>{new Date(n.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
      )}
    </div>
  )
}
