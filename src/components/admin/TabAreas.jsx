// src/components/admin/TabAreas.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

const EMPTY = { disaster_id: '', area_name: '', urgency: 'Low', latitude: '', longitude: '' }
const URGENCIES = ['Low', 'Moderate', 'Critical']

export default function TabAreas() {
  const [areas, setAreas] = useState([])
  const [disasters, setDisasters] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filterDis, setFilterDis] = useState('all')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [aRes, dRes] = await Promise.all([
      supabase.from('affected_areas').select('*, disasters(type, region)').order('created_at', { ascending: false }),
      supabase.from('disasters').select('id, type, region').eq('is_active', true),
    ])
    setAreas(aRes.data || [])
    setDisasters(dRes.data || [])
    setLoading(false)
  }

  const filtered = filterDis === 'all' ? areas : areas.filter(a => String(a.disaster_id) === filterDis)

  function openCreate() { setForm(EMPTY); setEditId(null); setError(''); setShowForm(true) }
  function openEdit(a)  {
    setForm({ disaster_id: String(a.disaster_id), area_name: a.area_name, urgency: a.urgency,
      latitude: a.latitude || '', longitude: a.longitude || '' })
    setEditId(a.id); setError(''); setShowForm(true)
  }
  function closeForm() { setShowForm(false); setError('') }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.disaster_id || !form.area_name) { setError('Disaster and Area Name are required.'); return }
    setSaving(true); setError('')
    const payload = {
      disaster_id: parseInt(form.disaster_id),
      area_name: form.area_name,
      urgency: form.urgency,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
    }
    const { error: err } = editId
      ? await supabase.from('affected_areas').update(payload).eq('id', editId)
      : await supabase.from('affected_areas').insert(payload)
    setSaving(false)
    if (err) { setError(err.message); return }
    closeForm(); fetchAll()
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this area? Related tasks will also be deleted.')) return
    await supabase.from('affected_areas').delete().eq('id', id)
    fetchAll()
  }

  const URG_COLOR = { Low: 'sev-low', Moderate: 'sev-medium', Critical: 'sev-critical' }

  return (
    <div className="tab-section">
      <div className="tab-toolbar">
        <div className="tab-filters">
          <button className={`filter-btn${filterDis === 'all' ? ' active' : ''}`} onClick={() => setFilterDis('all')}>All</button>
          {disasters.map(d => (
            <button key={d.id} className={`filter-btn${filterDis === String(d.id) ? ' active' : ''}`}
              onClick={() => setFilterDis(String(d.id))}>
              {d.type} – {d.region}
            </button>
          ))}
        </div>
        <button className="btn-add" onClick={openCreate} id="area-add-btn">➕ Add Area</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editId ? 'Edit Affected Area' : 'New Affected Area'}</h2>
              <button className="modal-close" onClick={closeForm}>✕</button>
            </div>
            {error && <div className="form-error">⚠️ {error}</div>}
            <form className="modal-form" onSubmit={handleSave}>
              <div className="form-group">
                <label>Disaster *</label>
                <select value={form.disaster_id} onChange={e => setForm(p => ({...p, disaster_id: e.target.value}))} required>
                  <option value="">Select a disaster…</option>
                  {disasters.map(d => <option key={d.id} value={d.id}>{d.type} – {d.region}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Area Name *</label>
                  <input placeholder="e.g. Alappuzha District" value={form.area_name}
                    onChange={e => setForm(p => ({...p, area_name: e.target.value}))} required />
                </div>
                <div className="form-group">
                  <label>Urgency</label>
                  <select value={form.urgency} onChange={e => setForm(p => ({...p, urgency: e.target.value}))}>
                    {URGENCIES.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Latitude (optional)</label>
                  <input type="number" step="any" placeholder="e.g. 9.4981" value={form.latitude}
                    onChange={e => setForm(p => ({...p, latitude: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label>Longitude (optional)</label>
                  <input type="number" step="any" placeholder="e.g. 76.3388" value={form.longitude}
                    onChange={e => setForm(p => ({...p, longitude: e.target.value}))} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={closeForm}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : editId ? 'Save Changes' : 'Add Area'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <div className="ad-loading"><div className="ad-spinner" /></div> : (
        filtered.length === 0
          ? <div className="empty-state"><p>No affected areas found.</p></div>
          : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>ID</th><th>Disaster</th><th>Area Name</th><th>Urgency</th><th>Coordinates</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filtered.map(a => (
                    <tr key={a.id}>
                      <td className="td-id">#{a.id}</td>
                      <td><span className="tag-blue">{a.disasters?.type} – {a.disasters?.region}</span></td>
                      <td><strong>{a.area_name}</strong></td>
                      <td><span className={`sev-badge ${URG_COLOR[a.urgency]}`}>{a.urgency}</span></td>
                      <td className="td-coords">
                        {a.latitude && a.longitude ? `${a.latitude}, ${a.longitude}` : <span className="muted">—</span>}
                      </td>
                      <td className="td-actions">
                        <button className="act-btn act-edit" onClick={() => openEdit(a)} title="Edit">✏️</button>
                        <button className="act-btn act-del" onClick={() => handleDelete(a.id)} title="Delete">🗑️</button>
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
