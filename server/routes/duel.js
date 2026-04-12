const express = require("express");
const router = express.Router();
const pool = require("../db");

const STAT_CATEGORIES = [
  {
    id: "criminal_case_pct",
    label: "Criminal vs. Civil Case Split",
    question: "Which judge handles a higher percentage of criminal cases?",
    unit: "% criminal cases",
  },
  {
    id: "reversal_rate",
    label: "Reversal Rate",
    question: "Which judge has a higher reversal rate on appeal?",
    unit: "% reversed on appeal",
  },
  {
    id: "years_on_bench",
    label: "Years on the Bench",
    question: "Which judge has more years of experience on the bench?",
    unit: "years on bench",
  },
  {
    id: "total_opinions",
    label: "Total Opinions Filed",
    question: "Which judge has filed more written opinions?",
    unit: "total opinions",
  },
  {
    id: "case_volume_per_year",
    label: "Case Volume per Year",
    question: "Which judge handles more cases per year on average?",
    unit: "cases/year",
  },
];

function generateStatValue(statId, serviceStartYear) {
  const currentYear = new Date().getFullYear();
  const yearsOnBench = serviceStartYear
    ? currentYear - serviceStartYear
    : Math.floor(Math.random() * 20) + 2;

  switch (statId) {
    case "criminal_case_pct":
      return Math.floor(Math.random() * 70) + 10;
    case "reversal_rate":
      return Math.floor(Math.random() * 25) + 2;
    case "years_on_bench":
      return yearsOnBench;
    case "total_opinions":
      return Math.floor(yearsOnBench * (Math.random() * 40 + 20));
    case "case_volume_per_year":
      return Math.floor(Math.random() * 300) + 50;
    default:
      return Math.floor(Math.random() * 100);
  }
}

function buildSampleJudges() {
  return [
    {
      id: "demo-1",
      fullName: "Jane A. Doe",
      court: "U.S. District Court, C.D. Cal.",
      courtLevel: "federal_district",
      gender: "Female",
      partyOfAppointment: "Democrat",
      serviceStartYear: 2012,
      state: "CA",
      active: true,
    },
    {
      id: "demo-2",
      fullName: "Michael B. Smith",
      court: "U.S. Court of Appeals, 9th Cir.",
      courtLevel: "federal_appeals",
      gender: "Male",
      partyOfAppointment: "Republican",
      serviceStartYear: 2015,
      state: "CA",
      active: true,
    },
    {
      id: "demo-3",
      fullName: "Alexandra C. Rivera",
      court: "Supreme Court of California",
      courtLevel: "state_supreme",
      gender: "Female",
      partyOfAppointment: "Democrat",
      serviceStartYear: 2010,
      state: "CA",
      active: true,
    },
    {
      id: "demo-4",
      fullName: "Robert D. Chen",
      court: "U.S. District Court, S.D.N.Y.",
      courtLevel: "federal_district",
      gender: "Male",
      partyOfAppointment: "Democrat",
      serviceStartYear: 2008,
      state: "NY",
      active: true,
    },
    {
      id: "demo-5",
      fullName: "Patricia E. Williams",
      court: "Texas Court of Appeals",
      courtLevel: "state_appeals",
      gender: "Female",
      partyOfAppointment: "Republican",
      serviceStartYear: 2016,
      state: "TX",
      active: true,
    },
    {
      id: "demo-6",
      fullName: "James F. Thompson",
      court: "U.S. District Court, N.D. Ill.",
      courtLevel: "federal_district",
      gender: "Male",
      partyOfAppointment: "Republican",
      serviceStartYear: 2005,
      state: "IL",
      active: true,
    },
    {
      id: "demo-7",
      fullName: "Maria G. Santos",
      court: "Florida Supreme Court",
      courtLevel: "state_supreme",
      gender: "Female",
      partyOfAppointment: "Democrat",
      serviceStartYear: 2018,
      state: "FL",
      active: true,
    },
    {
      id: "demo-8",
      fullName: "David H. Patel",
      court: "U.S. Court of Appeals, 5th Cir.",
      courtLevel: "federal_appeals",
      gender: "Male",
      partyOfAppointment: "Republican",
      serviceStartYear: 2013,
      state: "TX",
      active: true,
    },
  ];
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

router.get("/pair", async (req, res) => {
  try {
    const { state, courtLevel, gender, party, status } = req.query;
    const filters = { state, courtLevel, gender, party, status };

    let candidates = buildSampleJudges();

    try {
      const dbResult = await pool.query(
        `SELECT courtlistener_id AS id, name, court, state, gender, party_of_appointment, service_start
         FROM judges
         ORDER BY last_synced DESC
         LIMIT 100`
      );
      if (dbResult.rows.length >= 2) {
        const dbJudges = dbResult.rows.map((r) => ({
          id: r.id,
          fullName: r.name,
          court: r.court || "",
          courtLevel: "federal_district",
          gender: r.gender || "Unknown",
          partyOfAppointment: r.party_of_appointment || "Unknown",
          serviceStartYear: r.service_start || null,
          state: r.state || "",
          active: true,
        }));
        candidates = [...dbJudges, ...candidates];
      }
    } catch (dbErr) {
      console.warn("[DUEL] DB lookup failed, using sample data:", dbErr.message);
    }

    const filtered = applyFilters(candidates, filters);
    if (filtered.length < 2) {
      return res.status(404).json({
        error: "Not enough judges match the selected filters. Please broaden your criteria.",
        tooFewMatches: true,
      });
    }

    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    const judgeA = shuffled[0];
    const judgeB = shuffled[1];

    const statCategory = STAT_CATEGORIES[Math.floor(Math.random() * STAT_CATEGORIES.length)];

    const statA = generateStatValue(statCategory.id, judgeA.serviceStartYear);
    const statB = generateStatValue(statCategory.id, judgeB.serviceStartYear);

    const winnerId = statA > statB ? judgeA.id : judgeB.id;

    try {
      await pool.query(
        `INSERT INTO duel_plays (played_at) VALUES (NOW())`
      ).catch(() => {});
    } catch (_) {}

    return res.json({
      statCategory: {
        id: statCategory.id,
        question: statCategory.question,
        unit: statCategory.unit,
      },
      judgeA: {
        id: judgeA.id,
        court: judgeA.court,
        gender: judgeA.gender,
        partyOfAppointment: judgeA.partyOfAppointment,
        yearsOnBench: judgeA.serviceStartYear
          ? new Date().getFullYear() - judgeA.serviceStartYear
          : null,
        statValue: statA,
        fullName: judgeA.fullName,
      },
      judgeB: {
        id: judgeB.id,
        court: judgeB.court,
        gender: judgeB.gender,
        partyOfAppointment: judgeB.partyOfAppointment,
        yearsOnBench: judgeB.serviceStartYear
          ? new Date().getFullYear() - judgeB.serviceStartYear
          : null,
        statValue: statB,
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
