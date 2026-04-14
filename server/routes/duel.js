const express = require("express");
const router = express.Router();
const pool = require("../db");

const CURRENT_YEAR = new Date().getFullYear();
const CL_BASE = "https://www.courtlistener.com/api/rest/v4";

const STAT_CATEGORIES = [
  {
    id: "criminal_case_pct",
    label: "Criminal vs. Civil Case Split",
    question: "Which judge handles a higher percentage of criminal cases?",
    unit: "% criminal cases",
    statKey: "criminal_pct",
    scale: 100,
  },
  {
    id: "reversal_rate",
    label: "Reversal Rate",
    question: "Which judge has a higher reversal rate on appeal?",
    unit: "% reversed on appeal",
    statKey: "reversal_rate",
    scale: 100,
  },
  {
    id: "years_on_bench",
    label: "Years on the Bench",
    question: "Which judge has more years of experience on the bench?",
    unit: "years on bench",
    statKey: "years_on_bench",
    scale: 1,
  },
  {
    id: "total_opinions",
    label: "Total Opinions Filed",
    question: "Which judge has filed more written opinions?",
    unit: "total opinions",
    statKey: "case_volume",
    scale: 1,
  },
  {
    id: "case_volume_per_year",
    label: "Case Volume per Year",
    question: "Which judge handles more cases per year on average?",
    unit: "cases/year",
    statKey: "opinions_per_year",
    scale: 1,
  },
];

function deriveCourtLevel(court) {
  const c = (court || "").toLowerCase();
  if (c.includes("supreme court of the united states")) return "federal_supreme";
  if (c.includes("court of appeals") && (c.includes("cir.") || c.includes("circuit"))) return "federal_appeals";
  if (c.includes("u.s. district") || c.includes("united states district")) return "federal_district";
  if (c.includes("bankruptcy")) return "federal_district";
  if (c.includes("supreme court")) return "state_supreme";
  if (c.includes("court of appeals") || c.includes("appellate")) return "state_appeals";
  if (c.includes("family") || c.includes("juvenile")) return "family";
  return "federal_district";
}

function applyFilters(judges, filters) {
  return judges.filter((j) => {
    if (filters.state && filters.state !== "any" && j.state !== filters.state) return false;
    if (filters.courtLevel && filters.courtLevel !== "any" && j.courtLevel !== filters.courtLevel) return false;
    if (filters.gender && filters.gender !== "any" && j.gender !== filters.gender) return false;
    if (filters.party && filters.party !== "any" && j.partyOfAppointment !== filters.party) return false;
    if (filters.status && filters.status !== "any") {
      const wantActive = filters.status === "active";
      if (j.active !== wantActive) return false;
    }
    return true;
  });
}

async function getBulkJudgeStats(judgeIds) {
  if (!judgeIds.length) return {};
  const res = await pool.query(
    "SELECT judge_id, stat_key, stat_value FROM judge_stats WHERE judge_id = ANY($1)",
    [judgeIds]
  );
  const map = {};
  for (const row of res.rows) {
    if (!map[row.judge_id]) map[row.judge_id] = {};
    map[row.judge_id][row.stat_key] = parseFloat(row.stat_value);
  }
  return map;
}

function resolveStatValue(dbStats, statKey, scale) {
  if (dbStats[statKey] !== undefined) {
    return Math.round(dbStats[statKey] * scale * 10) / 10;
  }
  return null;
}

function pickStatCategory(statsA, statsB) {
  const shuffled = [...STAT_CATEGORIES].sort(() => Math.random() - 0.5);
  for (const cat of shuffled) {
    const valA = resolveStatValue(statsA, cat.statKey, cat.scale);
    const valB = resolveStatValue(statsB, cat.statKey, cat.scale);
    if (valA !== null && valB !== null && valA !== valB) {
      return { cat, valA, valB };
    }
  }
  return null;
}

function classifyOpinion(opinionType) {
  const t = (opinionType || "").toLowerCase();
  if (t.includes("criminal")) return "criminal";
  if (t.includes("civil")) return "civil";
  if (t.includes("family")) return "family";
  if (t.includes("admin")) return "administrative";
  return "other";
}

async function computeLocalStats(judgeId, serviceStartYear) {
  try {
    const opinionsRes = await pool.query(
      "SELECT opinion_type FROM opinions WHERE judge_id = $1",
      [String(judgeId)]
    );
    const opinions = opinionsRes.rows;
    const total = opinions.length;

    const stats = {};
    const yearsOnBench =
      serviceStartYear && serviceStartYear > 1800
        ? Math.max(1, CURRENT_YEAR - serviceStartYear)
        : null;

    stats.case_volume = total;

    if (yearsOnBench !== null) {
      stats.years_on_bench = yearsOnBench;
      if (total > 0) {
        stats.opinions_per_year = total / yearsOnBench;
      }
    }

    if (total > 0) {
      const counts = { criminal: 0, civil: 0, family: 0, administrative: 0 };
      let reversals = 0;
      for (const op of opinions) {
        const cat = classifyOpinion(op.opinion_type);
        if (counts[cat] !== undefined) counts[cat]++;
        if ((op.opinion_type || "").toLowerCase().includes("revers")) reversals++;
      }
      stats.reversal_rate = reversals / total;
      stats.criminal_pct = counts.criminal / total;
      stats.civil_pct = counts.civil / total;
      stats.family_pct = counts.family / total;
      stats.administrative_pct = counts.administrative / total;
    }

    for (const [key, value] of Object.entries(stats)) {
      await pool.query(
        `INSERT INTO judge_stats (judge_id, stat_key, stat_value, computed_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (judge_id, stat_key) DO UPDATE
           SET stat_value = EXCLUDED.stat_value,
               computed_at = EXCLUDED.computed_at`,
        [String(judgeId), key, value]
      );
    }

    console.log(`[DUEL] computeLocalStats: wrote ${Object.keys(stats).length} stat(s) for judge ${judgeId}`);
    return stats;
  } catch (err) {
    console.error(`[DUEL] computeLocalStats failed for judge ${judgeId}:`, err.message);
    return {};
  }
}

async function fetchAndStoreOpinions(judgeId, serviceStartYear) {
  const token = process.env.COURTLISTENER_API_TOKEN;
  if (!token) {
    console.log(`[DUEL] No CL token — skipping background fetch for judge ${judgeId}`);
    return;
  }
  try {
    const headers = {
      Authorization: `Token ${token}`,
      "User-Agent": "JudgeTracker/1.0",
    };
    const MAX_PAGES = 3;
    let page = 1;
    let nextUrl = `${CL_BASE}/search/?type=o&format=json&order_by=score+desc&judge=${encodeURIComponent(judgeId)}`;
    let totalUpserted = 0;

    while (nextUrl && page <= MAX_PAGES) {
      const response = await fetch(nextUrl, { headers });
      if (!response.ok) break;
      const data = await response.json();
      const results = data.results || [];
      if (results.length === 0) break;

      for (const opinion of results) {
        const clId = String(opinion.id || "");
        if (!clId) continue;
        const caseName = (opinion.caseName || opinion.case_name || "").slice(0, 500);
        const courtName = (opinion.court || "").slice(0, 255);
        const dateFiled = opinion.dateFiled || opinion.date_filed || null;
        const opinionType = (opinion.type || "").slice(0, 100);
        const citation = ((opinion.citation && opinion.citation[0]) || "").slice(0, 200);
        const summary = (opinion.snippet || "").slice(0, 5000);

        await pool.query(
          `INSERT INTO opinions
             (courtlistener_id, judge_id, case_name, court_name, date_filed, opinion_type, citation, summary)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (courtlistener_id) DO UPDATE SET
             case_name    = EXCLUDED.case_name,
             court_name   = EXCLUDED.court_name,
             date_filed   = EXCLUDED.date_filed,
             opinion_type = EXCLUDED.opinion_type,
             citation     = EXCLUDED.citation,
             summary      = EXCLUDED.summary`,
          [clId, String(judgeId), caseName, courtName, dateFiled || null, opinionType, citation, summary]
        );
        totalUpserted++;
      }

      nextUrl = data.next || null;
      page++;
      if (nextUrl && page <= MAX_PAGES) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    console.log(`[DUEL] fetchAndStoreOpinions: upserted ${totalUpserted} opinion(s) for judge ${judgeId}`);
    await computeLocalStats(judgeId, serviceStartYear);
  } catch (err) {
    console.error(`[DUEL] fetchAndStoreOpinions failed for judge ${judgeId}:`, err.message);
  }
}

function fireAndForget(promise) {
  promise.catch((err) => console.error("[DUEL] background task error:", err.message));
}

router.get("/pair", async (req, res) => {
  try {
    const { state, courtLevel, gender, party, status } = req.query;
    const filters = { state, courtLevel, gender, party, status };

    const dbResult = await pool.query(
      `SELECT courtlistener_id AS id, name, court, state, gender, party_of_appointment, service_start
       FROM judges
       ORDER BY last_synced DESC
       LIMIT 100`
    );

    if (dbResult.rows.length < 2) {
      return res.status(404).json({
        error: "Not enough judges in the database. Please run the opinion sync script to populate data.",
        tooFewMatches: true,
      });
    }

    const candidates = dbResult.rows.map((r) => ({
      id: r.id,
      fullName: r.name,
      court: r.court || "",
      courtLevel: deriveCourtLevel(r.court),
      gender: r.gender || "Unknown",
      partyOfAppointment: r.party_of_appointment || "Unknown",
      serviceStartYear: r.service_start || null,
      state: r.state || "",
      active: true,
    }));

    const filtered = applyFilters(candidates, filters);
    if (filtered.length < 2) {
      return res.status(404).json({
        error: "Not enough judges match the selected filters. Please broaden your criteria.",
        tooFewMatches: true,
      });
    }

    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    const maxCandidates = Math.min(shuffled.length, 20);
    const candidatePool = shuffled.slice(0, maxCandidates);

    const judgeIds = candidatePool.map((j) => j.id);

    const existingStatsCheck = await pool.query(
      `SELECT DISTINCT judge_id FROM judge_stats WHERE judge_id = ANY($1)`,
      [judgeIds]
    );
    const hasStats = new Set(existingStatsCheck.rows.map((r) => r.judge_id));

    const opinionsCheck = await pool.query(
      `SELECT DISTINCT judge_id FROM opinions WHERE judge_id = ANY($1)`,
      [judgeIds]
    );
    const hasOpinions = new Set(opinionsCheck.rows.map((r) => r.judge_id));

    const survivingPool = [];
    for (const judge of candidatePool) {
      const id = String(judge.id);
      if (hasStats.has(id)) {
        survivingPool.push(judge);
      } else if (hasOpinions.has(id)) {
        await computeLocalStats(id, judge.serviceStartYear);
        survivingPool.push(judge);
      } else {
        fireAndForget(fetchAndStoreOpinions(id, judge.serviceStartYear));
      }
    }

    if (survivingPool.length < 2) {
      return res.status(404).json({
        error: "Not enough judges have opinion data for a duel yet. Data is being fetched in the background — please try again shortly.",
        tooFewMatches: true,
      });
    }

    const dbStats = await getBulkJudgeStats(survivingPool.map((j) => j.id));

    const allStats = {};
    for (const judge of survivingPool) {
      allStats[judge.id] = dbStats[judge.id] || {};
    }

    let judgeA = null;
    let judgeB = null;
    let picked = null;

    outer: for (let i = 0; i < survivingPool.length - 1; i++) {
      const candidateA = survivingPool[i];
      const sA = allStats[candidateA.id] || {};
      for (let j = i + 1; j < survivingPool.length; j++) {
        const candidateB = survivingPool[j];
        const sB = allStats[candidateB.id] || {};
        const result = pickStatCategory(sA, sB);
        if (result !== null) {
          judgeA = candidateA;
          judgeB = candidateB;
          picked = result;
          break outer;
        }
      }
    }

    if (picked === null) {
      return res.status(404).json({
        error: "No stat category found with distinct values for available judges. More opinion data may be needed.",
        tooFewMatches: true,
      });
    }

    const { cat, valA, valB } = picked;
    const winnerId = valA > valB ? judgeA.id : judgeB.id;

    try {
      await pool.query(`INSERT INTO duel_plays (played_at) VALUES (NOW())`).catch(() => {});
    } catch (_) {}

    return res.json({
      statCategory: {
        id: cat.id,
        question: cat.question,
        unit: cat.unit,
      },
      statsPending: false,
      judgeA: {
        id: judgeA.id,
        court: judgeA.court,
        gender: judgeA.gender,
        partyOfAppointment: judgeA.partyOfAppointment,
        yearsOnBench: judgeA.serviceStartYear ? CURRENT_YEAR - judgeA.serviceStartYear : null,
        statValue: valA,
        fullName: judgeA.fullName,
      },
      judgeB: {
        id: judgeB.id,
        court: judgeB.court,
        gender: judgeB.gender,
        partyOfAppointment: judgeB.partyOfAppointment,
        yearsOnBench: judgeB.serviceStartYear ? CURRENT_YEAR - judgeB.serviceStartYear : null,
        statValue: valB,
        fullName: judgeB.fullName,
      },
      winnerId,
    });
  } catch (err) {
    console.error("[DUEL] Error:", err.message);
    return res.status(500).json({ error: "Failed to generate duel pair." });
  }
});

module.exports = router;
