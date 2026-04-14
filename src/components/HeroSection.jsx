import React from "react";
import { useNavigate } from "react-router-dom";
import StatBar from "./StatBar";

const HeroSection = () => {
  const navigate = useNavigate();

  const scrollToDataCoverage = () => {
    const el = document.getElementById("data-coverage");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/#data-coverage");
    }
  };

  return (
    <section className="hero-container">
      <div>
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
            Search judges
          </button>
          <button
            className="hero-button-secondary"
            onClick={scrollToDataCoverage}
          >
            Data &amp; coverage
          </button>
        </div>
      </div>

      <StatBar />
    </section>
  );
};

export default HeroSection;
