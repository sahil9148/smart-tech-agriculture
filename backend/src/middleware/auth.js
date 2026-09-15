const jwt = require('jsonwebtoken')
const { query } = require('../config/db')

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access token required' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    // Fetch fresh user from DB (ensures user still exists & is active)
    const result = await query(
      'SELECT id, name, email, phone, state, district, farm_size, crop_types, farming_type, avatar_url FROM users WHERE id = $1',
      [decoded.userId]
    )
    if (!result.rows.length) {
      return res.status(401).json({ success: false, message: 'User not found' })
    }
    req.user = result.rows[0]
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' })
    }
    return res.status(401).json({ success: false, message: 'Invalid token' })
  }
}

module.exports = auth
