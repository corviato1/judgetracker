/**
 * syncOpinions.js
 *
 * Fetches opinions from CourtListener /search/?type=o in paginated batches,
 * upserts them into the opinions table (and ensures minimal judge records exist),
 * then triggers computeStats.js.
 *
 * Usage:
 *   node server/scripts/syncOpinions.js
 *   node server/scripts/syncOpinions.js --pages=5
 *   node server/scripts/syncOpinions.js --pages=5 --judge=12345
 */

require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const { execSync } = require("child_process");
const pool = require("../db");

const CL_BASE = "https://www.courtlistener.com/api/rest/v4";

function getAuthHeaders() {
  const token = process.env.COURTLISTENER_API_TOKEN;
  if (!token) {
    console.error("[syncOpinions] ERROR: COURTLISTENER_API_TOKEN is not set.");
    process.exit(1);
  }
  return { Authorization: `Token ${token}`, "User-Agent": "JudgeTracker/1.0" };
}

function parseArgs() {
  const args = process.argv.slice(2);
  let maxPages = Infinity;
  let judgeId = null;

  for (const arg of args) {
    const pagesMatch = arg.match(/^--pages=(\d+)$/);
    if (pagesMatch) maxPages = parseInt(pagesMatch[1], 10);

    const judgeMatch = arg.match(/^--judge=(\S+)$/);
    if (judgeMatch) judgeId = judgeMatch[1];
  }

  return { maxPages, judgeId };
}

async function upsertJudge(client, opinion, explicitJudgeId) {
  const authorId = explicitJudgeId || String(opinion.author_id || "");
  if (!authorId || authorId === "undefined") return;

  const authorName = (opinion.author || opinion.judge || "").slice(0, 255);
  const courtName = (opinion.court || "").slice(0, 255);

  await client.query(
    `INSERT INTO judges (courtlistener_id, name, court, last_synced)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (courtlistener_id) DO UPDATE SET
       name        = CASE WHEN EXCLUDED.name != '' THEN EXCLUDED.name ELSE judges.name END,
       court       = CASE WHEN EXCLUDED.court != '' THEN EXCLUDED.court ELSE judges.court END,
       last_synced = NOW()`,
    [authorId, authorName, courtName]
  );
}

async function upsertOpinion(client, opinion, explicitJudgeId) {
  const clId = String(opinion.id || "");
  if (!clId) return;

  const authorId = explicitJudgeId || String(opinion.author_id || "");
  if (!authorId || authorId === "undefined") return;

  const caseName = (opinion.caseName || opinion.case_name || "").slice(0, 500);
  const courtName = (opinion.court || "").slice(0, 255);
  const dateFiled = opinion.dateFiled || opinion.date_filed || null;
  const opinionType = (opinion.type || "").slice(0, 100);
  const citation = ((opinion.citation && opinion.citation[0]) || "").slice(0, 200);
  const summary = (opinion.snippet || "").slice(0, 5000);

  await client.query(
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
    [clId, authorId, caseName, courtName, dateFiled || null, opinionType, citation, summary]
  );
}

async function fetchPage(url, headers) {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`CourtListener responded ${response.status}: ${text.slice(0, 200)}`);
  }
  return response.json();
}

async function run() {
  const { maxPages, judgeId } = parseArgs();
  const headers = getAuthHeaders();

  console.log(`[syncOpinions] Starting sync. maxPages=${maxPages === Infinity ? "all" : maxPages}${judgeId ? `, judgeId=${judgeId}` : ""}`);

  const client = await pool.connect();
  let totalUpserted = 0;
  let page = 1;

  try {
    const params = new URLSearchParams({ type: "o", format: "json", order_by: "score desc" });
    if (judgeId) params.set("judge", judgeId);
    let nextUrl = `${CL_BASE}/search/?${params.toString()}`;

    while (nextUrl && page <= maxPages) {
      console.log(`[syncOpinions] Fetching page ${page}: ${nextUrl}`);
      const data = await fetchPage(nextUrl, headers);

      const results = data.results || [];
      if (results.length === 0) {
        console.log("[syncOpinions] No results on this page, stopping.");
        break;
      }

      for (const opinion of results) {
        await upsertJudge(client, opinion, judgeId);
        await upsertOpinion(client, opinion, judgeId);
        totalUpserted++;
      }

      console.log(`[syncOpinions] Page ${page}: processed ${results.length} opinion(s) (total so far: ${totalUpserted})`);

      nextUrl = data.next || null;
      page++;

      if (nextUrl && page <= maxPages) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    console.log(`[syncOpinions] Sync complete. Total opinions processed: ${totalUpserted}`);
  } catch (err) {
    console.error("[syncOpinions] Error during sync:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }

  console.log("[syncOpinions] Running computeStats.js...");
  try {
    execSync(`node ${require("path").join(__dirname, "computeStats.js")}`, { stdio: "inherit" });
    console.log("[syncOpinions] computeStats.js completed successfully.");
  } catch (err) {
    console.error("[syncOpinions] computeStats.js failed:", err.message);
    process.exit(1);
  }
}

run();
