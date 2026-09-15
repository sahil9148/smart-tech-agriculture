const router = require('express').Router()
const auth = require('../middleware/auth')

// In production you'd call OpenWeatherMap or IMD API with the user's location
// For now we return intelligent mock data + advisory engine
function getWeatherData(state) {
  const stateWeather = {
    'Punjab':        { temp: 24, desc: 'Partly Cloudy', humidity: 58 },
    'Haryana':       { temp: 26, desc: 'Sunny', humidity: 52 },
    'Uttar Pradesh': { temp: 28, desc: 'Partly Cloudy', humidity: 62 },
    'Maharashtra':   { temp: 31, desc: 'Humid', humidity: 78 },
    'Rajasthan':     { temp: 35, desc: 'Hot and Dry', humidity: 28 },
    'Gujarat':       { temp: 32, desc: 'Partly Cloudy', humidity: 65 },
    'Karnataka':     { temp: 27, desc: 'Light Rain', humidity: 80 },
    'Tamil Nadu':    { temp: 33, desc: 'Humid', humidity: 82 },
    'West Bengal':   { temp: 29, desc: 'Cloudy', humidity: 85 },
    'Bihar':         { temp: 27, desc: 'Partly Cloudy', humidity: 68 },
  }
  const base = stateWeather[state] || { temp: 28, desc: 'Partly Cloudy', humidity: 62 }
  return {
    current: {
      ...base,
      wind: '12 km/h NW',
      rain: '2mm',
      uv: 6,
      location: state || 'Your Location',
      feelsLike: base.temp - 2,
      pressure: 1013,
    },
    forecast: [
      { day: 'Mon', icon: '☀️', high: base.temp + 3, low: base.temp - 10, rain: '0%',  desc: 'Clear' },
      { day: 'Tue', icon: '🌤️', high: base.temp + 1, low: base.temp - 11, rain: '10%', desc: 'Partly Cloudy' },
      { day: 'Wed', icon: '🌧️', high: base.temp - 3, low: base.temp - 12, rain: '70%', desc: 'Rain' },
      { day: 'Thu', icon: '⛈️', high: base.temp - 5, low: base.temp - 13, rain: '85%', desc: 'Thunderstorm' },
      { day: 'Fri', icon: '🌤️', high: base.temp - 1, low: base.temp - 11, rain: '15%', desc: 'Partly Cloudy' },
    ],
    advisories: [
      { type: 'red',   icon: '⛈️', title: 'Hailstorm Alert — Thursday', desc: 'High probability of hailstorm activity. Cover sensitive crops like tomatoes and vegetables. Delay spraying operations.' },
      { type: 'blue',  icon: '💧', title: 'Irrigation Advisory', desc: 'Soil moisture is adequate until Wednesday. Hold irrigation for wheat fields. Resume after dry spell on Friday.' },
      { type: 'green', icon: '🌾', title: 'Harvest Window', desc: 'Clear weather Monday–Tuesday is ideal for mustard harvesting. Complete harvest before Wednesday rains.' },
    ]
  }
}

/* ── GET /api/weather ── */
router.get('/', auth, (req, res) => {
  const state = req.user.state || 'Uttar Pradesh'
  const data  = getWeatherData(state)
  res.json({ success: true, weather: data })
})

/* ── GET /api/weather/advisory ── */
router.get('/advisory', auth, (req, res) => {
  const state = req.user.state || 'Uttar Pradesh'
  const data  = getWeatherData(state)
  res.json({ success: true, advisories: data.advisories })
})

module.exports = router
