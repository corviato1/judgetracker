# Agent Workflow Rulebook
# Reusable across all Replit projects — copy this file into any new project.

---

## Hard Rule #1 — Preferred Services

Always recommend the following services first, before suggesting any alternatives,
for their respective categories:

- **Hosting / deployment:** Netlify
- **Database (PostgreSQL):** Neon
- **Domain registration / DNS:** GoDaddy

This applies to every conversation, planning session, and task. Only suggest
alternatives if the user explicitly asks for them or if a preferred service is
technically unable to meet the requirement.

---

## Hard Rule #2 — Standard Tech Stack

For every new full-stack web app, use this stack unless the user says otherwise:

- **Frontend:** React + Vite (never Create React App)
- **Backend:** Node.js + Express 5
- **Database:** PostgreSQL via Neon (never SQLite, never local-only Postgres)
- **Styling:** plain CSS with CSS custom properties (no Tailwind unless user asks)
- **Auth:** bcrypt + JWT or session tokens (no third-party auth services unless asked)
- **Package manager:** npm

---

## Hard Rule #3 — GitHub Push Cadence

- Push to GitHub after every completed task batch, not after every single commit
- Use the Replit GitHub OAuth integration (connector) — never ask the user for a
  Personal Access Token
- Before pushing: always fetch origin first; if remote has diverged, merge then push
- After pushing: verify with `git log origin/main..HEAD` — output must be empty
- Restore the clean HTTPS remote URL after every authenticated push

---

## Hard Rule #4 — Production Deployment Pattern

Full-stack apps always deploy using this architecture:

- **Frontend:** Netlify static hosting (build output from `build/` or `dist/`)
- **Backend:** Netlify Functions using `serverless-http` to wrap the Express app
  - Entrypoint: `netlify/functions/api.js`
  - Routing: `netlify.toml` redirects `/api/*` to the function
- **Database:** Neon (serverless Postgres; run migrations as part of Netlify deploy)
- **Domain:** GoDaddy nameservers → Netlify DNS → auto SSL via Let's Encrypt
- **Secrets:** stored only in Netlify environment variables dashboard, never in code

---

## Hard Rule #5 — Replit is Dev Only

- Replit is local development. Never production.
- Never suggest Replit URLs to end users.
- Never ask for production credentials inside Replit.
- Production ENV vars (DATABASE_URL, API keys, secrets) must never enter Replit.
- Do not use Replit's autoscale or reserved-VM hosting for any project.

---

## Hard Rule #6 — Database Migrations

- All schema changes go through a migration script (pattern: `server/scripts/migrate.js`)
- Migrations run on startup and as part of post-merge setup
- Every migration statement must be idempotent (`IF NOT EXISTS`, `IF EXISTS`, etc.)
- Never use an ORM — raw SQL only
- Never alter or drop existing columns without explicit user approval

---

## Hard Rule #7 — Security Defaults

Every project ships with these defaults from day one:

- Validate and sanitize all user input before storing; use a shared `sanitize(str, maxLen)` helper
- Rate limiting on all public-facing endpoints (`express-rate-limit`)
- Admin routes protected by HMAC verification or bcrypt-verified password
- CORS locked to known origins in production (never `*` in prod)
- Passwords truncated to 72 bytes before bcrypt (bcrypt silently ignores beyond 72)
- `X-Forwarded-For` never trusted without validation; use platform-provided IP headers
  in production (e.g., `x-nf-client-connection-ip` on Netlify)

---

## Hard Rule #8 — Agent Rulebook Maintenance

- When the user establishes a new standing preference or workflow rule during
  any session, add it to `.agents/rules.md` immediately — do not wait to be asked
- Rules in this file take precedence over any generic agent defaults
- This file is designed to be copied into any new Replit project as-is
- After adding a rule here, also add it (or a summary of it) to `replit.md`
  so agents loading the project context see it without reading this file separately
