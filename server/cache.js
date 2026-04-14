const pool = require("./db");

const MEM_MAX_SIZE = 200;
const MEM_TTL_MS = 5 * 60 * 1000;

const memCache = new Map();
let memHits = 0;
let memMisses = 0;
const pendingRequests = new Map();

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
  };
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
      `INSERT INTO api_cache (key, value, expires_at)
       VALUES ($1, $2, NOW() + ($3 || ' hours')::interval)
       ON CONFLICT (key) DO UPDATE
         SET value = EXCLUDED.value, expires_at = EXCLUDED.expires_at`,
      [key, serialized, String(ttlHours)]
    );
  } catch (err) {
    console.error("[CACHE] Write error:", err.message);
  }
}

async function withCoalescing(key, fetchFn) {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }
  const promise = fetchFn().finally(() => pendingRequests.delete(key));
  pendingRequests.set(key, promise);
  return promise;
}

module.exports = { getCached, setCache, withCoalescing, getMemStats };
