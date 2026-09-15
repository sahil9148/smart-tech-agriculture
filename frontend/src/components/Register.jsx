import { useState } from 'react'
import { Auth, TokenStore } from '../api.js'

const STATES = ['Andhra Pradesh','Assam','Bihar','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Odisha','Punjab','Rajasthan','Tamil Nadu','Telangana','Uttar Pradesh','Uttarakhand','West Bengal','Other']

export default function Register({ navigate, setUser, showToast }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    fname:'', lname:'', email:'', password:'', confirm:'',
    phone:'', state:'', district:'',
    farmSize:'', cropTypes:'', farmingType:'Traditional',
  })
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const step1 = (e) => {
    e.preventDefault(); setError('')
    if (!form.fname || !form.email || !form.password) { setError('Please fill all required fields'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    setStep(2)
  }
  const step2 = (e) => {
    e.preventDefault(); setError('')
    if (!form.phone || !form.state) { setError('Phone and state are required'); return }
    setStep(3)
  }

  const finish = async (e) => {
    e.preventDefault(); setError('')
    setLoading(true)
    try {
      const data = await Auth.register({
        name:        `${form.fname} ${form.lname}`.trim(),
        email:       form.email,
        password:    form.password,
        phone:       form.phone,
        state:       form.state,
        district:    form.district,
        farmSize:    form.farmSize,
        cropTypes:   form.cropTypes,
        farmingType: form.farmingType,
      })
      TokenStore.set(data.token)
      setUser(data.user)
      showToast(`Welcome to AgriTech, ${form.fname}! 🌱`)
      navigate('dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const StepDots = () => (
    <div className="step-indicator">
      {[1,2,3].map((s,i) => (
        <span key={s}>
          <div className={`step-dot ${step>s?'done':step===s?'active':''}`}>{step>s?'✓':s}</div>
          {i<2 && <div className={`step-line ${step>s+1?'done':''}`} />}
        </span>
      ))}
    </div>
  )

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="logo" style={{ color:'white', marginBottom:48 }}><div className="logo-icon">🌾</div>AgriTech</div>
          <div className="auth-left-title">Join 2.4 Lakh<br />Farmers Today 🌾</div>
          <p className="auth-left-sub">Register free and access government schemes, equipment financing, crop insurance, and direct market connections.</p>
          <div className="auth-features">
            {['✅ Free — no hidden charges', '⚡ Setup in 3 minutes', '🔒 Bank-grade security', '📱 Works on any device'].map(f => (
              <div className="auth-feature" key={f}><div className="auth-feature-icon">{f[0]}</div>{f.slice(2)}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrap">
          <div className="auth-mobile-logo"><div className="logo-icon">🌾</div>AgriTech</div>
          <StepDots />

          {error && (
            <div style={{ background:'var(--red-pale)', color:'var(--red)', padding:'10px 14px', borderRadius:'var(--radius-sm)', fontSize:13, marginBottom:16 }}>
              ⚠️ {error}
            </div>
          )}

          {step === 1 && (
            <>
              <h1 className="auth-title">Create Account</h1>
              <p className="auth-sub">Step 1 of 3 — Basic details</p>
              <form className="auth-form" onSubmit={step1}>
                <div className="form-row">
                  <div className="form-group"><label>First Name *</label><input value={form.fname} onChange={e=>update('fname',e.target.value)} placeholder="Rahul" required /></div>
                  <div className="form-group"><label>Last Name</label><input value={form.lname} onChange={e=>update('lname',e.target.value)} placeholder="Sharma" /></div>
                </div>
                <div className="form-group"><label>Email *</label><input type="email" value={form.email} onChange={e=>update('email',e.target.value)} placeholder="you@example.com" required /></div>
                <div className="form-group"><label>Password * (min 6 chars)</label><input type="password" value={form.password} onChange={e=>update('password',e.target.value)} placeholder="••••••••" required /></div>
                <div className="form-group"><label>Confirm Password *</label><input type="password" value={form.confirm} onChange={e=>update('confirm',e.target.value)} placeholder="Re-enter password" required /></div>
                <button type="submit" className="btn btn-primary btn-full">Continue →</button>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="auth-title">Personal Details</h1>
              <p className="auth-sub">Step 2 of 3 — Contact info</p>
              <form className="auth-form" onSubmit={step2}>
                <div className="form-group"><label>Mobile Number *</label><input type="tel" value={form.phone} onChange={e=>update('phone',e.target.value)} placeholder="+91 9876543210" required /></div>
                <div className="form-group"><label>State *</label>
                  <select value={form.state} onChange={e=>update('state',e.target.value)} required>
                    <option value="">Select state</option>
                    {STATES.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>District</label><input value={form.district} onChange={e=>update('district',e.target.value)} placeholder="Your district" /></div>
                <div style={{display:'flex',gap:12}}>
                  <button type="button" className="btn btn-ghost btn-full" onClick={()=>setStep(1)}>← Back</button>
                  <button type="submit" className="btn btn-primary btn-full">Continue →</button>
                </div>
              </form>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="auth-title">Farm Setup</h1>
              <p className="auth-sub">Step 3 of 3 — About your farm</p>
              <form className="auth-form" onSubmit={finish}>
                <div className="form-group"><label>Farm Size (acres)</label><input type="number" value={form.farmSize} onChange={e=>update('farmSize',e.target.value)} placeholder="e.g. 5" min="0" step="0.1" /></div>
                <div className="form-group"><label>Primary Crops</label><input value={form.cropTypes} onChange={e=>update('cropTypes',e.target.value)} placeholder="e.g. Wheat, Rice, Mustard" /></div>
                <div className="form-group"><label>Farming Type</label>
                  <select value={form.farmingType} onChange={e=>update('farmingType',e.target.value)}>
                    <option>Traditional</option><option>Organic</option><option>Mixed</option><option>Horticulture</option><option>Dairy + Farming</option>
                  </select>
                </div>
                <div style={{display:'flex',gap:12}}>
                  <button type="button" className="btn btn-ghost btn-full" onClick={()=>setStep(2)}>← Back</button>
                  <button type="submit" className="btn btn-primary btn-full" disabled={loading}>{loading?'Creating...':'✅ Create Account'}</button>
                </div>
              </form>
            </>
          )}
          <p className="auth-switch" style={{marginTop:16}}>Already have an account? <a onClick={()=>navigate('login')}>Sign in</a></p>
          <p className="auth-switch" style={{marginTop:8}}><a onClick={()=>navigate('landing')}>← Back to Home</a></p>
        </div>
      </div>
    </div>
  )
}
