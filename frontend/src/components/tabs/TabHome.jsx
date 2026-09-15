import { useState, useEffect } from 'react'
import { Dashboard, Weather } from '../../api.js'

const QUICK_ACTIONS = [
  { icon: '🏛️', label: 'Apply for Scheme', tab: 'govconnect' },
  { icon: '🚜', label: 'Browse Equipment', tab: 'equipment' },
  { icon: '🛡️', label: 'Enrol Insurance', tab: 'insurance' },
  { icon: '📦', label: 'List Produce', tab: 'market' },
]

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 3600) return `${Math.max(1, Math.floor(diff / 60))}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function TabHome({ user, switchTab }) {
  const [stats, setStats] = useState(null)
  const [activities, setActivities] = useState([])
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    Promise.all([
      Dashboard.stats().catch(() => null),
      Dashboard.activities().catch(() => null),
      Weather.get().catch(() => null),
    ]).then(([s, a, w]) => {
      if (!mounted) return
      if (s) setStats(s.stats)
      if (a) setActivities(a.activities)
      if (w) setWeather(w.weather)
      setLoading(false)
    })
    return () => { mounted = false }
  }, [])

  const fname = (user?.name || 'Farmer').split(' ')[0]
  const hour  = new Date().getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const STAT_DISPLAY = stats ? [
    { icon: '🌾', value: stats.activeCrops, label: 'Active Crops' },
    { icon: '🏛️', value: stats.schemesApplied, label: 'Schemes Applied' },
    { icon: '🛡️', value: `₹${Number(stats.insuranceCoverage).toLocaleString('en-IN')}`, label: 'Insurance Coverage' },
    { icon: '📦', value: stats.marketListings, label: 'Market Listings' },
  ] : []

  return (
    <>
      <div className="dash-welcome">
        <h2>{greet}, {fname}! 👋</h2>
        <p>Here's your farm dashboard overview for today — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      {loading ? (
        <div className="center-loading"><div className="spinner" /><span>Loading your dashboard...</span></div>
      ) : (
        <>
          <div className="stats-row">
            {STAT_DISPLAY.map(s => (
              <div className="stat-card" key={s.label}>
                <div className="stat-icon">{s.icon}</div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="dash-grid">
            <div className="dash-card">
              <h3>⚡ Recent Activity</h3>
              {activities.length === 0 ? (
                <div className="empty-state" style={{ padding: '20px 0' }}>
                  <span style={{ fontSize: 13 }}>No recent activity yet. Start by applying for a scheme!</span>
                </div>
              ) : (
                activities.map((a, i) => (
                  <div className="activity-item" key={i}>
                    <div className={`activity-dot ${a.type}`} />
                    <span className="activity-text">{a.text}</span>
                    <span className="activity-time">{timeAgo(a.created_at)}</span>
                  </div>
                ))
              )}
            </div>

            <div className="dash-card">
              <h3>🚀 Quick Actions</h3>
              <div className="quick-actions">
                {QUICK_ACTIONS.map(a => (
                  <button className="quick-action" key={a.tab} onClick={() => switchTab(a.tab)}>
                    <span className="qa-icon">{a.icon}</span>{a.label}
                  </button>
                ))}
              </div>

              {weather && (
                <div style={{ marginTop: 20, padding: 16, background: 'linear-gradient(135deg, var(--green) 0%, #2d7a4f 100%)', borderRadius: 'var(--radius)', color: 'white', cursor: 'pointer' }} onClick={() => switchTab('weather')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>📍 {weather.current.location}</div>
                      <div style={{ fontSize: 28, fontFamily: 'var(--font-head)', fontWeight: 800 }}>{weather.current.temp}°C</div>
                      <div style={{ fontSize: 13, opacity: 0.8 }}>🌤️ {weather.current.desc}</div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 12, opacity: 0.7 }}>
                      <div>💧 Humidity {weather.current.humidity}%</div>
                      <div style={{ marginTop: 4 }}>💨 Wind {weather.current.wind}</div>
                      <div style={{ marginTop: 8, fontSize: 11, padding: '4px 10px', background: 'rgba(255,255,255,0.2)', borderRadius: '100px' }}>View forecast →</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
