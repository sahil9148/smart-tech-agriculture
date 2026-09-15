import { useState, useEffect } from 'react'
import TabHome       from './tabs/TabHome.jsx'
import TabGovConnect  from './tabs/TabGovConnect.jsx'
import TabEquipment   from './tabs/TabEquipment.jsx'
import TabInsurance   from './tabs/TabInsurance.jsx'
import TabWeather     from './tabs/TabWeather.jsx'
import TabMarket      from './tabs/TabMarket.jsx'
import TabDisease     from './tabs/TabDisease.jsx'
import TabReports     from './tabs/TabReports.jsx'
import TabSettings    from './tabs/TabSettings.jsx'

const NAV = [
  { id: 'home',       icon: '🏠', label: 'Dashboard' },
  { id: 'govconnect', icon: '🏛️', label: 'Gov Connect' },
  { id: 'equipment',  icon: '🚜', label: 'Equipment' },
  { id: 'insurance',  icon: '🛡️', label: 'Crop Insurance' },
  { id: 'weather',    icon: '🌦️', label: 'Weather' },
  { id: 'market',     icon: '📦', label: 'Marketplace' },
  { id: 'disease',    icon: '🔬', label: 'Disease Detection' },
  { id: 'reports',    icon: '📊', label: 'Reports' },
  { id: 'settings',   icon: '⚙️', label: 'Settings' },
]

const TAB_TITLES = {
  home: 'Dashboard', govconnect: 'Gov Connect', equipment: 'Equipment Finance',
  insurance: 'Crop Insurance', weather: 'Weather Advisory', market: 'Marketplace',
  disease: 'Disease Detection', reports: 'Farm Reports', settings: 'Settings',
}

export default function Dashboard({ user, setUser, navigate, showToast, handleLogout }) {
  const [tab, setTab] = useState('home')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const switchTab = (t) => { setTab(t); setSidebarOpen(false); window.scrollTo(0, 0) }

  useEffect(() => {
    const handler = () => { if (window.innerWidth > 900) setSidebarOpen(false) }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const initials = (user?.name || 'F').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const TabContent = {
    home:       <TabHome       user={user} switchTab={switchTab} />,
    govconnect: <TabGovConnect showToast={showToast} />,
    equipment:  <TabEquipment  showToast={showToast} />,
    insurance:  <TabInsurance  showToast={showToast} />,
    weather:    <TabWeather />,
    market:     <TabMarket     showToast={showToast} user={user} />,
    disease:    <TabDisease    showToast={showToast} />,
    reports:    <TabReports />,
    settings:   <TabSettings   user={user} setUser={setUser} showToast={showToast} />,
  }[tab]

  return (
    <div className="dashboard-layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo"><span style={{ fontSize: 22 }}>🌾</span>AgriTech</div>
        <nav className="sidebar-nav">
          {NAV.map(n => (
            <button key={n.id} className={`nav-item ${tab === n.id ? 'active' : ''}`} onClick={() => switchTab(n.id)}>
              <span className="nav-icon">{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="user-avatar-sm">{initials}</div>
          <div className="user-info-sm">
            <strong>{user?.name || 'Farmer'}</strong>
            <span>{user?.email?.length > 22 ? user.email.slice(0, 22) + '...' : user?.email || ''}</span>
          </div>
          <button className="sidebar-logout-btn" onClick={handleLogout} title="Logout">⏻</button>
        </div>
      </aside>

      <div className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`} onClick={() => setSidebarOpen(false)} />

      <div className="main-content">
        <div className="top-bar">
          <button className="menu-toggle" onClick={() => setSidebarOpen(o => !o)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span className="top-bar-title">{TAB_TITLES[tab]}</span>
          <div className="top-bar-right">
            <div className="user-chip"><span>👤</span><span>{user?.name?.split(' ')[0] || 'Farmer'}</span></div>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
          </div>
        </div>
        <div className="tab-content fade-in" key={tab}>{TabContent}</div>
      </div>
    </div>
  )
}
