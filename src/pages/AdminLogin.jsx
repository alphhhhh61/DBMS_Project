// src/pages/AdminLogin.jsx — Admin Login Panel  Route: /admin/login
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    if (error) setError('')
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Please enter your admin email and password.')
      return
    }
    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    })

    setLoading(false)

    if (authError) {
      setError(authError.message || 'Authentication failed. Check your credentials.')
      return
    }

    // Verify admin role from JWT user_metadata
    const role = data?.user?.user_metadata?.role
    if (role !== 'admin') {
      await supabase.auth.signOut()
      setError('Access denied. This panel is restricted to administrators only.')
      return
    }

    navigate('/admin/dashboard')
  }

  return (
    <div className="auth-page auth-page-admin" id="admin-login-page">
      {/* Background */}
      <div className="auth-bg" aria-hidden="true">
        <div className="auth-grid auth-grid-red" />
        <div className="auth-glow auth-glow-admin-1" />
        <div className="auth-glow auth-glow-admin-2" />
      </div>

      <Link to="/" className="auth-back-link" aria-label="Back to home">← Back to Home</Link>

      <div className="auth-container auth-container-narrow">
        {/* Left panel */}
        <div className="auth-panel auth-panel-left auth-panel-admin" aria-hidden="true">
          <div className="auth-panel-content">
            <div className="auth-brand">
              <div className="brand-icon brand-icon-red" style={{ width: 52, height: 52, fontSize: '1.4rem' }}>🛡️</div>
              <span className="brand-text" style={{ fontSize: '1.3rem' }}><span>DMIS</span></span>
            </div>
            <h2 className="auth-panel-title">Admin Portal</h2>
            <p className="auth-panel-subtitle">
              Restricted access for authorized administrators only. Full operational control over disasters, volunteers, and resources.
            </p>
            <div className="auth-panel-features">
              <div className="auth-feature-item">
                <span className="auth-feature-icon">🌪️</span>
                <span>Disaster lifecycle management</span>
              </div>
              <div className="auth-feature-item">
                <span className="auth-feature-icon">🔗</span>
                <span>Volunteer assignment engine</span>
              </div>
              <div className="auth-feature-item">
                <span className="auth-feature-icon">📦</span>
                <span>Resource allocation control</span>
              </div>
              <div className="auth-feature-item">
                <span className="auth-feature-icon">📈</span>
                <span>Reports &amp; analytics</span>
              </div>
            </div>
            <div className="auth-admin-warning" role="note" aria-label="Admin access warning">
              <span aria-hidden="true">⚠️</span>
              <span>Admin accounts are manually created. Contact your system administrator if you need access.</span>
            </div>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="auth-panel auth-panel-right">
          <div className="auth-form-wrap">
            <div className="auth-form-header">
              <div className="admin-badge" aria-label="Restricted admin access">
                <span aria-hidden="true">🔐</span> Restricted Access
              </div>
              <h1 className="auth-form-title">Admin Sign In</h1>
              <p className="auth-form-subtitle">
                Volunteer? <Link to="/login" className="auth-link" id="admin-volunteer-link">Sign in here instead</Link>
              </p>
            </div>

            {error && (
              <div className="auth-error auth-error-critical" role="alert" aria-live="assertive" id="admin-error-msg">
                <span aria-hidden="true">🚫</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form" noValidate id="admin-login-form">
              <div className="form-group">
                <label className="form-label" htmlFor="admin-email">Admin Email</label>
                <div className="form-input-wrap">
                  <span className="form-input-icon" aria-hidden="true">✉️</span>
                  <input
                    id="admin-email"
                    type="email"
                    name="email"
                    placeholder="admin@dmis.gov.in"
                    className="form-input form-input-admin"
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                    required
                    aria-required="true"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="admin-password">Admin Password</label>
                <div className="form-input-wrap">
                  <span className="form-input-icon" aria-hidden="true">🔑</span>
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Enter admin password"
                    className="form-input form-input-admin"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    required
                    aria-required="true"
                  />
                  <button
                    type="button"
                    className="form-eye-btn"
                    onClick={() => setShowPassword(p => !p)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    id="admin-toggle-password"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="admin-security-notice" aria-label="Security notice">
                <span aria-hidden="true">🔒</span>
                <span>This session is monitored. Unauthorized access attempts are logged.</span>
              </div>

              <button
                type="submit"
                className="btn btn-admin btn-lg btn-full"
                disabled={loading}
                id="admin-submit-btn"
                aria-busy={loading}
              >
                {loading ? <span className="btn-spinner" aria-label="Authenticating…" /> : null}
                {loading ? 'Authenticating…' : '🔐 Access Admin Dashboard'}
              </button>
            </form>

            <div className="auth-divider"><span>or</span></div>

            <div className="auth-alt-action">
              <Link to="/login" className="btn btn-ghost btn-full" id="admin-volunteer-signin">
                🤝 Volunteer Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
