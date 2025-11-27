import React from "react";

const OpinionCard = ({ opinion }) => {
  return (
    <article className="opinion-card">
      <h4 className="opinion-title">{opinion.caseName}</h4>
      <div className="opinion-meta">
        {opinion.courtName} · {opinion.dateFiled} · {opinion.opinionType}
      </div>
      {opinion.citation && (
        <div className="opinion-meta">Citation: {opinion.citation}</div>
      )}
      <p className="opinion-snippet">{opinion.summary}</p>
    </article>
  );
};

export default OpinionCard;
