const router = require('express').Router()
const { query } = require('../config/db')
const auth = require('../middleware/auth')

/* ── GET /api/dashboard/stats ── */
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id
    const [crops, schemes, insurance, market] = await Promise.all([
      query(`SELECT COUNT(*) FROM insurance_policies WHERE user_id=$1 AND status='Active'`, [userId]),
      query(`SELECT COUNT(*) FROM scheme_applications WHERE user_id=$1`, [userId]),
      query(`SELECT COALESCE(SUM(sum_insured),0) as total FROM insurance_policies WHERE user_id=$1 AND status='Active'`, [userId]),
      query(`SELECT COUNT(*) FROM market_listings WHERE user_id=$1 AND is_active=true`, [userId]),
    ])
    res.json({
      success: true,
      stats: {
        activeCrops:       parseInt(crops.rows[0].count) || 0,
        schemesApplied:    parseInt(schemes.rows[0].count) || 0,
        insuranceCoverage: parseFloat(insurance.rows[0].total) || 0,
        marketListings:    parseInt(market.rows[0].count) || 0,
      }
    })
  } catch (err) {
    console.error('Stats error:', err.message)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

/* ── GET /api/dashboard/activities ── */
router.get('/activities', auth, async (req, res) => {
  try {
    const result = await query(`
      SELECT text, type, created_at
      FROM farm_activities
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `, [req.user.id])
    res.json({ success: true, activities: result.rows })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

/* ── POST /api/dashboard/activities ── */
router.post('/activities', auth, async (req, res) => {
  const { text, type = 'green' } = req.body
  if (!text) return res.status(400).json({ success: false, message: 'text is required' })
  try {
    const result = await query(`
      INSERT INTO farm_activities (user_id, text, type) VALUES ($1,$2,$3)
      RETURNING *
    `, [req.user.id, text, type])
    res.status(201).json({ success: true, activity: result.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

module.exports = router
