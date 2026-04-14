const express = require("express");
const router = express.Router();
const pool = require("../db");
const { searchLimiter } = require("../middleware/rateLimiter");
const { validateSearchQuery, validateJudgeId } = require("../middleware/validation");
const { normalizePerson } = require("../utils/normalize");
const { getCached, setCache, withCoalescing, TTL } = require("../cache");

const CL_BASE = "https://www.courtlistener.com/api/rest/v4";

function getAuthHeaders() {
  const token = process.env.COURTLISTENER_API_TOKEN;
  return token ? { Authorization: `Token ${token}` } : {};
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
    const results = await withCoalescing(cacheKey, async () => {
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
        const upstreamErr = new Error(userMessage);
        upstreamErr.upstreamStatus = response.status;
        throw upstreamErr;
      }

      const data = await response.json();
      const normalized = (data.results || []).slice(0, 20).map(normalizePerson);
      await setCache(cacheKey, normalized, TTL.searchHours);

      for (const judge of normalized) {
        await pool.query(
          `INSERT INTO judges (courtlistener_id, name, court, state, gender, party_of_appointment, service_start, last_synced)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
           ON CONFLICT (courtlistener_id) DO UPDATE SET
             name = EXCLUDED.name, court = EXCLUDED.court, last_synced = NOW()`,
          [judge.id, judge.fullName, judge.courtName, judge.state, judge.gender, judge.partyOfAppointment, judge.serviceStartYear]
        );
      }
      return normalized;
    });

    return res.json({ results, cached: false });
  } catch (err) {
    if (err.upstreamStatus) {
      return res.status(502).json({ error: err.message, upstreamStatus: err.upstreamStatus, results: [] });
    }
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
    const judge = await withCoalescing(cacheKey, async () => {
      const response = await fetch(`${CL_BASE}/people/${id}/?format=json`, {
        headers: { ...getAuthHeaders(), "User-Agent": "JudgeTracker/1.0" },
      });

      if (!response.ok) {
        const upstreamErr = new Error("Judge not found.");
        upstreamErr.httpStatus = response.status === 404 ? 404 : 502;
        throw upstreamErr;
      }

      const data = await response.json();
      const normalized = normalizePerson(data);
      await setCache(cacheKey, normalized, TTL.judgeHours);

      await pool.query(
        `INSERT INTO judges (courtlistener_id, name, court, state, gender, party_of_appointment, service_start, last_synced)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         ON CONFLICT (courtlistener_id) DO UPDATE SET name = EXCLUDED.name, last_synced = NOW()`,
        [normalized.id, normalized.fullName, normalized.courtName, normalized.state, normalized.gender, normalized.partyOfAppointment, normalized.serviceStartYear]
      );
      return normalized;
    });

    return res.json({ judge, cached: false });
  } catch (err) {
    if (err.httpStatus) {
      return res.status(err.httpStatus).json({ error: err.message });
    }
    console.error("[CL] Judge fetch error:", err.message);
    return res.status(500).json({ error: "Internal error fetching judge." });
  }
});

router.get("/:id/stats", validateJudgeId, async (req, res) => {
  const id = req.cleanId;

  try {
    const judgeRow = await pool.query(
      "SELECT state, court, party_of_appointment FROM judges WHERE courtlistener_id = $1",
      [id]
    );
    const judge = judgeRow.rows[0] || {};

    const judgeStatsRes = await pool.query(
      "SELECT stat_key, stat_value FROM judge_stats WHERE judge_id = $1",
      [id]
    );
    const judgeStats = {};
    for (const row of judgeStatsRes.rows) {
      judgeStats[row.stat_key] = parseFloat(row.stat_value);
    }

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

    const STAT_KEYS = [
      "reversal_rate", "opinions_per_year", "years_on_bench", "case_volume",
      "criminal_pct", "civil_pct", "family_pct", "administrative_pct",
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

router.get("/:id/local", validateJudgeId, async (req, res) => {
  const id = req.cleanId;
  try {
    const result = await pool.query(
      `SELECT courtlistener_id, name, court, state, gender, party_of_appointment, service_start
       FROM judges WHERE courtlistener_id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Judge not found in local database." });
    }
    const row = result.rows[0];
    const judge = {
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
    };
    return res.json({ judge });
  } catch (err) {
    console.error("[DB] Local judge fetch error:", err.message);
    return res.status(500).json({ error: "Internal error fetching local judge data." });
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

  async function localOpinions() {
    const result = await pool.query(
      `SELECT courtlistener_id, case_name, court_name, date_filed, opinion_type, citation, summary
       FROM opinions WHERE judge_id = $1 ORDER BY date_filed DESC NULLS LAST LIMIT 50`,
      [id]
    );
    return result.rows.map((r) => ({
      id: String(r.courtlistener_id || r.id || ""),
      judgeId: id,
      caseName: r.case_name || "",
      courtName: r.court_name || "",
      dateFiled: r.date_filed ? String(r.date_filed).slice(0, 10) : "",
      opinionType: r.opinion_type || "",
      citation: r.citation || "",
      summary: r.summary || "",
      disposition: "",
      url: r.courtlistener_id ? `https://www.courtlistener.com/opinion/${r.courtlistener_id}/` : null,
      source: "local",
    }));
  }

  if (!token) {
    try {
      const local = await localOpinions();
      return res.json({ opinions: local, cached: false, source: "local" });
    } catch (dbErr) {
      console.error("[DB] Local opinions error:", dbErr.message);
      return res.status(503).json({ error: "CourtListener API token not configured.", opinions: [] });
    }
  }

  try {
    const opinions = await withCoalescing(cacheKey, async () => {
      const url = `${CL_BASE}/search/?type=o&judge=${encodeURIComponent(id)}&format=json&order_by=score+desc`;
      const response = await fetch(url, {
        headers: { ...getAuthHeaders(), "User-Agent": "JudgeTracker/1.0" },
      });

      if (!response.ok) {
        const upstreamErr = new Error("Upstream API error.");
        upstreamErr.httpStatus = response.status >= 500 ? 502 : response.status;
        throw upstreamErr;
      }

      const data = await response.json();
      const normalized = (data.results || []).slice(0, 50).map((o) => ({
        id: String(o.id),
        judgeId: id,
        caseName: o.caseName || o.case_name || "",
        courtName: o.court || "",
        dateFiled: o.dateFiled || o.date_filed || "",
        opinionType: o.type || "",
        citation: (o.citation && o.citation[0]) || "",
        summary: o.snippet || "",
        disposition: o.disposition || "",
        url: o.absolute_url
          ? `https://www.courtlistener.com${o.absolute_url}`
          : `https://www.courtlistener.com/opinion/${o.id}/`,
      }));

      await setCache(cacheKey, normalized, TTL.opinionsHours);

      for (const o of normalized) {
        await pool.query(
          `INSERT INTO opinions (courtlistener_id, judge_id, case_name, court_name, date_filed, opinion_type, citation, summary)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (courtlistener_id) DO NOTHING`,
          [o.id || null, id, o.caseName, o.courtName, o.dateFiled || null, o.opinionType, o.citation, o.summary]
        ).catch((dbErr) => console.warn("[DB] Opinion insert skip:", dbErr.message));
      }
      return normalized;
    });

    return res.json({ opinions, cached: false });
  } catch (err) {
    if (err.httpStatus === 503 || err.httpStatus === 502) {
      try {
        const local = await localOpinions();
        return res.json({ opinions: local, cached: false, source: "local" });
      } catch (dbErr) {
        console.error("[DB] Local opinions fallback error:", dbErr.message);
      }
      return res.status(err.httpStatus).json({ error: err.message, opinions: [] });
    }
    console.error("[CL] Opinions fetch error:", err.message);
    return res.status(500).json({ error: "Internal error fetching opinions.", opinions: [] });
  }
});

router.get("/:id/history", validateJudgeId, async (req, res) => {
  const id = req.cleanId;
  const cacheKey = `history:${id}`;

  const cached = await getCached(cacheKey);
  if (cached) {
    return res.json({ ...cached, cached: true });
  }

  const token = process.env.COURTLISTENER_API_TOKEN;
  if (!token) {
    return res.status(503).json({
      error: "CourtListener API token not configured.",
      reversals: [], violentFelonyReleases: [], citations: [],
    });
  }

  try {
    const history = await withCoalescing(cacheKey, async () => {
      const url = `${CL_BASE}/search/?type=o&judge=${encodeURIComponent(id)}&format=json&order_by=dateFiled+desc`;
      const response = await fetch(url, {
        headers: { ...getAuthHeaders(), "User-Agent": "JudgeTracker/1.0" },
      });

      if (!response.ok) {
        const upstreamErr = new Error("Upstream API error.");
        upstreamErr.httpStatus = 502;
        throw upstreamErr;
      }

      const data = await response.json();
      const opinions = data.results || [];

      const reversalRe = /\b(revers|overrul|vacat|overturned|remand)\b/i;
      const violentRe = /\b(assault|murder|homicide|robbery|rape|kidnap|weapon|firearm|gun|battery|manslaughter|carjack|arson|trafficking|sex.offend|armed)\b/i;
      const releaseRe = /\b(bail|bond|releas|detention|pretrial|custody)\b/i;

      const VIOLENT_NOS = new Set([
        "110", "111", "112", "113", "115", "120", "130", "140", "160",
        "490", "530", "535", "540",
      ]);

      const reversals = [];
      const violentFelonyReleases = [];
      const citations = [];

      for (const o of opinions) {
        const caseName = o.caseName || o.case_name || "";
        const snippet = o.snippet || "";
        const dateFiled = o.dateFiled || o.date_filed || "";
        const court = o.court || "";
        const citation = (o.citation && o.citation[0]) || "";
        const precedentialStatus = o.precedentialStatus || o.precedential_status || "";
        const natureOfSuit = String(o.nature_of_suit || o.suitNature || o.suit_nature || "");
        const clUrl = o.absolute_url
          ? `https://www.courtlistener.com${o.absolute_url}`
          : `https://www.courtlistener.com/opinion/${o.id}/`;
        const combined = `${caseName} ${snippet}`;
        const trimSnippet = snippet.slice(0, 280);

        const entry = {
          id: String(o.id),
          caseName,
          dateFiled,
          court,
          citation,
          snippet: trimSnippet,
          url: clUrl,
        };

        const isReversal =
          precedentialStatus === "Overruled" ||
          o.per_curiam === true ||
          reversalRe.test(combined);

        const isViolent =
          VIOLENT_NOS.has(natureOfSuit.trim()) ||
          violentRe.test(natureOfSuit) ||
          violentRe.test(combined);

        const isRelease = releaseRe.test(combined);

        if (isReversal) reversals.push(entry);
        if (isViolent && isRelease) violentFelonyReleases.push(entry);

        citations.push({
          id: String(o.id),
          caseName,
          dateFiled,
          court,
          citation,
          snippet: trimSnippet,
          url: clUrl,
        });
      }

      const result = {
        judgeId: id,
        reversals: reversals.slice(0, 20),
        violentFelonyReleases: violentFelonyReleases.slice(0, 20),
        citations: citations.slice(0, 30),
      };

      await setCache(cacheKey, result, TTL.opinionsHours);
      return result;
    });

    return res.json({ ...history, cached: false });
  } catch (err) {
    if (err.httpStatus) {
      return res.status(err.httpStatus).json({
        error: err.message, reversals: [], violentFelonyReleases: [], citations: [],
      });
    }
    console.error("[CL] History fetch error:", err.message);
    return res.status(500).json({
      error: "Internal error fetching judge history.",
      reversals: [], violentFelonyReleases: [], citations: [],
    });
  }
});

module.exports = router;
