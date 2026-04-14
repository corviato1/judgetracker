const pool = require("./db");

const MEM_MAX_SIZE = 200;
const MEM_TTL_MS = 5 * 60 * 1000;
const DB_CAP_BYTES = 200 * 1024 * 1024;

const memCache = new Map();
let memHits = 0;
let memMisses = 0;
const pendingRequests = new Map();
let evictionRunning = false;

function memGet(key) {
  const entry = memCache.get(key);
  if (!entry) {
    memMisses++;
    return null;
  }
  if (Date.now() > entry.expiresAt) {
    memCache.delete(key);
    memMisses++;
    return null;
  }
  memCache.delete(key);
  memCache.set(key, entry);
  memHits++;
  return entry.value;
}

function memSet(key, value) {
  if (memCache.has(key)) memCache.delete(key);
  if (memCache.size >= MEM_MAX_SIZE) {
    memCache.delete(memCache.keys().next().value);
  }
  memCache.set(key, { value, expiresAt: Date.now() + MEM_TTL_MS });
}

function getMemStats() {
  return {
    size: memCache.size,
    maxSize: MEM_MAX_SIZE,
    ttlMinutes: MEM_TTL_MS / 60000,
    hits: memHits,
    misses: memMisses,
    hitRate: memHits + memMisses > 0
      ? Number((memHits / (memHits + memMisses)).toFixed(4))
      : 0,
    dbCapBytes: DB_CAP_BYTES,
  };
}

async function enforceDbCap() {
  if (evictionRunning) return;
  evictionRunning = true;
  try {
    const sizeRes = await pool.query(
      "SELECT COALESCE(SUM(length(value)), 0) AS total_bytes FROM api_cache WHERE expires_at > NOW()"
    );
    let totalBytes = parseInt(sizeRes.rows[0].total_bytes) || 0;
    if (totalBytes <= DB_CAP_BYTES) return;

    console.log(`[CACHE] DB size ${(totalBytes / 1024 / 1024).toFixed(1)} MB exceeds 200 MB cap — evicting LFU rows`);
    while (totalBytes > DB_CAP_BYTES) {
      const deleted = await pool.query(`
        DELETE FROM api_cache
        WHERE key IN (
          SELECT key FROM api_cache
          WHERE expires_at > NOW()
          ORDER BY hit_count ASC, last_accessed ASC
          LIMIT 50
        )
        RETURNING length(value) AS bytes
      `);
      if (deleted.rowCount === 0) break;
      const freed = deleted.rows.reduce((sum, r) => sum + (parseInt(r.bytes) || 0), 0);
      totalBytes -= freed;
    }
    console.log(`[CACHE] Eviction complete — DB now ~${(totalBytes / 1024 / 1024).toFixed(1)} MB`);
  } catch (err) {
    console.error("[CACHE] enforceDbCap error:", err.message);
  } finally {
    evictionRunning = false;
  }
}

async function getCached(key) {
  const mem = memGet(key);
  if (mem !== null) return mem;

  try {
    const result = await pool.query(
      "SELECT value FROM api_cache WHERE key = $1 AND expires_at > NOW()",
      [key]
    );
    if (result.rows.length > 0) {
      const value = JSON.parse(result.rows[0].value);
      memSet(key, value);
      pool.query(
        "UPDATE api_cache SET hit_count = hit_count + 1, last_accessed = NOW() WHERE key = $1",
        [key]
      ).catch((err) => console.error("[CACHE] hit_count update error:", err.message));
      return value;
    }
  } catch (err) {
    console.error("[CACHE] Read error:", err.message);
  }
  return null;
}

async function setCache(key, value, ttlHours = 24) {
  memSet(key, value);
  try {
    const serialized = JSON.stringify(value);
    await pool.query(
      `INSERT INTO api_cache (key, value, expires_at, hit_count, last_accessed)
       VALUES ($1, $2, NOW() + ($3 || ' hours')::interval, 0, NOW())
       ON CONFLICT (key) DO UPDATE
         SET value = EXCLUDED.value,
             expires_at = EXCLUDED.expires_at,
             last_accessed = NOW()`,
      [key, serialized, String(ttlHours)]
    );
    enforceDbCap().catch((err) => console.error("[CACHE] Post-write eviction error:", err.message));
  } catch (err) {
    console.error("[CACHE] Write error:", err.message);
  }
}

function startCacheCleanup() {
  const run = async () => {
    try {
      const expired = await pool.query("DELETE FROM api_cache WHERE expires_at < NOW()");
      if (expired.rowCount > 0) {
        console.log(`[CACHE] Deleted ${expired.rowCount} expired cache rows`);
      }
      await enforceDbCap();

      const oldEvents = await pool.query(
        "DELETE FROM events WHERE created_at < NOW() - INTERVAL '90 days'"
      );
      if (oldEvents.rowCount > 0) {
        console.log(`[RETENTION] Deleted ${oldEvents.rowCount} events older than 90 days`);
      }

      const oldImpressions = await pool.query(
        "DELETE FROM ad_impressions WHERE created_at < NOW() - INTERVAL '90 days'"
      );
      if (oldImpressions.rowCount > 0) {
        console.log(`[RETENTION] Deleted ${oldImpressions.rowCount} ad_impressions older than 90 days`);
      }
    } catch (err) {
      console.error("[CACHE] Scheduled cleanup error:", err.message);
    }
  };

  setInterval(run, 10 * 60 * 1000);
  console.log("[CACHE] Scheduled cleanup started (every 10 min, 200 MB cap, 90-day retention)");
}

async function withCoalescing(key, fetchFn) {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }
  const promise = fetchFn().finally(() => pendingRequests.delete(key));
  pendingRequests.set(key, promise);
  return promise;
}

const TTL = {
  searchHours: 24,
  judgeHours: 24 * 7,
  opinionsHours: 24 * 7,
  memMinutes: MEM_TTL_MS / 60000,
};

module.exports = { getCached, setCache, withCoalescing, getMemStats, startCacheCleanup, TTL };
