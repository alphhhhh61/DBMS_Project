// src/components/admin/TabVolunteers.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function TabVolunteers() {
  const [volunteers, setVolunteers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterAvail, setFilterAvail] = useState('all')

  useEffect(() => { fetchVolunteers() }, [])

  async function fetchVolunteers() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'volunteer')
      .order('created_at', { ascending: false })
    setVolunteers(data || [])
    setLoading(false)
  }

  async function toggleAvailability(v) {
    await supabase.from('profiles').update({ availability: !v.availability }).eq('id', v.id)
    fetchVolunteers()
  }

  const filtered = volunteers.filter(v => {
    const matchSearch = !search ||
      v.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      v.region?.toLowerCase().includes(search.toLowerCase()) ||
      (v.skills || []).some(s => s.toLowerCase().includes(search.toLowerCase()))
    const matchAvail = filterAvail === 'all' ? true :
      filterAvail === 'available' ? v.availability : !v.availability
    return matchSearch && matchAvail
  })

  return (
    <div className="tab-section">
      <div className="tab-toolbar">
        <div className="tab-filters">
          {['all', 'available', 'unavailable'].map(f => (
            <button key={f} className={`filter-btn${filterAvail === f ? ' active' : ''}`}
              onClick={() => setFilterAvail(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="Search by name, region, skill…"
            value={search} onChange={e => setSearch(e.target.value)} id="volunteer-search" />
        </div>
      </div>

      {loading ? <div className="ad-loading"><div className="ad-spinner" /></div> : (
        filtered.length === 0
          ? <div className="empty-state"><p>No volunteers found.</p></div>
          : (
            <div className="volunteer-grid">
              {filtered.map(v => (
                <div key={v.id} className="vol-card">
                  <div className="vol-card-header">
                    <div className="vol-avatar">{(v.full_name || 'V')[0].toUpperCase()}</div>
                    <div>
                      <p className="vol-name">{v.full_name}</p>
                      <p className="vol-region">📍 {v.region || '—'}</p>
                    </div>
                    <span className={`status-pill ${v.availability ? 'pill-active' : 'pill-inactive'}`}>
                      {v.availability ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <div className="vol-skills">
                    {(v.skills || []).length > 0
                      ? v.skills.map(s => <span key={s} className="tag-skill">{s}</span>)
                      : <span className="muted">No skills listed</span>
                    }
                  </div>
                  <div className="vol-card-footer">
                    <p className="vol-phone">📞 {v.phone || '—'}</p>
                    <button
                      className={`btn-toggle-avail ${v.availability ? 'btn-toggle-off' : 'btn-toggle-on'}`}
                      onClick={() => toggleAvailability(v)}
                      id={`toggle-avail-${v.id}`}
                    >
                      {v.availability ? 'Mark Unavailable' : 'Mark Available'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
      )}
    </div>
  )
}
