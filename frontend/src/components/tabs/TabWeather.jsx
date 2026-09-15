import { useState, useEffect } from 'react'
import { Weather } from '../../api.js'

export default function TabWeather() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Weather.get().then(d => setData(d.weather)).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="center-loading"><div className="spinner" /><span>Fetching weather data...</span></div>
  }
  if (!data) {
    return <div className="empty-state"><div className="icon">🌦️</div>Unable to load weather data. Please try again.</div>
  }

  const { current, forecast, advisories } = data
  const ADVISORY_BG = { red: 'var(--red-pale)', blue: 'var(--blue-pale)', green: 'var(--green-pale)' }
  const ADVISORY_BORDER = { red: 'rgba(192,57,43,0.2)', blue: 'rgba(26,95,168,0.2)', green: 'rgba(26,107,60,0.2)' }
  const ADVISORY_COLOR = { red: 'var(--red)', blue: 'var(--blue)', green: 'var(--green)' }

  return (
    <>
      <div className="dash-header">
        <h1>Weather Advisory</h1>
        <p className="dash-sub">Hyperlocal forecast and agricultural weather intelligence</p>
      </div>

      <div className="weather-current">
        <div>
          <div className="weather-temp">{current.temp}°C</div>
          <div className="weather-desc">🌤️ {current.desc}</div>
          <div className="weather-meta">
            <span className="weather-meta-item">💧 Humidity: {current.humidity}%</span>
            <span className="weather-meta-item">💨 Wind: {current.wind}</span>
            <span className="weather-meta-item">🌂 Rain: {current.rain}</span>
            <span className="weather-meta-item">☀️ UV Index: {current.uv}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.8)' }}>
          <div style={{ fontSize: 13, marginBottom: 4 }}>📍 Your Location</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{current.location}</div>
          <div style={{ fontSize: 12, marginTop: 8, opacity: 0.7 }}>Feels like {current.feelsLike}°C</div>
        </div>
      </div>

      <h3 style={{ margin: '24px 0 14px', fontFamily: 'var(--font-head)', fontWeight: 700 }}>📅 5-Day Forecast</h3>
      <div className="weather-forecast">
        {forecast.map(f => (
          <div className="forecast-card" key={f.day}>
            <div className="forecast-day">{f.day}</div>
            <div className="forecast-icon">{f.icon}</div>
            <div className="forecast-temps">{f.high}° / {f.low}°</div>
            <div className="forecast-rain">🌧 {f.rain}</div>
          </div>
        ))}
      </div>

      <h3 style={{ margin: '28px 0 14px', fontFamily: 'var(--font-head)', fontWeight: 700 }}>🌾 Agricultural Advisories</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {advisories.map(a => (
          <div key={a.title} style={{ background: ADVISORY_BG[a.type], border: `1px solid ${ADVISORY_BORDER[a.type]}`, borderRadius: 'var(--radius)', padding: '18px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 20 }}>{a.icon}</span>
              <strong style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, color: ADVISORY_COLOR[a.type] }}>{a.title}</strong>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.65 }}>{a.desc}</p>
          </div>
        ))}
      </div>
    </>
  )
}
