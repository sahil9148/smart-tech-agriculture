require('dotenv').config()
const express    = require('express')
const cors       = require('cors')
const helmet     = require('helmet')
const morgan     = require('morgan')
const rateLimit  = require('express-rate-limit')
const path       = require('path')

const app = express()

/* ── Security & Middleware ── */
app.use(helmet({ crossOriginEmbedderPolicy: false }))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

/* ── CORS ── */
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
].filter(Boolean)

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (Postman, mobile apps)
    if (!origin) return cb(null, true)
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      return cb(null, true)
    }
    cb(new Error('CORS not allowed for: ' + origin))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

/* ── Rate Limiting ── */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' }
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts. Please wait 15 minutes.' }
})

app.use('/api/', apiLimiter)
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)

/* ── API Routes ── */
app.use('/api/auth',      require('./routes/auth'))
app.use('/api/dashboard', require('./routes/dashboard'))
app.use('/api/schemes',   require('./routes/schemes'))
app.use('/api/equipment', require('./routes/equipment'))
app.use('/api/insurance', require('./routes/insurance'))
app.use('/api/market',    require('./routes/market'))
app.use('/api/weather',   require('./routes/weather'))
app.use('/api/chat',      require('./routes/chat'))
app.use('/api/reports',   require('./routes/reports'))

/* ── Health Check ── */
app.get('/api/health', async (req, res) => {
  const { pool } = require('./config/db')
  let dbStatus = 'disconnected'
  try {
    await pool.query('SELECT 1')
    dbStatus = 'connected'
  } catch (_) {}

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    db: dbStatus,
    environment: process.env.NODE_ENV || 'development',
  })
})

/* ── Serve Frontend in Production ── */
// Render can serve both backend + frontend from same service
// OR you can deploy frontend separately on Render Static Site
if (process.env.NODE_ENV === 'production') {
  const frontendBuild = path.join(__dirname, '../../frontend/dist')
  const fs = require('fs')
  if (fs.existsSync(frontendBuild)) {
    app.use(express.static(frontendBuild))
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api/')) {
        res.sendFile(path.join(frontendBuild, 'index.html'))
      }
    })
  }
}

/* ── 404 Handler ── */
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` })
})

/* ── Global Error Handler ── */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message)
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  })
})

/* ── Start Server ── */
// Migrations run separately via `npm run migrate` (see package.json /
// render.yaml startCommand), which is idempotent (CREATE TABLE IF NOT
// EXISTS) so it's safe to run before every boot.
const PORT = parseInt(process.env.PORT) || 5000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🌾 Smart AgriTech API Server`)
  console.log(`   Running on port ${PORT}`)
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`   Health: http://localhost:${PORT}/api/health\n`)
})

module.exports = app
