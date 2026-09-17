import { useState, useEffect, useCallback } from 'react'
import { Equipment } from '../../api.js'

const TAG_COLORS = { Popular: 'status-good', Subsidy: 'status-blue', Rental: 'status-warning', '0% EMI': 'status-blue', New: 'status-good' }

export default function TabEquipment({ showToast }) {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [loanForm, setLoanForm] = useState({ amount: '', tenure: '5', purpose: 'Purchase' })

  const load = useCallback((q = '') => {
    setLoading(true)
    Equipment.list(q ? { search: q } : {})
      .then(data => setItems(data.equipment))
      .catch(() => showToast('Failed to load equipment', 'error'))
      .finally(() => setLoading(false))
  }, [showToast])

  useEffect(() => { load() }, [load])
  useEffect(() => { const t = setTimeout(() => load(search), 350); return () => clearTimeout(t) }, [search, load])

  const openModal = (item) => {
    setModal(item)
    setLoanForm({ amount: String(item.price), tenure: '5', purpose: item.emi ? 'Purchase' : 'Rental' })
  }

  const submitLoan = async () => {
    if (!loanForm.amount) { showToast('Enter loan amount', 'error'); return }
    setSubmitting(true)
    try {
      await Equipment.apply({
        equipmentName: modal.name,
        category: modal.category,
        loanAmount: loanForm.amount,
        tenureYears: loanForm.tenure,
        purpose: loanForm.purpose,
      })
      const dest = modal.financeUrl || modal.applyUrl
      setItems(list => list.map(e => e.name === modal.name ? { ...e, applied: true, applicationStatus: 'pending' } : e))
      showToast(`Tracked in your dashboard — opening real financing options ✓`)
      setModal(null)
      // Local tracking recorded above. The actual loan application happens
      // with a real bank/dealer, which opens here — no third-party app can
      // process an equipment loan on the farmer's behalf.
      if (dest) window.open(dest, '_blank', 'noopener,noreferrer')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const cardAction = (item) => {
    // Already tracked — skip the form, go straight back to the real page.
    if (item.applied) {
      const dest = item.financeUrl || item.applyUrl
      if (dest) window.open(dest, '_blank', 'noopener,noreferrer')
      return
    }
    openModal(item)
  }

  return (
    <>
      <div className="dash-header">
        <div>
          <h1>Equipment Finance</h1>
          <p className="dash-sub">Browse equipment, apply for loans, and find rental options</p>
        </div>
      </div>

      <div className="search-bar">
        <span>🔍</span>
        <input placeholder="Search equipment..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="center-loading"><div className="spinner" /><span>Loading equipment...</span></div>
      ) : (
        <div className="equipment-grid">
          {items.map(e => (
            <div className="equip-card" key={e.name}>
              <div className="equip-header">
                <div className="equip-icon">{e.icon}</div>
                <div className="equip-meta"><h4>{e.name}</h4><div className="equip-cat">{e.category}</div></div>
                {e.tag && <span className={`status-badge ${TAG_COLORS[e.tag] || 'status-good'}`} style={{ marginLeft: 'auto' }}>{e.tag}</span>}
              </div>
              <div className="equip-body">
                <p>{e.desc}</p>
                <div className="equip-prices">
                  <div className="price-item"><strong>{e.priceFormatted}</strong><span>Market Price</span></div>
                  {e.emiFormatted !== 'N/A' && <div className="price-item"><strong style={{ color: 'var(--blue)' }}>{e.emiFormatted}</strong><span>EMI from</span></div>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className={`btn btn-sm ${e.applied ? 'btn-ghost' : 'btn-primary'}`}
                    style={{ flex: 1 }}
                    onClick={() => cardAction(e)}
                  >
                    {e.applied ? '✓ Tracked — reopen ↗' : e.emiFormatted === 'N/A' ? 'Book Now ↗' : 'Apply for Loan ↗'}
                  </button>
                  {e.applyUrl && (
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => window.open(e.applyUrl, '_blank', 'noopener,noreferrer')}
                      title="Browse real listings and prices"
                    >
                      Browse ↗
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="modal-overlay open" onClick={() => setModal(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Loan Application — {modal.name}</h3><button className="modal-close" onClick={() => setModal(null)}>×</button></div>
            <div style={{ background: 'var(--green-pale)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: 16 }}>
              <strong style={{ color: 'var(--green)' }}>{modal.priceFormatted}</strong> at <strong>{modal.emiFormatted}</strong> EMI
            </div>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16, lineHeight: 1.6 }}>
              This tracks your interest here in your dashboard, then opens a real loan comparison page (SBI, HDFC, ICICI and other banks) where you actually apply.
            </p>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Loan Amount (₹)</label>
              <input type="number" value={loanForm.amount} onChange={e => setLoanForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label>Loan Tenure</label>
              <select value={loanForm.tenure} onChange={e => setLoanForm(f => ({ ...f, tenure: e.target.value }))}>
                <option value="3">3 Years</option><option value="5">5 Years</option><option value="7">7 Years</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label>Purpose</label>
              <select value={loanForm.purpose} onChange={e => setLoanForm(f => ({ ...f, purpose: e.target.value }))}>
                <option>Purchase</option><option>Rental</option><option>Upgrade</option>
              </select>
            </div>
            <button className="btn btn-primary btn-full" onClick={submitLoan} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Application →'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
