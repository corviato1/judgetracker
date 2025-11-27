import React from "react";

const AboutPage = () => {
  return (
    <div>
      <h2 className="section-heading">Vision and roadmap</h2>
      <p className="section-subheading">
        JudgeTracker.info aims to be the standard way to understand judicial
        behavior in the United States by combining public records, structured
        search, and transparent methodology.
      </p>

      <div className="card-grid">
        <article className="card">
          <h4 className="card-title">Phase 1 · Federal coverage</h4>
          <p className="card-description">
            Index federal judges and opinions using public court data and
            open-licensed sources. Deliver judge-centric profiles, timelines,
            and basic statistics.
          </p>
        </article>

        <article className="card">
          <h4 className="card-title">Phase 2 · State expansion</h4>
          <p className="card-description">
            Add state supreme and appellate courts, then expand to high-volume
            trial courts in key jurisdictions.
          </p>
        </article>

        <article className="card">
          <h4 className="card-title">Phase 3 · Advanced analytics</h4>
          <p className="card-description">
            Build filters by issue, party, attorney, and outcome, with
            confidence intervals and clear limitations for any statistical
            interpretation.
          </p>
        </article>
      </div>
    </div>
  );
};

export default AboutPage;
