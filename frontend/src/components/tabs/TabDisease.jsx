import { useState, useRef } from 'react'

const MOCK_RESULTS = [
  { icon: '🦠', label: 'Disease Detected', val: 'Early Blight (Alternaria solani)', bg: 'var(--red-pale)' },
  { icon: '📊', label: 'Confidence Level', val: '94.7%', bg: 'var(--blue-pale)' },
  { icon: '🌡️', label: 'Severity', val: 'Moderate — Stage 2 of 5', bg: 'var(--amber-pale)' },
  { icon: '💊', label: 'Treatment', val: 'Apply Mancozeb 75% WP @ 2.5g/L, spray at 10-day intervals', bg: 'var(--green-pale)' },
  { icon: '🛡️', label: 'Prevention', val: 'Use resistant varieties, crop rotation, proper spacing for air circulation', bg: 'var(--teal-pale)' },
]

export default function TabDisease({ showToast }) {
  const [state, setState] = useState('idle')
  const [fileName, setFileName] = useState('')
  const [preview, setPreview] = useState(null)
  const fileRef = useRef()

  const handleFile = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { showToast('Please upload an image file', 'error'); return }
    setFileName(file.name)
    setPreview(URL.createObjectURL(file))
    setState('analyzing')
    showToast('Analyzing crop image with AI...')
    setTimeout(() => { setState('done'); showToast('Disease analysis complete! ✓') }, 2600)
  }

  const handleDrop = (e) => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) handleFile(file) }
  const reset = () => { setState('idle'); setFileName(''); setPreview(null) }

  return (
    <>
      <div className="dash-header">
        <div><h1>AI Disease Detection</h1><p className="dash-sub">Upload a photo of your crop to detect diseases and get treatment recommendations</p></div>
        {state !== 'idle' && <button className="btn btn-ghost btn-sm" onClick={reset}>↺ New Analysis</button>}
      </div>

      {state === 'idle' && (
        <div className="disease-drop" onClick={() => fileRef.current.click()} onDrop={handleDrop} onDragOver={e => e.preventDefault()}>
          <div className="drop-icon">📸</div>
          <h3>Upload Crop Photo</h3>
          <p>Click to browse or drag & drop an image of your crop leaf or plant</p>
          <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>Supports: JPG, PNG, WEBP — Max 10MB</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }}>Choose Image →</button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
        </div>
      )}

      {state === 'analyzing' && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          {preview && <img src={preview} alt="crop" style={{ maxHeight: 200, borderRadius: 'var(--radius)', marginBottom: 24, boxShadow: 'var(--shadow-lg)' }} />}
          <div style={{ marginBottom: 16 }}><div className="spinner" /></div>
          <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Analyzing with AI...</h3>
          <p style={{ color: 'var(--text3)', fontSize: 14 }}>Image: {fileName}</p>
          <p style={{ color: 'var(--text3)', fontSize: 14, marginTop: 8 }}>Running computer vision disease detection model</p>
        </div>
      )}

      {state === 'done' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div>
              {preview && <img src={preview} alt="crop" style={{ width: '100%', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }} />}
              <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8, textAlign: 'center' }}>📁 {fileName}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ background: 'var(--red-pale)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: 'var(--radius)', padding: '16px 18px' }}>
                <div style={{ fontSize: 12, color: 'var(--red)', fontWeight: 700, marginBottom: 4 }}>DISEASE DETECTED</div>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800 }}>Early Blight</div>
                <div style={{ fontSize: 13, color: 'var(--text3)' }}>Alternaria solani</div>
              </div>
              <div style={{ background: 'var(--amber-pale)', borderRadius: 'var(--radius)', padding: '16px 18px' }}>
                <div style={{ fontSize: 12, color: 'var(--amber)', fontWeight: 700, marginBottom: 8 }}>SEVERITY SCALE</div>
                <div style={{ display: 'flex', gap: 4 }}>{[1,2,3,4,5].map(n => <div key={n} style={{ flex: 1, height: 10, borderRadius: 4, background: n <= 2 ? 'var(--amber)' : 'var(--border)' }} />)}</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 6 }}>Moderate — Stage 2 of 5</div>
              </div>
              <div style={{ background: 'var(--blue-pale)', borderRadius: 'var(--radius)', padding: '16px 18px' }}>
                <div style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 700, marginBottom: 4 }}>AI CONFIDENCE</div>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800, color: 'var(--blue)' }}>94.7%</div>
              </div>
            </div>
          </div>

          <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, marginBottom: 14 }}>📋 Diagnosis Report</h3>
          <div className="disease-result">
            {MOCK_RESULTS.map(r => (
              <div className="disease-finding" key={r.label}>
                <div className="finding-icon" style={{ background: r.bg }}>{r.icon}</div>
                <div><div className="finding-label">{r.label}</div><div className="finding-val">{r.val}</div></div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
            <button className="btn btn-primary" onClick={() => showToast('Report downloaded! ✓')}>📥 Download Report</button>
            <button className="btn btn-outline" onClick={() => showToast('Expert consultation requested! ✓')}>👨‍⚕️ Consult Expert</button>
          </div>
        </>
      )}

      <div style={{ marginTop: 32 }}>
        <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, marginBottom: 14 }}>🌿 Common Crop Diseases</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { name: 'Wheat Rust', icon: '🟤', crop: 'Wheat' }, { name: 'Blast Disease', icon: '💨', crop: 'Rice/Paddy' },
            { name: 'Early Blight', icon: '🦠', crop: 'Tomato' }, { name: 'Powdery Mildew', icon: '⬜', crop: 'All crops' },
            { name: 'Leaf Curl', icon: '🍂', crop: 'Cotton' }, { name: 'Root Rot', icon: '🪱', crop: 'Pulse crops' },
          ].map(d => (
            <div key={d.name} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 24 }}>{d.icon}</span>
              <div><div style={{ fontSize: 13, fontWeight: 700 }}>{d.name}</div><div style={{ fontSize: 12, color: 'var(--text3)' }}>{d.crop}</div></div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
