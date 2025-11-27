import React from "react";
import { useNavigate } from "react-router-dom";
import StatBar from "./StatBar";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="hero-container">
      <div>
        <p className="small-label">Pitch Demo</p>
        <h2 className="hero-heading">
          A search engine for judges, rulings, and case histories.
        </h2>
        <p className="hero-subheading">
          JudgeTracker.info indexes public judicial records so lawyers, policy
          teams, journalists, and citizens can quickly see how judges actually
          rule: by issue, by party, and over time.
        </p>

        <div className="hero-pill-row">
          <span className="hero-pill">Judge-centric case history</span>
          <span className="hero-pill">Trends and statistics</span>
          <span className="hero-pill">Built on public court data</span>
        </div>

        <div className="hero-actions">
          <button
            className="hero-button-primary"
            onClick={() => navigate("/search")}
          >
            Try the judge search demo
          </button>
          <button
            className="hero-button-secondary"
            onClick={() => navigate("/data-sources")}
          >
            View data and coverage plan
          </button>
        </div>
      </div>

      <StatBar />
    </section>
  );
};

export default HeroSection;
