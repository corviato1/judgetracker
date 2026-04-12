# JudgeTracker

A React web application for tracking and analyzing judicial behavior in the United States. It provides transparency by indexing federal and state judges, their opinions, and judicial statistics using public records and open-licensed data (CourtListener).

## Architecture

### Frontend (React 19 / Create React App)
- Runs on port 5000 with `HOST=0.0.0.0` for Replit preview compatibility
- Proxies all `/api/*` requests to the backend via CRA's built-in proxy (`package.json` → `"proxy": "http://localhost:3001"`)
- Falls back to mock data (`src/API/mockApi.js`) if the backend is unavailable

### Backend (Express.js)
- Runs on port 3001 (`127.0.0.1`) alongside the React dev server
- Proxies CourtListener API calls and caches results in PostgreSQL
- Requires `COURTLISTENER_API_TOKEN` env secret for live data (graceful 503 without it)

### Database (Replit PostgreSQL)
- Schema: `judges`, `opinions`, `api_cache`, `judge_stats`, `group_stats`
- Run `npm run migrate` to apply/re-apply migrations

#### Stats Schema
- **`judge_stats`** — one row per (judge_id, stat_key); stat_keys: `reversal_rate`, `opinions_per_year`, `years_on_bench`, `case_volume`, `criminal_pct`, `civil_pct`, `family_pct`, `administrative_pct`
- **`group_stats`** — pre-computed group averages; group_type ∈ `{national, state, court_type, party}`; group_value is the specific value (e.g. "CA", "Democratic"); includes `judge_count` for context
- To add new stat types: derive them in `computeStats.js` and write them using the same `upsertJudgeStats` / `upsertGroupStats` pattern — no schema changes needed

## Startup
The `bash start.sh` script starts the backend in the background, waits for it to be ready, then starts the React dev server. Both processes run under a single workflow.

## Package Manager
npm

## Tech Stack
- **Frontend:** React 19, React Router 7, Create React App
- **Backend:** Node.js, Express 5, Helmet, CORS, express-rate-limit
- **Database:** PostgreSQL (Replit built-in, `pg` package)
- **Styling:** CSS3 (global + component styles)

## Project Structure
- `server/` — Express backend
  - `server/index.js` — Main app entry point
  - `server/db.js` — PostgreSQL connection pool
  - `server/middleware/rateLimiter.js` — Rate limiting (100 req/15min global, 30 req/15min search)
  - `server/middleware/validation.js` — Input sanitization
  - `server/routes/judges.js` — Judge search/profile/opinions/stats routes
  - `server/scripts/migrate.js` — DB schema migrations
  - `server/scripts/computeStats.js` — Batch stats computation script (run on a schedule, e.g. weekly)
- `src/API/` — Frontend API layer
  - `src/API/api.js` — Unified API with backend → mock fallback
  - `src/API/courtListenerApi.js` — Real backend HTTP client (relative URLs, uses CRA proxy)
  - `src/API/mockApi.js` — Mock data fallback
- `src/components/` — Reusable UI components
- `src/pages/` — Page-level components
- `src/data/` — Static sample/mock data
- `src/security/` — Frontend input validation helpers
- `public/` — Static HTML, icons, manifest

## Security
- Helmet.js: CSP, HSTS, X-Frame-Options: DENY, X-Content-Type-Options, Referrer-Policy
- Rate limiting: 100 req/15min per IP globally, 30 req/15min per IP on search
- Input sanitization on backend before any CourtListener proxy call
- CORS locked to app origin (auto-detects REPLIT_DEV_DOMAIN)

## Environment Variables
See `.env.example` for all variables. Key ones:
- `COURTLISTENER_API_TOKEN` (secret) — CourtListener API token for live data
- `REACT_APP_BACKEND_URL` — Override backend URL (defaults to relative URLs via CRA proxy)
- `DATABASE_URL`, `PGHOST`, etc. — Auto-set by Replit PostgreSQL provisioning

## Scripts
- `npm start` — Frontend only (port 5000)
- `npm run dev` — Both frontend + backend via concurrently
- `node server/index.js` — Backend only (port 3001)
- `npm run migrate` — Run DB migrations

## Deployment
Configured as a static site deployment:
- Build command: `npm run build`
- Public directory: `build`
