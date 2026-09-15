require('dotenv').config()
const { pool } = require('../config/db')

const SQL = `
/* ── Extensions ── */
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

/* ── USERS ── */
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(180) UNIQUE NOT NULL,
  password_hash VARCHAR(256),
  phone         VARCHAR(20),
  state         VARCHAR(80),
  district      VARCHAR(80),
  farm_size     NUMERIC(10,2),
  crop_types    TEXT,
  farming_type  VARCHAR(50) DEFAULT 'Traditional',
  avatar_url    TEXT,
  google_id     VARCHAR(120) UNIQUE,
  is_verified   BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

/* ── REFRESH TOKENS ── */
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

/* ── GOV SCHEME APPLICATIONS ── */
CREATE TABLE IF NOT EXISTS scheme_applications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scheme_name VARCHAR(200) NOT NULL,
  category    VARCHAR(80),
  badge       VARCHAR(80),
  status      VARCHAR(40) DEFAULT 'pending',
  notes       TEXT,
  applied_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

/* ── EQUIPMENT LOAN APPLICATIONS ── */
CREATE TABLE IF NOT EXISTS equipment_applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  equipment_name  VARCHAR(200) NOT NULL,
  category        VARCHAR(80),
  loan_amount     NUMERIC(12,2),
  tenure_years    INT DEFAULT 5,
  purpose         VARCHAR(80) DEFAULT 'Purchase',
  status          VARCHAR(40) DEFAULT 'pending',
  applied_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

/* ── INSURANCE POLICIES ── */
CREATE TABLE IF NOT EXISTS insurance_policies (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  crop_name    VARCHAR(120) NOT NULL,
  season       VARCHAR(60),
  area_acres   NUMERIC(8,2),
  premium_amt  NUMERIC(10,2),
  sum_insured  NUMERIC(12,2),
  status       VARCHAR(40) DEFAULT 'Active',
  claim_amount NUMERIC(12,2),
  enrolled_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

/* ── MARKETPLACE LISTINGS ── */
CREATE TABLE IF NOT EXISTS market_listings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_name VARCHAR(120),
  title       VARCHAR(200) NOT NULL,
  category    VARCHAR(80),
  price_per_q NUMERIC(10,2),
  quantity_q  NUMERIC(10,2),
  unit        VARCHAR(40) DEFAULT 'quintal',
  description TEXT,
  location    VARCHAR(120),
  is_active   BOOLEAN DEFAULT true,
  listed_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

/* ── MARKET INQUIRIES ── */
CREATE TABLE IF NOT EXISTS market_inquiries (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES market_listings(id) ON DELETE CASCADE,
  buyer_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message    TEXT,
  status     VARCHAR(30) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

/* ── CHAT HISTORY (AI Chatbot) ── */
CREATE TABLE IF NOT EXISTS chat_history (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       VARCHAR(20) NOT NULL CHECK (role IN ('user','assistant')),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

/* ── FARM ACTIVITIES (activity feed) ── */
CREATE TABLE IF NOT EXISTS farm_activities (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text       TEXT NOT NULL,
  type       VARCHAR(20) DEFAULT 'green',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

/* ── INDEXES ── */
CREATE INDEX IF NOT EXISTS idx_scheme_apps_user    ON scheme_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_equip_apps_user     ON equipment_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_insurance_user      ON insurance_policies(user_id);
CREATE INDEX IF NOT EXISTS idx_market_listings_cat ON market_listings(category);
CREATE INDEX IF NOT EXISTS idx_market_listings_usr ON market_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_user   ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_user     ON farm_activities(user_id);

/* ── AUTO-UPDATE updated_at ── */
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_users_updated_at') THEN
    CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at();
  END IF;
END $$;
`

async function migrate() {
  const client = await pool.connect()
  try {
    console.log('🔄 Running migrations...')
    await client.query(SQL)
    console.log('✅ All tables created successfully')
  } catch (err) {
    console.error('❌ Migration error:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()
