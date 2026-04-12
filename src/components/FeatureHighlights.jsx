import React from "react";
import featureHighlights from "../data/featureHighlights";

const FeatureHighlights = () => {
  return (
    <section>
      <h3 className="section-heading">What JudgeTracker does</h3>
      <p className="section-subheading">
        Find any federal judge, explore their rulings, and understand the
        patterns that matter to practitioners, journalists, and policy teams.
      </p>
      <div className="card-grid">
        {featureHighlights.map((feature) => (
          <article key={feature.id} className="card">
            <div className="small-label">{feature.category}</div>
            <h4 className="card-title">{feature.title}</h4>
            <p className="card-description">{feature.description}</p>
            {feature.targetUser && (
              <p
                className="card-description"
                style={{ marginTop: "0.4rem", opacity: 0.9 }}
              >
                <strong>Primary user:</strong> {feature.targetUser}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
};

export default FeatureHighlights;
