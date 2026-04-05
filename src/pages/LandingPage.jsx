// src/pages/LandingPage.jsx
// All landing page content extracted from App.jsx — section 3.1
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

// ── Mock data (replace with Supabase queries later) ──
const MOCK_DISASTERS = [
  {
    id: 1,
    type: 'Flood',
    region: 'Kerala, South India',
    severity: 'high',
    date: '2026-04-02',
    description: 'Severe flooding affecting over 12 districts. Rescue operations ongoing. Thousands displaced from their homes.',
    activeTasks: 18,
    volunteers: 43,
    emoji: '🌊',
  },
  {
    id: 2,
    type: 'Earthquake',
    region: 'Gujarat, West India',
    severity: 'medium',
    date: '2026-04-01',
    description: 'Magnitude 5.8 earthquake. Structural damage reported in multiple townships. Relief camps established.',
    activeTasks: 9,
    volunteers: 27,
    emoji: '🏚️',
  },
  {
    id: 3,
    type: 'Cyclone',
    region: 'Odisha, East India',
    severity: 'high',
    date: '2026-04-03',
    description: 'Cyclone Nilam making landfall. Coastal areas evacuated. Emergency response teams deployed.',
    activeTasks: 24,
    volunteers: 61,
    emoji: '🌀',
  },
  {
    id: 4,
    type: 'Drought',
    region: 'Rajasthan, North India',
    severity: 'low',
    date: '2026-03-28',
    description: 'Prolonged dry spell. Aid distribution underway. Water tankers deployed to 80+ villages.',
    activeTasks: 6,
    volunteers: 15,
    emoji: '🌵',
  },
  {
    id: 5,
    type: 'Landslide',
    region: 'Himachal Pradesh',
    severity: 'medium',
    date: '2026-04-01',
    description: 'Heavy rains triggered landslides blocking NH-3. NDRF teams clearing debris and rescuing trapped residents.',
    activeTasks: 11,
    volunteers: 34,
    emoji: '⛰️',
  },
  {
    id: 6,
    type: 'Wildfire',
    region: 'Uttarakhand Forests',
    severity: 'medium',
    date: '2026-03-30',
    description: 'Forest fires spreading across 3,000 hectares. Aerial water bombing underway. Villages on alert.',
    activeTasks: 7,
    volunteers: 22,
    emoji: '🔥',
  },
]

const SEVERITY_MAP = {
  high: { label: 'High', className: 'high' },
  medium: { label: 'Medium', className: 'medium' },
  low: { label: 'Low / Stable', className: 'low' },
}

function useCounter(target, duration = 1800) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const start = Date.now()
          const tick = () => {
            const elapsed = Date.now() - start
            const progress = Math.min(elapsed / duration, 1)
            const ease = 1 - Math.pow(1 - progress, 3)
            setCount(Math.round(ease * target))
            if (progress < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration])

  return [count, ref]
}

function Navbar({ alertVisible }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`} role="navigation" aria-label="Main navigation">
      <Link to="/" className="navbar-brand" aria-label="DMIS Home">
        <div className="brand-icon" aria-hidden="true">🛡️</div>
        <span className="brand-text"><span>DMIS</span></span>
      </Link>
      <ul className="navbar-links" role="list">
        <li><a href="#disasters">Live Disasters</a></li>
        <li><a href="#stats">Operations</a></li>
        <li><a href="#how-it-works">How It Works</a></li>
      </ul>
      <div className="navbar-actions">
        <Link to="/register" className="btn btn-ghost btn-sm" id="nav-register-btn">Register as Volunteer</Link>
        <Link to="/admin/login" className="btn btn-primary btn-sm" id="nav-admin-btn">🔐 Admin Login</Link>
      </div>
    </nav>
  )
}

function AlertBanner({ onClose }) {
  return (
    <div className="alert-banner" role="alert" aria-live="assertive" id="emergency-alert-banner">
      <div className="alert-banner-pulse" aria-hidden="true" />
      <p className="alert-banner-text">
        <strong>⚠️ ACTIVE EMERGENCY:</strong> Multiple disasters currently in progress —{' '}
        6 active operations across India. Relief coordination underway.
      </p>
      <button className="alert-banner-close" onClick={onClose} aria-label="Dismiss emergency alert">✕</button>
    </div>
  )
}

function HeroStatItem({ value, suffix, label, duration }) {
  const [count, ref] = useCounter(value, duration)
  return (
    <div className="hero-stat-item" ref={ref}>
      <div className="hero-stat-value"><span>{count}</span>{suffix}</div>
      <div className="hero-stat-label">{label}</div>
    </div>
  )
}

function HeroSection({ alertVisible }) {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 8}s`,
    duration: `${6 + Math.random() * 10}s`,
    size: `${1 + Math.random() * 2}px`,
  }))

  return (
    <section id="hero" className="hero" style={{ paddingTop: alertVisible ? '160px' : '120px' }} aria-label="Hero section">
      <div className="hero-bg" aria-hidden="true">
        <div className="hero-grid" />
        <div className="hero-glow-1" />
        <div className="hero-glow-2" />
        <div className="hero-glow-3" />
        <div className="particles-container">
          {particles.map(p => (
            <div key={p.id} className="particle" style={{ left: p.left, animationDelay: p.delay, animationDuration: p.duration, width: p.size, height: p.size }} />
          ))}
        </div>
      </div>
      <div className="hero-content">
        <div className="hero-badge">
          <span className="hero-badge-dot" aria-hidden="true" />
          System Live · Real-time Coordination
        </div>
        <h1 className="hero-title">
          <span className="highlight">Disaster Management</span><br />Information System
        </h1>
        <p className="hero-tagline">
          <em>Coordinating Relief. Saving Lives.</em><br />
          A centralized platform for real-time disaster response, volunteer management, and resource coordination.
        </p>
        <div className="hero-actions">
          <Link to="/register" className="btn btn-primary btn-lg" id="hero-volunteer-btn">🤝 Register as Volunteer</Link>
          <a href="#disasters" className="btn btn-secondary btn-lg" id="hero-operations-btn">📡 View Active Operations</a>
          <Link to="/admin/login" className="btn btn-ghost btn-lg" id="hero-admin-btn">🔐 Admin Login</Link>
        </div>
        <div className="hero-stats-strip">
          <HeroStatItem value={6} suffix="" label="Active Disasters" duration={1200} />
          <div className="hero-divider" aria-hidden="true" />
          <HeroStatItem value={202} suffix="+" label="Volunteers Active" duration={1600} />
          <div className="hero-divider" aria-hidden="true" />
          <HeroStatItem value={75} suffix="" label="Ongoing Tasks" duration={1400} />
        </div>
      </div>
    </section>
  )
}

function DisasterCard({ disaster }) {
  const sev = SEVERITY_MAP[disaster.severity]
  const dateStr = new Date(disaster.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  return (
    <article className={`disaster-card severity-${disaster.severity}`} aria-label={`${disaster.type} in ${disaster.region}`} tabIndex={0}>
      <div className="disaster-card-header">
        <div className={`disaster-card-icon ${sev.className}`} aria-hidden="true">{disaster.emoji}</div>
        <span className={`severity-badge ${sev.className}`}>
          <span className="dot" aria-hidden="true" />{sev.label}
        </span>
      </div>
      <h3 className="disaster-card-title">{disaster.type}</h3>
      <div className="disaster-card-region"><span aria-hidden="true">📍</span> {disaster.region}</div>
      <p className="disaster-card-desc">{disaster.description}</p>
      <div className="disaster-card-meta">
        <div className="disaster-card-tasks"><span>✅</span> {disaster.activeTasks} Tasks</div>
        <div><span>👥</span> {disaster.volunteers} Volunteers</div>
        <time dateTime={disaster.date}>{dateStr}</time>
      </div>
    </article>
  )
}

function DisasterSection() {
  return (
    <section id="disasters" className="disaster-section" aria-labelledby="disasters-heading">
      <div className="disaster-section-inner">
        <div className="section-header">
          <div className="section-label" aria-hidden="true">🔴 Live Feed</div>
          <h2 className="section-title" id="disasters-heading">Active Disaster Operations</h2>
          <p className="section-subtitle">Real-time overview of all ongoing disaster events with severity indicators and operational status.</p>
        </div>
        <div className="disaster-grid">
          {MOCK_DISASTERS.map(d => <DisasterCard key={d.id} disaster={d} />)}
        </div>
      </div>
    </section>
  )
}

function StatsPanel() {
  const [volunteers, volRef] = useCounter(202, 1800)
  const [resources, resRef] = useCounter(1384, 2000)
  const [tasks, taskRef] = useCounter(75, 1600)
  return (
    <section id="stats" className="stats-panel" aria-labelledby="stats-heading">
      <h2 className="sr-only" id="stats-heading">Operational Statistics</h2>
      <div className="stats-inner">
        <div className="stat-card" ref={volRef}>
          <div className="stat-card-icon blue" aria-hidden="true">👤</div>
          <div className="stat-card-content">
            <div className="stat-card-value">{volunteers.toLocaleString()}</div>
            <div className="stat-card-label">Total Volunteers Active</div>
            <div className="stat-card-sub">Currently marked available</div>
            <div className="stat-trend up">▲ 12% this week</div>
          </div>
        </div>
        <div className="stat-card" ref={resRef}>
          <div className="stat-card-icon green" aria-hidden="true">📦</div>
          <div className="stat-card-content">
            <div className="stat-card-value">{resources.toLocaleString()}</div>
            <div className="stat-card-label">Resources Available</div>
            <div className="stat-card-sub">Aggregated stock levels</div>
            <div className="stat-trend down">▼ 8% deployed</div>
          </div>
        </div>
        <div className="stat-card" ref={taskRef}>
          <div className="stat-card-icon orange" aria-hidden="true">⚡</div>
          <div className="stat-card-content">
            <div className="stat-card-value">{tasks}</div>
            <div className="stat-card-label">Tasks Ongoing</div>
            <div className="stat-card-sub">Pending + In-Progress</div>
            <div className="stat-trend up">▲ Priority escalated</div>
          </div>
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section id="cta" className="cta-section" aria-labelledby="cta-heading">
      <div className="section-header">
        <div className="section-label" aria-hidden="true">Get Involved</div>
        <h2 className="section-title" id="cta-heading">Take Action Now</h2>
        <p className="section-subtitle">Whether you're a first responder, coordinator, or administrator — the DMIS platform is your operational hub.</p>
      </div>
      <div className="cta-grid">
        <Link to="/register" className="cta-card volunteer" id="cta-volunteer-card">
          <div className="cta-card-icon" aria-hidden="true">🤝</div>
          <h3 className="cta-card-title">Register as Volunteer</h3>
          <p className="cta-card-desc">Join our relief network. Get assigned to tasks matching your skills. Coordinate with teams on the ground.</p>
          <div className="cta-card-action"><span className="btn btn-primary" style={{ justifyContent: 'center' }}>Join the Team →</span></div>
        </Link>
        <Link to="/admin/login" className="cta-card admin" id="cta-admin-card">
          <div className="cta-card-icon" aria-hidden="true">🔐</div>
          <h3 className="cta-card-title">Admin Login</h3>
          <p className="cta-card-desc">Access the full command dashboard. Manage disasters, assign volunteers, allocate resources, and generate reports.</p>
          <div className="cta-card-action"><span className="btn btn-secondary" style={{ justifyContent: 'center', borderColor: 'rgba(239,68,68,0.3)' }}>Enter Dashboard →</span></div>
        </Link>
        <a href="#disasters" className="cta-card ops" id="cta-operations-card">
          <div className="cta-card-icon" aria-hidden="true">📡</div>
          <h3 className="cta-card-title">View Active Operations</h3>
          <p className="cta-card-desc">Monitor live disaster events, severity levels, affected areas, and real-time task progress across all regions.</p>
          <div className="cta-card-action"><span className="btn btn-accent" style={{ justifyContent: 'center' }}>View Live Feed →</span></div>
        </a>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const steps = [
    { num: '🌪️', title: 'Disaster Reported', desc: 'Admin creates a disaster event with type, region, and severity classification.' },
    { num: '📍', title: 'Areas Identified', desc: 'Affected zones are mapped with urgency levels — Critical, Moderate, or Low.' },
    { num: '🤝', title: 'Volunteers Matched', desc: 'The matching engine assigns available volunteers based on skills and location.' },
    { num: '📦', title: 'Resources Deployed', desc: 'Resources are allocated to tasks and tracked in real-time until completion.' },
  ]
  return (
    <section id="how-it-works" className="how-section" aria-labelledby="how-heading">
      <div className="section-header">
        <div className="section-label" aria-hidden="true">Workflow</div>
        <h2 className="section-title" id="how-heading">How DMIS Works</h2>
        <p className="section-subtitle">A streamlined four-step process from disaster detection to full operational resolution.</p>
      </div>
      <div className="how-grid">
        {steps.map((step, i) => (
          <div key={i} className="how-step">
            <div className="how-step-num" aria-hidden="true">{step.num}</div>
            <h3 className="how-step-title">{step.title}</h3>
            <p className="how-step-desc">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="footer" aria-label="Site footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <Link to="/" className="navbar-brand">
              <div className="brand-icon" aria-hidden="true">🛡️</div>
              <span className="brand-text"><span>DMIS</span></span>
            </Link>
            <p>Disaster Management Information System — a centralized platform designed to coordinate relief operations, manage volunteers, and allocate resources in real-time during crisis events.</p>
          </div>
          <div>
            <p className="footer-column-title">Platform</p>
            <ul className="footer-links">
              <li><a href="#disasters">Live Disasters</a></li>
              <li><a href="#stats">Operations</a></li>
              <li><a href="#how-it-works">How It Works</a></li>
            </ul>
          </div>
          <div>
            <p className="footer-column-title">Access</p>
            <ul className="footer-links">
              <li><Link to="/register">Volunteer Registration</Link></li>
              <li><Link to="/login">Volunteer Login</Link></li>
              <li><Link to="/admin/login">Admin Login</Link></li>
            </ul>
          </div>
          <div>
            <p className="footer-column-title">System</p>
            <ul className="footer-links">
              <li><a href="#">Powered by Supabase</a></li>
              <li><a href="#">PostgreSQL Database</a></li>
              <li><a href="#">Real-time Subscriptions</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {year} DMIS — Disaster Management Information System. All rights reserved.</span>
          <div className="footer-status">
            <div className="status-dot" aria-hidden="true" />
            <span>All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  const [alertVisible, setAlertVisible] = useState(true)
  return (
    <>
      <Navbar alertVisible={alertVisible} />
      {alertVisible && <AlertBanner onClose={() => setAlertVisible(false)} />}
      <main id="main-content">
        <HeroSection alertVisible={alertVisible} />
        <DisasterSection />
        <StatsPanel />
        <CTASection />
        <HowItWorksSection />
      </main>
      <Footer />
    </>
  )
}
