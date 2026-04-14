import React from "react";
import { useNavigate } from "react-router-dom";

const JudgeCard = ({ judge, onSelectJudge }) => {
  const navigate = useNavigate();

  const handleViewProfile = () => {
    if (onSelectJudge) onSelectJudge(judge);
    navigate(`/judge/${judge.id}`);
  };

  return (
    <article className="judge-card">
      <div className="judge-card-main">
        <h4 className="judge-card-name">{judge.fullName}</h4>
        <p className="judge-card-meta">
          {judge.courtName} · {judge.jurisdiction}
        </p>
        {judge.appointer && (
          <p className="judge-card-meta">
            Appointed by {judge.appointer} · {judge.partyOfAppointment}
          </p>
        )}
      </div>
      <button className="judge-card-button" onClick={handleViewProfile}>
        View profile
      </button>
    </article>
  );
};

export default JudgeCard;
