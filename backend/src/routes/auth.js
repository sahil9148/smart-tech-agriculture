const router  = require('express').Router()
const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const { query } = require('../config/db')
const authMiddleware = require('../middleware/auth')

/* ── Helper: issue JWT pair ── */
function issueTokens(userId) {
  const access = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
  return { access }
}

/* ── POST /api/auth/register ── */
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() })
  }

  const { name, email, password, phone, state, district, farmSize, cropTypes, farmingType } = req.body

  try {
    // Check if user exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email])
    if (existing.rows.length) {
      return res.status(409).json({ success: false, message: 'Email already registered' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const result = await query(`
      INSERT INTO users (name, email, password_hash, phone, state, district, farm_size, crop_types, farming_type)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING id, name, email, phone, state, district, farm_size, crop_types, farming_type, created_at
    `, [name, email, passwordHash, phone || null, state || null, district || null,
        farmSize ? parseFloat(farmSize) : null, cropTypes || null, farmingType || 'Traditional'])

    const user = result.rows[0]

    // Seed default activities for new user
    await query(`
      INSERT INTO farm_activities (user_id, text, type)
      VALUES ($1,'Welcome to Smart AgriTech! Your journey starts here 🌾','green')
    `, [user.id])

    const { access } = issueTokens(user.id)
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token: access,
      user: {
        id: user.id, name: user.name, email: user.email,
        phone: user.phone, state: user.state,
        farmSize: user.farm_size, cropTypes: user.crop_types,
      }
    })
  } catch (err) {
    console.error('Register error:', err.message)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

/* ── POST /api/auth/login ── */
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Email and password required' })
  }

  const { email, password } = req.body
  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email])
    if (!result.rows.length) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }

    const user = result.rows[0]

    if (!user.password_hash) {
      return res.status(401).json({ success: false, message: 'This account uses Google sign-in' })
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' })
    }

    const { access } = issueTokens(user.id)
    res.json({
      success: true,
      message: 'Login successful',
      token: access,
      user: {
        id: user.id, name: user.name, email: user.email,
        phone: user.phone, state: user.state, district: user.district,
        farmSize: user.farm_size, cropTypes: user.crop_types,
        farmingType: user.farming_type,
      }
    })
  } catch (err) {
    console.error('Login error:', err.message)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

/* ── POST /api/auth/google ── */
// Accepts Google ID token from frontend Firebase Auth, creates/finds user
router.post('/google', async (req, res) => {
  const { uid, name, email, photoUrl } = req.body
  if (!uid || !email) {
    return res.status(400).json({ success: false, message: 'uid and email required' })
  }

  try {
    // Upsert user
    const result = await query(`
      INSERT INTO users (name, email, google_id, avatar_url)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (email) DO UPDATE SET
        google_id  = COALESCE(EXCLUDED.google_id, users.google_id),
        avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
        updated_at = NOW()
      RETURNING id, name, email, phone, state, district, farm_size, crop_types, farming_type
    `, [name, email, uid, photoUrl || null])

    const user = result.rows[0]
    const { access } = issueTokens(user.id)
    res.json({
      success: true, token: access,
      user: {
        id: user.id, name: user.name, email: user.email,
        phone: user.phone, state: user.state,
        farmSize: user.farm_size, cropTypes: user.crop_types,
      }
    })
  } catch (err) {
    console.error('Google auth error:', err.message)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

/* ── GET /api/auth/me ── */
router.get('/me', authMiddleware, (req, res) => {
  res.json({ success: true, user: req.user })
})

/* ── PUT /api/auth/profile ── */
router.put('/profile', authMiddleware, async (req, res) => {
  const { name, phone, state, district, farmSize, cropTypes, farmingType } = req.body
  try {
    const result = await query(`
      UPDATE users SET
        name         = COALESCE($1, name),
        phone        = COALESCE($2, phone),
        state        = COALESCE($3, state),
        district     = COALESCE($4, district),
        farm_size    = COALESCE($5, farm_size),
        crop_types   = COALESCE($6, crop_types),
        farming_type = COALESCE($7, farming_type),
        updated_at   = NOW()
      WHERE id = $8
      RETURNING id, name, email, phone, state, district, farm_size, crop_types, farming_type
    `, [name, phone, state, district, farmSize ? parseFloat(farmSize) : null, cropTypes, farmingType, req.user.id])

    res.json({ success: true, user: result.rows[0] })
  } catch (err) {
    console.error('Profile update error:', err.message)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

/* ── PUT /api/auth/password ── */
router.put('/password', authMiddleware, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
], async (req, res) => {
  const { currentPassword, newPassword } = req.body
  try {
    const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id])
    const user = result.rows[0]
    if (!user.password_hash) {
      return res.status(400).json({ success: false, message: 'Cannot change password for Google accounts' })
    }
    const valid = await bcrypt.compare(currentPassword, user.password_hash)
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' })
    }
    const newHash = await bcrypt.hash(newPassword, 12)
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user.id])
    res.json({ success: true, message: 'Password changed successfully' })
  } catch (err) {
    console.error('Password change error:', err.message)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

module.exports = router
