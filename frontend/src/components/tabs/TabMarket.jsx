import { useState, useEffect, useCallback } from 'react'
import { Market } from '../../api.js'

const CATEGORIES = ['All', 'Grains', 'Vegetables', 'Fruits', 'Seeds', 'Fertilizers', 'Equipment']
const CAT_ICONS = { Grains: '🌾', Vegetables: '🥬', Fruits: '🍎', Seeds: '🌱', Fertilizers: '🧪', Equipment: '🔧', All: '📦' }

export default function TabMarket({ showToast, user }) {
  const [listings, setListings] = useState([])
  const [msp, setMsp] = useState([])
  const [cat, setCat] = useState('All')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: '', price: '', qty: '', category: 'Grains' })
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const load = useCallback((c = 'All') => {
    setLoading(true)
    Market.list(c !== 'All' ? { category: c } : {})
      .then(data => setListings(data.listings))
      .catch(() => showToast('Failed to load marketplace', 'error'))
      .finally(() => setLoading(false))
  }, [showToast])

  useEffect(() => { load(cat) }, [cat, load])
  useEffect(() => { Market.msp().then(d => setMsp(d.rates)).catch(() => {}) }, [])

  const addListing = async () => {
    if (!form.name || !form.price || !form.qty) { showToast('Please fill all fields', 'error'); return }
    setSubmitting(true)
    try {
      await Market.create({
        title: form.name, category: form.category,
        pricePerQ: form.price, quantityQ: form.qty,
      })
      setModal(false)
      setForm({ name: '', price: '', qty: '', category: 'Grains' })
      showToast('Listing published successfully! ✓')
      load(cat)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const inquire = async (listing) => {
    try {
      await Market.inquiry(listing.id, { message: `Interested in ${listing.title}` })
      showToast(`Inquiry sent for ${listing.title}! ✓`)
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  return (
    <>
      <div className="dash-header">
        <div><h1>Marketplace</h1><p className="dash-sub">Buy and sell farm produce, equipment, seeds, and inputs directly</p></div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ List Produce</button>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {CATEGORIES.map(c => (
          <button key={c} className={`btn btn-sm ${cat === c ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCat(c)}>
            {CAT_ICONS[c]} {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="center-loading"><div className="spinner" /><span>Loading marketplace...</span></div>
      ) : listings.length === 0 ? (
        <div className="empty-state"><div className="icon">📦</div>No listings in this category yet. Be the first to list!</div>
      ) : (
        <div className="market-grid">
          {listings.map(l => (
            <div className="market-card" key={l.id}>
              <div className="market-cat">{CAT_ICONS[l.category] || '📦'} {l.category}</div>
              <h4>{l.title}</h4>
              <p className="seller">🧑‍🌾 {l.seller_display || l.seller_name}</p>
              <div className="market-prices">
                <div>
                  <div className="market-price">₹{Number(l.price_per_q).toLocaleString('en-IN')}</div>
                  <div className="market-qty">{l.quantity_q} {l.unit || 'quintal'} available</div>
                </div>
                <button className="btn btn-sm btn-primary" onClick={() => inquire(l)}>Buy →</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {msp.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, marginBottom: 14 }}>📊 Government MSP Rates 2025-26</h3>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 480 }}>
              <thead>
                <tr style={{ background: 'var(--green)', color: 'white' }}>
                  {['Crop', 'MSP (₹/quintal)', 'vs Last Year', 'Season'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 13 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {msp.map((r, i) => (
                  <tr key={r.crop} style={{ background: i % 2 === 0 ? 'var(--bg)' : 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '11px 16px', fontWeight: 600 }}>{r.crop}</td>
                    <td style={{ padding: '11px 16px', color: 'var(--green)', fontWeight: 700 }}>₹{r.msp.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '11px 16px', color: 'var(--green)', fontSize: 12 }}>▲ {r.change}</td>
                    <td style={{ padding: '11px 16px', color: 'var(--text3)' }}>{r.season}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <div className="modal-overlay open" onClick={() => setModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Add New Listing</h3><button className="modal-close" onClick={() => setModal(false)}>×</button></div>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label>Product Name</label>
              <input value={form.name} onChange={e => update('name', e.target.value)} placeholder="e.g. Organic Wheat" />
            </div>
            <div className="form-row" style={{ marginBottom: 14 }}>
              <div className="form-group"><label>Price (₹/quintal)</label><input type="number" value={form.price} onChange={e => update('price', e.target.value)} placeholder="2500" /></div>
              <div className="form-group"><label>Quantity (quintals)</label><input type="number" value={form.qty} onChange={e => update('qty', e.target.value)} placeholder="10" /></div>
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label>Category</label>
              <select value={form.category} onChange={e => update('category', e.target.value)}>
                {['Grains', 'Vegetables', 'Fruits', 'Seeds', 'Fertilizers', 'Equipment'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <button className="btn btn-primary btn-full" onClick={addListing} disabled={submitting}>
              {submitting ? 'Publishing...' : 'Publish Listing →'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
