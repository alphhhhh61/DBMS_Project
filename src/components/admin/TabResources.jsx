// src/components/admin/TabResources.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

const EMPTY = { disaster_id: '', type: 'Food', quantity: '' }
const RES_TYPES = ['Food', 'Medical', 'Shelter', 'Equipment', 'Water']
const ALLOC_COLOR = { 'Available': 'pill-active', 'Partially Allocated': 'pill-warn', 'Fully Allocated': 'pill-inactive' }

export default function TabResources() {
  const [resources, setResources] = useState([])
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
    const [rRes, dRes] = await Promise.all([
      supabase.from('resources').select('*, disasters(type, region)').order('created_at', { ascending: false }),
      supabase.from('disasters').select('id, type, region'),
    ])
    setResources(rRes.data || [])
    setDisasters(dRes.data || [])
    setLoading(false)
  }

  const filtered = filterDis === 'all' ? resources : resources.filter(r => String(r.disaster_id) === filterDis)

  function openCreate() { setForm(EMPTY); setEditId(null); setError(''); setShowForm(true) }
  function openEdit(r)  { setForm({ disaster_id: String(r.disaster_id), type: r.type, quantity: String(r.quantity) }); setEditId(r.id); setError(''); setShowForm(true) }
  function closeForm()  { setShowForm(false); setError('') }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.disaster_id || !form.quantity) { setError('Disaster and Quantity are required.'); return }
    setSaving(true); setError('')
    const payload = { disaster_id: parseInt(form.disaster_id), type: form.type, quantity: parseInt(form.quantity) }
    const { error: err } = editId
      ? await supabase.from('resources').update(payload).eq('id', editId)
      : await supabase.from('resources').insert(payload)
    setSaving(false)
    if (err) { setError(err.message); return }
    closeForm(); fetchAll()
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this resource?')) return
    await supabase.from('resources').delete().eq('id', id)
    fetchAll()
  }

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
        <button className="btn-add" onClick={openCreate} id="resource-add-btn">➕ Add Resource</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editId ? 'Edit Resource' : 'New Resource'}</h2>
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
                  <label>Resource Type</label>
                  <select value={form.type} onChange={e => setForm(p => ({...p, type: e.target.value}))}>
                    {RES_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantity *</label>
                  <input type="number" min="0" placeholder="e.g. 500" value={form.quantity}
                    onChange={e => setForm(p => ({...p, quantity: e.target.value}))} required />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={closeForm}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : editId ? 'Save Changes' : 'Add Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <div className="ad-loading"><div className="ad-spinner" /></div> : (
        filtered.length === 0
          ? <div className="empty-state"><p>No resources found.</p></div>
          : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>ID</th><th>Disaster</th><th>Type</th><th>Quantity</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id}>
                      <td className="td-id">#{r.id}</td>
                      <td><span className="tag-blue">{r.disasters?.type} – {r.disasters?.region}</span></td>
                      <td><strong>{r.type}</strong></td>
                      <td>{r.quantity.toLocaleString()}</td>
                      <td><span className={`status-pill ${ALLOC_COLOR[r.alloc_status]}`}>{r.alloc_status}</span></td>
                      <td className="td-actions">
                        <button className="act-btn act-edit" onClick={() => openEdit(r)} title="Edit">✏️</button>
                        <button className="act-btn act-del" onClick={() => handleDelete(r.id)} title="Delete">🗑️</button>
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
