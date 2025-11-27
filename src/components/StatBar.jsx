import React from "react";
import statsHighlights from "../data/statsHighlights";

const StatBar = () => {
  return (
    <div className="hero-stat-bar">
      {statsHighlights.map((stat) => (
        <div key={stat.id}>
          <div style={{ fontSize: "1.2rem", fontWeight: 600 }}>
            {stat.value}
          </div>
          <div style={{ fontSize: "0.75rem" }}>{stat.label}</div>
        </div>
      ))}
    </div>
  );
};

export default StatBar;
