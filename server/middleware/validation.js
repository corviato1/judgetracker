const DANGEROUS_CHARS = /[<>;$'"\\]/g;
const MAX_QUERY_LENGTH = 80;
const MAX_ID_LENGTH = 20;

function sanitizeQuery(raw) {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim().replace(DANGEROUS_CHARS, "").slice(0, MAX_QUERY_LENGTH);
  return trimmed || null;
}

function sanitizeId(raw) {
  if (!raw || typeof raw !== "string") return null;
  const cleaned = raw.trim().replace(/[^a-zA-Z0-9\-_]/g, "").slice(0, MAX_ID_LENGTH);
  return cleaned || null;
}

function validateSearchQuery(req, res, next) {
  const q = sanitizeQuery(req.query.q);
  if (!q) {
    return res.status(400).json({ error: "Query parameter 'q' is required and must not be empty." });
  }
  req.cleanQuery = q;
  next();
}

function validateJudgeId(req, res, next) {
  const id = sanitizeId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid judge ID." });
  }
  req.cleanId = id;
  next();
}

module.exports = { sanitizeQuery, sanitizeId, validateSearchQuery, validateJudgeId };
