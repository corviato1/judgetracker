import React from "react";
import OpinionCard from "./OpinionCard";

const OpinionList = ({ opinions }) => {
  if (!opinions || opinions.length === 0) {
    return (
      <p style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
        No opinions found in sample data for this judge.
      </p>
    );
  }

  return (
    <section style={{ marginTop: "1.5rem" }}>
      <p className="small-label">Sample opinions</p>
      <h3 className="section-heading">Recent opinions (demo data)</h3>
      <div className="opinion-list">
        {opinions.map((opinion) => (
          <OpinionCard key={opinion.id} opinion={opinion} />
        ))}
      </div>
    </section>
  );
};

export default OpinionList;
