const router = require('express').Router()
const { query } = require('../config/db')
const auth = require('../middleware/auth')

// applyUrl points to real, verified destinations on TractorJunction — a real,
// established Indian farm-equipment marketplace with genuine multi-bank loan
// comparison (SBI, HDFC, ICICI, Bank of Baroda, IndusInd, TVS Credit, etc.)
// and per-brand listing pages. Clicking through takes the farmer to an actual
// place to browse real listings and start a real loan application.
const EQUIPMENT_CATALOGUE = [
  { name: 'Mahindra Arjun 605 Tractor', category: 'Tractor', icon: '🚜', price: 750000, emi: 14200, desc: '60 HP, 4WD, perfect for medium farms. Available on 5-yr loan at 7% interest.', tag: 'Popular', applyUrl: 'https://www.tractorjunction.com/mahindra-tractor/', financeUrl: 'https://www.tractorjunction.com/tractor-loan/' },
  { name: 'John Deere 5050E Tractor', category: 'Tractor', icon: '🚜', price: 920000, emi: 17400, desc: '50 HP, ideal for wheat & paddy. Subsidised under state agricultural scheme.', tag: 'Subsidy', applyUrl: 'https://www.tractorjunction.com/john-deere-tractor/', financeUrl: 'https://www.tractorjunction.com/tractor-loan/' },
  { name: 'Kubota Paddy Harvester', category: 'Harvester', icon: '🌾', price: 1280000, emi: 22000, desc: 'Self-propelled paddy harvester. Rental also available at ₹1,800/hr.', tag: 'Rental', applyUrl: 'https://www.tractorjunction.com/kubota-tractor/', financeUrl: 'https://www.tractorjunction.com/tractor-loan/' },
  { name: 'Kirloskar Star-1 Water Pump', category: 'Pump', icon: '💧', price: 18500, emi: 1800, desc: '5 HP diesel pump, ideal for drip & sprinkler irrigation. 60% subsidy under PM-KUSUM.', tag: 'Subsidy', applyUrl: 'https://pmkusum.mnre.gov.in/', financeUrl: 'https://pmkusum.mnre.gov.in/' },
  { name: 'VST Shakti 130 Power Tiller', category: 'Tiller', icon: '🔧', price: 120000, emi: 2800, desc: '13 HP, best for small/hilly farms. 3-yr zero-interest EMI scheme available.', tag: '0% EMI', applyUrl: 'https://www.tractorjunction.com/vst-shakti-tractor/', financeUrl: 'https://www.tractorjunction.com/tractor-loan/' },
  { name: 'Drone Sprayer Service', category: 'Drone', icon: '🛸', price: 800, emi: null, desc: 'AI-guided pesticide drone spraying service. No purchase required.', tag: 'Rental', applyUrl: 'https://www.tractorjunction.com/', financeUrl: null },
  { name: 'Laser Land Leveller', category: 'Leveller', icon: '📐', price: 450000, emi: 8500, desc: 'GPS-guided laser land leveller. Reduces water usage by 25%.', tag: 'New', applyUrl: 'https://www.tractorjunction.com/', financeUrl: 'https://www.tractorjunction.com/tractor-loan/' },
  { name: 'Mini Rice Mill', category: 'Processing', icon: '🏭', price: 280000, emi: 5200, desc: '1 ton/hr capacity mini rice mill. Perfect for farmer cooperatives.', tag: '', applyUrl: 'https://www.tractorjunction.com/', financeUrl: 'https://www.tractorjunction.com/tractor-loan/' },
]

/* ── GET /api/equipment ── */
router.get('/', auth, async (req, res) => {
  const { search, category } = req.query
  let list = EQUIPMENT_CATALOGUE
  if (search) {
    const s = search.toLowerCase()
    list = list.filter(e => e.name.toLowerCase().includes(s) || e.category.toLowerCase().includes(s))
  }
  if (category && category !== 'All') list = list.filter(e => e.category === category)

  // Fetch user's applications
  const apps = await query(
    'SELECT equipment_name, status FROM equipment_applications WHERE user_id=$1', [req.user.id]
  )
  const appMap = {}
  apps.rows.forEach(r => { appMap[r.equipment_name] = r.status })

  res.json({
    success: true,
    equipment: list.map(e => ({
      ...e,
      priceFormatted: `₹${(e.price/100000 >= 1 ? (e.price/100000).toFixed(1)+'L' : e.price.toLocaleString('en-IN'))}`,
      emiFormatted: e.emi ? `₹${e.emi.toLocaleString('en-IN')}/mo` : 'N/A',
      applied: !!appMap[e.name],
      applicationStatus: appMap[e.name] || null,
    }))
  })
})

/* ── GET /api/equipment/applications ── */
router.get('/applications', auth, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM equipment_applications WHERE user_id=$1 ORDER BY applied_at DESC', [req.user.id]
    )
    res.json({ success: true, applications: result.rows })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

/* ── POST /api/equipment/apply ── */
router.post('/apply', auth, async (req, res) => {
  const { equipmentName, category, loanAmount, tenureYears, purpose } = req.body
  if (!equipmentName || !loanAmount) {
    return res.status(400).json({ success: false, message: 'equipmentName and loanAmount required' })
  }
  try {
    const result = await query(`
      INSERT INTO equipment_applications (user_id, equipment_name, category, loan_amount, tenure_years, purpose)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [req.user.id, equipmentName, category || null, parseFloat(loanAmount), parseInt(tenureYears) || 5, purpose || 'Purchase'])

    await query(
      'INSERT INTO farm_activities (user_id, text, type) VALUES ($1,$2,$3)',
      [req.user.id, `Loan application for "${equipmentName}" submitted successfully`, 'green']
    )
    res.status(201).json({ success: true, application: result.rows[0] })
  } catch (err) {
    console.error('Equipment apply error:', err.message)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

module.exports = router
