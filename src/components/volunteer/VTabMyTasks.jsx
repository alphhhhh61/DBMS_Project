// src/components/volunteer/VTabMyTasks.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'

const STATUS_CLASS = { Pending: 'pill-warn', Ongoing: 'pill-blue', Completed: 'pill-active' }
const STATUS_ICON  = { Pending: '⏳', Ongoing: '🔵', Completed: '✅' }
const SEV_CLASS    = { Low: 'sev-low', Medium: 'sev-medium', High: 'sev-high', Critical: 'sev-critical' }

export default function VTabMyTasks() {
  const { session } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => { fetchTasks() }, [])

  async function fetchTasks() {
    setLoading(true)
    const { data } = await supabase
      .from('assignments')
      .select(`
        id, status, assigned_date,
        tasks (
          id, description, required_skill, status,
          disasters ( type, region, severity ),
          affected_areas ( area_name, urgency )
        )
      `)
      .eq('volunteer_id', session?.user?.id)
      .order('assigned_date', { ascending: false })
    setAssignments(data || [])
    setLoading(false)
  }

  const filtered = filter === 'all'
    ? assignments
    : assignments.filter(a => a.tasks?.status === filter || a.status === filter)

  const stats = {
    total: assignments.length,
    active: assignments.filter(a => a.tasks?.status !== 'Completed' && a.status === 'Active').length,
    completed: assignments.filter(a => a.tasks?.status === 'Completed').length,
  }

  if (loading) return <div className="ad-loading"><div className="ad-spinner" /></div>

  return (
    <div className="tab-section">
      {/* Stats banner */}
      <div className="vd-task-stats">
        <div className="vd-task-stat vd-stat-total">
          <p className="vd-ts-val">{stats.total}</p>
          <p className="vd-ts-label">Total Assigned</p>
        </div>
        <div className="vd-task-stat vd-stat-active">
          <p className="vd-ts-val">{stats.active}</p>
          <p className="vd-ts-label">Active Tasks</p>
        </div>
        <div className="vd-task-stat vd-stat-done">
          <p className="vd-ts-val">{stats.completed}</p>
          <p className="vd-ts-label">Completed</p>
        </div>
      </div>

      {/* Filter */}
      <div className="tab-toolbar" style={{ marginTop: '1.25rem' }}>
        <div className="tab-filters">
          {['all', 'Pending', 'Ongoing', 'Completed'].map(f => (
            <button key={f} className={`filter-btn${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : `${STATUS_ICON[f]} ${f}`}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>🎯 {filter === 'all' ? 'No tasks assigned yet. Check back after admin assigns you.' : `No ${filter} tasks.`}</p>
        </div>
      ) : (
        <div className="vd-task-grid">
          {filtered.map(a => {
            const t = a.tasks
            if (!t) return null
            return (
              <div key={a.id} className={`vd-task-card${t.status === 'Completed' ? ' vd-task-done' : ''}`}>
                <div className="vd-task-card-header">
                  <div className="vd-task-badges">
                    {t.disasters && (
                      <span className={`sev-badge ${SEV_CLASS[t.disasters.severity]}`}>{t.disasters.severity}</span>
                    )}
                    <span className={`status-pill ${STATUS_CLASS[t.status]}`}>
                      {STATUS_ICON[t.status]} {t.status}
                    </span>
                  </div>
                  <span className="vd-task-id">Task #{t.id}</span>
                </div>

                <p className="vd-task-description">{t.description}</p>

                <div className="vd-task-meta">
                  <div className="vd-meta-item">
                    <span className="vd-meta-icon">🌪️</span>
                    <span>{t.disasters?.type} · {t.disasters?.region}</span>
                  </div>
                  <div className="vd-meta-item">
                    <span className="vd-meta-icon">📍</span>
                    <span>{t.affected_areas?.area_name}</span>
                  </div>
                  <div className="vd-meta-item">
                    <span className="vd-meta-icon">📅</span>
                    <span>Assigned: {new Date(a.assigned_date).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>

                <div className="vd-task-footer">
                  <span className="tag-skill">🛠️ {t.required_skill}</span>
                  {a.status !== 'Active' && (
                    <span className={`status-pill ${a.status === 'Completed' ? 'pill-active' : 'pill-inactive'}`}>
                      {a.status}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
