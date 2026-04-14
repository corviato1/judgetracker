import React, { useState } from "react";
import { getSessionId } from "../analytics/tracker";

const QuizResult = ({ result, onRestart }) => {
  const [emailFormOpen, setEmailFormOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  if (!result || !result.topMatch) return null;

  const { topMatch, breakdown, isTie } = result;
  const realJudge = topMatch.judge.realJudge || {};

  function buildResultData() {
    const matchExplanation = breakdown
      .filter((b) => b.score > 0)
      .slice(0, 3)
      .map((b) => `Your answers aligned with ${b.judge.fullName} (score: ${b.score})`);

    return {
      judgeId: String(topMatch.judge.id),
      judgeFullName: realJudge.name || topMatch.judge.fullName,
      courtName: realJudge.court || topMatch.judge.courtName || "",
      jurisdiction: topMatch.judge.jurisdiction || "",
      matchScore: topMatch.score,
      resultLabel: `Most like ${realJudge.name || topMatch.judge.fullName}`,
      matchExplanation,
      keyStats: {
        Court: realJudge.court || topMatch.judge.courtName || "—",
        "Judicial Philosophy": topMatch.judge.fullName,
        "Appointing President": realJudge.appointer || topMatch.judge.appointer || "—",
        Party: topMatch.judge.partyOfAppointment || "—",
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
          You are most like
        </p>
        <h2
          style={{
            fontSize: "2rem",
            fontWeight: "800",
            lineHeight: 1.15,
            margin: "0 0 0.5rem 0",
            background: "linear-gradient(90deg, #a78bfa, #818cf8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {realJudge.name || topMatch.judge.fullName}
        </h2>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center", marginBottom: "0.75rem" }}>
          <span
            style={{
              fontSize: "0.78rem",
              fontWeight: "600",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              padding: "0.2rem 0.65rem",
              borderRadius: "999px",
              background: "rgba(167,139,250,0.18)",
              border: "1px solid rgba(167,139,250,0.35)",
              color: "#c4b5fd",
            }}
          >
            Judicial philosophy: {topMatch.judge.fullName}
          </span>
          {realJudge.court && (
            <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
              {realJudge.court}
            </span>
          )}
        </div>

        {realJudge.appointer && (
          <p style={{ fontSize: "0.82rem", color: "#718096", marginBottom: "0.75rem" }}>
            {realJudge.appointer}
          </p>
        )}

        {realJudge.note && (
          <p style={{ fontSize: "0.92rem", color: "#cbd5e0", lineHeight: 1.6, margin: 0 }}>
            {realJudge.note}
          </p>
        )}
      </div>

      {isTie && (
        <p className="card-description" style={{ color: "#ffddaa", marginBottom: "0.75rem" }}>
          It is a close call — at least two philosophy types scored the same
          for your answers. The match shown is the first in configured order.
        </p>
      )}

      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.07)",
          paddingTop: "1rem",
          marginBottom: "1rem",
        }}
      >
        <p
          style={{
            fontSize: "0.75rem",
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: "#718096",
            marginBottom: "0.4rem",
          }}
        >
          About this philosophy
        </p>
        <p className="card-description" style={{ color: "#a0aec0", fontStyle: "italic" }}>
          {topMatch.judge.description}
        </p>
      </div>

      <p className="card-description" style={{ color: "#718096", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
        Based on your answers, your judicial instincts align with this philosophy.
        These patterns are drawn from real judicial reasoning styles — use the quiz
        as a starting point to explore what kinds of cases and outcomes matter to you.
      </p>

      <h4
        style={{
          marginBottom: "0.5rem",
          fontSize: "0.95rem",
        }}
      >
        Score breakdown
      </h4>
      <div className="quiz-breakdown">
        {breakdown.map(({ judge, score }) => (
          <div key={judge.id} className="quiz-breakdown-row">
            <div className="quiz-breakdown-name">
              {judge.realJudge?.name
                ? <><strong>{judge.realJudge.name}</strong> <span style={{ color: "#718096", fontSize: "0.82rem" }}>({judge.fullName})</span></>
                : judge.fullName}
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
