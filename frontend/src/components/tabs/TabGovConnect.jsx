import { useState, useEffect, useCallback } from 'react'
import { Schemes } from '../../api.js'

export default function TabGovConnect({ showToast }) {
  const [schemes, setSchemes] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(null)

  const load = useCallback((q = '') => {
    setLoading(true)
    Schemes.list(q ? { search: q } : {})
      .then(data => setSchemes(data.schemes))
      .catch(() => showToast('Failed to load schemes', 'error'))
      .finally(() => setLoading(false))
  }, [showToast])

  useEffect(() => { load() }, [load])

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => load(search), 350)
    return () => clearTimeout(t)
  }, [search, load])

  const apply = async (scheme) => {
    setApplying(scheme.name)
    try {
      await Schemes.apply({ schemeName: scheme.name, category: scheme.category, badge: scheme.badge })
      setSchemes(list => list.map(s => s.name === scheme.name ? { ...s, applied: true, applicationStatus: 'pending' } : s))
      showToast(`Application for "${scheme.name}" submitted! ✓`)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setApplying(null)
    }
  }

  return (
    <>
      <div className="dash-header">
        <div>
          <h1>Government Schemes</h1>
          <p className="dash-sub">Discover and apply for 200+ central & state agricultural schemes</p>
        </div>
      </div>

      <div className="search-bar">
        <span>🔍</span>
        <input placeholder="Search schemes..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="center-loading"><div className="spinner" /><span>Loading schemes...</span></div>
      ) : schemes.length === 0 ? (
        <div className="empty-state"><div className="icon">🔍</div>No schemes found for "{search}"</div>
      ) : (
        <div className="gov-cards">
          {schemes.map(s => (
            <div className="gov-card" key={s.name}>
              <div className="gov-card-head">
                <span className="gov-badge">{s.badge}</span>
                <div className="gov-status"><div className="status-dot" />Open</div>
              </div>
              <div className="category">{s.category}</div>
              <h3>{s.name}</h3>
              <p>{s.desc}</p>
              <button
                className={`btn btn-sm ${s.applied ? 'btn-ghost' : 'btn-primary'} btn-full`}
                onClick={() => apply(s)}
                disabled={s.applied || applying === s.name}
              >
                {applying === s.name ? 'Submitting...' : s.applied ? `✓ ${s.applicationStatus === 'approved' ? 'Approved' : 'Applied'}` : 'Apply Now →'}
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
