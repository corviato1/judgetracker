import React from "react";
import JudgeCard from "./JudgeCard";

const JudgeList = ({ judges, onSelectJudge }) => {
  if (!judges || judges.length === 0) {
    return (
      <p style={{ marginTop: "1.25rem", fontSize: "0.9rem" }}>
        No matching judges found in sample data. Try a shorter name, for
        example, “Smith”.
      </p>
    );
  }

  return (
    <div className="judge-list">
      {judges.map((judge) => (
        <JudgeCard
          key={judge.id}
          judge={judge}
          onSelectJudge={() => onSelectJudge(judge)}
        />
      ))}
    </div>
  );
};

export default JudgeList;
