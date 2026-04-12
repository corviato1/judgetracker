require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { globalLimiter } = require("./middleware/rateLimiter");
const judgesRouter = require("./routes/judges");

const PORT = process.env.BACKEND_PORT || 3001;
const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5000",
  `http://localhost:5000`,
  `http://0.0.0.0:5000`,
];

if (process.env.REPLIT_DEV_DOMAIN) {
  allowedOrigins.push(`https://${process.env.REPLIT_DEV_DOMAIN}`);
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
      if (!origin || allowedOrigins.some((o) => origin.startsWith(o.replace(/\/$/, "")))) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' not allowed`));
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
