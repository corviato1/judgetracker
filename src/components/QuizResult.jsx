import React from "react";

const QuizResult = ({ result, onRestart }) => {
  if (!result || !result.topMatch) return null;

  const { topMatch, breakdown, isTie } = result;

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
