const express = require("express");
const router = express.Router();
const pool = require("../db");

const CURRENT_YEAR = new Date().getFullYear();

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
    if (valA !== null && valB !== null) {
      return { cat, valA, valB };
    }
  }
  return null;
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

    const allStats = await getBulkJudgeStats(candidatePool.map((j) => j.id));

    let judgeA = null;
    let judgeB = null;
    let picked = null;

    outer: for (let i = 0; i < candidatePool.length - 1; i++) {
      const candidateA = candidatePool[i];
      const sA = allStats[candidateA.id] || {};
      for (let j = i + 1; j < candidatePool.length; j++) {
        const candidateB = candidatePool[j];
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
      judgeA = shuffled[0];
      judgeB = shuffled[1];
      return res.json({
        statCategory: {
          id: "years_on_bench",
          question: "Which judge has more years of experience on the bench?",
          unit: "years on bench",
        },
        statsPending: true,
        pendingReason: "Statistics for these judges have not been computed yet. Run the sync script to populate real data.",
        judgeA: {
          id: judgeA.id,
          court: judgeA.court,
          gender: judgeA.gender,
          partyOfAppointment: judgeA.partyOfAppointment,
          yearsOnBench: judgeA.serviceStartYear ? CURRENT_YEAR - judgeA.serviceStartYear : null,
          statValue: null,
          fullName: judgeA.fullName,
        },
        judgeB: {
          id: judgeB.id,
          court: judgeB.court,
          gender: judgeB.gender,
          partyOfAppointment: judgeB.partyOfAppointment,
          yearsOnBench: judgeB.serviceStartYear ? CURRENT_YEAR - judgeB.serviceStartYear : null,
          statValue: null,
          fullName: judgeB.fullName,
        },
        winnerId: null,
      });
    }

    const { cat, valA, valB } = picked;
    const winnerId = valA >= valB ? judgeA.id : judgeB.id;

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
