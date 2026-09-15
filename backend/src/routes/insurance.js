const router = require('express').Router()
const { query } = require('../config/db')
const auth = require('../middleware/auth')

/* ── GET /api/insurance ── */
router.get('/', auth, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM insurance_policies WHERE user_id=$1 ORDER BY enrolled_at DESC',
      [req.user.id]
    )
    // Summary
    const active  = result.rows.filter(r => r.status === 'Active').length
    const claims  = result.rows.filter(r => r.status === 'Claim Filed').length
    const settled = result.rows.filter(r => r.status === 'Settled').length
    const totalCoverage = result.rows.reduce((s, r) => s + parseFloat(r.sum_insured || 0), 0)

    res.json({
      success: true,
      policies: result.rows,
      summary: { active, claims, settled, totalCoverage }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

/* ── POST /api/insurance/enrol ── */
router.post('/enrol', auth, async (req, res) => {
  const { cropName, season, areaAcres, farmingType } = req.body
  if (!cropName || !areaAcres) {
    return res.status(400).json({ success: false, message: 'cropName and areaAcres required' })
  }

  // PMFBY premium calculation
  const area = parseFloat(areaAcres)
  const sumInsured  = area * 15500   // ₹15,500 per acre default
  const premiumRate = (season || '').toLowerCase().includes('kharif') ? 0.02 : 0.015
  const premiumAmt  = Math.round(sumInsured * premiumRate)

  try {
    const result = await query(`
      INSERT INTO insurance_policies (user_id, crop_name, season, area_acres, premium_amt, sum_insured, status)
      VALUES ($1,$2,$3,$4,$5,$6,'Active') RETURNING *
    `, [req.user.id, cropName, season || null, area, premiumAmt, sumInsured])

    await query(
      'INSERT INTO farm_activities (user_id, text, type) VALUES ($1,$2,$3)',
      [req.user.id, `PMFBY enrolment for ${cropName} confirmed — ₹${premiumAmt.toLocaleString('en-IN')} premium`, 'blue']
    )
    res.status(201).json({ success: true, policy: result.rows[0] })
  } catch (err) {
    console.error('Insurance enrol error:', err.message)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

/* ── POST /api/insurance/:id/claim ── */
router.post('/:id/claim', auth, async (req, res) => {
  const { id } = req.params
  const { reason, claimAmount } = req.body
  try {
    const result = await query(`
      UPDATE insurance_policies SET status='Claim Filed', claim_amount=$1, updated_at=NOW()
      WHERE id=$2 AND user_id=$3 RETURNING *
    `, [claimAmount ? parseFloat(claimAmount) : null, id, req.user.id])

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Policy not found' })
    }
    await query(
      'INSERT INTO farm_activities (user_id, text, type) VALUES ($1,$2,$3)',
      [req.user.id, `Crop damage claim filed for ${result.rows[0].crop_name}`, 'amber']
    )
    res.json({ success: true, policy: result.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

/* ── DELETE /api/insurance/:id ── */
router.delete('/:id', auth, async (req, res) => {
  try {
    await query('DELETE FROM insurance_policies WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id])
    res.json({ success: true, message: 'Policy removed' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

module.exports = router
