# JudgeTracker

https://www.youtube.com/watch?v=jgE1jNqalMM
https://x.com/JohnnyFSE/status/2043027517016076638
https://x.com/elonmusk/status/2043291848920469979
https://x.com/WomanDefiner/status/2043035556523700271

---

## Production Deployment Guide (Netlify + Neon + GoDaddy)

### 1. Neon (Database)
1. Create a free account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string — it looks like:
   `postgres://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require`
4. This becomes your `DATABASE_URL` in Netlify (step 2 below)

### 2. Netlify (Hosting)
1. Create a free account at [netlify.com](https://netlify.com)
2. **Add new site → Import from Git → GitHub → select `corviato1/judgetracker`**
3. Build settings are auto-detected from `netlify.toml` — no manual config needed
4. Go to **Site configuration → Environment variables** and add:
   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Neon connection string from step 1 |
   | `NETLIFY_URL` | `https://judgetracker.info` (your domain, no trailing slash) |
   | `ADMIN_PASSWORD` | Your chosen admin password |
   | `ADMIN_SESSION_SECRET` | A long random string (32+ chars) |
   | `COURTLISTENER_API_TOKEN` | Token from courtlistener.com |
   | `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | Optional — for email delivery |
5. Click **Deploy site** — Netlify runs DB migrations against Neon automatically

### 3. GoDaddy (Custom Domain)
1. In **Netlify → Domain management → Add custom domain** → enter `judgetracker.info`
2. Netlify will show you nameservers (e.g. `dns1.p01.nsone.net`)
3. In **GoDaddy → My Domains → judgetracker.info → Manage DNS → Nameservers**
   → switch to **Custom nameservers** → paste Netlify's nameservers
4. SSL is provisioned automatically by Netlify (Let's Encrypt) — takes ~1 minute
   after DNS propagates (up to 48 hours, usually under 1 hour)

> **Note:** If you use both `judgetracker.info` and `www.judgetracker.info`,
> set `NETLIFY_URL` to your primary domain only. Netlify automatically redirects
> the www variant to the primary.

---

## Local Development

```bash
# Install dependencies
npm install

# Copy and fill in environment variables
cp .env.example .env

# Start (migrations + backend on :3001 + frontend on :5000)
bash start.sh
```
