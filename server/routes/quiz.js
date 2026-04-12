const express = require("express");
const router = express.Router();
const pool = require("../db");
const rateLimit = require("express-rate-limit");
const { generateQuizResultPdf } = require("../pdfService");
const { requireAdmin } = require("../middleware/adminAuth");

const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: "Too many email submissions from this IP. Please try again later." },
});

const downloadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: "Too many download requests." },
});

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post("/email-results", emailLimiter, async (req, res) => {
  try {
    const { email, sessionId, resultData } = req.body || {};

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: "A valid email address is required." });
    }
    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required." });
    }
    if (!resultData) {
      return res.status(400).json({ error: "resultData is required." });
    }

    const safeEmail = email.trim().toLowerCase().slice(0, 254);

    const pdfBuffer = await generateQuizResultPdf({
      judgeFullName: resultData.judgeFullName || "",
      courtName: resultData.courtName || "",
      jurisdiction: resultData.jurisdiction || "",
      matchScore: resultData.matchScore,
      resultLabel: resultData.resultLabel || "",
      matchExplanation: resultData.matchExplanation || [],
      keyStats: resultData.keyStats || {},
    });

    await pool.query(
      `INSERT INTO quiz_email_submissions
         (session_id, email, matched_judge_id, result_label, match_explanation, pdf_blob, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        sessionId,
        safeEmail,
        resultData.judgeId || null,
        resultData.resultLabel || null,
        JSON.stringify(resultData.matchExplanation || []),
        pdfBuffer,
      ]
    );

    res.json({ ok: true, message: "Your result has been saved. The admin will send it from their inbox." });
  } catch (err) {
    console.error("[QUIZ email-results]", err.message);
    res.status(500).json({ error: "Internal error saving your submission." });
  }
});

router.post("/download-pdf", downloadLimiter, async (req, res) => {
  try {
    const { resultData } = req.body || {};
    if (!resultData) {
      return res.status(400).json({ error: "resultData is required." });
    }

    const pdfBuffer = await generateQuizResultPdf({
      judgeFullName: resultData.judgeFullName || "",
      courtName: resultData.courtName || "",
      jurisdiction: resultData.jurisdiction || "",
      matchScore: resultData.matchScore,
      resultLabel: resultData.resultLabel || "",
      matchExplanation: resultData.matchExplanation || [],
      keyStats: resultData.keyStats || {},
    });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="quiz-result.pdf"`,
      "Content-Length": pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error("[QUIZ download-pdf]", err.message);
    res.status(500).json({ error: "Internal error generating PDF." });
  }
});

module.exports = router;
