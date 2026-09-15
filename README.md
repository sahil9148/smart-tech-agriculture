# 🌾 Smart AgriTech Platform — Full Stack

A complete, production-ready **frontend + backend** for the Smart AgriTech farmer-empowerment platform. Real authentication, a real database, a real REST API, and an AI chatbot — deployable to [Render](https://render.com) for free.

This has been fully built and tested end-to-end in a local environment (migrations, seeding, every route, real JWT auth, CORS) before being handed to you — see [What was tested](#-what-was-tested-before-you-got-this) at the bottom.

---

## 🏗️ Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌──────────────┐
│   React (Vite)   │  HTTPS  │  Node / Express   │   SQL   │  PostgreSQL  │
│  Static Site      │ ──────▶ │      REST API      │ ──────▶ │   Database    │
│  (Render Static)  │ ◀────── │  (Render Web Svc)  │ ◀────── │ (Render DB)  │
└─────────────────┘         └─────────┬────────┘         └──────────────┘
                                        │
                                        ▼
                              ┌──────────────────┐
                              │  Anthropic Claude  │
                              │   (AI chatbot)     │
                              └──────────────────┘
```

- **Frontend**: React 18 + Vite, calls the backend over `fetch` (see `frontend/src/api.js`) — no Firebase, no client-side secrets.
- **Backend**: Node.js + Express REST API. Handles auth (JWT + bcrypt), all CRUD, and proxies chatbot requests to Claude so your API key never reaches the browser.
- **Database**: PostgreSQL — 8 tables (users, schemes, equipment, insurance, market listings, inquiries, chat history, activities). See `backend/src/utils/migrate.js` for the full schema.

---

## 📁 Project Structure

```
smart-agritech-fullstack/
├── render.yaml              # One-click Render Blueprint (both services + DB)
├── backend/
│   ├── src/
│   │   ├── server.js        # Express app entry point
│   │   ├── config/db.js     # PostgreSQL connection pool
│   │   ├── middleware/auth.js
│   │   ├── routes/          # auth, dashboard, schemes, equipment,
│   │   │                    # insurance, market, weather, chat, reports
│   │   └── utils/
│   │       ├── migrate.js   # Creates all tables (idempotent)
│   │       └── seed.js      # Loads demo farmer + sample data
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api.js            # All backend calls live here
    │   ├── App.jsx
    │   └── components/       # Landing, Login, Register, Dashboard,
    │                         # AIChatbot, and 9 dashboard tabs
    ├── package.json
    └── .env.example
```

---

## 🚀 Deploy to Render (recommended path)

### Option A — One-click Blueprint (fastest)

1. Push this whole folder to a **GitHub repo** (root of the repo, `render.yaml` must be at the top level).
2. In the [Render Dashboard](https://dashboard.render.com), click **New → Blueprint**.
3. Connect the repo. Render reads `render.yaml` and shows you 3 resources: a PostgreSQL database, the API web service, and the frontend static site. Click **Apply**.
4. Render provisions everything and wires `DATABASE_URL` automatically. The two things it **can't** fill in for you (marked `sync: false`) are secrets — add them after the first deploy:
   - Go to **smart-agritech-api → Environment**
   - Add `ANTHROPIC_API_KEY` (get one at [console.anthropic.com](https://console.anthropic.com)) — without this the chatbot still works, using built-in smart demo replies, so this step is optional.
5. Wait for both services to show **Live** (first build takes ~3-5 min).
6. Open the `smart-agritech-app` URL — that's your live site.

### Option B — Manual setup (more control, same result)

**1. Create the database**
Render Dashboard → New → PostgreSQL → name it `smart-agritech-db` → Free plan → Create. Copy the **Internal Database URL** once it's ready.

**2. Create the backend web service**
New → Web Service → connect your repo → set:
| Field | Value |
|---|---|
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `npm run migrate && npm start` |
| Plan | Free |

Environment variables:
| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | *(paste the Internal Database URL from step 1)* |
| `JWT_SECRET` | *(any long random string — Render can auto-generate this)* |
| `JWT_EXPIRES_IN` | `7d` |
| `FRONTEND_URL` | *(fill in after step 3, e.g. `https://smart-agritech-app.onrender.com`)* |
| `ANTHROPIC_API_KEY` | *(optional — omit to use demo chatbot replies)* |

Deploy. Once live, copy its URL (e.g. `https://smart-agritech-api.onrender.com`).

**3. Create the frontend static site**
New → Static Site → same repo → set:
| Field | Value |
|---|---|
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

Environment variable:
| Key | Value |
|---|---|
| `VITE_API_URL` | *(the backend URL from step 2)* |

Add a rewrite rule so client-side routing works: **Redirects/Rewrites** tab → source `/*` → destination `/index.html` → type **Rewrite**.

Deploy, then go back to the backend service and set `FRONTEND_URL` to this static site's URL, so CORS allows it.

**4. (Optional) Load demo data**
The seed script creates a demo login (`sahil@agritech.in` / `Demo@1234`) with sample schemes, insurance, and marketplace listings. It's **not** run automatically (so redeploys never wipe real user data) — run it once via Render's **Shell** tab on the backend service:
```bash
npm run seed
```
Skip this entirely if you'd rather just register a real account from the UI — that works immediately either way.

---

## ⚠️ Free-tier things to know

Render's free tier is genuinely free, but two behaviors are worth knowing about before you rely on it:

- **The free PostgreSQL database expires 30 days after creation** and is then deleted. Fine for a demo, portfolio piece, or college project; for anything longer-lived, upgrade the database to the **Starter** plan (~$6/mo) before day 30, or point `DATABASE_URL` at an external free-tier Postgres (e.g. Neon, Supabase).
- **Free web services spin down after 15 minutes of no traffic** and take ~30-60 seconds to wake up on the next request. The frontend (a static site) is unaffected — it's served from a CDN and stays instant. Only the *first* API call after idle time will feel slow; everything after that is normal speed. Upgrade the API service to **Starter** to keep it always-on.

Neither of these will break anything — they just mean "free" trades off persistence/instant-wake for zero cost, which is the right trade for testing and demos.

---

## 💻 Local Development

**Backend:**
```bash
cd backend
cp .env.example .env      # fill in DATABASE_URL (a local Postgres or a free cloud one) and JWT_SECRET
npm install
npm run migrate           # creates all tables
npm run seed               # optional — loads demo data
npm run dev                 # starts on http://localhost:5000 with auto-reload
```

**Frontend** (separate terminal):
```bash
cd frontend
cp .env.example .env.local   # set VITE_API_URL=http://localhost:5000
npm install
npm run dev                   # starts on http://localhost:5173, proxies /api to the backend
```

Open `http://localhost:5173` — register a new account, or sign in with the seeded demo login.

---

## 🔌 API Reference

All routes except `/api/health`, `/api/auth/register`, `/api/auth/login`, and `/api/auth/google` require `Authorization: Bearer <token>`.

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create account, returns JWT |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Current user profile |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/password` | Change password |
| GET | `/api/dashboard/stats` | Home tab summary cards |
| GET | `/api/dashboard/activities` | Recent activity feed |
| GET | `/api/schemes?search=&category=` | List gov schemes (with applied status) |
| POST | `/api/schemes/apply` | Apply for a scheme |
| GET | `/api/equipment?search=&category=` | List equipment |
| POST | `/api/equipment/apply` | Apply for an equipment loan |
| GET | `/api/insurance` | List policies + summary |
| POST | `/api/insurance/enrol` | Enrol in PMFBY (auto-calculates premium) |
| POST | `/api/insurance/:id/claim` | File a claim |
| GET | `/api/market?search=&category=` | Browse marketplace |
| POST | `/api/market` | Create a listing |
| POST | `/api/market/:id/inquiry` | Contact a seller |
| GET | `/api/market/msp` | Government MSP rate table |
| GET | `/api/weather` | Forecast + advisories (based on user's state) |
| POST | `/api/chat` | AI chatbot (Claude, with demo fallback) |
| GET | `/api/reports/summary` | Full farm report data |
| GET | `/api/health` | Health check (`db: connected/disconnected`) |

---

## 🔐 Security notes

- Passwords are hashed with **bcrypt** (12 rounds), never stored in plain text.
- Auth uses **JWT** signed server-side; the secret never reaches the client.
- The **Anthropic API key lives only on the backend** — the frontend calls your own `/api/chat`, which proxies to Claude. This is important: never put an AI provider's API key in frontend code, since anyone can read it from the browser.
- **Helmet** sets standard security headers; **express-rate-limit** throttles auth endpoints (20 attempts/15 min) and general API traffic (200 req/15 min per IP).
- Input is validated server-side with **express-validator** on every write route — the frontend's validation is a UX nicety, not the source of truth.

---

## ✅ What was tested before you got this

Rather than just writing the code, this was actually run: PostgreSQL 16 installed locally, migrations executed against a real database, the seed script loaded real data, the server booted, and then a full request cycle was driven end-to-end with `curl` — register/login returning real JWTs, every GET route returning real query results (dashboard stats, schemes with merged application status, equipment with EMI formatting, insurance with correct premium math, weather keyed to the user's state), every POST/PUT route persisting correctly (scheme applications, insurance enrolment, market listings, profile updates), the chat endpoint's demo fallback, and CORS preflight responses to confirm the frontend's origin is allowed. The frontend was also built with Vite to confirm all 17 components compile cleanly with no errors. What wasn't tested is the actual Render infrastructure itself (that requires your account/repo), so double-check the first deploy's logs — but the application code underneath it has been exercised, not just written.

---

## 👨‍💻 Credits

**Project:** Smart AgriTech Platform — Integrated Agriculture Management System
**Developer:** Sahil Arora (CS-2341220)
**College:** IILM University, Greater Noida
**Guide:** Mr. Harun Faridi
