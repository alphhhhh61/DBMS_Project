// src/pages/Login.jsx — Volunteer/General Login Page  Route: /login
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
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
      setError('Please enter your email and password.')
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
      setError(authError.message || 'Invalid credentials. Please try again.')
      return
    }

    // Role-based redirect from JWT user_metadata
    const role = data?.user?.user_metadata?.role
    if (role === 'admin') {
      navigate('/admin/dashboard')
    } else {
      navigate('/volunteer/dashboard')
    }
  }

  return (
    <div className="auth-page" id="login-page">
      {/* Background */}
      <div className="auth-bg" aria-hidden="true">
        <div className="auth-grid" />
        <div className="auth-glow auth-glow-1" />
        <div className="auth-glow auth-glow-2" />
      </div>

      {/* Back to home */}
      <Link to="/" className="auth-back-link" aria-label="Back to home">
        ← Back to Home
      </Link>

      <div className="auth-container">
        {/* Left panel — branding */}
        <div className="auth-panel auth-panel-left" aria-hidden="true">
          <div className="auth-panel-content">
            <div className="auth-brand">
              <div className="brand-icon" style={{ width: 52, height: 52, fontSize: '1.4rem' }}>🛡️</div>
              <span className="brand-text" style={{ fontSize: '1.3rem' }}><span>DMIS</span></span>
            </div>
            <h2 className="auth-panel-title">Welcome Back</h2>
            <p className="auth-panel-subtitle">
              Log in to access your dashboard and continue coordinating relief operations in real time.
            </p>
            <div className="auth-panel-features">
              <div className="auth-feature-item">
                <span className="auth-feature-icon">📡</span>
                <span>Real-time disaster feed</span>
              </div>
              <div className="auth-feature-item">
                <span className="auth-feature-icon">✅</span>
                <span>Task assignment &amp; tracking</span>
              </div>
              <div className="auth-feature-item">
                <span className="auth-feature-icon">🔔</span>
                <span>Instant notifications</span>
              </div>
              <div className="auth-feature-item">
                <span className="auth-feature-icon">🔒</span>
                <span>Secured with Supabase Auth</span>
              </div>
            </div>
            <div className="auth-panel-badge">
              <div className="status-dot" />
              <span>Supabase Auth · JWT Secured</span>
            </div>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="auth-panel auth-panel-right">
          <div className="auth-form-wrap">
            <div className="auth-form-header">
              <h1 className="auth-form-title">Sign In</h1>
              <p className="auth-form-subtitle">
                Don't have an account?{' '}
                <Link to="/register" className="auth-link" id="login-register-link">Register as Volunteer</Link>
              </p>
            </div>

            {error && (
              <div className="auth-error" role="alert" aria-live="assertive" id="login-error-msg">
                <span aria-hidden="true">⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form" noValidate id="login-form">
              <div className="form-group">
                <label className="form-label" htmlFor="login-email">Email Address</label>
                <div className="form-input-wrap">
                  <span className="form-input-icon" aria-hidden="true">✉️</span>
                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    className="form-input"
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                    required
                    aria-required="true"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="login-password">
                  Password
                </label>
                <div className="form-input-wrap">
                  <span className="form-input-icon" aria-hidden="true">🔑</span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Enter your password"
                    className="form-input"
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
                    id="login-toggle-password"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg btn-full"
                disabled={loading}
                id="login-submit-btn"
                aria-busy={loading}
              >
                {loading ? <span className="btn-spinner" aria-label="Signing in…" /> : null}
                {loading ? 'Signing In…' : 'Sign In'}
              </button>
            </form>

            <div className="auth-divider"><span>or</span></div>

            <div className="auth-alt-action">
              <Link to="/admin/login" className="btn btn-ghost btn-full" id="login-admin-link">
                🔐 Admin Login Panel
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
