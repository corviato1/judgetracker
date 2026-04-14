require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const pool = require("../db");

const migrations = [
  `CREATE TABLE IF NOT EXISTS judges (
    id SERIAL PRIMARY KEY,
    courtlistener_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    court VARCHAR(255),
    state VARCHAR(100),
    gender VARCHAR(20),
    party_of_appointment VARCHAR(100),
    service_start INTEGER,
    case_count INTEGER,
    last_synced TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS opinions (
    id SERIAL PRIMARY KEY,
    courtlistener_id VARCHAR(50) UNIQUE,
    judge_id VARCHAR(50) NOT NULL,
    case_name VARCHAR(500),
    court_name VARCHAR(255),
    date_filed DATE,
    opinion_type VARCHAR(100),
    citation VARCHAR(200),
    summary TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS api_cache (
    key VARCHAR(512) PRIMARY KEY,
    value TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE INDEX IF NOT EXISTS idx_api_cache_expires ON api_cache(expires_at)`,
  `CREATE INDEX IF NOT EXISTS idx_judges_name ON judges(name)`,
  `CREATE INDEX IF NOT EXISTS idx_opinions_judge_id ON opinions(judge_id)`,
  `ALTER TABLE opinions ADD COLUMN IF NOT EXISTS courtlistener_id VARCHAR(50)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_opinions_cl_id ON opinions(courtlistener_id) WHERE courtlistener_id IS NOT NULL`,

  // judge_stats: one row per judge per stat_key, refreshed by computeStats.js
  // stat_key examples: reversal_rate, opinions_per_year, years_on_bench,
  //   case_volume, criminal_pct, civil_pct, family_pct, administrative_pct
  `CREATE TABLE IF NOT EXISTS judge_stats (
    id SERIAL PRIMARY KEY,
    judge_id VARCHAR(50) NOT NULL,
    stat_key VARCHAR(100) NOT NULL,
    stat_value NUMERIC(12,4),
    computed_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(judge_id, stat_key)
  )`,

  // group_stats: pre-computed averages per group; group_type ∈ {national, state, court_type, party}
  // group_value: the specific value, e.g. "CA" for state, "federal_district" for court_type, "Democratic" for party
  `CREATE TABLE IF NOT EXISTS group_stats (
    id SERIAL PRIMARY KEY,
    group_type VARCHAR(50) NOT NULL,
    group_value VARCHAR(200) NOT NULL,
    stat_key VARCHAR(100) NOT NULL,
    stat_value NUMERIC(12,4),
    judge_count INTEGER DEFAULT 0,
    computed_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(group_type, group_value, stat_key)
  )`,

  `CREATE INDEX IF NOT EXISTS idx_judge_stats_judge_id ON judge_stats(judge_id)`,
  `CREATE INDEX IF NOT EXISTS idx_group_stats_lookup ON group_stats(group_type, group_value)`,

  `CREATE TABLE IF NOT EXISTS duel_plays (
    id SERIAL PRIMARY KEY,
    played_at TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    judge_id VARCHAR(50),
    query VARCHAR(255),
    route VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    ip_hash VARCHAR(32),
    country VARCHAR(100),
    region VARCHAR(100),
    device_type VARCHAR(50),
    browser VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id)`,
  `CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type)`,
  `CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at)`,

  `CREATE TABLE IF NOT EXISTS game_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    game_type VARCHAR(20) NOT NULL,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    rounds_completed INTEGER DEFAULT 0,
    final_score INTEGER,
    result_label VARCHAR(255),
    filters JSONB DEFAULT '{}'
  )`,

  `CREATE INDEX IF NOT EXISTS idx_game_sessions_session ON game_sessions(session_id)`,
  `CREATE INDEX IF NOT EXISTS idx_game_sessions_type ON game_sessions(game_type)`,

  `CREATE TABLE IF NOT EXISTS game_rounds (
    id SERIAL PRIMARY KEY,
    game_session_id INTEGER NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    stat_key VARCHAR(100),
    judge1_id VARCHAR(50),
    judge2_id VARCHAR(50),
    selected_judge_id VARCHAR(50),
    correct BOOLEAN,
    created_at TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE INDEX IF NOT EXISTS idx_game_rounds_session ON game_rounds(game_session_id)`,

  `CREATE TABLE IF NOT EXISTS quiz_email_submissions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL,
    matched_judge_id VARCHAR(50),
    result_label VARCHAR(255),
    match_explanation JSONB DEFAULT '[]',
    pdf_blob BYTEA,
    created_at TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE INDEX IF NOT EXISTS idx_quiz_email_session ON quiz_email_submissions(session_id)`,
  `CREATE INDEX IF NOT EXISTS idx_quiz_email_created ON quiz_email_submissions(created_at)`,

  `CREATE TABLE IF NOT EXISTS ad_placements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    dimensions VARCHAR(100),
    notes TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS ad_impressions (
    id BIGSERIAL PRIMARY KEY,
    placement_id INTEGER NOT NULL REFERENCES ad_placements(id) ON DELETE CASCADE,
    session_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE INDEX IF NOT EXISTS idx_ad_impressions_placement ON ad_impressions(placement_id)`,
  `CREATE INDEX IF NOT EXISTS idx_ad_impressions_created ON ad_impressions(created_at)`,

  `CREATE TABLE IF NOT EXISTS ad_inquiries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    email VARCHAR(254) NOT NULL,
    placement_interest VARCHAR(100),
    message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE INDEX IF NOT EXISTS idx_ad_inquiries_created ON ad_inquiries(created_at)`,

  `ALTER TABLE api_cache ADD COLUMN IF NOT EXISTS hit_count INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE api_cache ADD COLUMN IF NOT EXISTS last_accessed TIMESTAMP NOT NULL DEFAULT NOW()`,
  `CREATE INDEX IF NOT EXISTS idx_api_cache_eviction ON api_cache (hit_count ASC, last_accessed ASC)`,
];

const SEED_JUDGES = [
  { id: "local-scotus-thomas",   name: "Clarence Thomas",           court: "Supreme Court of the United States", state: "DC", service_start: 1991, party: "Republican",  gender: "M" },
  { id: "local-scotus-roberts",  name: "John G. Roberts Jr.",       court: "Supreme Court of the United States", state: "DC", service_start: 2005, party: "Republican",  gender: "M" },
  { id: "local-scotus-alito",    name: "Samuel A. Alito Jr.",       court: "Supreme Court of the United States", state: "DC", service_start: 2006, party: "Republican",  gender: "M" },
  { id: "local-scotus-soto",     name: "Sonia Sotomayor",           court: "Supreme Court of the United States", state: "DC", service_start: 2009, party: "Democratic",  gender: "F" },
  { id: "local-scotus-kagan",    name: "Elena Kagan",               court: "Supreme Court of the United States", state: "DC", service_start: 2010, party: "Democratic",  gender: "F" },
  { id: "local-scotus-gorsuch",  name: "Neil Gorsuch",              court: "Supreme Court of the United States", state: "DC", service_start: 2017, party: "Republican",  gender: "M" },
  { id: "local-scotus-kav",      name: "Brett Kavanaugh",           court: "Supreme Court of the United States", state: "DC", service_start: 2018, party: "Republican",  gender: "M" },
  { id: "local-scotus-barrett",  name: "Amy Coney Barrett",         court: "Supreme Court of the United States", state: "DC", service_start: 2020, party: "Republican",  gender: "F" },
  { id: "local-scotus-jackson",  name: "Ketanji Brown Jackson",     court: "Supreme Court of the United States", state: "DC", service_start: 2022, party: "Democratic",  gender: "F" },
  { id: "local-5th-jones",       name: "Edith Jones",               court: "U.S. Court of Appeals, 5th Cir.",   state: "TX", service_start: 1985, party: "Republican",  gender: "F" },
  { id: "local-dc-henderson",    name: "Karen LeCraft Henderson",   court: "U.S. Court of Appeals, D.C. Cir.",  state: "DC", service_start: 1990, party: "Republican",  gender: "F" },
  { id: "local-2nd-calabresi",   name: "Guido Calabresi",           court: "U.S. Court of Appeals, 2nd Cir.",   state: "CT", service_start: 1994, party: "Democratic",  gender: "M" },
  { id: "local-7th-wood",        name: "Diane Wood",                court: "U.S. Court of Appeals, 7th Cir.",   state: "IL", service_start: 1995, party: "Democratic",  gender: "F" },
  { id: "local-9th-graber",      name: "Susan Graber",              court: "U.S. Court of Appeals, 9th Cir.",   state: "OR", service_start: 1998, party: "Democratic",  gender: "F" },
  { id: "local-4th-wilkinson",   name: "J. Harvie Wilkinson III",   court: "U.S. Court of Appeals, 4th Cir.",   state: "VA", service_start: 1984, party: "Republican",  gender: "M" },
];

async function runSeed(client) {
  let seeded = 0;
  for (const j of SEED_JUDGES) {
    const result = await client.query(
      `INSERT INTO judges (courtlistener_id, name, court, state, gender, party_of_appointment, service_start, last_synced)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (courtlistener_id) DO NOTHING`,
      [j.id, j.name, j.court, j.state, j.gender, j.party, j.service_start]
    );
    if (result.rowCount > 0) seeded++;
  }
  if (seeded > 0) console.log(`[MIGRATE] Seeded ${seeded} initial judges.`);
}

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.warn("[MIGRATE] DATABASE_URL not set — skipping migrations.");
    process.exit(0);
  }
  console.log("[MIGRATE] Starting database migrations...");
  const client = await pool.connect();
  try {
    for (const sql of migrations) {
      await client.query(sql);
      const label = sql.slice(0, 60).replace(/\n/g, " ").trim();
      console.log(`[MIGRATE] OK: ${label}...`);
    }
    console.log("[MIGRATE] All migrations complete.");
    await runSeed(client);
  } catch (err) {
    console.error("[MIGRATE] Migration failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
