import React, { useState } from "react";
import { Link } from "react-router-dom";
import { getSessionId } from "../analytics/tracker";
import judgeList from "../data/JudgeGameJudgeList";

const QuizResult = ({ result, onRestart }) => {
  const [emailFormOpen, setEmailFormOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [showAllJudges, setShowAllJudges] = useState(false);

  if (!result || !result.winningPhilosophy) return null;

  const { winningPhilosophy, matchedJudges, breakdown, isTie } = result;

  const activeJudges = matchedJudges.filter((j) => j.active);
  const retiredJudges = matchedJudges.filter((j) => !j.active);

  const INITIAL_RETIRED_COUNT = 4;
  const visibleRetired = showAllJudges ? retiredJudges : retiredJudges.slice(0, INITIAL_RETIRED_COUNT);

  function buildResultData() {
    const matchExplanation = breakdown
      .filter((b) => b.score > 0)
      .slice(0, 3)
      .map((b) => `Your answers aligned with ${b.philosophy.label} (score: ${b.score})`);

    const topJudge = matchedJudges[0] || {};

    return {
      judgeId: String(winningPhilosophy.id),
      judgeFullName: winningPhilosophy.label,
      courtName: "U.S. Supreme Court",
      jurisdiction: "Federal supreme court",
      matchScore: result.winningScore || 0,
      resultLabel: `Judicial philosophy: ${winningPhilosophy.label}`,
      matchExplanation,
      keyStats: {
        "Judicial Philosophy": winningPhilosophy.label,
        "Matching Justices": String(matchedJudges.length),
        "Active Matches": String(activeJudges.length),
      },
    };
  }

  const handleDownload = async () => {
    setDownloadLoading(true);
    try {
      const res = await fetch("/api/quiz/download-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultData: buildResultData() }),
      });
      if (!res.ok) {
        alert("Could not generate PDF. Please try again.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "my-judge-match.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Download failed. Please try again.");
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setEmailLoading(true);
    setEmailStatus(null);
    try {
      const res = await fetch("/api/quiz/email-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          sessionId: getSessionId(),
          resultData: buildResultData(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setEmailStatus({ ok: true, message: data.message || "Your results have been submitted successfully." });
        setEmail("");
      } else {
        setEmailStatus({ ok: false, message: data.error || "Submission failed. Please try again." });
      }
    } catch {
      setEmailStatus({ ok: false, message: "Network error. Please try again." });
    } finally {
      setEmailLoading(false);
    }
  };

  const partyColor = (party) => {
    const p = (party || "").toLowerCase();
    if (p.includes("democrat")) return { bg: "rgba(74,144,217,0.15)", border: "rgba(74,144,217,0.35)", text: "#90c4f8" };
    if (p.includes("republican")) return { bg: "rgba(217,83,74,0.15)", border: "rgba(217,83,74,0.35)", text: "#f8a090" };
    return { bg: "rgba(160,174,192,0.15)", border: "rgba(160,174,192,0.3)", text: "#a0aec0" };
  };

  const JudgeRow = ({ judge }) => {
    const pc = partyColor(judge.partyOfAppointment);
    const years = judge.serviceEnd
      ? `${judge.serviceStart}–${judge.serviceEnd}`
      : `${judge.serviceStart}–present`;

    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.6rem 0.75rem",
        borderRadius: "8px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        gap: "0.75rem",
        flexWrap: "wrap",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "#e2e8f0" }}>
              {judge.fullName}
            </span>
            {judge.active && (
              <span style={{
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "0.1rem 0.45rem",
                borderRadius: "999px",
                background: "rgba(72,187,120,0.15)",
                border: "1px solid rgba(72,187,120,0.3)",
                color: "#68d391",
              }}>
                Active
              </span>
            )}
          </div>
          <div style={{ fontSize: "0.78rem", color: "#718096", marginTop: "0.2rem" }}>
            {years} · {judge.appointer}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
          <span style={{
            fontSize: "0.7rem",
            fontWeight: 600,
            padding: "0.15rem 0.5rem",
            borderRadius: "999px",
            background: pc.bg,
            border: `1px solid ${pc.border}`,
            color: pc.text,
            whiteSpace: "nowrap",
          }}>
            {judge.partyOfAppointment}
          </span>
          {judge.clId && (
            <Link
              to={`/judge/${judge.clId}`}
              style={{
                fontSize: "0.78rem",
                color: "#818cf8",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              View profile →
            </Link>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="card" style={{ marginTop: "1rem" }}>
      <p className="small-label" style={{ marginBottom: "0.5rem" }}>
        Your judicial philosophy match
      </p>

      <div
        style={{
          background: "linear-gradient(135deg, rgba(102,126,234,0.15) 0%, rgba(118,75,162,0.15) 100%)",
          border: "1px solid rgba(102,126,234,0.3)",
          borderRadius: "12px",
          padding: "1.5rem 1.75rem",
          marginBottom: "1.25rem",
        }}
      >
        <p style={{ fontSize: "0.8rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#a0aec0", marginBottom: "0.4rem" }}>
          Your judicial philosophy
        </p>
        <h2
          style={{
            fontSize: "2rem",
            fontWeight: "800",
            lineHeight: 1.15,
            margin: "0 0 0.75rem 0",
            background: "linear-gradient(90deg, #a78bfa, #818cf8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {winningPhilosophy.label}
        </h2>

        <p style={{ fontSize: "0.92rem", color: "#cbd5e0", lineHeight: 1.6, margin: 0 }}>
          {winningPhilosophy.description}
        </p>
      </div>

      {isTie && (
        <p className="card-description" style={{ color: "#ffddaa", marginBottom: "0.75rem" }}>
          It is a close call — at least two philosophy types scored the same for your answers. The match shown is the first in configured order.
        </p>
      )}

      <p className="card-description" style={{ color: "#718096", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
        Based on your answers, your judicial instincts align with this philosophy. These patterns are drawn from real judicial reasoning styles — use the quiz as a starting point to explore what kinds of cases and outcomes matter to you.
      </p>

      {matchedJudges.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <h4 style={{ marginBottom: "0.75rem", fontSize: "0.95rem" }}>
            Supreme Court justices who share this philosophy
            <span style={{ fontSize: "0.78rem", fontWeight: 400, color: "#718096", marginLeft: "0.5rem" }}>
              ({matchedJudges.length} total)
            </span>
          </h4>

          {activeJudges.length > 0 && (
            <div style={{ marginBottom: "0.75rem" }}>
              <p style={{ fontSize: "0.72rem", letterSpacing: "0.07em", textTransform: "uppercase", color: "#718096", marginBottom: "0.4rem" }}>
                Currently serving
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {activeJudges.map((j) => <JudgeRow key={j.id} judge={j} />)}
              </div>
            </div>
          )}

          {retiredJudges.length > 0 && (
            <div>
              <p style={{ fontSize: "0.72rem", letterSpacing: "0.07em", textTransform: "uppercase", color: "#718096", marginBottom: "0.4rem" }}>
                Notable predecessors
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {visibleRetired.map((j) => <JudgeRow key={j.id} judge={j} />)}
              </div>
              {retiredJudges.length > INITIAL_RETIRED_COUNT && (
                <button
                  onClick={() => setShowAllJudges((v) => !v)}
                  style={{
                    marginTop: "0.6rem",
                    background: "none",
                    border: "none",
                    color: "#818cf8",
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    padding: "0.2rem 0",
                  }}
                >
                  {showAllJudges
                    ? "Show fewer"
                    : `Show ${retiredJudges.length - INITIAL_RETIRED_COUNT} more →`}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <h4 style={{ marginBottom: "0.5rem", fontSize: "0.95rem" }}>
        Score breakdown
      </h4>
      <div className="quiz-breakdown">
        {breakdown.map(({ philosophy, score }) => (
          <div key={philosophy.id} className="quiz-breakdown-row">
            <div className="quiz-breakdown-name">
              <strong>{philosophy.label}</strong>
              <span style={{ color: "#718096", fontSize: "0.8rem", marginLeft: "0.4rem" }}>
                ({judgeList.filter((j) => j.philosophyId === philosophy.id).length} justices)
              </span>
            </div>
            <div className="quiz-breakdown-score">{score}</div>
          </div>
        ))}
      </div>

      <div className="quiz-result-actions" style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <button
          className="hero-button"
          onClick={handleDownload}
          disabled={downloadLoading}
          style={{ minWidth: "200px" }}
        >
          {downloadLoading ? "Generating PDF…" : "Download my results (PDF)"}
        </button>

        {!emailFormOpen && !emailStatus?.ok && (
          <button
            className="hero-button-secondary"
            onClick={() => setEmailFormOpen(true)}
            style={{ minWidth: "180px" }}
          >
            Email my results
          </button>
        )}
      </div>

      {emailFormOpen && !emailStatus?.ok && (
        <form
          onSubmit={handleEmailSubmit}
          className="quiz-email-form"
          style={{
            marginTop: "1rem",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            padding: "1rem",
          }}
        >
          <p style={{ fontSize: "0.85rem", marginBottom: "0.6rem", color: "#a0aec0" }}>
            Enter your email to receive your results as a PDF attachment.
          </p>
          <p style={{ fontSize: "0.78rem", marginBottom: "0.75rem", color: "#718096" }}>
            Your email will only be used to send your results.
          </p>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <input
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                flex: 1,
                minWidth: "200px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#e2e8f0",
                borderRadius: "5px",
                padding: "0.45rem 0.75rem",
                fontSize: "0.9rem",
              }}
            />
            <button
              className="hero-button"
              type="submit"
              disabled={emailLoading}
              style={{ whiteSpace: "nowrap" }}
            >
              {emailLoading ? "Submitting…" : "Submit"}
            </button>
            <button
              type="button"
              className="hero-button-secondary"
              onClick={() => { setEmailFormOpen(false); setEmailStatus(null); }}
            >
              Cancel
            </button>
          </div>
          {emailStatus && !emailStatus.ok && (
            <p style={{ color: "#fc8181", fontSize: "0.85rem", marginTop: "0.5rem" }}>
              {emailStatus.message}
            </p>
          )}
        </form>
      )}

      {emailStatus?.ok && (
        <p style={{
          marginTop: "0.75rem",
          padding: "0.6rem 0.9rem",
          background: "rgba(56, 161, 105, 0.15)",
          border: "1px solid rgba(56, 161, 105, 0.3)",
          borderRadius: "6px",
          color: "#68d391",
          fontSize: "0.85rem",
        }}>
          {emailStatus.message}
        </p>
      )}

      <button
        className="hero-button-secondary"
        style={{ marginTop: "1rem" }}
        onClick={onRestart}
      >
        Play again
      </button>
    </section>
  );
};

export default QuizResult;
