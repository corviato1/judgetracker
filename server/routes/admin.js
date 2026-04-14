const express = require("express");
const router = express.Router();
const pool = require("../db");
const { ADMIN_PASSWORD, COOKIE_NAME, signAdminToken, requireAdmin } = require("../middleware/adminAuth");
const { generateQuizResultPdf } = require("../pdfService");
const rateLimit = require("express-rate-limit");
const { normalizePerson } = require("../utils/normalize");

const CL_BASE = "https://www.courtlistener.com/api/rest/v4";
const SEED_QUERIES = ["Smith", "Jones", "Johnson", "Williams", "Brown", "Davis", "Miller", "Wilson", "Taylor", "Anderson"];

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts." },
});

router.post("/login", loginLimiter, (req, res) => {
  const { password } = req.body || {};
  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid password." });
  }
  const token = signAdminToken();
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 8 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === "production",
  });
  return res.json({ ok: true });
});

router.post("/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
});

router.get("/session", requireAdmin, (req, res) => {
  res.json({ authenticated: true });
});

router.get("/overview", requireAdmin, async (req, res) => {
  try {
    const [
      views7d,
      views30d,
      sessions7d,
      sessions30d,
      topJudges,
      topSearches,
      activeUsers1h,
      newVsReturning,
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS count FROM events WHERE event_type='page_view' AND created_at > NOW() - INTERVAL '7 days'`),
      pool.query(`SELECT COUNT(*) AS count FROM events WHERE event_type='page_view' AND created_at > NOW() - INTERVAL '30 days'`),
      pool.query(`SELECT COUNT(DISTINCT session_id) AS count FROM events WHERE created_at > NOW() - INTERVAL '7 days'`),
      pool.query(`SELECT COUNT(DISTINCT session_id) AS count FROM events WHERE created_at > NOW() - INTERVAL '30 days'`),
      pool.query(`SELECT judge_id, COUNT(*) AS views FROM events WHERE event_type='page_view' AND judge_id IS NOT NULL AND created_at > NOW() - INTERVAL '30 days' GROUP BY judge_id ORDER BY views DESC LIMIT 10`),
      pool.query(`SELECT query, COUNT(*) AS count FROM events WHERE event_type='search' AND query IS NOT NULL AND created_at > NOW() - INTERVAL '30 days' GROUP BY query ORDER BY count DESC LIMIT 10`),
      pool.query(`SELECT COUNT(DISTINCT session_id) AS count FROM events WHERE created_at > NOW() - INTERVAL '1 hour'`),
      pool.query(`
        WITH first_seen AS (
          SELECT session_id, MIN(created_at) AS first_at FROM events GROUP BY session_id
        )
        SELECT
          SUM(CASE WHEN first_at > NOW() - INTERVAL '30 days' THEN 1 ELSE 0 END) AS new_sessions,
          SUM(CASE WHEN first_at <= NOW() - INTERVAL '30 days' THEN 1 ELSE 0 END) AS returning_sessions
        FROM first_seen
        WHERE first_at IS NOT NULL
      `),
    ]);

    res.json({
      pageViews7d: parseInt(views7d.rows[0].count),
      pageViews30d: parseInt(views30d.rows[0].count),
      uniqueSessions7d: parseInt(sessions7d.rows[0].count),
      uniqueSessions30d: parseInt(sessions30d.rows[0].count),
      topJudges: topJudges.rows,
      topSearches: topSearches.rows,
      activeUsers1h: parseInt(activeUsers1h.rows[0].count),
      newSessions: parseInt(newVsReturning.rows[0].new_sessions || 0),
      returningSessions: parseInt(newVsReturning.rows[0].returning_sessions || 0),
    });
  } catch (err) {
    console.error("[ADMIN overview]", err.message);
    res.status(500).json({ error: "Internal error." });
  }
});

router.get("/traffic", requireAdmin, async (req, res) => {
  try {
    const [dailySearch, noResults, referrers, devices, browsers, countries, timeOnPage] = await Promise.all([
      pool.query(`
        SELECT DATE(created_at) AS day, COUNT(*) AS count
        FROM events WHERE event_type='search' AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY day ORDER BY day
      `),
      pool.query(`
        SELECT query, COUNT(*) AS count
        FROM events WHERE event_type='search_no_results' AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY query ORDER BY count DESC LIMIT 20
      `),
      pool.query(`
        SELECT (metadata->>'referrer') AS referrer, COUNT(*) AS count
        FROM events WHERE event_type='page_view' AND metadata->>'referrer' IS NOT NULL
        AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY referrer ORDER BY count DESC LIMIT 10
      `),
      pool.query(`
        SELECT device_type, COUNT(*) AS count
        FROM events WHERE created_at > NOW() - INTERVAL '30 days' AND device_type IS NOT NULL
        GROUP BY device_type ORDER BY count DESC
      `),
      pool.query(`
        SELECT browser, COUNT(*) AS count
        FROM events WHERE created_at > NOW() - INTERVAL '30 days' AND browser IS NOT NULL
        GROUP BY browser ORDER BY count DESC
      `),
      pool.query(`
        SELECT country, COUNT(*) AS count
        FROM events WHERE created_at > NOW() - INTERVAL '30 days' AND country IS NOT NULL
        GROUP BY country ORDER BY count DESC LIMIT 20
      `),
      pool.query(`
        SELECT route, AVG((metadata->>'duration_ms')::numeric) AS avg_ms, COUNT(*) AS views
        FROM events WHERE event_type='page_exit' AND metadata->>'duration_ms' IS NOT NULL
        AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY route ORDER BY avg_ms DESC LIMIT 20
      `),
    ]);

    res.json({
      dailySearchVolume: dailySearch.rows,
      noResultsQueries: noResults.rows,
      referrers: referrers.rows,
      devices: devices.rows,
      browsers: browsers.rows,
      countries: countries.rows,
      timeOnPage: timeOnPage.rows,
    });
  } catch (err) {
    console.error("[ADMIN traffic]", err.message);
    res.status(500).json({ error: "Internal error." });
  }
});

router.get("/players", requireAdmin, async (req, res) => {
  try {
    const { search = "", page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [sessions, totals] = await Promise.all([
      pool.query(`
        SELECT
          gs.id,
          gs.session_id,
          gs.game_type,
          gs.started_at,
          gs.completed_at,
          gs.rounds_completed,
          gs.final_score,
          gs.result_label,
          gs.filters,
          (SELECT device_type FROM events e WHERE e.session_id = gs.session_id LIMIT 1) AS device_type,
          (SELECT browser FROM events e WHERE e.session_id = gs.session_id LIMIT 1) AS browser,
          (SELECT country FROM events e WHERE e.session_id = gs.session_id LIMIT 1) AS country
        FROM game_sessions gs
        WHERE ($1 = '' OR gs.session_id ILIKE '%' || $1 || '%')
        ORDER BY gs.started_at DESC
        LIMIT $2 OFFSET $3
      `, [search, parseInt(limit), offset]),
      pool.query(`
        SELECT
          COUNT(DISTINCT session_id) AS total_players,
          AVG(rounds_completed) AS avg_rounds,
          SUM(CASE WHEN game_type='duel' THEN 1 ELSE 0 END) AS duel_count,
          SUM(CASE WHEN game_type='quiz' THEN 1 ELSE 0 END) AS quiz_count
        FROM game_sessions
      `),
    ]);

    res.json({
      sessions: sessions.rows,
      totals: totals.rows[0],
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error("[ADMIN players]", err.message);
    res.status(500).json({ error: "Internal error." });
  }
});

router.get("/players/:sessionId", requireAdmin, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const [events, gameSessions] = await Promise.all([
      pool.query(`
        SELECT event_type, judge_id, query, route, metadata, created_at
        FROM events WHERE session_id = $1 ORDER BY created_at ASC
      `, [sessionId]),
      pool.query(`
        SELECT gs.*, gr.round_number, gr.stat_key, gr.judge1_id, gr.judge2_id, gr.selected_judge_id, gr.correct
        FROM game_sessions gs
        LEFT JOIN game_rounds gr ON gr.game_session_id = gs.id
        WHERE gs.session_id = $1
        ORDER BY gs.started_at, gr.round_number
      `, [sessionId]),
    ]);
    res.json({ events: events.rows, gameSessions: gameSessions.rows });
  } catch (err) {
    console.error("[ADMIN player detail]", err.message);
    res.status(500).json({ error: "Internal error." });
  }
});

router.get("/quiz-stats", requireAdmin, async (req, res) => {
  try {
    const [outcomes, completionTime, dropOff] = await Promise.all([
      pool.query(`
        SELECT result_label, COUNT(*) AS count
        FROM game_sessions WHERE game_type='quiz' AND result_label IS NOT NULL
        GROUP BY result_label ORDER BY count DESC
      `),
      pool.query(`
        SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) AS avg_seconds
        FROM game_sessions WHERE game_type='quiz' AND completed_at IS NOT NULL
      `),
      pool.query(`
        SELECT rounds_completed, COUNT(*) AS count
        FROM game_sessions WHERE game_type='quiz'
        GROUP BY rounds_completed ORDER BY rounds_completed
      `),
    ]);
    res.json({
      outcomeDistribution: outcomes.rows,
      avgCompletionSeconds: parseFloat(completionTime.rows[0].avg_seconds || 0),
      dropOff: dropOff.rows,
    });
  } catch (err) {
    console.error("[ADMIN quiz-stats]", err.message);
    res.status(500).json({ error: "Internal error." });
  }
});

router.get("/duel-stats", requireAdmin, async (req, res) => {
  try {
    const [totals, winningJudges, filterCombos, statWinRates] = await Promise.all([
      pool.query(`
        SELECT COUNT(*) AS total_games,
               AVG(final_score) AS avg_score,
               SUM(CASE WHEN completed_at IS NOT NULL THEN 1 ELSE 0 END)::float / NULLIF(COUNT(*),0) AS completion_rate
        FROM game_sessions WHERE game_type='duel'
      `),
      pool.query(`
        SELECT j.name AS judge_name, gr.selected_judge_id, COUNT(*) AS wins
        FROM game_rounds gr
        JOIN game_sessions gs ON gs.id = gr.game_session_id
        LEFT JOIN judges j ON j.courtlistener_id = gr.selected_judge_id
        WHERE gs.game_type='duel'
        GROUP BY gr.selected_judge_id, j.name
        ORDER BY wins DESC LIMIT 10
      `),
      pool.query(`
        SELECT filters::text AS filter_combo, COUNT(*) AS count
        FROM game_sessions WHERE game_type='duel' AND filters IS NOT NULL
        GROUP BY filter_combo ORDER BY count DESC LIMIT 10
      `),
      pool.query(`
        SELECT stat_key, AVG(CASE WHEN correct THEN 1 ELSE 0 END) AS win_rate, COUNT(*) AS rounds
        FROM game_rounds WHERE stat_key IS NOT NULL
        GROUP BY stat_key ORDER BY win_rate DESC
      `),
    ]);
    res.json({
      totals: totals.rows[0],
      winningJudges: winningJudges.rows,
      filterCombos: filterCombos.rows,
      statWinRates: statWinRates.rows,
    });
  } catch (err) {
    console.error("[ADMIN duel-stats]", err.message);
    res.status(500).json({ error: "Internal error." });
  }
});

router.get("/rate-limits", requireAdmin, async (req, res) => {
  try {
    const [apiCalls, cacheStats, errors] = await Promise.all([
      pool.query(`
        SELECT
          SUM(CASE WHEN created_at > NOW() - INTERVAL '1 day' THEN 1 ELSE 0 END) AS today,
          SUM(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) AS week,
          SUM(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 ELSE 0 END) AS month
        FROM events WHERE event_type='api_call'
      `),
      pool.query(`
        SELECT
          COUNT(*) AS total_entries,
          SUM(CASE WHEN expires_at > NOW() THEN 1 ELSE 0 END) AS active_entries
        FROM api_cache
      `),
      pool.query(`
        SELECT event_type, metadata, created_at
        FROM events WHERE event_type='error'
        ORDER BY created_at DESC LIMIT 50
      `),
    ]);
    res.json({
      apiCalls: apiCalls.rows[0],
      cacheStats: cacheStats.rows[0],
      recentErrors: errors.rows,
    });
  } catch (err) {
    console.error("[ADMIN rate-limits]", err.message);
    res.status(500).json({ error: "Internal error." });
  }
});

router.get("/quiz-email-submissions", requireAdmin, async (req, res) => {
  try {
    const { email = "", dateFrom = "", dateTo = "", judge = "", page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const params = [];
    let idx = 1;

    if (email) { conditions.push(`q.email ILIKE '%' || $${idx++} || '%'`); params.push(email); }
    if (dateFrom) { conditions.push(`q.created_at >= $${idx++}`); params.push(dateFrom); }
    if (dateTo) { conditions.push(`q.created_at <= $${idx++}`); params.push(dateTo); }
    if (judge) { conditions.push(`(j.name ILIKE '%' || $${idx++} || '%' OR q.result_label ILIKE '%' || $${idx++} || '%')`); params.push(judge); params.push(judge); idx++; }

    const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
    params.push(parseInt(limit), offset);

    const rows = await pool.query(`
      SELECT q.id, q.session_id, q.email, q.result_label, q.created_at, j.name AS judge_name,
             q.matched_judge_id
      FROM quiz_email_submissions q
      LEFT JOIN judges j ON j.courtlistener_id = q.matched_judge_id
      ${where}
      ORDER BY q.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `, params);

    res.json({ submissions: rows.rows, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error("[ADMIN quiz-email-submissions]", err.message);
    res.status(500).json({ error: "Internal error." });
  }
});

router.get("/quiz-email-submissions/:id/pdf", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT pdf_blob, email, result_label FROM quiz_email_submissions WHERE id = $1",
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Not found." });

    const row = result.rows[0];
    if (!row.pdf_blob) {
      return res.status(404).json({ error: "PDF not stored for this submission." });
    }

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="quiz-result-${id}.pdf"`,
    });
    res.send(row.pdf_blob);
  } catch (err) {
    console.error("[ADMIN pdf download]", err.message);
    res.status(500).json({ error: "Internal error." });
  }
});

router.get("/ads", requireAdmin, async (req, res) => {
  try {
    const rows = await pool.query("SELECT * FROM ad_placements ORDER BY created_at DESC");
    res.json({ placements: rows.rows });
  } catch (err) {
    console.error("[ADMIN ads]", err.message);
    res.status(500).json({ error: "Internal error." });
  }
});

router.post("/ads", requireAdmin, async (req, res) => {
  try {
    const { name, slug, dimensions, notes, active = true } = req.body || {};
    if (!name || !slug) return res.status(400).json({ error: "name and slug are required." });
    const result = await pool.query(
      "INSERT INTO ad_placements (name, slug, dimensions, notes, active) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [name, slug, dimensions || "", notes || "", active]
    );
    res.status(201).json({ placement: result.rows[0] });
  } catch (err) {
    console.error("[ADMIN ads create]", err.message);
    res.status(500).json({ error: "Internal error." });
  }
});

router.patch("/ads/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, dimensions, notes, active } = req.body || {};
    const result = await pool.query(
      `UPDATE ad_placements SET
        name = COALESCE($1, name),
        slug = COALESCE($2, slug),
        dimensions = COALESCE($3, dimensions),
        notes = COALESCE($4, notes),
        active = COALESCE($5, active)
       WHERE id = $6 RETURNING *`,
      [name, slug, dimensions, notes, active, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Not found." });
    res.json({ placement: result.rows[0] });
  } catch (err) {
    console.error("[ADMIN ads update]", err.message);
    res.status(500).json({ error: "Internal error." });
  }
});

router.get("/ads/impressions", requireAdmin, async (req, res) => {
  try {
    const rows = await pool.query(`
      SELECT ap.name, ap.slug, DATE(ai.created_at) AS day, COUNT(*) AS impressions
      FROM ad_impressions ai
      JOIN ad_placements ap ON ap.id = ai.placement_id
      WHERE ai.created_at > NOW() - INTERVAL '30 days'
      GROUP BY ap.name, ap.slug, day ORDER BY day DESC, impressions DESC
    `);
    res.json({ impressions: rows.rows });
  } catch (err) {
    console.error("[ADMIN ads impressions]", err.message);
    res.status(500).json({ error: "Internal error." });
  }
});

router.post("/ads/inquiries", async (req, res) => {
  try {
    const { name, company, email, placement_interest, message } = req.body || {};
    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required." });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email address." });
    }
    await pool.query(
      `INSERT INTO ad_inquiries (name, company, email, placement_interest, message)
       VALUES ($1, $2, $3, $4, $5)`,
      [name.slice(0, 255), (company || "").slice(0, 255), email.slice(0, 254), (placement_interest || "").slice(0, 100), (message || "").slice(0, 2000)]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("[AD INQUIRY]", err.message);
    res.status(500).json({ error: "Internal error." });
  }
});

router.get("/ads/inquiries", requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const offset = (page - 1) * 50;
    const rows = await pool.query(
      `SELECT id, name, company, email, placement_interest, message, created_at
       FROM ad_inquiries ORDER BY created_at DESC LIMIT 50 OFFSET $1`,
      [offset]
    );
    res.json({ inquiries: rows.rows });
  } catch (err) {
    console.error("[ADMIN ads inquiries]", err.message);
    res.status(500).json({ error: "Internal error." });
  }
});

router.post("/seed-judges", requireAdmin, async (req, res) => {
  const token = process.env.COURTLISTENER_API_TOKEN;
  if (!token) {
    return res.status(503).json({ error: "COURTLISTENER_API_TOKEN is not configured on this server." });
  }

  const seededIds = new Set();
  const errors = [];

  for (const q of SEED_QUERIES) {
    try {
      const url = `${CL_BASE}/people/?full_name=${encodeURIComponent(q)}&format=json`;
      const response = await fetch(url, {
        headers: { Authorization: `Token ${token}`, "User-Agent": "JudgeTracker/1.0" },
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) {
        errors.push(`${q}: HTTP ${response.status}`);
        continue;
      }
      const data = await response.json();
      const judges = (data.results || []).slice(0, 20).map(normalizePerson);
      for (const judge of judges) {
        if (!judge.fullName || !judge.id) continue;
        if (seededIds.has(judge.id)) continue;
        try {
          await pool.query(
            `INSERT INTO judges (courtlistener_id, name, court, state, gender, party_of_appointment, service_start, last_synced)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
             ON CONFLICT (courtlistener_id) DO UPDATE SET
               name = EXCLUDED.name,
               court = EXCLUDED.court,
               state = EXCLUDED.state,
               gender = EXCLUDED.gender,
               party_of_appointment = EXCLUDED.party_of_appointment,
               service_start = EXCLUDED.service_start,
               last_synced = NOW()`,
            [judge.id, judge.fullName, judge.courtName, judge.state, judge.gender, judge.partyOfAppointment, judge.serviceStartYear]
          );
          seededIds.add(judge.id);
        } catch (dbErr) {
          errors.push(`DB insert ${judge.id}: ${dbErr.message}`);
        }
      }
    } catch (e) {
      errors.push(`${q}: ${e.message}`);
    }
  }

  console.log(`[SEED] Seeded ${seededIds.size} unique judges. Errors: ${errors.length}`);
  return res.json({ seeded: seededIds.size, errors });
});

module.exports = router;
