const express = require("express");
const router = express.Router();
const pool = require("../db");
const { searchLimiter } = require("../middleware/rateLimiter");
const { validateSearchQuery, validateJudgeId } = require("../middleware/validation");
const { normalizePerson } = require("../utils/normalize");

const CL_BASE = "https://www.courtlistener.com/api/rest/v4";
const CACHE_TTL_HOURS = 24;

function getAuthHeaders() {
  const token = process.env.COURTLISTENER_API_TOKEN;
  return token ? { Authorization: `Token ${token}` } : {};
}

async function getCached(key) {
  try {
    const result = await pool.query(
      "SELECT value FROM api_cache WHERE key = $1 AND expires_at > NOW()",
      [key]
    );
    if (result.rows.length > 0) {
      return JSON.parse(result.rows[0].value);
    }
  } catch (err) {
    console.error("[CACHE] Read error:", err.message);
  }
  return null;
}

async function setCache(key, value) {
  try {
    const serialized = JSON.stringify(value);
    await pool.query(
      `INSERT INTO api_cache (key, value, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '${CACHE_TTL_HOURS} hours')
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, expires_at = EXCLUDED.expires_at`,
      [key, serialized]
    );
  } catch (err) {
    console.error("[CACHE] Write error:", err.message);
  }
}

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT courtlistener_id, name, court, state, gender, party_of_appointment, service_start
       FROM judges
       WHERE court IS NOT NULL AND court != ''
         AND state IS NOT NULL AND state != ''
       ORDER BY name ASC`
    );
    const judges = result.rows.map((row) => ({
      id: String(row.courtlistener_id),
      fullName: row.name || "",
      courtName: row.court || "",
      jurisdiction: row.state || "",
      appointer: "",
      partyOfAppointment: row.party_of_appointment || "",
      serviceStartYear: row.service_start ? Number(row.service_start) : null,
      gender: row.gender || "",
      state: row.state || "",
      sampleCaseCount: null,
      source: "local",
    }));
    return res.json({ judges });
  } catch (err) {
    console.error("[DB] List judges error:", err.message);
    return res.status(500).json({ error: "Internal error listing judges.", judges: [] });
  }
});

router.get("/search", searchLimiter, validateSearchQuery, async (req, res) => {
  const q = req.cleanQuery;
  const cacheKey = `search:${q.toLowerCase()}`;

  const cached = await getCached(cacheKey);
  if (cached) {
    return res.json({ results: cached, cached: true });
  }

  const token = process.env.COURTLISTENER_API_TOKEN;
  if (!token) {
    return res.status(503).json({
      error: "Judge search requires API configuration. Search is fully available on the live site.",
      results: [],
    });
  }

  try {
    const url = `${CL_BASE}/people/?full_name=${encodeURIComponent(q)}&format=json`;
    const response = await fetch(url, {
      headers: { ...getAuthHeaders(), "User-Agent": "JudgeTracker/1.0" },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[CL] Search failed ${response.status}: ${errText.slice(0, 500)}`);
      let userMessage = "Search is temporarily unavailable. Please try again later.";
      if (response.status === 401 || response.status === 403) {
        userMessage = "Judge search requires a valid API token. Set COURTLISTENER_API_TOKEN to enable search.";
      } else if (response.status === 429) {
        userMessage = "Too many requests — please wait a moment and try again.";
      }
      return res.status(502).json({ error: userMessage, upstreamStatus: response.status, results: [] });
    }

    const data = await response.json();
    const results = (data.results || []).slice(0, 20).map(normalizePerson);

    await setCache(cacheKey, results);

    for (const judge of results) {
      await pool.query(
        `INSERT INTO judges (courtlistener_id, name, court, state, gender, party_of_appointment, service_start, last_synced)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         ON CONFLICT (courtlistener_id) DO UPDATE SET
           name = EXCLUDED.name, court = EXCLUDED.court, last_synced = NOW()`,
        [judge.id, judge.fullName, judge.courtName, judge.state, judge.gender, judge.partyOfAppointment, judge.serviceStartYear]
      );
    }

    return res.json({ results, cached: false });
  } catch (err) {
    console.error("[CL] Search error:", err.message);
    return res.status(500).json({ error: "Internal error during judge search.", results: [] });
  }
});

router.get("/:id", validateJudgeId, async (req, res) => {
  const id = req.cleanId;
  const cacheKey = `judge:${id}`;

  const cached = await getCached(cacheKey);
  if (cached) {
    return res.json({ judge: cached, cached: true });
  }

  const token = process.env.COURTLISTENER_API_TOKEN;
  if (!token) {
    return res.status(503).json({ error: "CourtListener API token not configured." });
  }

  try {
    const response = await fetch(`${CL_BASE}/people/${id}/?format=json`, {
      headers: { ...getAuthHeaders(), "User-Agent": "JudgeTracker/1.0" },
    });

    if (!response.ok) {
      return res.status(response.status === 404 ? 404 : 502).json({ error: "Judge not found." });
    }

    const data = await response.json();
    const judge = normalizePerson(data);
    await setCache(cacheKey, judge);

    await pool.query(
      `INSERT INTO judges (courtlistener_id, name, court, state, gender, party_of_appointment, service_start, last_synced)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (courtlistener_id) DO UPDATE SET name = EXCLUDED.name, last_synced = NOW()`,
      [judge.id, judge.fullName, judge.courtName, judge.state, judge.gender, judge.partyOfAppointment, judge.serviceStartYear]
    );

    return res.json({ judge, cached: false });
  } catch (err) {
    console.error("[CL] Judge fetch error:", err.message);
    return res.status(500).json({ error: "Internal error fetching judge." });
  }
});

router.get("/:id/stats", validateJudgeId, async (req, res) => {
  const id = req.cleanId;

  try {
    // Fetch judge metadata for group lookups
    const judgeRow = await pool.query(
      "SELECT state, court, party_of_appointment FROM judges WHERE courtlistener_id = $1",
      [id]
    );
    const judge = judgeRow.rows[0] || {};

    // Individual stats for this judge
    const judgeStatsRes = await pool.query(
      "SELECT stat_key, stat_value FROM judge_stats WHERE judge_id = $1",
      [id]
    );
    const judgeStats = {};
    for (const row of judgeStatsRes.rows) {
      judgeStats[row.stat_key] = parseFloat(row.stat_value);
    }

    // Helper: fetch group averages as { stat_key -> value }
    async function getGroupAverages(groupType, groupValue) {
      if (!groupValue) return {};
      const res = await pool.query(
        "SELECT stat_key, stat_value FROM group_stats WHERE group_type = $1 AND group_value = $2",
        [groupType, groupValue]
      );
      const out = {};
      for (const row of res.rows) out[row.stat_key] = parseFloat(row.stat_value);
      return out;
    }

    const [nationalAvg, stateAvg, courtTypeAvg, partyAvg] = await Promise.all([
      getGroupAverages("national", "all"),
      getGroupAverages("state", judge.state),
      getGroupAverages("court_type", judge.court),
      getGroupAverages("party", judge.party_of_appointment),
    ]);

    // Most-similar state: Euclidean distance between this judge's stat vector
    // and each state's average vector.
    const STAT_KEYS = [
      "reversal_rate",
      "opinions_per_year",
      "years_on_bench",
      "case_volume",
      "criminal_pct",
      "civil_pct",
      "family_pct",
      "administrative_pct",
    ];

    const statesRes = await pool.query(
      "SELECT DISTINCT group_value FROM group_stats WHERE group_type = 'state'"
    );
    const stateNames = statesRes.rows.map((r) => r.group_value);

    let similarStates = [];
    if (stateNames.length > 0 && Object.keys(judgeStats).length > 0) {
      const stateVectorsRes = await pool.query(
        "SELECT group_value, stat_key, stat_value FROM group_stats WHERE group_type = 'state'"
      );
      const stateVectors = {};
      for (const row of stateVectorsRes.rows) {
        stateVectors[row.group_value] = stateVectors[row.group_value] || {};
        stateVectors[row.group_value][row.stat_key] = parseFloat(row.stat_value);
      }

      const distances = [];
      for (const stateName of stateNames) {
        const vec = stateVectors[stateName] || {};
        let sumSq = 0;
        let dims = 0;
        for (const key of STAT_KEYS) {
          if (judgeStats[key] !== undefined && vec[key] !== undefined) {
            sumSq += Math.pow(judgeStats[key] - vec[key], 2);
            dims++;
          }
        }
        if (dims > 0) {
          distances.push({ state: stateName, distance: Math.sqrt(sumSq / dims) });
        }
      }
      distances.sort((a, b) => a.distance - b.distance);

      similarStates = {
        mostSimilar: distances.slice(0, 3),
        mostDifferent: distances.slice(-3).reverse(),
      };
    }

    return res.json({
      judgeId: id,
      hasStats: Object.keys(judgeStats).length > 0,
      judgeStats,
      groups: {
        national: nationalAvg,
        state: { name: judge.state || null, averages: stateAvg },
        courtType: { name: judge.court || null, averages: courtTypeAvg },
        party: { name: judge.party_of_appointment || null, averages: partyAvg },
      },
      similarStates,
    });
  } catch (err) {
    console.error("[STATS] Error:", err.message);
    return res.status(500).json({ error: "Internal error fetching stats." });
  }
});

router.get("/:id/opinions", validateJudgeId, async (req, res) => {
  const id = req.cleanId;
  const cacheKey = `opinions:${id}`;

  const cached = await getCached(cacheKey);
  if (cached) {
    return res.json({ opinions: cached, cached: true });
  }

  const token = process.env.COURTLISTENER_API_TOKEN;
  if (!token) {
    return res.status(503).json({ error: "CourtListener API token not configured.", opinions: [] });
  }

  try {
    const url = `${CL_BASE}/search/?type=o&judge=${encodeURIComponent(id)}&format=json&order_by=score+desc`;
    const response = await fetch(url, {
      headers: { ...getAuthHeaders(), "User-Agent": "JudgeTracker/1.0" },
    });

    if (!response.ok) {
      return res.status(502).json({ error: "Upstream API error.", opinions: [] });
    }

    const data = await response.json();
    const opinions = (data.results || []).slice(0, 20).map((o) => ({
      id: String(o.id),
      judgeId: id,
      caseName: o.caseName || o.case_name || "",
      courtName: o.court || "",
      dateFiled: o.dateFiled || o.date_filed || "",
      opinionType: o.type || "",
      citation: (o.citation && o.citation[0]) || "",
      summary: o.snippet || "",
    }));

    await setCache(cacheKey, opinions);

    for (const o of opinions) {
      await pool.query(
        `INSERT INTO opinions (courtlistener_id, judge_id, case_name, court_name, date_filed, opinion_type, citation, summary)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (courtlistener_id) DO NOTHING`,
        [o.id || null, id, o.caseName, o.courtName, o.dateFiled || null, o.opinionType, o.citation, o.summary]
      ).catch((err) => console.warn("[DB] Opinion insert skip:", err.message));
    }

    return res.json({ opinions, cached: false });
  } catch (err) {
    console.error("[CL] Opinions fetch error:", err.message);
    return res.status(500).json({ error: "Internal error fetching opinions.", opinions: [] });
  }
});

module.exports = router;
