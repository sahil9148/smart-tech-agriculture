const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }   // Render's PostgreSQL needs this
    : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'production') console.log('✓ PostgreSQL connected')
})

pool.on('error', (err) => {
  console.error('PostgreSQL error:', err.message)
})

// Helper: run a query
const query = (text, params) => pool.query(text, params)

// Helper: get a client for transactions
const getClient = () => pool.connect()

module.exports = { pool, query, getClient }
