import React from "react";

const QuizIntro = ({ onStart }) => {
  return (
    <section className="card" style={{ marginTop: "1rem" }}>
      <h3 className="card-title">How it works</h3>
      <p className="card-description">
        You will see 15 short case-style scenarios drawn from real patterns in
        judicial opinions and rulings history. For each one, pick the outcome
        that feels most fair or most legally correct to you. There are no right
        or wrong answers — only honest ones.
      </p>
      <p className="card-description" style={{ marginTop: "0.5rem" }}>
        Questions are grouped into four themes:
      </p>
      <ul style={{ fontSize: "0.85rem", color: "#dde1ff", lineHeight: "1.7", marginBottom: "0.5rem" }}>
        <li>Interpreting the law — statutory and constitutional methods</li>
        <li>Criminal justice — sentencing, bail, rights of the accused</li>
        <li>Government power — agencies, executive authority, standing</li>
        <li>Rights and society — speech, religion, equal protection</li>
      </ul>
      <p className="card-description" style={{ marginTop: "0.25rem" }}>
        At the end you will be matched to one of five judicial philosophy types
        — Civil Libertarian, Textualist, Pragmatist, Originalist, or
        Institutionalist — with a full score breakdown across all five.
      </p>
      <button
        className="hero-button-primary"
        style={{ marginTop: "0.85rem" }}
        onClick={onStart}
      >
        Start the quiz
      </button>
    </section>
  );
};

export default QuizIntro;
