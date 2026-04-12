require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { globalLimiter } = require("./middleware/rateLimiter");
const judgesRouter = require("./routes/judges");

const PORT = process.env.BACKEND_PORT || 3001;
const app = express();

function buildAllowedOriginSet() {
  const origins = new Set();
  const add = (v) => v && origins.add(v.replace(/\/$/, "").toLowerCase());

  add("http://localhost:5000");
  add("http://127.0.0.1:5000");
  if (process.env.FRONTEND_URL) add(process.env.FRONTEND_URL);
  if (process.env.REPLIT_DEV_DOMAIN) add(`https://${process.env.REPLIT_DEV_DOMAIN}`);

  return origins;
}

const ALLOWED_ORIGINS = buildAllowedOriginSet();

function isOriginAllowed(origin) {
  if (!origin) return false;
  return ALLOWED_ORIGINS.has(origin.replace(/\/$/, "").toLowerCase());
}

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true },
    frameguard: { action: "deny" },
    noSniff: true,
    xssFilter: true,
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, false);
        return;
      }
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Rejected origin: ${origin}`);
        callback(null, false);
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: false, limit: "50kb" }));

app.use(globalLimiter);

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/judges", judgesRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found." });
});

app.use((err, req, res, next) => {
  console.error("[ERROR]", err.message);
  res.status(500).json({ error: "An internal server error occurred." });
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`[SERVER] JudgeTracker API running on http://127.0.0.1:${PORT}`);
});

module.exports = app;
