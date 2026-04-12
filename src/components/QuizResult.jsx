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

  function buildResultData() {
    const matchExplanation = breakdown
      .filter((b) => b.score > 0)
      .slice(0, 3)
      .map((b) => `Your answers aligned with ${b.judge.fullName} (score: ${b.score})`);

    return {
      judgeId: String(topMatch.judge.id),
      judgeFullName: topMatch.judge.fullName,
      courtName: topMatch.judge.courtName || "",
      jurisdiction: topMatch.judge.jurisdiction || "",
      matchScore: topMatch.score,
      resultLabel: `Most like ${topMatch.judge.fullName}`,
      matchExplanation,
      keyStats: {
        Court: topMatch.judge.courtName || "—",
        Jurisdiction: topMatch.judge.jurisdiction || "—",
        "Appointing President": topMatch.judge.appointer || "—",
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
        setEmailStatus({ ok: true, message: data.message || "Saved! The admin will send your results from their inbox." });
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
      <p className="small-label">Your match</p>
      <h3 className="card-title">
        You are most like: {topMatch.judge.fullName}
      </h3>
      <p className="card-description">
        Court: {topMatch.judge.courtName} · {topMatch.judge.jurisdiction}
      </p>

      {isTie && (
        <p
          className="card-description"
          style={{ marginTop: "0.5rem", color: "#ffddaa" }}
        >
          It is a close call. At least two judges scored the same for your
          answers. The tie-breaker here is minimal and just based on
          ordering in this demo dataset.
        </p>
      )}

      <p className="card-description" style={{ marginTop: "0.75rem" }}>
        Based on your quiz choices, you lean toward outcomes that align with{" "}
        <strong>{topMatch.judge.fullName}</strong> in this prototype
        dataset. In the full product, this kind of mapping could help users
        understand how their own instincts compare to real-world judicial
        patterns.
      </p>

      <h4
        style={{
          marginTop: "1.25rem",
          marginBottom: "0.5rem",
          fontSize: "0.95rem",
        }}
      >
        Score breakdown (demo judges)
      </h4>
      <div className="quiz-breakdown">
        {breakdown.map(({ judge, score }) => (
          <div key={judge.id} className="quiz-breakdown-row">
            <div className="quiz-breakdown-name">{judge.fullName}</div>
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
            Enter your email and the admin will send your results from their inbox.
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
