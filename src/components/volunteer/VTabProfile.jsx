// src/components/volunteer/VTabProfile.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'

const SKILL_OPTIONS = ['Medical', 'Logistics', 'Search & Rescue', 'Communications', 'Engineering', 'Driving', 'IT', 'First Aid', 'Cooking', 'Teaching']

export default function VTabProfile() {
  const { session } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [form, setForm] = useState({})
  const [skillInput, setSkillInput] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { fetchProfile() }, [])

  async function fetchProfile() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session?.user?.id)
      .single()
    setProfile(data)
    setForm({
      full_name: data?.full_name || '',
      phone: data?.phone || '',
      region: data?.region || '',
      skills: data?.skills || [],
    })
    setLoading(false)
  }

  async function toggleAvailability() {
    setToggling(true)
    await supabase.from('profiles').update({ availability: !profile.availability }).eq('id', session.user.id)
    setProfile(p => ({ ...p, availability: !p.availability }))
    setToggling(false)
  }

  function addSkill(skill) {
    const s = skill.trim()
    if (!s || form.skills.includes(s)) return
    setForm(p => ({ ...p, skills: [...p.skills, s] }))
    setSkillInput('')
  }

  function removeSkill(skill) {
    setForm(p => ({ ...p, skills: p.skills.filter(s => s !== skill) }))
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.full_name.trim()) { setError('Name is required.'); return }
    setSaving(true); setError(''); setSuccess('')
    const { error: err } = await supabase.from('profiles').update({
      full_name: form.full_name.trim(),
      phone: form.phone.trim() || null,
      region: form.region.trim() || null,
      skills: form.skills,
    }).eq('id', session.user.id)
    setSaving(false)
    if (err) { setError(err.message); return }
    setSuccess('Profile updated successfully!')
    setEditing(false)
    fetchProfile()
    setTimeout(() => setSuccess(''), 3000)
  }

  const email = session?.user?.email || ''
  const initials = (profile?.full_name || email || 'V').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  if (loading) return <div className="ad-loading"><div className="ad-spinner" /></div>

  return (
    <div className="vd-profile-layout">
      {/* ── Left — Avatar card ── */}
      <div className="vd-avatar-card">
        <div className="vd-avatar-circle">{initials}</div>
        <h2 className="vd-profile-name">{profile?.full_name || 'Volunteer'}</h2>
        <p className="vd-profile-email">{email}</p>

        <div className="vd-avail-wrap">
          <span className={`status-pill ${profile?.availability ? 'pill-active' : 'pill-inactive'}`}>
            {profile?.availability ? '🟢 Available' : '🔴 Unavailable'}
          </span>
          <button
            className={`vd-avail-btn ${profile?.availability ? 'btn-avail-off' : 'btn-avail-on'}`}
            onClick={toggleAvailability}
            disabled={toggling}
            id="vol-toggle-avail"
          >
            {toggling ? 'Updating…' : profile?.availability ? 'Mark Unavailable' : 'Mark Available'}
          </button>
        </div>

        <div className="vd-stat-row">
          <div className="vd-mini-stat">
            <p className="vd-mini-val">{profile?.region || '—'}</p>
            <p className="vd-mini-label">📍 Region</p>
          </div>
          <div className="vd-mini-stat">
            <p className="vd-mini-val">{(profile?.skills || []).length}</p>
            <p className="vd-mini-label">🛠️ Skills</p>
          </div>
        </div>
      </div>

      {/* ── Right — Details ── */}
      <div className="vd-details-card">
        <div className="vd-card-header">
          <h3 className="vd-card-title">Personal Details</h3>
          {!editing && (
            <button className="btn-edit-profile" onClick={() => { setEditing(true); setError(''); setSuccess('') }} id="vol-edit-btn">
              ✏️ Edit Profile
            </button>
          )}
        </div>

        {error && <div className="form-error">⚠️ {error}</div>}
        {success && <div className="form-success">{success}</div>}

        {editing ? (
          <form className="vd-edit-form" onSubmit={handleSave}>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} placeholder="Your full name" required />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+91 98765 43210" />
              </div>
            </div>
            <div className="form-group">
              <label>Region</label>
              <input value={form.region} onChange={e => setForm(p => ({ ...p, region: e.target.value }))} placeholder="e.g. Kerala, Chennai" />
            </div>

            {/* Skills */}
            <div className="form-group">
              <label>Skills</label>
              <div className="vd-skills-editor">
                <div className="vd-skills-tags">
                  {form.skills.map(s => (
                    <span key={s} className="tag-skill tag-removable">
                      {s}
                      <button type="button" className="tag-remove" onClick={() => removeSkill(s)}>×</button>
                    </span>
                  ))}
                </div>
                <div className="vd-skill-add-row">
                  <select value={skillInput} onChange={e => setSkillInput(e.target.value)}>
                    <option value="">Select a skill…</option>
                    {SKILL_OPTIONS.filter(s => !form.skills.includes(s)).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button type="button" className="btn-add-skill" onClick={() => addSkill(skillInput)}>+ Add</button>
                </div>
                <div className="vd-skill-manual">
                  <input placeholder="Or type custom skill…" value={skillInput} onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput) } }} />
                </div>
              </div>
            </div>

            <div className="vd-form-actions">
              <button type="button" className="btn-ghost" onClick={() => { setEditing(false); setError('') }}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving} id="vol-save-btn">
                {saving ? 'Saving…' : '💾 Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="vd-info-grid">
            <div className="vd-info-item">
              <span className="vd-info-icon">👤</span>
              <div>
                <p className="vd-info-label">Full Name</p>
                <p className="vd-info-val">{profile?.full_name || '—'}</p>
              </div>
            </div>
            <div className="vd-info-item">
              <span className="vd-info-icon">✉️</span>
              <div>
                <p className="vd-info-label">Email</p>
                <p className="vd-info-val">{email}</p>
              </div>
            </div>
            <div className="vd-info-item">
              <span className="vd-info-icon">📞</span>
              <div>
                <p className="vd-info-label">Phone</p>
                <p className="vd-info-val">{profile?.phone || '—'}</p>
              </div>
            </div>
            <div className="vd-info-item">
              <span className="vd-info-icon">📍</span>
              <div>
                <p className="vd-info-label">Region</p>
                <p className="vd-info-val">{profile?.region || '—'}</p>
              </div>
            </div>

            <div className="vd-info-item vd-info-full">
              <span className="vd-info-icon">🛠️</span>
              <div>
                <p className="vd-info-label">Skills</p>
                <div className="vd-skills-display">
                  {(profile?.skills || []).length > 0
                    ? profile.skills.map(s => <span key={s} className="tag-skill">{s}</span>)
                    : <span className="muted">No skills listed — click Edit Profile to add</span>
                  }
                </div>
              </div>
            </div>

            <div className="vd-info-item">
              <span className="vd-info-icon">📅</span>
              <div>
                <p className="vd-info-label">Member Since</p>
                <p className="vd-info-val">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
