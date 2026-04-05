// src/components/admin/TabAssignments.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

const AS_STATUS_CLASS = { Active: 'pill-blue', Completed: 'pill-active', Revoked: 'pill-inactive' }

export default function TabAssignments() {
  const [assignments, setAssignments] = useState([])
  const [tasks, setTasks] = useState([])
  const [volunteers, setVolunteers] = useState([])
  const [suggestedVols, setSuggestedVols] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selTask, setSelTask] = useState('')
  const [selVol, setSelVol] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [aRes, tRes, vRes] = await Promise.all([
      supabase.from('assignments').select('*, tasks(description, required_skill, status), profiles(full_name, region)').order('assigned_date', { ascending: false }),
      supabase.from('tasks').select('id, description, required_skill, status').neq('status', 'Completed'),
      supabase.from('profiles').select('id, full_name, skills, region, availability').eq('role', 'volunteer').eq('availability', true),
    ])
    setAssignments(aRes.data || [])
    setTasks(tRes.data || [])
    setVolunteers(vRes.data || [])
    setLoading(false)
  }

  function handleTaskSelect(taskId) {
    setSelTask(taskId); setSelVol('')
    const task = tasks.find(t => String(t.id) === taskId)
    if (task) {
      const matches = volunteers.filter(v => (v.skills || []).includes(task.required_skill))
      setSuggestedVols(matches)
    } else {
      setSuggestedVols([])
    }
  }

  async function handleAssign(e) {
    e.preventDefault()
    if (!selTask || !selVol) { setError('Select a task and a volunteer.'); return }
    setSaving(true); setError('')
    const { error: err } = await supabase.from('assignments').insert({
      task_id: parseInt(selTask), volunteer_id: selVol,
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    // Auto-send notification
    const task = tasks.find(t => String(t.id) === selTask)
    await supabase.from('notifications').insert({
      recipient_id: selVol,
      message: `You have been assigned a new task: "${task?.description}"`,
      event_type: 'task_assigned',
    })
    setShowForm(false); setSelTask(''); setSelVol(''); setSuggestedVols([])
    fetchAll()
  }

  async function revokeAssignment(id) {
    if (!window.confirm('Revoke this assignment?')) return
    await supabase.from('assignments').update({ status: 'Revoked' }).eq('id', id)
    fetchAll()
  }

  const allVols = selTask ? volunteers : volunteers
  const displayVols = suggestedVols.length > 0 ? suggestedVols : allVols

  return (
    <div className="tab-section">
      <div className="tab-toolbar">
        <div />
        <button className="btn-add" onClick={() => { setShowForm(true); setError('') }} id="assign-add-btn">
          🔗 Assign Volunteer
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Assign Volunteer to Task</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            {error && <div className="form-error">⚠️ {error}</div>}
            <form className="modal-form" onSubmit={handleAssign}>
              <div className="form-group">
                <label>Select Task *</label>
                <select value={selTask} onChange={e => handleTaskSelect(e.target.value)} required>
                  <option value="">Choose a task…</option>
                  {tasks.map(t => (
                    <option key={t.id} value={t.id}>
                      #{t.id} — {t.description.slice(0, 50)} [{t.required_skill}]
                    </option>
                  ))}
                </select>
              </div>

              {selTask && (
                <div className="form-group">
                  <label>
                    Select Volunteer *
                    {suggestedVols.length > 0 && (
                      <span className="suggest-badge">🤖 {suggestedVols.length} skill-matched</span>
                    )}
                  </label>
                  <select value={selVol} onChange={e => setSelVol(e.target.value)} required>
                    <option value="">Choose a volunteer…</option>
                    {displayVols.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.full_name} — {v.region} [{(v.skills || []).join(', ')}]
                      </option>
                    ))}
                  </select>
                  {suggestedVols.length === 0 && selTask && (
                    <p className="form-hint">⚠️ No volunteers have the required skill. Showing all available.</p>
                  )}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Assigning…' : '🔗 Assign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <div className="ad-loading"><div className="ad-spinner" /></div> : (
        assignments.length === 0
          ? <div className="empty-state"><p>No assignments yet.</p></div>
          : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>ID</th><th>Task</th><th>Required Skill</th><th>Volunteer</th><th>Date</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {assignments.map(a => (
                    <tr key={a.id}>
                      <td className="td-id">#{a.id}</td>
                      <td className="td-desc">{a.tasks?.description}</td>
                      <td><span className="tag-skill">{a.tasks?.required_skill}</span></td>
                      <td><strong>{a.profiles?.full_name}</strong><br /><span className="muted">{a.profiles?.region}</span></td>
                      <td>{a.assigned_date}</td>
                      <td><span className={`status-pill ${AS_STATUS_CLASS[a.status]}`}>{a.status}</span></td>
                      <td className="td-actions">
                        {a.status === 'Active' && (
                          <button className="act-btn act-del" onClick={() => revokeAssignment(a.id)} title="Revoke">🚫</button>
                        )}
                      </td>
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
