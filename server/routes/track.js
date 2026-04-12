const express = require("express");
const router = express.Router();
const pool = require("../db");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");

const trackLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many tracking requests." },
});

function hashIp(ip) {
  if (!ip) return null;
  return crypto.createHash("sha256").update(ip + "judgetracker-salt").digest("hex").slice(0, 16);
}

router.post("/", trackLimiter, async (req, res) => {
  try {
    const {
      eventType,
      sessionId,
      judgeId = null,
      query = null,
      route = null,
      metadata = {},
    } = req.body || {};

    if (!eventType || !sessionId) {
      return res.status(400).json({ error: "eventType and sessionId are required." });
    }

    const ip = req.ip || req.headers["x-forwarded-for"] || null;
    const ipHash = hashIp(ip);
    const ua = req.headers["user-agent"] || "";
    const deviceType = /mobile|android|iphone|ipad/i.test(ua) ? "mobile" : /tablet/i.test(ua) ? "tablet" : "desktop";
    const browserMatch = ua.match(/(Chrome|Firefox|Safari|Edge|OPR)\/[\d.]+/);
    const browser = browserMatch ? browserMatch[1] : "Other";

    await pool.query(
      `INSERT INTO events (event_type, session_id, judge_id, query, route, metadata, ip_hash, device_type, browser, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [eventType, sessionId, judgeId, query, route, JSON.stringify(metadata), ipHash, deviceType, browser]
    );

    res.status(204).end();
  } catch (err) {
    console.error("[TRACK]", err.message);
    res.status(500).json({ error: "Tracking error." });
  }
});

module.exports = router;
