const router = require('express').Router()
const { query } = require('../config/db')
const auth = require('../middleware/auth')

/* ── GET /api/reports/summary ── */
router.get('/summary', auth, async (req, res) => {
  try {
    const uid = req.user.id
    const [policies, apps, listings, activities] = await Promise.all([
      query('SELECT * FROM insurance_policies WHERE user_id=$1', [uid]),
      query('SELECT * FROM scheme_applications WHERE user_id=$1', [uid]),
      query('SELECT * FROM market_listings WHERE user_id=$1 AND is_active=true', [uid]),
      query('SELECT COUNT(*) FROM farm_activities WHERE user_id=$1', [uid]),
    ])

    const totalCoverage = policies.rows.reduce((s, r) => s + parseFloat(r.sum_insured || 0), 0)
    const totalPremium  = policies.rows.reduce((s, r) => s + parseFloat(r.premium_amt || 0), 0)

    res.json({
      success: true,
      report: {
        yield: {
          activeCrops:    policies.rows.filter(p => p.status === 'Active').length,
          yieldForecast:  '+18% vs last season',
          bestCrop:       'Wheat (HD-2967)',
          attentionNeeded:'Tomato (low moisture)',
        },
        water: {
          thisMonth:    '42,500 L',
          vsPrevMonth:  '−12%',
          target:       '38,000 L',
          efficiency:   '87%',
        },
        soil: {
          ph:           '6.8 (Optimal)',
          nitrogen:     'Medium — 280 kg/ha',
          phosphorus:   'High — 35 kg/ha',
          potassium:    'Medium — 190 kg/ha',
        },
        financial: {
          inputCosts:   185000,
          revenue:      420000,
          netProfit:    235000,
          roi:          '127%',
        },
        schemes: {
          applied:      apps.rows.length,
          approved:     apps.rows.filter(r => r.status === 'approved').length,
          pending:      apps.rows.filter(r => r.status === 'pending').length,
        },
        insurance: {
          activePolicies: policies.rows.filter(p => p.status === 'Active').length,
          totalCoverage,
          totalPremium,
          claims:         policies.rows.filter(p => p.status === 'Claim Filed').length,
          settled:        policies.rows.filter(p => p.status === 'Settled').length,
        },
        market: {
          activeListings: listings.rows.length,
        },
      }
    })
  } catch (err) {
    console.error('Reports error:', err.message)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

module.exports = router
