// src/components/admin/TabReports.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function TabReports() {
  const [disasters, setDisasters] = useState([])
  const [selected, setSelected] = useState(null)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [repLoading, setRepLoading] = useState(false)

  useEffect(() => {
    supabase.from('disasters').select('id, type, region, severity, date, is_active').order('date', { ascending: false })
      .then(({ data }) => { setDisasters(data || []); setLoading(false) })
  }, [])

  async function loadReport(dis) {
    setSelected(dis); setRepLoading(true); setReport(null)
    const [tRes, aRes, rRes, volRes, assignRes] = await Promise.all([
      supabase.from('tasks').select('id, status, required_skill').eq('disaster_id', dis.id),
      supabase.from('affected_areas').select('id, area_name, urgency').eq('disaster_id', dis.id),
      supabase.from('resources').select('id, type, quantity, alloc_status').eq('disaster_id', dis.id),
      supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'volunteer'),
      supabase.from('assignments').select('id, status, volunteer_id, task_id, tasks!inner(id, disaster_id)').eq('tasks.disaster_id', dis.id),
    ])
    const tasks = tRes.data || []
    setReport({
      tasks,
      areas: aRes.data || [],
      resources: rRes.data || [],
      totalVols: volRes.count || 0,
      assignments: assignRes.data || [],
      taskStats: {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'Pending').length,
        ongoing: tasks.filter(t => t.status === 'Ongoing').length,
        completed: tasks.filter(t => t.status === 'Completed').length,
      }
    })
    setRepLoading(false)
  }

  if (loading) return <div className="ad-loading"><div className="ad-spinner" /></div>

  return (
    <div className="tab-section reports-layout">
      {/* Disaster selector */}
      <div className="report-sidebar">
        <h3 className="report-sidebar-title">Select Disaster</h3>
        {disasters.map(d => (
          <button key={d.id}
            className={`report-disaster-btn${selected?.id === d.id ? ' active' : ''}`}
            onClick={() => loadReport(d)}
          >
            <span className={`sev-badge sev-${d.severity.toLowerCase()}`}>{d.severity}</span>
            <div>
              <p className="report-dis-name">{d.type}</p>
              <p className="report-dis-region">{d.region} · {d.date}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Report panel */}
      <div className="report-panel">
        {!selected && <div className="empty-state"><p>← Select a disaster to view its report.</p></div>}
        {repLoading && <div className="ad-loading"><div className="ad-spinner" /></div>}
        {report && selected && (
          <>
            <div className="report-header">
              <h2 className="report-title">{selected.type} — {selected.region}</h2>
              <span className={`status-pill ${selected.is_active ? 'pill-active' : 'pill-inactive'}`}>
                {selected.is_active ? 'Active' : 'Resolved'}
              </span>
            </div>

            {/* Task stats */}
            <div className="report-kpi-row">
              <div className="report-kpi"><p className="rk-val">{report.taskStats.total}</p><p className="rk-label">Total Tasks</p></div>
              <div className="report-kpi rk-yellow"><p className="rk-val">{report.taskStats.pending}</p><p className="rk-label">Pending</p></div>
              <div className="report-kpi rk-blue"><p className="rk-val">{report.taskStats.ongoing}</p><p className="rk-label">Ongoing</p></div>
              <div className="report-kpi rk-green"><p className="rk-val">{report.taskStats.completed}</p><p className="rk-label">Completed</p></div>
              <div className="report-kpi"><p className="rk-val">{report.areas.length}</p><p className="rk-label">Affected Areas</p></div>
              <div className="report-kpi"><p className="rk-val">{report.assignments.length}</p><p className="rk-label">Assignments</p></div>
            </div>

            {/* Affected Areas */}
            <h3 className="report-section-title">📍 Affected Areas</h3>
            {report.areas.length === 0 ? <p className="muted">None</p> : (
              <div className="report-table-wrap">
                <table className="data-table">
                  <thead><tr><th>Area</th><th>Urgency</th></tr></thead>
                  <tbody>
                    {report.areas.map(a => (
                      <tr key={a.id}>
                        <td>{a.area_name}</td>
                        <td><span className={`sev-badge sev-${a.urgency === 'Moderate' ? 'medium' : a.urgency.toLowerCase()}`}>{a.urgency}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Resources */}
            <h3 className="report-section-title">📦 Resources</h3>
            {report.resources.length === 0 ? <p className="muted">None</p> : (
              <div className="report-table-wrap">
                <table className="data-table">
                  <thead><tr><th>Type</th><th>Quantity</th><th>Status</th></tr></thead>
                  <tbody>
                    {report.resources.map(r => (
                      <tr key={r.id}>
                        <td>{r.type}</td>
                        <td>{r.quantity.toLocaleString()}</td>
                        <td><span className="tag-skill">{r.alloc_status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tasks breakdown */}
            <h3 className="report-section-title">✅ Tasks Breakdown</h3>
            {report.tasks.length === 0 ? <p className="muted">None</p> : (
              <div className="report-table-wrap">
                <table className="data-table">
                  <thead><tr><th>#</th><th>Required Skill</th><th>Status</th></tr></thead>
                  <tbody>
                    {report.tasks.map(t => (
                      <tr key={t.id}>
                        <td className="td-id">#{t.id}</td>
                        <td><span className="tag-skill">{t.required_skill}</span></td>
                        <td><span className={`status-pill ${t.status === 'Completed' ? 'pill-active' : t.status === 'Ongoing' ? 'pill-blue' : 'pill-warn'}`}>{t.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
