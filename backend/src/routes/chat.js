const router = require('express').Router()
const { query } = require('../config/db')
const auth = require('../middleware/auth')

const SYSTEM_PROMPT = `You are KisanAI, a friendly and expert agricultural assistant for the Smart AgriTech Platform — a digital empowerment platform for Indian farmers.

You help farmers with:
- Government schemes (PM-KISAN, PMFBY, KCC, eNAM, PM-KUSUM, soil health cards, etc.)
- Crop advisory (best practices, sowing schedules, fertilizer recommendations, pest/disease control)
- Equipment guidance (tractor selection, EMI options, rental vs purchase, maintenance)
- Crop insurance (PMFBY enrollment, claim procedures, premium calculation)
- Market prices (MSP rates, mandi trends, direct selling strategies, FPO benefits)
- Weather-based farming decisions
- Soil health and water management
- Organic farming and sustainable practices
- Loan and credit guidance (KCC, NABARD schemes)

Key facts to remember:
- MSP 2025-26: Wheat ₹2,275/q, Paddy ₹2,183/q, Mustard ₹5,650/q, Gram ₹5,440/q
- PM-KISAN: ₹6,000/year in 3 installments of ₹2,000
- PMFBY premium: Kharif 2%, Rabi 1.5%, Horticulture 5%
- KCC interest: 4% p.a. for loans up to ₹3 lakh (with subvention)

Respond in a warm, practical, actionable manner. Use simple language a farmer can understand. Use emojis naturally. Keep responses concise but complete. If asked in Hindi or other Indian languages, respond in that language.

Always end with a specific actionable tip or next step when relevant.`

const DEMO_RESPONSES = {
  'pm-kisan': `🏛️ **PM-KISAN Samman Nidhi** gives ₹6,000/year in 3 installments of ₹2,000 to all eligible landholding farmer families.\n\n**How to apply:**\n1. Visit your local Gram Panchayat or Common Service Centre (CSC)\n2. Submit: Aadhaar + land records + bank passbook (Aadhaar-linked)\n3. Or apply online at pmkisan.gov.in\n\n💡 **Tip:** Use the Gov Connect tab in your dashboard to track application status!`,
  'pmfby': `🛡️ **PMFBY Crop Insurance** premium rates:\n• Kharif crops — **2%** of sum insured\n• Rabi crops — **1.5%** of sum insured\n• Horticulture — **5%** of sum insured\n\nGovernment pays the remaining premium subsidy.\n\n**Coverage:** Drought, flood, cyclone, hailstorm, pests & disease.\n**Claim:** Report crop loss within **72 hours** to your bank.\n\n💡 **Tip:** Enrol through the Crop Insurance tab — takes just 3 minutes!`,
  'wheat': `🌾 **Wheat Cultivation Advisory:**\n\n**Best Varieties (UP/Punjab):** HD-3226, GW-322, PBW-343\n**Sowing Time:** November 1–30 (Rabi season)\n\n**Fertilizer Schedule:**\n• Basal dose: DAP 100 kg/ha + Urea 100 kg/ha\n• At tillering (21 DAS): Urea 50 kg/ha\n• At jointing: Urea 30 kg/ha\n\n**Water:** 5–6 irrigations critical. First at Crown Root Initiation (21 days)\n\n**MSP 2025-26:** ₹2,275/quintal\n\n💡 **Tip:** Sow HD-2781 for late-sowing (after Nov 25) conditions!`,
  'tractor': `🚜 **Equipment Finance Options:**\n\n**Top Tractors:**\n• Mahindra Arjun 605 (60HP) — ₹7.5L | EMI: ₹14,200/mo\n• John Deere 5050E (50HP) — ₹9.2L | EMI: ₹17,400/mo\n\n**Loan Terms:**\n• Interest: 7–9% p.a.\n• Tenure: 3–7 years\n• Down payment: 15–20%\n• PM-KUSUM subsidy available on solar tractors\n\n**Documents:** Aadhaar, land records, bank statements (6 months)\n\n💡 **Tip:** Apply through the Equipment tab for instant processing!`,
  'market': `📊 **MSP Rates 2025-26:**\n\n| Crop | MSP (₹/quintal) |\n|------|------------------|\n| Wheat | ₹2,275 |\n| Paddy | ₹2,183 |\n| Mustard | ₹5,650 |\n| Gram | ₹5,440 |\n| Maize | ₹2,090 |\n| Soybean | ₹4,892 |\n\n**Best Selling Options:**\n• APMC Mandis (assured MSP)\n• FPO collective selling (premium rates)\n• Direct listing on our Marketplace\n\n💡 **Tip:** List your produce on the Marketplace tab to connect with direct buyers and get better prices!`,
  'weather': `🌦️ **Weather Advisory:**\n\nThis week: Mon–Tue clear, ideal for harvesting and spraying. Wed–Thu rain/hailstorm risk — protect crops. Fri improving.\n\n**Farm Actions:**\n• Delay fertilizer spray until Saturday\n• Cover tomatoes/vegetables Thursday\n• Complete mustard harvest by Tuesday\n• Hold irrigation until after Wednesday rains\n\n💡 **Tip:** Check the Weather tab daily for location-specific 5-day forecasts!`,
  'organic': `🌿 **Organic Farming Guidance:**\n\n**PKVY Scheme:** ₹50,000/ha for 3 years for organic conversion!\n\n**Key Practices:**\n• Farmyard manure (FYM): 10 tons/ha\n• Vermicompost: 5 tons/ha\n• Neem-based pesticides for pest control\n• Green manuring with dhaincha/sunhemp\n\n**Certification:**\n• NPOP (National Programme for Organic Production)\n• PGS-India for small farmer groups\n\n**Premium:** Organic produce gets 20–50% premium in markets!\n\n💡 **Tip:** Apply for PKVY through the Gov Connect tab!`,
  'kcc': `💳 **Kisan Credit Card (KCC) Features:**\n\n• Credit limit: Up to ₹3 lakh (interest subvention applies)\n• Interest rate: **4% p.a.** (after subvention for timely repayment)\n• Covers: Seeds, fertilizers, pesticides, machinery, post-harvest needs\n• Revolving credit — repay after harvest\n\n**How to get:**\n1. Visit your nearest bank (SBI, PNB, Cooperative banks)\n2. Submit: Land records, Aadhaar, passport photo\n3. Sanction usually within 2 weeks\n\n💡 **Tip:** Apply for KCC through the Gov Connect tab in your dashboard!`,
}

function getDemoResponse(text) {
  const t = text.toLowerCase()
  for (const [key, response] of Object.entries(DEMO_RESPONSES)) {
    if (t.includes(key)) return response
  }
  return `🌾 I'm KisanAI, your agricultural assistant! I can help with:\n\n• 🏛️ **Government schemes** — PM-KISAN, PMFBY, KCC\n• 🌱 **Crop advisory** — sowing, fertilizers, pest control\n• 🚜 **Equipment & loans** — tractors, EMI options\n• 🌦️ **Weather-based tips** — irrigation, harvest windows\n• 📊 **Market prices** — MSP, mandi trends\n• 🌿 **Organic farming** — PKVY scheme, certification\n\nPlease ask me a specific question and I'll provide detailed guidance!`
}

/* ── GET /api/chat/history ── */
router.get('/history', auth, async (req, res) => {
  try {
    const result = await query(
      'SELECT role, content, created_at FROM chat_history WHERE user_id=$1 ORDER BY created_at ASC LIMIT 50',
      [req.user.id]
    )
    res.json({ success: true, messages: result.rows })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

/* ── POST /api/chat ── */
router.post('/', auth, async (req, res) => {
  const { message, history = [] } = req.body
  if (!message?.trim()) {
    return res.status(400).json({ success: false, message: 'message is required' })
  }

  // Save user message
  try {
    await query(
      'INSERT INTO chat_history (user_id, role, content) VALUES ($1,$2,$3)',
      [req.user.id, 'user', message]
    )
  } catch (_) { /* non-critical */ }

  // Try Anthropic Claude API
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (apiKey && !apiKey.startsWith('your_') && !apiKey.startsWith('sk-ant-your')) {
    try {
      const messages = [
        // Include recent history for context
        ...history.slice(-8).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: message }
      ]

      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 800,
          system: SYSTEM_PROMPT + `\n\nFarmer context: Name: ${req.user.name}, State: ${req.user.state || 'India'}, Crops: ${req.user.crop_types || 'various'}, Farm size: ${req.user.farm_size || 'N/A'} acres.`,
          messages,
        }),
      })

      const data = await resp.json()
      if (data.content?.[0]?.text) {
        const aiReply = data.content[0].text

        await query(
          'INSERT INTO chat_history (user_id, role, content) VALUES ($1,$2,$3)',
          [req.user.id, 'assistant', aiReply]
        )

        return res.json({ success: true, reply: aiReply, source: 'ai' })
      }
    } catch (err) {
      console.error('Anthropic API error:', err.message)
      // Fall through to demo
    }
  }

  // Demo fallback
  const reply = getDemoResponse(message)
  try {
    await query(
      'INSERT INTO chat_history (user_id, role, content) VALUES ($1,$2,$3)',
      [req.user.id, 'assistant', reply]
    )
  } catch (_) { /* non-critical */ }

  res.json({ success: true, reply, source: 'demo' })
})

/* ── DELETE /api/chat/history ── */
router.delete('/history', auth, async (req, res) => {
  try {
    await query('DELETE FROM chat_history WHERE user_id=$1', [req.user.id])
    res.json({ success: true, message: 'Chat history cleared' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

module.exports = router
