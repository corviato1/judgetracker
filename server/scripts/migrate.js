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
];

async function migrate() {
  console.log("[MIGRATE] Starting database migrations...");
  const client = await pool.connect();
  try {
    for (const sql of migrations) {
      await client.query(sql);
      const label = sql.slice(0, 60).replace(/\n/g, " ").trim();
      console.log(`[MIGRATE] OK: ${label}...`);
    }
    console.log("[MIGRATE] All migrations complete.");
  } catch (err) {
    console.error("[MIGRATE] Migration failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
