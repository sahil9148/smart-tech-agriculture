const router = require('express').Router()
const { query } = require('../config/db')
const auth = require('../middleware/auth')

/* ── GET /api/market ── Public listings ── */
router.get('/', auth, async (req, res) => {
  const { search, category, minPrice, maxPrice, page = 1, limit = 20 } = req.query
  const offset = (parseInt(page) - 1) * parseInt(limit)

  let where = ['m.is_active = true']
  const params = []

  if (search) {
    params.push(`%${search}%`)
    where.push(`(m.title ILIKE $${params.length} OR m.category ILIKE $${params.length})`)
  }
  if (category && category !== 'All') {
    params.push(category)
    where.push(`m.category = $${params.length}`)
  }
  if (minPrice) {
    params.push(parseFloat(minPrice))
    where.push(`m.price_per_q >= $${params.length}`)
  }
  if (maxPrice) {
    params.push(parseFloat(maxPrice))
    where.push(`m.price_per_q <= $${params.length}`)
  }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : ''

  try {
    params.push(parseInt(limit))
    params.push(offset)
    const result = await query(`
      SELECT m.*, u.name AS seller_display, u.state AS seller_state
      FROM market_listings m
      JOIN users u ON u.id = m.user_id
      ${whereClause}
      ORDER BY m.listed_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params)

    // Count total
    const countParams = params.slice(0, params.length - 2)
    const countResult = await query(
      `SELECT COUNT(*) FROM market_listings m ${whereClause}`,
      countParams
    )

    res.json({
      success: true,
      listings: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
    })
  } catch (err) {
    console.error('Market list error:', err.message)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

/* ── GET /api/market/my-listings ── */
router.get('/my-listings', auth, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM market_listings WHERE user_id=$1 ORDER BY listed_at DESC',
      [req.user.id]
    )
    res.json({ success: true, listings: result.rows })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

/* ── POST /api/market ── Create listing ── */
router.post('/', auth, async (req, res) => {
  const { title, category, pricePerQ, quantityQ, unit, description, location } = req.body
  if (!title || !pricePerQ) {
    return res.status(400).json({ success: false, message: 'title and pricePerQ are required' })
  }
  try {
    const result = await query(`
      INSERT INTO market_listings (user_id, seller_name, title, category, price_per_q, quantity_q, unit, description, location)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [req.user.id, req.user.name, title, category || 'Grains',
        parseFloat(pricePerQ), parseFloat(quantityQ) || 0, unit || 'quintal',
        description || null, location || req.user.state || null])

    await query(
      'INSERT INTO farm_activities (user_id, text, type) VALUES ($1,$2,$3)',
      [req.user.id, `New listing "${title}" published on Marketplace`, 'green']
    )
    res.status(201).json({ success: true, listing: result.rows[0] })
  } catch (err) {
    console.error('Market create error:', err.message)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

/* ── PUT /api/market/:id ── Update listing ── */
router.put('/:id', auth, async (req, res) => {
  const { title, category, pricePerQ, quantityQ, description, location, isActive } = req.body
  try {
    const result = await query(`
      UPDATE market_listings SET
        title       = COALESCE($1, title),
        category    = COALESCE($2, category),
        price_per_q = COALESCE($3, price_per_q),
        quantity_q  = COALESCE($4, quantity_q),
        description = COALESCE($5, description),
        location    = COALESCE($6, location),
        is_active   = COALESCE($7, is_active),
        updated_at  = NOW()
      WHERE id=$8 AND user_id=$9 RETURNING *
    `, [title, category, pricePerQ ? parseFloat(pricePerQ) : null,
        quantityQ ? parseFloat(quantityQ) : null, description, location,
        isActive !== undefined ? isActive : null, req.params.id, req.user.id])

    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Listing not found' })
    res.json({ success: true, listing: result.rows[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

/* ── DELETE /api/market/:id ── */
router.delete('/:id', auth, async (req, res) => {
  try {
    await query('DELETE FROM market_listings WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id])
    res.json({ success: true, message: 'Listing deleted' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

/* ── POST /api/market/:id/inquiry ── */
router.post('/:id/inquiry', auth, async (req, res) => {
  const { message } = req.body
  try {
    // Check listing exists
    const listing = await query('SELECT id, user_id, title FROM market_listings WHERE id=$1 AND is_active=true', [req.params.id])
    if (!listing.rows.length) return res.status(404).json({ success: false, message: 'Listing not found' })

    const result = await query(`
      INSERT INTO market_inquiries (listing_id, buyer_id, message) VALUES ($1,$2,$3) RETURNING *
    `, [req.params.id, req.user.id, message || 'Interested in your listing'])

    // Notify seller via activity feed
    await query(
      'INSERT INTO farm_activities (user_id, text, type) VALUES ($1,$2,$3)',
      [listing.rows[0].user_id, `New inquiry for your listing "${listing.rows[0].title}"`, 'amber']
    )
    res.status(201).json({ success: true, inquiry: result.rows[0] })
  } catch (err) {
    console.error('Inquiry error:', err.message)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

/* ── GET /api/market/msp ── MSP Rates ── */
router.get('/msp', auth, (req, res) => {
  res.json({
    success: true,
    season: '2025-26',
    rates: [
      { crop: 'Wheat', msp: 2275, change: '+5.4%', season: 'Rabi' },
      { crop: 'Paddy (Common)', msp: 2183, change: '+7.0%', season: 'Kharif' },
      { crop: 'Maize', msp: 2090, change: '+6.2%', season: 'Kharif' },
      { crop: 'Soybean', msp: 4892, change: '+4.1%', season: 'Kharif' },
      { crop: 'Mustard', msp: 5650, change: '+8.3%', season: 'Rabi' },
      { crop: 'Gram', msp: 5440, change: '+5.2%', season: 'Rabi' },
      { crop: 'Groundnut', msp: 6783, change: '+3.8%', season: 'Kharif' },
      { crop: 'Sunflower', msp: 7280, change: '+5.0%', season: 'Kharif' },
    ]
  })
})

module.exports = router
