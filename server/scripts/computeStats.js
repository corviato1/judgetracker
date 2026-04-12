/**
 * computeStats.js
 *
 * Reads cached opinion/judge data from PostgreSQL and derives per-judge stats,
 * then aggregates into group averages.  Safe to re-run at any time (upserts).
 *
 * Schema overview
 * ---------------
 * judge_stats  (judge_id, stat_key, stat_value, computed_at)
 * group_stats  (group_type, group_value, stat_key, stat_value, judge_count, computed_at)
 *
 * Stat keys
 * ---------
 * reversal_rate       – fraction of opinions that are "reversals" (0–1)
 * opinions_per_year   – total opinions / years on bench
 * years_on_bench      – how long the judge has served
 * case_volume         – total opinions indexed
 * criminal_pct        – fraction whose opinion_type contains "criminal"
 * civil_pct           – fraction whose opinion_type contains "civil"
 * family_pct          – fraction whose opinion_type contains "family"
 * administrative_pct  – fraction whose opinion_type contains "admin"
 *
 * Group types
 * -----------
 * national   – single group "all"
 * state      – judges.state value
 * court_type – judges.court value (trimmed)
 * party      – judges.party_of_appointment value
 *
 * Usage
 *   node server/scripts/computeStats.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const pool = require("../db");

const CURRENT_YEAR = new Date().getFullYear();

async function fetchAllJudges(client) {
  const res = await client.query(`
    SELECT courtlistener_id AS id, name, court, state, party_of_appointment, service_start
    FROM judges
  `);
  return res.rows;
}

async function fetchOpinionsForJudge(client, judgeId) {
  const res = await client.query(
    `SELECT opinion_type FROM opinions WHERE judge_id = $1`,
    [judgeId]
  );
  return res.rows;
}

function classifyOpinion(opinionType) {
  const t = (opinionType || "").toLowerCase();
  if (t.includes("criminal")) return "criminal";
  if (t.includes("civil")) return "civil";
  if (t.includes("family")) return "family";
  if (t.includes("admin")) return "administrative";
  return "other";
}

function deriveJudgeStats(judge, opinions) {
  const total = opinions.length;
  const yearsOnBench =
    judge.service_start && judge.service_start > 1800
      ? Math.max(1, CURRENT_YEAR - judge.service_start)
      : null;

  const counts = { criminal: 0, civil: 0, family: 0, administrative: 0 };
  let reversals = 0;
  for (const op of opinions) {
    const cat = classifyOpinion(op.opinion_type);
    if (counts[cat] !== undefined) counts[cat]++;
    if ((op.opinion_type || "").toLowerCase().includes("revers")) reversals++;
  }

  const stats = {};

  stats.case_volume = total;

  if (total > 0) {
    stats.reversal_rate = reversals / total;
    stats.criminal_pct = counts.criminal / total;
    stats.civil_pct = counts.civil / total;
    stats.family_pct = counts.family / total;
    stats.administrative_pct = counts.administrative / total;
  }

  if (yearsOnBench !== null) {
    stats.years_on_bench = yearsOnBench;
    stats.opinions_per_year = total / yearsOnBench;
  }

  return stats;
}

async function upsertJudgeStats(client, judgeId, stats) {
  for (const [key, value] of Object.entries(stats)) {
    await client.query(
      `INSERT INTO judge_stats (judge_id, stat_key, stat_value, computed_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (judge_id, stat_key) DO UPDATE
         SET stat_value = EXCLUDED.stat_value,
             computed_at = EXCLUDED.computed_at`,
      [judgeId, key, value]
    );
  }
}

function groupJudges(judges, allStats) {
  const groups = {
    national: { all: [] },
    state: {},
    court_type: {},
    party: {},
  };

  for (const judge of judges) {
    const id = judge.id;
    if (!allStats[id]) continue;

    groups.national.all.push(id);

    const state = (judge.state || "").trim();
    if (state) {
      groups.state[state] = groups.state[state] || [];
      groups.state[state].push(id);
    }

    const court = (judge.court || "").trim();
    if (court) {
      groups.court_type[court] = groups.court_type[court] || [];
      groups.court_type[court].push(id);
    }

    const party = (judge.party_of_appointment || "").trim();
    if (party) {
      groups.party[party] = groups.party[party] || [];
      groups.party[party].push(id);
    }
  }

  return groups;
}

function computeGroupAverage(judgeIds, allStats) {
  const sums = {};
  const counts = {};

  for (const id of judgeIds) {
    const stats = allStats[id] || {};
    for (const [key, val] of Object.entries(stats)) {
      if (val === null || val === undefined) continue;
      sums[key] = (sums[key] || 0) + val;
      counts[key] = (counts[key] || 0) + 1;
    }
  }

  const averages = {};
  for (const key of Object.keys(sums)) {
    averages[key] = sums[key] / counts[key];
  }
  return averages;
}

async function upsertGroupStats(client, groupType, groupValue, averages, judgeCount) {
  for (const [key, value] of Object.entries(averages)) {
    await client.query(
      `INSERT INTO group_stats (group_type, group_value, stat_key, stat_value, judge_count, computed_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (group_type, group_value, stat_key) DO UPDATE
         SET stat_value  = EXCLUDED.stat_value,
             judge_count = EXCLUDED.judge_count,
             computed_at = EXCLUDED.computed_at`,
      [groupType, groupValue, key, value, judgeCount]
    );
  }
}

async function run() {
  console.log("[computeStats] Starting stats computation...");
  const client = await pool.connect();

  try {
    const judges = await fetchAllJudges(client);
    console.log(`[computeStats] Found ${judges.length} judge(s).`);

    const allStats = {};

    for (const judge of judges) {
      const opinions = await fetchOpinionsForJudge(client, judge.id);
      const stats = deriveJudgeStats(judge, opinions);
      allStats[judge.id] = stats;
      await upsertJudgeStats(client, judge.id, stats);
      console.log(`[computeStats] Wrote ${Object.keys(stats).length} stat(s) for judge ${judge.id} (${judge.name})`);
    }

    const groups = groupJudges(judges, allStats);

    for (const [groupType, groupMap] of Object.entries(groups)) {
      for (const [groupValue, judgeIds] of Object.entries(groupMap)) {
        const averages = computeGroupAverage(judgeIds, allStats);
        await upsertGroupStats(client, groupType, groupValue, averages, judgeIds.length);
        console.log(`[computeStats] Group ${groupType}:${groupValue} — ${judgeIds.length} judge(s)`);
      }
    }

    console.log("[computeStats] Done.");
  } catch (err) {
    console.error("[computeStats] Error:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
