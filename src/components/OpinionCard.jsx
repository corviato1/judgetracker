import React, { useState } from "react";

const OpinionCard = ({ opinion, expandedId, onExpand }) => {
  const isExpanded = expandedId === opinion.id;

  const clUrl = opinion.url ||
    (opinion.id ? `https://www.courtlistener.com/opinion/${opinion.id}/` : null);

  return (
    <article
      className={`opinion-card${isExpanded ? " opinion-card--expanded" : ""}`}
      onClick={() => onExpand(isExpanded ? null : opinion.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onExpand(isExpanded ? null : opinion.id); }}
      aria-expanded={isExpanded}
    >
      <div className="opinion-card-header">
        <div className="opinion-card-title-row">
          <h4 className="opinion-title">{opinion.caseName || "Untitled case"}</h4>
          <span className="opinion-chevron">{isExpanded ? "▲" : "▼"}</span>
        </div>
        <div className="opinion-meta">
          {[opinion.courtName, opinion.dateFiled, opinion.opinionType].filter(Boolean).join(" · ")}
        </div>
      </div>

      {isExpanded && (
        <div className="opinion-card-body" onClick={(e) => e.stopPropagation()}>
          {opinion.citation && (
            <p className="opinion-meta" style={{ marginTop: "0.5rem" }}>
              Citation: {opinion.citation}
            </p>
          )}
          {opinion.summary && (
            <p className="opinion-snippet" style={{ marginTop: "0.5rem" }}>
              {opinion.summary}
            </p>
          )}
          {clUrl && (
            <a
              href={clUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="opinion-cl-link"
            >
              View on CourtListener →
            </a>
          )}
        </div>
      )}
    </article>
  );
};

export default OpinionCard;
