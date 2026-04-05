// src/components/volunteer/VTabTaskUpdates.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'

const STATUS_ICON = { Pending: '⏳', Ongoing: '🔵', Completed: '✅' }
const STATUS_CLASS = { Pending: 'pill-warn', Ongoing: 'pill-blue', Completed: 'pill-active' }

export default function VTabTaskUpdates() {
  const { session } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null) // task id being updated
  const [toast, setToast] = useState('')

  useEffect(() => { fetchTasks() }, [])

  async function fetchTasks() {
    setLoading(true)
    const { data } = await supabase
      .from('assignments')
      .select(`
        id, status, volunteer_id,
        tasks (
          id, description, required_skill, status,
          disasters ( type, region ),
          affected_areas ( area_name )
        )
      `)
      .eq('volunteer_id', session?.user?.id)
      .eq('status', 'Active')
      .order('assigned_date', { ascending: false })
    setAssignments(data || [])
    setLoading(false)
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function markOngoing(assignment) {
    const taskId = assignment.tasks?.id
    if (!taskId) return
    setUpdating(taskId)
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'Ongoing' })
      .eq('id', taskId)
    setUpdating(null)
    if (error) { showToast('❌ Error: ' + error.message); return }
    showToast('🔵 Task marked as In Progress!')
    fetchTasks()
  }

  async function markCompleted(assignment) {
    const taskId = assignment.tasks?.id
    if (!taskId) return
    setUpdating(taskId)
    // Update task status AND assignment status together
    const [taskRes] = await Promise.all([
      supabase.from('tasks').update({ status: 'Completed' }).eq('id', taskId),
    ])
    await supabase.from('assignments').update({ status: 'Completed' }).eq('id', assignment.id)
    setUpdating(null)
    if (taskRes.error) { showToast('❌ Error: ' + taskRes.error.message); return }
    showToast('✅ Task marked as Completed!')
    fetchTasks()
  }

  if (loading) return <div className="ad-loading"><div className="ad-spinner" /></div>

  const pendingTasks   = assignments.filter(a => a.tasks?.status === 'Pending')
  const ongoingTasks   = assignments.filter(a => a.tasks?.status === 'Ongoing')

  return (
    <div className="tab-section">
      {/* Toast */}
      {toast && <div className="vd-toast">{toast}</div>}

      {assignments.length === 0 ? (
        <div className="empty-state">
          <p>🎉 No active tasks to update. All done or nothing assigned yet!</p>
        </div>
      ) : (
        <>
          {/* Pending Tasks */}
          {pendingTasks.length > 0 && (
            <div className="vd-update-section">
              <h3 className="vd-update-section-title">
                <span className="vd-section-dot vd-dot-yellow" /> ⏳ Pending Tasks — Start when ready
              </h3>
              <div className="vd-update-list">
                {pendingTasks.map(a => (
                  <div key={a.id} className="vd-update-card vd-card-pending">
                    <div className="vd-uc-info">
                      <div className="vd-uc-head">
                        <span className="status-pill pill-warn">⏳ Pending</span>
                        <span className="vd-task-id">Task #{a.tasks?.id}</span>
                      </div>
                      <p className="vd-uc-desc">{a.tasks?.description}</p>
                      <div className="vd-uc-meta">
                        <span>🌪️ {a.tasks?.disasters?.type} · {a.tasks?.disasters?.region}</span>
                        <span>📍 {a.tasks?.affected_areas?.area_name}</span>
                        <span className="tag-skill">🛠️ {a.tasks?.required_skill}</span>
                      </div>
                    </div>
                    <div className="vd-uc-actions">
                      <button
                        className="vd-btn-ongoing"
                        onClick={() => markOngoing(a)}
                        disabled={updating === a.tasks?.id}
                        id={`start-task-${a.tasks?.id}`}
                      >
                        {updating === a.tasks?.id ? 'Updating…' : '🔵 Start Task'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ongoing Tasks */}
          {ongoingTasks.length > 0 && (
            <div className="vd-update-section">
              <h3 className="vd-update-section-title">
                <span className="vd-section-dot vd-dot-blue" /> 🔵 In Progress — Mark done when complete
              </h3>
              <div className="vd-update-list">
                {ongoingTasks.map(a => (
                  <div key={a.id} className="vd-update-card vd-card-ongoing">
                    <div className="vd-uc-info">
                      <div className="vd-uc-head">
                        <span className="status-pill pill-blue">🔵 Ongoing</span>
                        <span className="vd-task-id">Task #{a.tasks?.id}</span>
                      </div>
                      <p className="vd-uc-desc">{a.tasks?.description}</p>
                      <div className="vd-uc-meta">
                        <span>🌪️ {a.tasks?.disasters?.type} · {a.tasks?.disasters?.region}</span>
                        <span>📍 {a.tasks?.affected_areas?.area_name}</span>
                        <span className="tag-skill">🛠️ {a.tasks?.required_skill}</span>
                      </div>
                    </div>
                    <div className="vd-uc-actions">
                      <button
                        className="vd-btn-complete"
                        onClick={() => markCompleted(a)}
                        disabled={updating === a.tasks?.id}
                        id={`complete-task-${a.tasks?.id}`}
                      >
                        {updating === a.tasks?.id ? 'Updating…' : '✅ Mark Complete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
