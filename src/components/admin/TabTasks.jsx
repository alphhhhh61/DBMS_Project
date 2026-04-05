// src/components/admin/TabTasks.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

const EMPTY = { disaster_id: '', area_id: '', description: '', required_skill: '', status: 'Pending' }
const STATUSES = ['Pending', 'Ongoing', 'Completed']
const STATUS_CLASS = { Pending: 'pill-warn', Ongoing: 'pill-blue', Completed: 'pill-active' }

export default function TabTasks() {
  const [tasks, setTasks] = useState([])
  const [disasters, setDisasters] = useState([])
  const [areas, setAreas] = useState([])
  const [filteredAreas, setFilteredAreas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [tRes, dRes, aRes] = await Promise.all([
      supabase.from('tasks').select('*, disasters(type, region), affected_areas(area_name)').order('created_at', { ascending: false }),
      supabase.from('disasters').select('id, type, region'),
      supabase.from('affected_areas').select('id, area_name, disaster_id'),
    ])
    setTasks(tRes.data || [])
    setDisasters(dRes.data || [])
    setAreas(aRes.data || [])
    setLoading(false)
  }

  function handleDisasterChange(dis_id) {
    setForm(p => ({...p, disaster_id: dis_id, area_id: ''}))
    setFilteredAreas(areas.filter(a => String(a.disaster_id) === dis_id))
  }

  const displayedTasks = filterStatus === 'all' ? tasks : tasks.filter(t => t.status === filterStatus)

  function openCreate() { setForm(EMPTY); setFilteredAreas([]); setEditId(null); setError(''); setShowForm(true) }
  function openEdit(t)  {
    const dis_id = String(t.disaster_id)
    setForm({ disaster_id: dis_id, area_id: String(t.area_id), description: t.description, required_skill: t.required_skill, status: t.status })
    setFilteredAreas(areas.filter(a => String(a.disaster_id) === dis_id))
    setEditId(t.id); setError(''); setShowForm(true)
  }
  function closeForm() { setShowForm(false); setError('') }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.disaster_id || !form.area_id || !form.description || !form.required_skill) {
      setError('All fields are required.'); return
    }
    setSaving(true); setError('')
    const payload = { disaster_id: parseInt(form.disaster_id), area_id: parseInt(form.area_id),
      description: form.description, required_skill: form.required_skill, status: form.status }
    const { error: err } = editId
      ? await supabase.from('tasks').update(payload).eq('id', editId)
      : await supabase.from('tasks').insert(payload)
    setSaving(false)
    if (err) { setError(err.message); return }
    closeForm(); fetchAll()
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this task?')) return
    await supabase.from('tasks').delete().eq('id', id)
    fetchAll()
  }

  return (
    <div className="tab-section">
      <div className="tab-toolbar">
        <div className="tab-filters">
          {['all', ...STATUSES].map(s => (
            <button key={s} className={`filter-btn${filterStatus === s ? ' active' : ''}`}
              onClick={() => setFilterStatus(s)}>
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
        <button className="btn-add" onClick={openCreate} id="task-add-btn">➕ Create Task</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editId ? 'Edit Task' : 'New Task'}</h2>
              <button className="modal-close" onClick={closeForm}>✕</button>
            </div>
            {error && <div className="form-error">⚠️ {error}</div>}
            <form className="modal-form" onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group">
                  <label>Disaster *</label>
                  <select value={form.disaster_id} onChange={e => handleDisasterChange(e.target.value)} required>
                    <option value="">Select disaster…</option>
                    {disasters.map(d => <option key={d.id} value={d.id}>{d.type} – {d.region}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Affected Area *</label>
                  <select value={form.area_id} onChange={e => setForm(p => ({...p, area_id: e.target.value}))} required>
                    <option value="">Select area…</option>
                    {filteredAreas.map(a => <option key={a.id} value={a.id}>{a.area_name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Task Description *</label>
                <textarea rows={3} placeholder="Describe the task…" value={form.description}
                  onChange={e => setForm(p => ({...p, description: e.target.value}))} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Required Skill *</label>
                  <input placeholder="e.g. Medical, Logistics" value={form.required_skill}
                    onChange={e => setForm(p => ({...p, required_skill: e.target.value}))} required />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({...p, status: e.target.value}))}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={closeForm}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : editId ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <div className="ad-loading"><div className="ad-spinner" /></div> : (
        displayedTasks.length === 0
          ? <div className="empty-state"><p>No tasks found.</p></div>
          : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>ID</th><th>Disaster</th><th>Area</th><th>Description</th><th>Skill</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {displayedTasks.map(t => (
                    <tr key={t.id}>
                      <td className="td-id">#{t.id}</td>
                      <td><span className="tag-blue">{t.disasters?.type}</span></td>
                      <td>{t.affected_areas?.area_name}</td>
                      <td className="td-desc">{t.description}</td>
                      <td><span className="tag-skill">{t.required_skill}</span></td>
                      <td><span className={`status-pill ${STATUS_CLASS[t.status]}`}>{t.status}</span></td>
                      <td className="td-actions">
                        <button className="act-btn act-edit" onClick={() => openEdit(t)} title="Edit">✏️</button>
                        <button className="act-btn act-del" onClick={() => handleDelete(t.id)} title="Delete">🗑️</button>
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
