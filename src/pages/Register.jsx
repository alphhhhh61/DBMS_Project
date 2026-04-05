// src/pages/Register.jsx — Volunteer Registration  Route: /register
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const SKILLS_OPTIONS = [
  'First Aid', 'Medical', 'Search & Rescue', 'Firefighting',
  'Logistics', 'Driving', 'IT & Communications', 'Counselling',
  'Construction', 'Water & Sanitation', 'Food Distribution', 'Translation',
]

export default function Register() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 2-step form
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    region: '',
    skills: [],
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    if (error) setError('')
  }

  const toggleSkill = skill => {
    setForm(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill],
    }))
  }

  const validateStep1 = () => {
    if (!form.fullName.trim()) return 'Full name is required.'
    if (!form.email.trim()) return 'Email address is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Enter a valid email address.'
    if (!form.phone.trim()) return 'Phone number is required.'
    if (!form.region.trim()) return 'Region is required.'
    return null
  }

  const validateStep2 = () => {
    if (form.skills.length === 0) return 'Select at least one skill.'
    if (!form.password) return 'Password is required.'
    if (form.password.length < 8) return 'Password must be at least 8 characters.'
    if (form.password !== form.confirmPassword) return 'Passwords do not match.'
    return null
  }

  const handleNext = () => {
    const err = validateStep1()
    if (err) { setError(err); return }
    setError('')
    setStep(2)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const err = validateStep2()
    if (err) { setError(err); return }

    setLoading(true)
    setError('')

    // signUp with user_metadata.role = 'volunteer' as per layout.md
    const { error: authError } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: {
          full_name: form.fullName.trim(),
          role: 'volunteer',
          phone: form.phone.trim(),
          region: form.region.trim(),
          skills: form.skills,
        },
      },
    })

    setLoading(false)

    if (authError) {
      setError(authError.message || 'Registration failed. Please try again.')
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <div className="auth-page" id="register-success-page">
        <div className="auth-bg" aria-hidden="true">
          <div className="auth-grid" />
          <div className="auth-glow auth-glow-1" />
        </div>
        <div className="auth-success-card" role="main" aria-label="Registration successful">
          <div className="auth-success-icon" aria-hidden="true">✅</div>
          <h1 className="auth-success-title">Registration Successful!</h1>
          <p className="auth-success-msg">
            Welcome to DMIS, <strong>{form.fullName}</strong>!<br />
            Please check your email <strong>{form.email}</strong> to confirm your account before signing in.
          </p>
          <div className="auth-success-actions">
            <Link to="/login" className="btn btn-primary btn-lg" id="success-login-btn">Sign In Now</Link>
            <Link to="/" className="btn btn-ghost btn-lg" id="success-home-btn">Back to Home</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page" id="register-page">
      <div className="auth-bg" aria-hidden="true">
        <div className="auth-grid" />
        <div className="auth-glow auth-glow-1" />
        <div className="auth-glow auth-glow-2" />
      </div>

      <Link to="/" className="auth-back-link" aria-label="Back to home">← Back to Home</Link>

      <div className="auth-container">
        {/* Left panel */}
        <div className="auth-panel auth-panel-left" aria-hidden="true">
          <div className="auth-panel-content">
            <div className="auth-brand">
              <div className="brand-icon" style={{ width: 52, height: 52, fontSize: '1.4rem' }}>🛡️</div>
              <span className="brand-text" style={{ fontSize: '1.3rem' }}><span>DMIS</span></span>
            </div>
            <h2 className="auth-panel-title">Join the Relief Network</h2>
            <p className="auth-panel-subtitle">
              Register as a volunteer to get matched with disaster relief tasks that fit your skills and region.
            </p>
            <div className="auth-panel-features">
              <div className="auth-feature-item">
                <span className="auth-feature-icon">🤝</span>
                <span>Skills-based task matching</span>
              </div>
              <div className="auth-feature-item">
                <span className="auth-feature-icon">📍</span>
                <span>Region-aware assignments</span>
              </div>
              <div className="auth-feature-item">
                <span className="auth-feature-icon">🔔</span>
                <span>Instant task notifications</span>
              </div>
              <div className="auth-feature-item">
                <span className="auth-feature-icon">📋</span>
                <span>Personal volunteer dashboard</span>
              </div>
            </div>
            {/* Step indicator */}
            <div className="reg-steps-indicator" aria-label="Registration progress">
              <div className={`reg-step-dot${step >= 1 ? ' active' : ''}`} aria-label="Step 1: Personal details" />
              <div className="reg-step-line" />
              <div className={`reg-step-dot${step >= 2 ? ' active' : ''}`} aria-label="Step 2: Skills & password" />
            </div>
            <p className="auth-panel-badge-text">Step {step} of 2 — {step === 1 ? 'Personal Details' : 'Skills & Password'}</p>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="auth-panel auth-panel-right">
          <div className="auth-form-wrap">
            <div className="auth-form-header">
              <h1 className="auth-form-title">
                {step === 1 ? 'Create Account' : 'Skills & Security'}
              </h1>
              <p className="auth-form-subtitle">
                {step === 1
                  ? <>Already registered? <Link to="/login" className="auth-link" id="register-login-link">Sign In</Link></>
                  : <button type="button" className="auth-link-btn" onClick={() => { setStep(1); setError('') }}>← Back to details</button>
                }
              </p>
            </div>

            {/* Step progress bar */}
            <div className="form-progress" aria-label={`Step ${step} of 2`}>
              <div className="form-progress-bar" style={{ width: step === 1 ? '50%' : '100%' }} />
            </div>

            {error && (
              <div className="auth-error" role="alert" aria-live="assertive" id="register-error-msg">
                <span aria-hidden="true">⚠️</span> {error}
              </div>
            )}

            {/* STEP 1 */}
            {step === 1 && (
              <form onSubmit={e => { e.preventDefault(); handleNext() }} className="auth-form" noValidate id="register-step1-form">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-fullname">Full Name</label>
                    <div className="form-input-wrap">
                      <span className="form-input-icon" aria-hidden="true">👤</span>
                      <input id="reg-fullname" type="text" name="fullName" placeholder="Your full name" className="form-input"
                        value={form.fullName} onChange={handleChange} autoComplete="name" required aria-required="true" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-phone">Phone Number</label>
                    <div className="form-input-wrap">
                      <span className="form-input-icon" aria-hidden="true">📞</span>
                      <input id="reg-phone" type="tel" name="phone" placeholder="+91 98765 43210" className="form-input"
                        value={form.phone} onChange={handleChange} autoComplete="tel" required aria-required="true" />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-email">Email Address</label>
                  <div className="form-input-wrap">
                    <span className="form-input-icon" aria-hidden="true">✉️</span>
                    <input id="reg-email" type="email" name="email" placeholder="you@example.com" className="form-input"
                      value={form.email} onChange={handleChange} autoComplete="email" required aria-required="true" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-region">Operating Region</label>
                  <div className="form-input-wrap">
                    <span className="form-input-icon" aria-hidden="true">📍</span>
                    <input id="reg-region" type="text" name="region" placeholder="e.g. Kerala, Gujarat, Mumbai" className="form-input"
                      value={form.region} onChange={handleChange} required aria-required="true" />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-lg btn-full" id="register-next-btn">
                  Continue to Skills →
                </button>
              </form>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <form onSubmit={handleSubmit} className="auth-form" noValidate id="register-step2-form">
                <div className="form-group">
                  <label className="form-label">Skills <span className="form-label-hint">(select all that apply)</span></label>
                  <div className="skills-grid" role="group" aria-label="Select your skills">
                    {SKILLS_OPTIONS.map(skill => (
                      <button
                        key={skill}
                        type="button"
                        className={`skill-tag${form.skills.includes(skill) ? ' selected' : ''}`}
                        onClick={() => toggleSkill(skill)}
                        aria-pressed={form.skills.includes(skill)}
                        id={`skill-${skill.replace(/\s+/g, '-').replace('&', 'and').toLowerCase()}`}
                      >
                        {form.skills.includes(skill) ? '✓ ' : ''}{skill}
                      </button>
                    ))}
                  </div>
                  {form.skills.length > 0 && (
                    <p className="skills-count" aria-live="polite">{form.skills.length} skill{form.skills.length > 1 ? 's' : ''} selected</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-password">Password</label>
                  <div className="form-input-wrap">
                    <span className="form-input-icon" aria-hidden="true">🔑</span>
                    <input id="reg-password" type={showPassword ? 'text' : 'password'} name="password" placeholder="Minimum 8 characters"
                      className="form-input" value={form.password} onChange={handleChange} autoComplete="new-password" required aria-required="true" />
                    <button type="button" className="form-eye-btn" onClick={() => setShowPassword(p => !p)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'} id="register-toggle-password">
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <div className="password-strength" aria-label="Password strength">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`pw-bar${form.password.length >= i * 2 ? ' filled' : ''}`} />
                    ))}
                    <span className="pw-label">
                      {form.password.length === 0 ? '' : form.password.length < 6 ? 'Weak' : form.password.length < 10 ? 'Fair' : 'Strong'}
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-confirm-password">Confirm Password</label>
                  <div className="form-input-wrap">
                    <span className="form-input-icon" aria-hidden="true">🔒</span>
                    <input id="reg-confirm-password" type={showPassword ? 'text' : 'password'} name="confirmPassword"
                      placeholder="Repeat your password" className="form-input" value={form.confirmPassword}
                      onChange={handleChange} autoComplete="new-password" required aria-required="true" />
                    {form.confirmPassword && (
                      <span className="form-match-icon" aria-label={form.password === form.confirmPassword ? 'Passwords match' : 'Passwords do not match'}>
                        {form.password === form.confirmPassword ? '✅' : '❌'}
                      </span>
                    )}
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}
                  id="register-submit-btn" aria-busy={loading}>
                  {loading ? <span className="btn-spinner" /> : null}
                  {loading ? 'Creating Account…' : '🤝 Complete Registration'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
