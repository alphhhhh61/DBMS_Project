// src/components/ProtectedRoute.jsx — Role-based route guard
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, requiredRole }) {
  const { session, role, loading } = useAuth()

  if (loading) {
    return (
      <div className="auth-loading" aria-label="Loading session…" role="status">
        <div className="auth-loading-spinner" aria-hidden="true" />
        <p>Loading…</p>
      </div>
    )
  }

  if (!session) {
    // Not logged in — redirect to appropriate login
    return <Navigate to={requiredRole === 'admin' ? '/admin/login' : '/login'} replace />
  }

  if (requiredRole && role !== requiredRole) {
    // Wrong role — redirect to their dashboard
    return <Navigate to={role === 'admin' ? '/admin/dashboard' : '/volunteer/dashboard'} replace />
  }

  return children
}
