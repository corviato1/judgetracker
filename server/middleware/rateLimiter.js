const rateLimit = require("express-rate-limit");

const logBlocked = (req, res) => {
  console.warn(
    `[RATE LIMIT] Blocked IP=${req.ip} method=${req.method} path=${req.path} at=${new Date().toISOString()}`
  );
};

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait and try again." },
  handler: (req, res, next, options) => {
    logBlocked(req, res);
    res.status(options.statusCode).json(options.message);
  },
});

const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many search requests. Please wait and try again." },
  handler: (req, res, next, options) => {
    logBlocked(req, res);
    res.status(options.statusCode).json(options.message);
  },
});

module.exports = { globalLimiter, searchLimiter };
