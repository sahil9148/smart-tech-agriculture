import { useState } from 'react'
import { Auth, TokenStore } from '../api.js'

export default function Login({ navigate, setUser, showToast }) {
  const [email,   setEmail]   = useState('')
  const [pass,    setPass]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !pass) { setError('Please enter email and password'); return }
    setLoading(true)
    try {
      const data = await Auth.login({ email, password: pass })
      TokenStore.set(data.token)
      setUser(data.user)
      showToast('Welcome back! 🌾')
      navigate('dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDemo = async () => {
    setLoading(true)
    try {
      const data = await Auth.login({ email: 'sahil@agritech.in', password: 'Demo@1234' })
      TokenStore.set(data.token)
      setUser(data.user)
      showToast('Welcome to Demo! 🌾')
      navigate('dashboard')
    } catch {
      // If backend demo user doesn't exist, use offline demo
      setUser({ id: 'demo', name: 'Demo Farmer', email: 'demo@agritech.in' })
      showToast('Demo Mode (offline) 🌾')
      navigate('dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="logo" style={{ color: 'white', marginBottom: 48 }}>
            <div className="logo-icon">🌾</div> AgriTech
          </div>
          <div className="auth-left-title">Welcome back,<br />Farmer 🌱</div>
          <p className="auth-left-sub">Sign in to access your farm dashboard, government schemes, equipment finance, and direct market access.</p>
          <div className="auth-features">
            {['🏛️ 200+ Government Schemes', '🚜 Equipment on Easy EMI', '🛡️ PMFBY Crop Insurance', '📦 Direct Market Access'].map(f => (
              <div className="auth-feature" key={f}>
                <div className="auth-feature-icon">{f[0]}</div>
                {f.slice(2)}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrap">
          <div className="auth-mobile-logo"><div className="logo-icon">🌾</div>AgriTech</div>
          <h1 className="auth-title">Sign In</h1>
          <p className="auth-sub">Access your farmer dashboard</p>

          {error && (
            <div style={{ background: 'var(--red-pale)', color: 'var(--red)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: 13, marginBottom: 16 }}>
              ⚠️ {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <button className="btn btn-outline btn-full" style={{ marginTop: 10 }} onClick={handleDemo} disabled={loading}>
            🎯 Try Demo (sahil@agritech.in)
          </button>

          <p className="auth-switch">Don't have an account? <a onClick={() => navigate('register')}>Sign up free</a></p>
          <p className="auth-switch" style={{ marginTop: 8 }}><a onClick={() => navigate('landing')}>← Back to Home</a></p>
        </div>
      </div>
    </div>
  )
}
