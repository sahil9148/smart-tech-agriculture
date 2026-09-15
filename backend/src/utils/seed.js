require('dotenv').config()
const { pool } = require('../config/db')
const bcrypt = require('bcryptjs')

async function seed() {
  const client = await pool.connect()
  try {
    console.log('🌱 Seeding database...')

    // Demo user
    const hash = await bcrypt.hash('Demo@1234', 12)
    const userRes = await client.query(`
      INSERT INTO users (name, email, password_hash, phone, state, district, farm_size, crop_types, farming_type)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `, ['Sahil Arora', 'sahil@agritech.in', hash, '+91 9876543210', 'Uttar Pradesh', 'Greater Noida', 5, 'Wheat, Rice, Mustard', 'Mixed'])
    const userId = userRes.rows[0].id
    console.log('  ✓ Demo user created  (email: sahil@agritech.in  password: Demo@1234)')

    // Seed insurance policies
    await client.query(`DELETE FROM insurance_policies WHERE user_id = $1`, [userId])
    await client.query(`
      INSERT INTO insurance_policies (user_id, crop_name, season, area_acres, premium_amt, sum_insured, status)
      VALUES
        ($1,'Wheat','Rabi 2025-26',4,1240,62000,'Active'),
        ($1,'Tomato','Kharif 2025',2,680,34000,'Claim Filed'),
        ($1,'Mustard','Rabi 2024-25',3,920,46000,'Settled')
    `, [userId])
    console.log('  ✓ Insurance policies seeded')

    // Seed scheme applications
    await client.query(`DELETE FROM scheme_applications WHERE user_id = $1`, [userId])
    await client.query(`
      INSERT INTO scheme_applications (user_id, scheme_name, category, badge, status)
      VALUES
        ($1,'PM-KISAN Samman Nidhi','Income Support','Central Govt','approved'),
        ($1,'Kisan Credit Card (KCC)','Credit','NABARD','approved'),
        ($1,'PMFBY — Crop Insurance','Insurance','Central Govt','pending')
    `, [userId])
    console.log('  ✓ Scheme applications seeded')

    // Seed market listings
    await client.query(`DELETE FROM market_listings WHERE user_id = $1`, [userId])
    await client.query(`
      INSERT INTO market_listings (user_id, seller_name, title, category, price_per_q, quantity_q, location)
      VALUES
        ($1,'Rajesh Kumar, Punjab','Organic Wheat Flour','Grains',2450,25,'Punjab'),
        ($1,'Arun Verma, UP','Basmati Rice (Premium)','Grains',6800,15,'Uttar Pradesh'),
        ($1,'Priya Sharma, Maharashtra','Fresh Tomatoes','Vegetables',1200,8,'Maharashtra'),
        ($1,'AgriStore Plus','NPK Fertilizer 20-20-20','Fertilizers',850,50,'Pan India'),
        ($1,'IrriTech Solutions','Drip Irrigation Kit','Equipment',12500,1,'Pan India'),
        ($1,'SeedCorp India','Hybrid Tomato Seeds','Seeds',450,100,'Pan India')
    `, [userId])
    console.log('  ✓ Market listings seeded')

    // Seed farm activities
    await client.query(`DELETE FROM farm_activities WHERE user_id = $1`, [userId])
    await client.query(`
      INSERT INTO farm_activities (user_id, text, type, created_at)
      VALUES
        ($1,'PM-KISAN installment of ₹2,000 credited to your account','green', NOW() - INTERVAL '2 hours'),
        ($1,'Wheat (Rabi) PMFBY enrolment confirmed — ₹1,240 premium paid','blue', NOW() - INTERVAL '5 hours'),
        ($1,'New buyer posted ₹2,600/quintal for Wheat — check Marketplace','amber', NOW() - INTERVAL '8 hours'),
        ($1,'Equipment application for Tractor loan submitted successfully','green', NOW() - INTERVAL '1 day'),
        ($1,'Weather alert: Hailstorm risk Thursday — consider crop protection','red', NOW() - INTERVAL '1 day'),
        ($1,'KCC credit limit of ₹1,50,000 approved','blue', NOW() - INTERVAL '2 days')
    `, [userId])
    console.log('  ✓ Farm activities seeded')

    console.log('\n✅ Database seeded successfully!')
    console.log('   Login: sahil@agritech.in / Demo@1234')
  } catch (err) {
    console.error('❌ Seed error:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

seed()
