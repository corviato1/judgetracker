const jwt = require("jsonwebtoken");

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "carl";
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || "admin-dev-secret-change-in-prod";
const SESSION_DURATION_HOURS = 8;
const COOKIE_NAME = "admin_session";

function signAdminToken() {
  return jwt.sign(
    { role: "admin", iat: Math.floor(Date.now() / 1000) },
    SESSION_SECRET,
    { expiresIn: `${SESSION_DURATION_HOURS}h` }
  );
}

function verifyAdminToken(token) {
  try {
    const payload = jwt.verify(token, SESSION_SECRET);
    return payload.role === "admin";
  } catch {
    return false;
  }
}

function requireAdmin(req, res, next) {
  const token = req.cookies && req.cookies[COOKIE_NAME];
  if (!token || !verifyAdminToken(token)) {
    return res.status(401).json({ error: "Unauthorized." });
  }
  next();
}

module.exports = { ADMIN_PASSWORD, COOKIE_NAME, signAdminToken, verifyAdminToken, requireAdmin };
