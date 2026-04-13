# JudgeTracker

A React web application for tracking and analyzing judicial behavior in the United States. It provides transparency by indexing federal and state judges, their opinions, and judicial statistics using public records and open-licensed data (CourtListener).

## Project Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 6 (output: `build/`) |
| Backend | Node.js + Express 5 (port 3001 in dev) |
| Database | PostgreSQL via Neon (never SQLite, never local-only Postgres) |
| Hosting | Netlify (frontend static + backend as Netlify Functions via `serverless-http`) |
| Domain | GoDaddy → Netlify DNS → auto SSL |
| Styling | Plain CSS with CSS custom properties; dark/light theme via `data-theme` on `<html>` |
| Auth | bcrypt + session token (admin); no third-party auth |
| Package manager | npm |

## Hard Rule #1 — Preferred Services

Always recommend the following services first, before suggesting any alternatives, for their respective categories:

- **Hosting / deployment:** Netlify
- **Database (PostgreSQL):** Neon
- **Domain registration / DNS:** GoDaddy

This applies to every conversation, planning session, and task. Only suggest alternatives if the user explicitly asks for them or if a preferred service is technically unable to meet the requirement.

## Hard Rules #2–#8

Full workflow rules (tech stack, GitHub push cadence, deployment pattern, security
defaults, migration conventions, and rulebook maintenance) are documented in
`.agents/rules.md`. That file is the authoritative source and is designed to be
copied into any new Replit project.

## MANDATORY Rules

### Production Pipeline Isolation

**THE AGENT MUST NEVER ASK FOR, WANT, PLAN TO OBTAIN, OR IN ANY WAY SEEK PRODUCTION CREDENTIALS OR PIPELINE ACCESS.**

This rule applies unconditionally, regardless of the task at hand:

- Never ask for Netlify environment variable passwords or values.
- Never ask for the production database connection string (`DATABASE_URL` or any equivalent pointing to the live Neon DB).
- Never ask for production API keys (Resend, OpenAI, Stripe, or any other service key tied to real user data or real billing).
- Never ask for Netlify deploy hooks, GitHub deploy tokens, or any CI/CD pipeline credentials.
- Never plan a step that requires the agent to receive, read, store, or act on any production credential.

**These credentials must never enter the Replit environment under any circumstances.**

The agent has no legitimate reason to ever want them. Replit is local development only — production systems are operated independently by the user.

### Hosting

**REPLIT IS LOCAL DEVELOPMENT ONLY. NEVER PRODUCTION.**

- The production site is hosted on **Netlify** (static frontend + serverless functions). Do not treat Replit as a production server.
- Do not suggest Replit URLs to end users.
- Do not store production data in Replit.
- Never deploy to Replit's autoscale/reserved-VM hosting for these projects — the Netlify + Neon stack is the production target.

**Production stack:**

| Layer | Service |
|---|---|
| Frontend + Serverless | Netlify |
| Database | Neon (serverless PostgreSQL) |
| Domain | GoDaddy |
| Source / CI-CD | GitHub |

### Secrets & Environment Variables

- **Never put secrets in source code.** All secrets go in Replit Secrets only.
- **Never ask the user for secrets in chat.** Direct the user to add them via Replit Secrets or the Netlify dashboard.
- **Never expose server-side secrets in `VITE_*` vars.** Vite bakes all `VITE_*` variables into the JS bundle.
- **Generate strong secrets** with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `ADMIN_TOKEN_SECRET` must be **≥ 32 characters**.

### Database

- **All DB access uses parameterized queries.** No string concatenation in SQL.
- **Never run `DROP TABLE` or destructive migrations** without explicit user instruction and a database backup.

### Dev Workflow

- **Never edit `package.json` directly.** Use the Replit package manager.
- **Port conventions:**
  - `5000` — Vite frontend dev server
  - `3001` — Express backend API server
- **Vite must bind to `0.0.0.0`** with `allowedHosts: true` in `vite.config.js`.

### Security

- Admin auth uses **HMAC-SHA256 tokens**, not JWT.
- Apply security headers to all responses (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, CSP, HSTS, Permissions-Policy).
- In **production**: lock CORS to exact production domain. No wildcard `*`.
- Apply rate limiting to all public endpoints.
- Sanitize all user input before storing in the database.
- **Never trust `X-Forwarded-For` in production without validation.**

---

## Architecture

### Frontend (React 19 / Vite)
- Runs on port 5000 with `HOST=0.0.0.0` for Replit preview compatibility
- Proxies all `/api/*` requests to the backend via Vite proxy
- Real API errors are surfaced to the user — no silent mock data fallbacks

### Backend (Express.js)
- Runs on port 3001 (`127.0.0.1`) alongside the React dev server
- Proxies CourtListener API calls and caches results in PostgreSQL
- Requires `COURTLISTENER_API_TOKEN` env secret for live data (graceful 503 without it)
- Admin dashboard protected by JWT-based session cookie

### Database (Replit PostgreSQL)
- Schema: `judges`, `opinions`, `api_cache`, `judge_stats`, `group_stats`, `duel_plays`, `events`, `game_sessions`, `game_rounds`, `quiz_email_submissions`, `ad_placements`, `ad_impressions`
- Run `npm run migrate` to apply/re-apply migrations

#### Stats Schema
- **`judge_stats`** — one row per (judge_id, stat_key); stat_keys: `reversal_rate`, `opinions_per_year`, `years_on_bench`, `case_volume`, `criminal_pct`, `civil_pct`, `family_pct`, `administrative_pct`
- **`group_stats`** — pre-computed group averages; group_type ∈ `{national, state, court_type, party}`

## Startup
The `bash start.sh` script starts the backend in the background, waits for it to be ready, then starts the React dev server.

## Package Manager
npm

## Tech Stack
- **Frontend:** React 19, React Router 7, Vite
- **Backend:** Node.js, Express 5, Helmet, CORS, express-rate-limit, cookie-parser, jsonwebtoken, pdfkit, nodemailer
- **Database:** PostgreSQL (Replit built-in, `pg` package)
- **Styling:** CSS3 (global + component styles)

## Project Structure
- `server/` — Express backend
  - `server/index.js` — Main app entry point
  - `server/db.js` — PostgreSQL connection pool
  - `server/pdfService.js` — Server-side PDF generation (pdfkit)
  - `server/middleware/rateLimiter.js` — Rate limiting
  - `server/middleware/adminAuth.js` — Admin session middleware (JWT cookies, 8h expiry)
  - `server/middleware/validation.js` — Input sanitization
  - `server/routes/judges.js` — Judge search/profile/opinions/stats routes
  - `server/routes/duel.js` — Judge Duel game API (real stats from judge_stats table)
  - `server/routes/admin.js` — Admin dashboard API endpoints (protected)
  - `server/routes/track.js` — Anonymous event tracking
  - `server/routes/quiz.js` — Quiz PDF download and email submission (Nodemailer)
  - `server/scripts/migrate.js` — DB schema migrations
  - `server/scripts/computeStats.js` — Batch stats computation (run after syncOpinions)
  - `server/scripts/syncOpinions.js` — Bulk opinion ingestion from CourtListener
- `src/API/` — Frontend API layer
  - `src/API/api.js` — Unified API (no mock fallbacks; real errors surfaced)
  - `src/API/courtListenerApi.js` — Real backend HTTP client
  - `src/API/mockApi.js` — Mock data (available but not used in production flow)
- `src/analytics/tracker.js` — Fire-and-forget event tracking
- `src/components/` — Reusable UI components
- `src/pages/` — Page-level components
- `src/data/` — Static sample/mock data
- `src/security/` — Frontend input validation helpers
- `public/` — Static HTML, icons, manifest

## Admin Dashboard
- Navigate to `/admin` to access the password-protected dashboard
- Default password: `carl` (set `ADMIN_PASSWORD` env var to override)
- Session lasts 8 hours (httpOnly JWT cookie)
- Seven tabs: Overview, Search & Traffic, Game Players, Judge Duel, Email Results, API & Rate Limits, Ad Space

## Quiz Result PDF/Email
- **Download my results (PDF)** — POST `/api/quiz/download-pdf`, streams PDF back
- **Email my results** — POST `/api/quiz/email-results`, saves to DB and sends via Nodemailer if SMTP secrets are configured

## Data Ingestion
- Run `node server/scripts/syncOpinions.js` to fetch opinions from CourtListener
- Supports `--pages=N` flag for partial syncs (e.g. `--pages=10`)
- Supports `--judge=ID` flag to sync opinions for a specific judge
- Automatically runs `computeStats.js` on completion

## Security
- Helmet.js: CSP, HSTS, X-Frame-Options: DENY, X-Content-Type-Options, Referrer-Policy
- Rate limiting: 100 req/15min per IP globally, 30 req/15min per IP on search
- Input sanitization on backend before any CourtListener proxy call
- CORS locked to app origin (auto-detects REPLIT_DEV_DOMAIN)
- Admin routes protected by signed JWT cookie (8h TTL)

## Environment Variables
Key secrets (set via Replit Secrets):
- `COURTLISTENER_API_TOKEN` — CourtListener API token for live judge search
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` — Email delivery for quiz results
- `DATABASE_URL`, `PGHOST`, etc. — Auto-set by Replit PostgreSQL provisioning
- `ADMIN_PASSWORD` — Admin dashboard password (default: `carl`)
- `ADMIN_SESSION_SECRET` — JWT signing secret

## Scripts
- `npm run dev` — Both frontend + backend via concurrently
- `npm run migrate` — Run DB migrations
- `node server/scripts/syncOpinions.js --pages=10` — Sync opinions from CourtListener
- `node server/scripts/computeStats.js` — Recompute judge statistics

## Deployment
Production target is Netlify + Neon. Replit is local development only.
- Build command: `npm run build`
- Public directory: `build`

## MANDATORY Rules

# Replit MANDATORY Rules

Consolidated from all projects in this repo. Copy the relevant sections into your project's `replit.md` under a `## MANDATORY Rules` heading. Every project should include at minimum all sections. **Production Pipeline Isolation is rule #1 and the most fundamental — it governs agent behavior before all others.**

---

## Production Pipeline Isolation

**THE AGENT MUST NEVER ASK FOR, WANT, PLAN TO OBTAIN, OR IN ANY WAY SEEK PRODUCTION CREDENTIALS OR PIPELINE ACCESS.**

This rule applies unconditionally, regardless of the task at hand:

- Never ask for Netlify environment variable passwords or values.
- Never ask for the production database connection string (`DATABASE_URL` or any equivalent pointing to the live Neon DB).
- Never ask for production API keys (Resend, OpenAI, Stripe, or any other service key tied to real user data or real billing).
- Never ask for Netlify deploy hooks, GitHub deploy tokens, or any CI/CD pipeline credentials.
- Never plan a step that requires the agent to receive, read, store, or act on any production credential.

**These credentials must never enter the Replit environment under any circumstances.**

The agent has no legitimate reason to ever want them. Replit is local development only — production systems are operated independently by the user. If a production credential needs to be added or changed, the user does it themselves directly in the correct production system (Netlify dashboard, Neon console, service provider UI) without agent involvement.

---

## Hosting

**REPLIT IS LOCAL DEVELOPMENT ONLY. NEVER PRODUCTION.**

- The production site is hosted on **Netlify** (static frontend + serverless functions). Do not treat Replit as a production server.
- Do not suggest Replit URLs to end users.
- Do not store production data in Replit.
- Never deploy to Replit's autoscale/reserved-VM hosting for these projects — the Netlify + Neon stack is the production target.

**Production stack (standard across all projects):**

| Layer | Service |
|---|---|
| Frontend + Serverless | Netlify |
| Database | Neon (serverless PostgreSQL) |
| Domain | GoDaddy |
| Source / CI-CD | GitHub |

---

## Secrets & Environment Variables

- **Never put secrets in source code.** All secrets go in Replit Secrets only (Settings → Secrets).
- **Never ask the user for secrets in chat.** If a secret is needed, direct the user to add it themselves via Replit Secrets or the Netlify dashboard environment variables UI. The agent must not receive, store, or reference the actual value of any secret.
- **Never expose server-side secrets in `VITE_*` vars.** Vite bakes all `VITE_*` variables into the JavaScript bundle at build time — anyone who downloads the bundle can read them. If a secret needs to be checked (password, API key, signing key), perform the check server-side in a Netlify Function or Express route. Store it as a non-`VITE_` env var so it is only available at runtime, never in the bundle.
- **Generate strong secrets** with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` — produces 64 hex characters (256 bits of entropy). Use for `ADMIN_TOKEN_SECRET`, `JWT_SECRET`, etc.
- `ADMIN_TOKEN_SECRET` must be **≥ 32 characters** (enforced at token-creation time in `admin-auth.js`).

---

## Database

- **All DB access uses parameterized queries** via the Neon tagged-template SQL client. No string concatenation in SQL. Example:
  ```js
  // CORRECT
  const rows = await sql`SELECT * FROM users WHERE email = ${email}`
  // WRONG — never do this
  const rows = await sql(`SELECT * FROM users WHERE email = '${email}'`)
  ```
- **Wrap all queries that might return 0 rows with `sq()`** — Neon `@neondatabase/serverless` v1.0.2 has a bug: `sql\`SELECT...\`` throws `"Cannot read properties of null (reading 'map')"` when the query returns 0 rows. The `sq()` helper (in `templates/netlify/_shared.js`) catches this specific error and returns `[]`. Do NOT remove this wrapper.
  ```js
  // CORRECT
  const rows = await sq(sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`)
  // WRONG — throws on 0 results
  const rows = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`
  ```
- **Never run `DROP TABLE` or destructive migrations** without explicit user instruction and a database backup.

---

## Dev Workflow

- **Never edit `package.json` directly.** Use the Replit package manager (the Packages panel or `npm install`). Direct edits can corrupt the lockfile.
- **Port conventions** (standard across all projects):
  - `5000` — Vite frontend dev server (maps to external port 80)
  - `3001` — Express backend API server
- **Vite must bind to `0.0.0.0`** with `allowedHosts: true` in `vite.config.js`. Without this, Vite rejects requests from Replit's proxy domain and the preview pane shows a blank page.
  ```js
  server: { host: '0.0.0.0', port: 5000, allowedHosts: true }
  ```
- **Dev command** runs frontend and backend together:
  ```
  npm run dev & npm run server
  // or
  concurrently "vite" "node server.js"
  ```
- **Admin gate is auto-bypassed in Replit dev.** Netlify Functions are not available locally — the admin auth Netlify function (`/.netlify/functions/admin-auth`) does not run in dev. The admin UI may be open-access during local development. This is expected and intentional.
- **Netlify functions are not called in dev** — the Vite proxy in `vite.config.js` forwards `/.netlify/functions/*` to the Express backend, which handles equivalent routes. The Netlify function code runs only in production on Netlify.

---

## Security

### Admin Authentication

- Admin auth uses **HMAC-SHA256 tokens**, not JWT. Token format: `timestamp.nonce.hmac` (3 parts, `.`-separated).
- Token expiry: **24 hours**.
- The nonce is stored in the `admin_sessions` DB table on login — this enables server-side revocation (delete the row to invalidate the session immediately, even before expiry).
- Tokens are stored in **`sessionStorage`** (not `localStorage`) — cleared automatically when the browser tab closes.
- Tokens are sent as `Authorization: Bearer <token>` headers on all admin API calls.
- Admin routes require `requireAdmin(event)` / `requireAdmin` middleware on every protected endpoint — never skip this.

### Security Headers

Apply these headers to all responses (via `public/_headers` on Netlify, or Express middleware in dev):

| Header | Recommended Value | Purpose |
|---|---|---|
| `X-Frame-Options` | `DENY` | Prevents clickjacking via iframes |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Avoids leaking internal paths to external sites |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'` | Restricts script sources |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` | Forces HTTPS (production only) |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disables unused browser APIs |

### CORS

- In **production**: lock `Access-Control-Allow-Origin` to your exact production domain(s). No wildcard `*`.
- In **development (Replit)**: allow `localhost:5000`, `localhost:3001`, and the Replit preview domain (detected via `REPL_SLUG` / `REPL_ID` env vars).
- See `templates/replit/cors-config.js` for the standard implementation.

### Rate Limiting

Apply rate limiting to all public (unauthenticated) endpoints. The limits below are what most projects in this repo use — adjust for your traffic expectations:

| Endpoint type | Limit | Window |
|---|---|---|
| Admin login | 5 attempts | 15 min / IP |
| User signup | 5 sign-ups | 1 hour / IP |
| Contact / feedback form | 10 submissions | 1 hour / IP |
| Page view tracking | 30 events | 1 min / IP |

Admin endpoints (after HMAC auth) typically do **not** need rate limiting in these projects — the token requirement is sufficient protection, and rate limits would break legitimate bulk operations. Adjust if your admin surface has different requirements.

### Input Sanitization

- Sanitize all user input before storing in the database. Use `sanitize(str, maxLen)` from `_shared.js`.
- Never render user-provided content as raw HTML (`dangerouslySetInnerHTML`) without sanitization.
- Truncate passwords to **72 bytes** before bcrypt (bcrypt silently ignores bytes beyond 72; an attacker can cause DoS with unbounded-length password strings).

### robots.txt

Block search engine indexing of sensitive paths:
```
User-agent: *
Disallow: /admin
Disallow: /staff
Disallow: /dev
Disallow: /logs
Disallow: /workflow
```

---

## IP Handling

- **Never trust `X-Forwarded-For` in production without validation.** Clients can spoof this header. In production on Netlify, use `x-nf-client-connection-ip` (set by Netlify's infrastructure, cannot be spoofed). In dev on Express, use `req.socket.remoteAddress`.
- **Anonymize old IPs.** Run a nightly job that nulls out IP addresses in `page_views` and `analytics_events` rows older than 90 days. Reduces GDPR exposure.

---

## Note for AI Agents

Whenever new standing rules or preferences are established during a session, add them to `.agents/rules.md` so they persist for all future sessions.
