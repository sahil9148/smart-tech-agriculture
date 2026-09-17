const router = require('express').Router()
const { query } = require('../config/db')
const auth = require('../middleware/auth')

// Real government schemes with their actual official application portals.
// URLs verified September 2026 — if a ministry restructures a portal, update
// applyUrl here; this is the only place it needs to change.
const SCHEMES_CATALOGUE = [
  { name: 'PM-KISAN Samman Nidhi', category: 'Income Support', badge: 'Central Govt', desc: '₹6,000/year direct income support in 3 installments to all landholding farmer families.', applyUrl: 'https://pmkisan.gov.in/' },
  { name: 'Kisan Credit Card (KCC)', category: 'Credit', badge: 'NABARD', desc: 'Flexible credit for crop cultivation, post harvest, maintenance. Low interest @ 4% p.a. via the Jan Samarth portal.', applyUrl: 'https://www.jansamarth.in/kisan-credit-card-scheme' },
  { name: 'PMFBY — Crop Insurance', category: 'Insurance', badge: 'Central Govt', desc: 'Affordable crop insurance against natural calamities, pests & disease. Premium from 1.5%.', applyUrl: 'https://pmfby.gov.in/' },
  { name: 'Soil Health Card Scheme', category: 'Soil Testing', badge: 'Ministry of Agri', desc: 'Free soil health card with crop-wise fertilizer recommendations.', applyUrl: 'https://soilhealth.dac.gov.in/' },
  { name: 'PM-KUSUM Solar Pump Scheme', category: 'Equipment Subsidy', badge: 'MNRE', desc: 'Up to 60% subsidy on solar pumps for irrigation.', applyUrl: 'https://pmkusum.mnre.gov.in/' },
  { name: 'eNAM — Electronic APMC', category: 'Market Access', badge: 'Ministry of Agri', desc: 'Online trading platform for agricultural commodities across 1600+ mandis.', applyUrl: 'https://enam.gov.in/web/' },
  { name: 'Paramparagat Krishi Vikas Yojana', category: 'Organic Farming', badge: 'Central Govt', desc: 'Financial assistance of ₹31,500/ha over 3 years for organic farming adoption via PGS-India certification.', applyUrl: 'https://pgsindia-ncof.gov.in/' },
  { name: 'National Livestock Mission', category: 'Animal Husbandry', badge: 'Ministry of AHD', desc: 'Subsidies and support for poultry, sheep, goat and piggery entrepreneurship via the Udyami Mitra portal.', applyUrl: 'https://nlm.udyamimitra.in/' },
  { name: 'Agri Infrastructure Fund', category: 'Infrastructure', badge: 'Central Govt', desc: '₹1 Lakh crore financing facility for farm-gate infrastructure — cold storage, warehousing, processing units.', applyUrl: 'https://agriinfra.dac.gov.in/' },
]

/* ── GET /api/schemes ── */
router.get('/', auth, async (req, res) => {
  const { search, category } = req.query
  let filtered = SCHEMES_CATALOGUE
  if (search) {
    const s = search.toLowerCase()
    filtered = filtered.filter(sc =>
      sc.name.toLowerCase().includes(s) || sc.category.toLowerCase().includes(s)
    )
  }
  if (category && category !== 'All') {
    filtered = filtered.filter(sc => sc.category === category)
  }

  // Fetch user's applied schemes
  const applied = await query(
    'SELECT scheme_name, status FROM scheme_applications WHERE user_id = $1',
    [req.user.id]
  )
  const appliedMap = {}
  applied.rows.forEach(r => { appliedMap[r.scheme_name] = r.status })

  const result = filtered.map(sc => ({
    ...sc,
    applied: !!appliedMap[sc.name],
    applicationStatus: appliedMap[sc.name] || null,
  }))

  res.json({ success: true, schemes: result, total: result.length })
})

/* ── GET /api/schemes/applications ── */
router.get('/applications', auth, async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM scheme_applications WHERE user_id = $1 ORDER BY applied_at DESC
    `, [req.user.id])
    res.json({ success: true, applications: result.rows })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

/* ── POST /api/schemes/apply ── */
router.post('/apply', auth, async (req, res) => {
  const { schemeName, category, badge, notes } = req.body
  if (!schemeName) return res.status(400).json({ success: false, message: 'schemeName required' })

  try {
    // Check if already applied
    const existing = await query(
      'SELECT id FROM scheme_applications WHERE user_id=$1 AND scheme_name=$2',
      [req.user.id, schemeName]
    )
    if (existing.rows.length) {
      return res.status(409).json({ success: false, message: 'Already applied for this scheme' })
    }

    const result = await query(`
      INSERT INTO scheme_applications (user_id, scheme_name, category, badge, notes)
      VALUES ($1,$2,$3,$4,$5) RETURNING *
    `, [req.user.id, schemeName, category || null, badge || null, notes || null])

    // Add to activity feed
    await query(
      'INSERT INTO farm_activities (user_id, text, type) VALUES ($1,$2,$3)',
      [req.user.id, `Application for "${schemeName}" submitted successfully`, 'blue']
    )

    res.status(201).json({ success: true, application: result.rows[0] })
  } catch (err) {
    console.error('Apply scheme error:', err.message)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

module.exports = router
