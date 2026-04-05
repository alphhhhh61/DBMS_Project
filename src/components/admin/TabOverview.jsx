// src/components/admin/TabOverview.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function TabOverview() {
  const [stats, setStats] = useState({ disasters: 0, volunteers: 0, tasks: 0, resources: 0 })
  const [disasters, setDisasters] = useState([])
  const [severityDist, setSeverityDist] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()

    // Realtime: refresh on disaster/task changes
    const ch = supabase.channel('overview-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'disasters' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchAll)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  async function fetchAll() {
    setLoading(true)
    const [disRes, volRes, taskRes, resRes] = await Promise.all([
      supabase.from('disasters').select('id, type, region, severity, date, is_active').order('date', { ascending: false }),
      supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'volunteer').eq('availability', true),
      supabase.from('tasks').select('id, status', { count: 'exact' }),
      supabase.from('resources').select('id, alloc_status', { count: 'exact' }),
    ])

    const allDisasters = disRes.data || []
    const allTasks = taskRes.data || []

    setDisasters(allDisasters.slice(0, 5))
    setStats({
      disasters: allDisasters.filter(d => d.is_active).length,
      volunteers: volRes.count || 0,
      tasks: allTasks.filter(t => t.status === 'Pending' || t.status === 'Ongoing').length,
      resources: (resRes.data || []).filter(r => r.alloc_status === 'Available').length,
    })

    // Severity distribution for chart
    const dist = ['Low','Medium','High','Critical'].map(s => ({
      label: s,
      count: allDisasters.filter(d => d.severity === s).length,
    }))
    setSeverityDist(dist)
    setLoading(false)
  }

  const SEVERITY_COLOR = { Low: '#22c55e', Medium: '#eab308', High: '#f97316', Critical: '#ef4444' }
  const maxCount = Math.max(...severityDist.map(d => d.count), 1)

  if (loading) return <div className="ad-loading"><div className="ad-spinner" /></div>

  return (
    <div className="tab-overview">
      {/* ── KPI Cards ── */}
      <div className="overview-kpi-grid">
        <div className="kpi-card kpi-red">
          <div className="kpi-icon">🌪️</div>
          <div className="kpi-body">
            <p className="kpi-value">{stats.disasters}</p>
            <p className="kpi-label">Active Disasters</p>
          </div>
        </div>
        <div className="kpi-card kpi-blue">
          <div className="kpi-icon">🤝</div>
          <div className="kpi-body">
            <p className="kpi-value">{stats.volunteers}</p>
            <p className="kpi-label">Available Volunteers</p>
          </div>
        </div>
        <div className="kpi-card kpi-yellow">
          <div className="kpi-icon">📋</div>
          <div className="kpi-body">
            <p className="kpi-value">{stats.tasks}</p>
            <p className="kpi-label">Tasks Ongoing</p>
          </div>
        </div>
        <div className="kpi-card kpi-green">
          <div className="kpi-icon">📦</div>
          <div className="kpi-body">
            <p className="kpi-value">{stats.resources}</p>
            <p className="kpi-label">Resources Available</p>
          </div>
        </div>
      </div>

      {/* ── Charts row ── */}
      <div className="overview-charts-row">
        {/* Severity bar chart */}
        <div className="chart-card">
          <h3 className="chart-title">Disaster Severity Distribution</h3>
          <div className="bar-chart">
            {severityDist.map(d => (
              <div key={d.label} className="bar-group">
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      height: `${(d.count / maxCount) * 140}px`,
                      background: SEVERITY_COLOR[d.label],
                    }}
                  />
                </div>
                <p className="bar-label">{d.label}</p>
                <p className="bar-value">{d.count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent disasters list */}
        <div className="chart-card">
          <h3 className="chart-title">Recent Disasters</h3>
          {disasters.length === 0 ? (
            <p className="empty-msg">No disasters recorded yet.</p>
          ) : (
            <div className="recent-list">
              {disasters.map(d => (
                <div key={d.id} className="recent-item">
                  <div className="recent-item-left">
                    <span className={`sev-badge sev-${d.severity.toLowerCase()}`}>{d.severity}</span>
                    <div>
                      <p className="recent-name">{d.type}</p>
                      <p className="recent-sub">{d.region}</p>
                    </div>
                  </div>
                  <span className={`status-pill ${d.is_active ? 'pill-active' : 'pill-inactive'}`}>
                    {d.is_active ? 'Active' : 'Resolved'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
