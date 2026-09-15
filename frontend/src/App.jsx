import { useState, useEffect, useCallback } from 'react'
import { Auth, TokenStore } from './api.js'
import Landing   from './components/Landing.jsx'
import Login     from './components/Login.jsx'
import Register  from './components/Register.jsx'
import Dashboard from './components/Dashboard.jsx'
import AIChatbot from './components/AIChatbot.jsx'
import Toast     from './components/Toast.jsx'

export default function App() {
  const [page,      setPage]      = useState('landing')
  const [user,      setUser]      = useState(null)
  const [chatOpen,  setChatOpen]  = useState(false)
  const [loading,   setLoading]   = useState(true)
  const [toast,     setToast]     = useState({ show: false, msg: '', type: 'success' })

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ show: true, msg, type })
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3500)
  }, [])

  const navigate = useCallback((p) => {
    setPage(p)
    window.scrollTo(0, 0)
  }, [])

  const handleLogout = useCallback(() => {
    TokenStore.clear()
    setUser(null)
    navigate('landing')
    showToast('Logged out successfully')
  }, [navigate, showToast])

  // On mount: restore session from saved token
  useEffect(() => {
    const token = TokenStore.get()
    if (!token) { setLoading(false); return }

    Auth.me()
      .then(data => {
        if (data.user) {
          setUser(data.user)
          setPage('dashboard')
        }
      })
      .catch(() => {
        TokenStore.clear()
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16,
        fontFamily: 'DM Sans, sans-serif',
        background: '#f4f7f4',
      }}>
        <div style={{ fontSize: 48 }}>🌾</div>
        <div style={{ color: '#1a6b3c', fontWeight: 600 }}>Loading Smart AgriTech...</div>
      </div>
    )
  }

  return (
    <>
      {page === 'landing'   && <Landing  navigate={navigate} />}
      {page === 'login'     && <Login    navigate={navigate} setUser={setUser} showToast={showToast} />}
      {page === 'register'  && <Register navigate={navigate} setUser={setUser} showToast={showToast} />}
      {page === 'dashboard' && (
        <Dashboard
          user={user}
          setUser={setUser}
          navigate={navigate}
          showToast={showToast}
          handleLogout={handleLogout}
        />
      )}
      <AIChatbot open={chatOpen} setOpen={setChatOpen} user={user} />
      <Toast toast={toast} />
    </>
  )
}
