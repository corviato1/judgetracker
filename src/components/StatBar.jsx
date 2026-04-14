import React, { useState, useEffect } from "react";
import statsHighlights from "../data/statsHighlights";

const StatBar = () => {
  const [judgeCount, setJudgeCount] = useState(null);

  useEffect(() => {
    fetch("/api/judges")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data && Array.isArray(data.judges)) {
          setJudgeCount(data.judges.length);
        }
      })
      .catch(() => {});
  }, []);

  const stats = statsHighlights.map((stat) => {
    if (stat.id === "s1") {
      return {
        ...stat,
        value: judgeCount !== null ? judgeCount.toLocaleString() : stat.value,
        label: judgeCount !== null ? "judges indexed in our database" : stat.label,
      };
    }
    return stat;
  });

  return (
    <div className="hero-stat-bar">
      {stats.map((stat) => (
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
