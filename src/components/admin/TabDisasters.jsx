// src/components/admin/TabDisasters.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

const EMPTY = { type: '', region: '', severity: 'Medium', date: '', description: '' }
const SEVERITIES = ['Low', 'Medium', 'High', 'Critical']

export default function TabDisasters() {
  const [disasters, setDisasters] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // all | active | resolved

  useEffect(() => { fetchDisasters() }, [])

  async function fetchDisasters() {
    setLoading(true)
    const { data } = await supabase.from('disasters').select('*').order('date', { ascending: false })
    setDisasters(data || [])
    setLoading(false)
  }

  const filtered = disasters.filter(d =>
    filter === 'all' ? true : filter === 'active' ? d.is_active : !d.is_active
  )

  function openCreate() { setForm(EMPTY); setEditId(null); setError(''); setShowForm(true) }
  function openEdit(d)  { setForm({ type: d.type, region: d.region, severity: d.severity, date: d.date, description: d.description || '' }); setEditId(d.id); setError(''); setShowForm(true) }
  function closeForm()  { setShowForm(false); setError('') }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.type || !form.region || !form.date) { setError('Type, Region and Date are required.'); return }
    setSaving(true); setError('')
    const payload = { type: form.type, region: form.region, severity: form.severity, date: form.date, description: form.description }
    const { error: err } = editId
      ? await supabase.from('disasters').update(payload).eq('id', editId)
      : await supabase.from('disasters').insert(payload)
    setSaving(false)
    if (err) { setError(err.message); return }
    closeForm(); fetchDisasters()
  }

  async function toggleActive(d) {
    await supabase.from('disasters').update({ is_active: !d.is_active }).eq('id', d.id)
    fetchDisasters()
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this disaster? This will cascade-delete all related areas, tasks, and resources.')) return
    await supabase.from('disasters').delete().eq('id', id)
    fetchDisasters()
  }

  const SEV_COLOR = { Low: 'sev-low', Medium: 'sev-medium', High: 'sev-high', Critical: 'sev-critical' }

  return (
    <div className="tab-section">
      {/* Toolbar */}
      <div className="tab-toolbar">
        <div className="tab-filters">
          {['all','active','resolved'].map(f => (
            <button key={f} className={`filter-btn${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button className="btn-add" onClick={openCreate} id="disaster-add-btn">➕ Add Disaster</button>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editId ? 'Edit Disaster' : 'New Disaster'}</h2>
              <button className="modal-close" onClick={closeForm}>✕</button>
            </div>
            {error && <div className="form-error">⚠️ {error}</div>}
            <form className="modal-form" onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group">
                  <label>Disaster Type *</label>
                  <input placeholder="e.g. Flood, Earthquake" value={form.type}
                    onChange={e => setForm(p => ({...p, type: e.target.value}))} required />
                </div>
                <div className="form-group">
                  <label>Region *</label>
                  <input placeholder="e.g. Kerala, Tamil Nadu" value={form.region}
                    onChange={e => setForm(p => ({...p, region: e.target.value}))} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Severity</label>
                  <select value={form.severity} onChange={e => setForm(p => ({...p, severity: e.target.value}))}>
                    {SEVERITIES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Date *</label>
                  <input type="date" value={form.date}
                    onChange={e => setForm(p => ({...p, date: e.target.value}))} required />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} placeholder="Optional details…" value={form.description}
                  onChange={e => setForm(p => ({...p, description: e.target.value}))} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={closeForm}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : editId ? 'Save Changes' : 'Create Disaster'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? <div className="ad-loading"><div className="ad-spinner" /></div> : (
        filtered.length === 0
          ? <div className="empty-state"><p>No disasters found.</p></div>
          : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Type</th><th>Region</th><th>Severity</th>
                    <th>Date</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(d => (
                    <tr key={d.id}>
                      <td className="td-id">#{d.id}</td>
                      <td><strong>{d.type}</strong></td>
                      <td>{d.region}</td>
                      <td><span className={`sev-badge ${SEV_COLOR[d.severity]}`}>{d.severity}</span></td>
                      <td>{d.date}</td>
                      <td>
                        <span className={`status-pill ${d.is_active ? 'pill-active' : 'pill-inactive'}`}>
                          {d.is_active ? 'Active' : 'Resolved'}
                        </span>
                      </td>
                      <td className="td-actions">
                        <button className="act-btn act-edit" onClick={() => openEdit(d)} title="Edit">✏️</button>
                        <button className="act-btn act-toggle" onClick={() => toggleActive(d)} title={d.is_active ? 'Mark Resolved' : 'Mark Active'}>
                          {d.is_active ? '🔒' : '🔓'}
                        </button>
                        <button className="act-btn act-del" onClick={() => handleDelete(d.id)} title="Delete">🗑️</button>
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
