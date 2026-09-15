import { useState, useRef, useEffect } from 'react'
import { Chat } from '../api.js'

const SUGGESTIONS = [
  'How to apply for PM-KISAN?',
  'Best crops for Rabi season',
  'PMFBY insurance premiums',
  'Tractor loan interest rates',
]

export default function AIChatbot({ open, setOpen, user }) {
  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  const greeting = () => ({
    role: 'assistant',
    text: `Namaste ${user?.name?.split(' ')[0] || 'Farmer'}! 🌾 I'm **KisanAI**, your personal agriculture assistant. I can help with government schemes, crop advice, weather-based farming tips, insurance, and market prices. How can I help you today?`,
    id: 'welcome',
  })

  useEffect(() => { setMsgs([greeting()]) }, [user?.name])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  const sendMessage = async (text) => {
    const userText = (text || input).trim()
    if (!userText || loading || !user) return

    setInput('')
    const userMsg = { role: 'user', text: userText, id: Date.now() }
    const newMsgs = [...msgs, userMsg]
    setMsgs(newMsgs)
    setLoading(true)

    try {
      // Backend proxies to Anthropic — API key never touches the browser
      const history = newMsgs
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.text }))

      const data = await Chat.send({ message: userText, history })
      setMsgs(m => [...m, { role: 'assistant', text: data.reply, id: Date.now() + 1 }])
    } catch (err) {
      setMsgs(m => [...m, { role: 'assistant', text: `⚠️ Sorry, I couldn't reach the server. ${err.message}`, id: Date.now() + 1 }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const renderText = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part
    )
  }

  if (!user) return null // Only show chatbot when logged in

  return (
    <>
      <button className="chat-fab" onClick={() => setOpen(o => !o)} title="AI Farm Assistant">
        {open ? '✕' : '🤖'}
      </button>

      <div className={`chat-window ${open ? '' : 'hidden'}`}>
        <div className="chat-header">
          <div className="chat-avatar">🌾</div>
          <div>
            <div className="chat-title">KisanAI Assistant</div>
            <div className="chat-status">● Online — Ask me anything about farming</div>
          </div>
          <button className="chat-close" onClick={() => setOpen(false)}>✕</button>
        </div>

        <div className="chat-messages">
          {msgs.map(m => (
            <div key={m.id} className={`chat-msg ${m.role === 'user' ? 'user' : 'bot'}`}>{renderText(m.text)}</div>
          ))}
          {loading && (
            <div className="chat-msg thinking">
              <span style={{ animation: 'blink 1s infinite' }}>●</span>
              <span style={{ animation: 'blink 1s 0.3s infinite' }}>●</span>
              <span style={{ animation: 'blink 1s 0.6s infinite' }}>●</span>
              <style>{`@keyframes blink { 0%,100%{opacity:0.2} 50%{opacity:1} }`}</style>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {msgs.length <= 1 && (
          <div className="chat-suggestions">
            {SUGGESTIONS.map(s => <button key={s} className="chat-sugg" onClick={() => sendMessage(s)}>{s}</button>)}
          </div>
        )}

        <div className="chat-input-area">
          <input
            className="chat-input"
            placeholder="Ask about crops, schemes, weather..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={loading}
          />
          <button className="chat-send" onClick={() => sendMessage()} disabled={loading || !input.trim()}>➤</button>
        </div>
      </div>
    </>
  )
}
