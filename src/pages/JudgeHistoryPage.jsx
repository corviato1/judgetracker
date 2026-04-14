import React, { useState } from "react";
import JudgeSearchForm from "../components/JudgeSearchForm";
import { getJudgeHistory } from "../API/api";

function HistoryEntry({ entry, showSnippet }) {
  return (
    <div className="history-entry">
      <div className="history-entry-header">
        <span className="history-case-name">{entry.caseName || "Untitled case"}</span>
        {entry.dateFiled && (
          <span className="history-date">{entry.dateFiled.slice(0, 10)}</span>
        )}
      </div>
      {entry.court && (
        <p className="history-court">{entry.court}</p>
      )}
      {showSnippet && entry.snippet && (
        <p className="history-snippet">{entry.snippet}</p>
      )}
      {entry.citation && (
        <p className="history-citation">{entry.citation}</p>
      )}
      <a
        href={entry.url}
        target="_blank"
        rel="noopener noreferrer"
        className="history-link"
      >
        View opinion →
      </a>
    </div>
  );
}

function HistorySection({ title, description, entries, showSnippet = true }) {
  return (
    <section className="history-section">
      <h3 className="history-section-title">{title}</h3>
      <p className="history-section-desc">{description}</p>
      {entries.length === 0 ? (
        <p className="history-empty">No entries found in this category for the opinions retrieved.</p>
      ) : (
        <div className="history-list">
          {entries.map((entry) => (
            <HistoryEntry key={entry.id} entry={entry} showSnippet={showSnippet} />
          ))}
        </div>
      )}
    </section>
  );
}

const JudgeHistoryPage = () => {
  const [searchResults, setSearchResults] = useState(null);
  const [selectedJudge, setSelectedJudge] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleResults = (judges) => {
    setSearchResults(judges && judges.length > 0 ? judges : []);
    setSelectedJudge(null);
    setHistory(null);
    setError(null);
  };

  const handleSelectJudge = async (judge) => {
    setSelectedJudge(judge);
    setHistory(null);
    setError(null);
    setLoading(true);
    try {
      const data = await getJudgeHistory(judge.id);
      setHistory(data);
    } catch (err) {
      const status = err.status || 0;
      if (status === 503) {
        setError("Judge history requires a CourtListener API token. Full data is available on judgetracker.info.");
      } else {
        setError(err.message || "Failed to load judge history. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearchResults(null);
    setSelectedJudge(null);
    setHistory(null);
    setError(null);
  };

  return (
    <div>
      <h2 className="section-heading">Judge History</h2>
      <p className="section-subheading">
        Search for a judge to view their ruling history, including reversals by
        higher courts, bail and release decisions in violent felony cases, and
        direct links to source opinions on CourtListener.
      </p>

      <JudgeSearchForm onResults={handleResults} onQueryChange={(q) => { if (!q) handleReset(); }} />

      {searchResults !== null && !selectedJudge && (
        <div style={{ marginTop: "1.25rem" }}>
          {searchResults.length === 0 ? (
            <p className="history-empty">No judges found. Try a different name.</p>
          ) : (
            <>
              <p className="section-subheading" style={{ marginBottom: "0.5rem" }}>
                Select a judge to view their history:
              </p>
              <div className="history-results-list">
                {searchResults.map((judge) => (
                  <button
                    key={judge.id}
                    className="history-judge-btn"
                    onClick={() => handleSelectJudge(judge)}
                  >
                    <span className="history-judge-name">{judge.fullName}</span>
                    {judge.courtName && (
                      <span className="history-judge-court">{judge.courtName}</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {selectedJudge && (
        <div style={{ marginTop: "1.5rem" }}>
          <div className="history-judge-header">
            <div>
              <h3 className="history-judge-selected-name">{selectedJudge.fullName}</h3>
              {selectedJudge.courtName && (
                <p className="history-judge-selected-court">{selectedJudge.courtName}</p>
              )}
            </div>
            <button className="history-back-btn" onClick={handleReset}>
              ← New search
            </button>
          </div>

          {loading && <p className="adm-loading" style={{ marginTop: "1rem" }}>Loading history…</p>}

          {error && (
            <p className="search-error" role="alert" style={{ color: "#fc8181", fontSize: "0.85rem", marginTop: "1rem" }}>
              {error}
            </p>
          )}

          {history && !loading && (
            <div className="history-sections">
              <HistorySection
                title="Reversals"
                description="Decisions where a higher court overturned or vacated this judge's ruling."
                entries={history.reversals}
                showSnippet={true}
              />
              <HistorySection
                title="Violent felony releases"
                description="Bail or detention opinions involving cases with violent charges where the defendant was released."
                entries={history.violentFelonyReleases}
                showSnippet={true}
              />
              <HistorySection
                title="Citations"
                description="All opinions retrieved from CourtListener for this judge, with direct source links."
                entries={history.citations}
                showSnippet={false}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JudgeHistoryPage;
