import React from "react";

const QuizIntro = ({ onStart }) => {
  return (
    <section className="card" style={{ marginTop: "1rem" }}>
      <h3 className="card-title">How the game works</h3>
      <p className="card-description">
        You will see short, simplified case-style scenarios. For each one,
        pick the outcome that feels most fair to you. Behind the scenes, the
        quiz maps your choices to tendencies associated with real federal judges.
      </p>
      <p className="card-description" style={{ marginTop: "0.5rem" }}>
        At the end, you will get:
      </p>
      <ul style={{ fontSize: "0.85rem", color: "#dde1ff" }}>
        <li>Your closest matching judge</li>
        <li>A quick explanation of why your answers align with them</li>
        <li>A score breakdown across all judges</li>
      </ul>
      <button
        className="hero-button-primary"
        style={{ marginTop: "0.75rem" }}
        onClick={onStart}
      >
        Start the quiz
      </button>
    </section>
  );
};

export default QuizIntro;
