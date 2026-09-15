import { useState, useEffect, useCallback } from 'react'
import { Insurance } from '../../api.js'

const STATUS_CLASS = { 'Active': 'status-good', 'Claim Filed': 'status-warning', 'Settled': 'status-blue' }

export default function TabInsurance({ showToast }) {
  const [policies, setPolicies] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ crop: '', season: 'Kharif 2025', area: '' })

  const load = useCallback(() => {
    setLoading(true)
    Insurance.list()
      .then(data => { setPolicies(data.policies); setSummary(data.summary) })
      .catch(() => showToast('Failed to load policies', 'error'))
      .finally(() => setLoading(false))
  }, [showToast])

  useEffect(() => { load() }, [load])

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.crop || !form.area) { showToast('Please fill all fields', 'error'); return }
    setSubmitting(true)
    try {
      await Insurance.enrol({ cropName: form.crop, season: form.season, areaAcres: form.area })
      setModal(false)
      setForm({ crop: '', season: 'Kharif 2025', area: '' })
      showToast('PMFBY enrolment submitted successfully! ✓')
      load()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const estPremium = form.area ? Math.round(parseFloat(form.area) * 15500 * (form.season.toLowerCase().includes('kharif') ? 0.02 : 0.015)) : 0
  const estSum = form.area ? Math.round(parseFloat(form.area) * 15500) : 0

  return (
    <>
      <div className="dash-header">
        <div><h1>Crop Insurance</h1><p className="dash-sub">Enrol in PMFBY and track your insurance claims</p></div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ Enrol in PMFBY</button>
      </div>

      {loading ? (
        <div className="center-loading"><div className="spinner" /><span>Loading policies...</span></div>
      ) : (
        <>
          <div className="stats-row" style={{ marginBottom: 24 }}>
            {[
              { icon: '🛡️', value: summary?.active ?? 0, label: 'Active Policies' },
              { icon: '📋', value: summary?.claims ?? 0, label: 'Claims Filed' },
              { icon: '✅', value: summary?.settled ?? 0, label: 'Settled Claims' },
              { icon: '💰', value: `₹${Number(summary?.totalCoverage ?? 0).toLocaleString('en-IN')}`, label: 'Total Coverage' },
            ].map(s => (
              <div className="stat-card" key={s.label}>
                <div className="stat-icon">{s.icon}</div>
                <div className="stat-value" style={{ fontSize: 18 }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {policies.length === 0 ? (
            <div className="empty-state"><div className="icon">🛡️</div>No insurance policies yet. Click "Enrol in PMFBY" to get started.</div>
          ) : (
            <div className="ins-cards">
              {policies.map(p => (
                <div className="ins-card" key={p.id}>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div className="ins-crop">{p.crop_name} {p.season ? `(${p.season})` : ''}</div>
                    <div className="ins-detail">📐 {p.area_acres} acres</div>
                  </div>
                  <div className="ins-amounts">
                    <div className="ins-amount"><strong>₹{Number(p.premium_amt).toLocaleString('en-IN')}</strong><span>Premium Paid</span></div>
                    <div className="ins-amount"><strong>₹{Number(p.sum_insured).toLocaleString('en-IN')}</strong><span>Sum Insured</span></div>
                  </div>
                  <span className={`status-badge ${STATUS_CLASS[p.status] || 'status-good'}`}>
                    {p.status === 'Settled' && p.claim_amount ? `Settled ₹${Number(p.claim_amount).toLocaleString('en-IN')}` : p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: 24, background: 'var(--blue-pale)', border: '1px solid rgba(26,95,168,0.15)', borderRadius: 'var(--radius)', padding: '20px 24px' }}>
        <h4 style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, color: 'var(--blue)', marginBottom: 8 }}>ℹ️ About PMFBY</h4>
        <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7 }}>
          Pradhan Mantri Fasal Bima Yojana provides comprehensive crop insurance coverage against natural calamities, pests and diseases.
          Premium rates: Kharif — 2%, Rabi — 1.5%. Claims are settled within 45 days of crop damage assessment.
        </p>
      </div>

      {modal && (
        <div className="modal-overlay open" onClick={() => setModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Enrol in PMFBY</h3><button className="modal-close" onClick={() => setModal(false)}>×</button></div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label>Crop Name</label>
              <input value={form.crop} onChange={e => update('crop', e.target.value)} placeholder="e.g. Wheat, Rice, Tomato" />
            </div>
            <div className="form-row" style={{ marginBottom: 14 }}>
              <div className="form-group">
                <label>Season</label>
                <select value={form.season} onChange={e => update('season', e.target.value)}>
                  <option>Kharif 2025</option><option>Rabi 2025-26</option><option>Zaid 2026</option>
                </select>
              </div>
              <div className="form-group">
                <label>Area (acres)</label>
                <input type="number" value={form.area} onChange={e => update('area', e.target.value)} placeholder="e.g. 5" min="0.1" step="0.1" />
              </div>
            </div>
            {form.area && (
              <div style={{ background: 'var(--green-pale)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: 16, fontSize: 14 }}>
                <strong>Est. Premium:</strong> ₹{estPremium.toLocaleString('en-IN')} &nbsp;|&nbsp; <strong>Sum Insured:</strong> ₹{estSum.toLocaleString('en-IN')}
              </div>
            )}
            <button className="btn btn-primary btn-full" onClick={submit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Application →'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
