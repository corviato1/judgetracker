import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getJudgeById, getLocalJudge, getOpinionsForJudge, getJudgeStats, getJudgeHistory } from "../API/api";
import JudgeComparison from "../components/JudgeComparison";

const REVERSAL_RE = /\b(revers|overrul|vacat|overturned|remand)\b/i;
const VIOLENT_RE = /\b(assault|murder|homicide|robbery|rape|kidnap|weapon|firearm|gun|battery|manslaughter|carjack|arson|trafficking|sex.offend|armed)\b/i;
const RELEASE_RE = /\b(bail|bond|releas|detention|pretrial|custody)\b/i;

function deriveLocalHistory(opinions) {
  const reversals = [];
  const violentFelonyReleases = [];
  const citations = [];
  const yearCounts = {};

  for (const op of opinions) {
    const combined = `${op.caseName || ""} ${op.summary || ""}`;
    const clUrl = op.url || (op.id ? `https://www.courtlistener.com/opinion/${op.id}/` : null);
    const year = op.dateFiled ? String(op.dateFiled).slice(0, 4) : "Unknown";
    yearCounts[year] = (yearCounts[year] || 0) + 1;

    const entry = {
      id: String(op.id),
      caseName: op.caseName || "Untitled case",
      dateFiled: op.dateFiled || "",
      court: op.courtName || "",
      citation: op.citation || "",
      snippet: (op.summary || "").slice(0, 280),
      url: clUrl,
    };
    if (REVERSAL_RE.test(combined)) reversals.push(entry);
    if (VIOLENT_RE.test(combined) && RELEASE_RE.test(combined)) violentFelonyReleases.push(entry);
    citations.push(entry);
  }

  const opinionsByYear = Object.entries(yearCounts)
    .sort(([a], [b]) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (isNaN(numA) && isNaN(numB)) return a.localeCompare(b);
      if (isNaN(numA)) return 1;
      if (isNaN(numB)) return -1;
      return numB - numA;
    })
    .map(([year, count]) => ({ year, count }));

  return {
    reversals: reversals.slice(0, 20),
    violentFelonyReleases: violentFelonyReleases.slice(0, 20),
    citations: citations.slice(0, 30),
    opinionsByYear,
    derived: true,
  };
}

function AccordionSection({ title, defaultOpen = false, children, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`profile-accordion${open ? " profile-accordion--open" : ""}`}>
      <button
        className="profile-accordion-header"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="profile-accordion-title">
          {title}
          {badge !== undefined && badge !== null && (
            <span className="profile-accordion-badge">{badge}</span>
          )}
        </span>
        <span className="profile-accordion-chevron">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="profile-accordion-body">{children}</div>}
    </div>
  );
}

function BioRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="profile-bio-row">
      <span className="profile-bio-label">{label}</span>
      <span className="profile-bio-value">{value}</span>
    </div>
  );
}

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

const JudgeProfilePage = () => {
  const { judgeId } = useParams();
  const navigate = useNavigate();

  const [judge, setJudge] = useState(null);
  const [opinions, setOpinions] = useState([]);
  const [statsData, setStatsData] = useState(undefined);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [opinionsLoading, setOpinionsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState(null);
  const [opinionsError, setOpinionsError] = useState(null);
  const [historyError, setHistoryError] = useState(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [opinionsPage, setOpinionsPage] = useState(0);
  const [caseTab, setCaseTab] = useState("ALL");
  const OPINIONS_PER_PAGE = 10;

  useEffect(() => {
    if (!judgeId) return;

    let cancelled = false;
    setLoading(true);
    setOpinionsLoading(true);
    setStatsLoading(true);
    setHistoryLoading(true);
    setError(null);
    setOpinionsError(null);
    setHistoryError(null);
    setUsedFallback(false);
    setJudge(null);
    setOpinions([]);
    setStatsData(undefined);
    setHistory(null);
    setFilterText("");
    setOpinionsPage(0);
    setCaseTab("ALL");

    async function loadJudge() {
      try {
        const found = await getJudgeById(judgeId);
        if (!cancelled) setJudge(found || null);
      } catch (err) {
        if (cancelled) return;
        if (err.status === 503 || err.status === 502 || err.status === 404) {
          try {
            const local = await getLocalJudge(judgeId);
            if (!cancelled) {
              setJudge(local || null);
              setUsedFallback(true);
            }
          } catch (localErr) {
            if (!cancelled) setError("This judge could not be found. Try searching again.");
          }
        } else {
          setError(err.message || "Failed to load judge data.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    async function loadOpinions() {
      try {
        const ops = await getOpinionsForJudge(judgeId);
        if (!cancelled) setOpinions(ops || []);
      } catch (err) {
        if (!cancelled) {
          if (err.status === 503) {
            setOpinionsError("Opinion data is only available on the live site.");
          } else {
            setOpinionsError(err.message || "Could not load opinions.");
          }
          setOpinions([]);
        }
      } finally {
        if (!cancelled) setOpinionsLoading(false);
      }
    }

    async function loadStats() {
      try {
        const stats = await getJudgeStats(judgeId);
        if (!cancelled) setStatsData(stats);
      } catch {
        if (!cancelled) setStatsData(null);
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    }

    async function loadHistory() {
      try {
        const data = await getJudgeHistory(judgeId);
        if (!cancelled) setHistory(data);
      } catch (err) {
        if (!cancelled) {
          const status = err.status || 0;
          if (status === 503) {
            setHistoryError("Ruling history requires a CourtListener API token. Full data is available on judgetracker.info.");
          } else {
            setHistoryError(err.message || "Could not load ruling history.");
          }
        }
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    }

    loadJudge();
    loadOpinions();
    loadStats();
    loadHistory();
    return () => { cancelled = true; };
  }, [judgeId]);

  const filteredOpinions = opinions.filter((op) =>
    !filterText || (op.caseName || "").toLowerCase().includes(filterText.toLowerCase())
  );
  const totalPages = Math.ceil(filteredOpinions.length / OPINIONS_PER_PAGE);
  const pagedOpinions = filteredOpinions.slice(
    opinionsPage * OPINIONS_PER_PAGE,
    (opinionsPage + 1) * OPINIONS_PER_PAGE
  );

  if (loading) {
    return (
      <div>
        <button className="profile-back-btn" onClick={() => navigate(-1)}>← Back to search</button>
        <h2 className="section-heading">Judge Profile</h2>
        <p className="section-subheading">Loading judge data...</p>
      </div>
    );
  }

  if (error && !judge) {
    return (
      <div>
        <button className="profile-back-btn" onClick={() => navigate(-1)}>← Back to search</button>
        <h2 className="section-heading">Judge Profile</h2>
        <p className="section-subheading">{error}</p>
      </div>
    );
  }

  if (!judge) {
    return (
      <div>
        <button className="profile-back-btn" onClick={() => navigate(-1)}>← Back to search</button>
        <h2 className="section-heading">Judge Profile</h2>
        <p className="section-subheading">No judge found for this identifier.</p>
      </div>
    );
  }

  const serviceYears = judge.serviceStartYear
    ? `${judge.serviceStartYear} – present (${new Date().getFullYear() - judge.serviceStartYear} years)`
    : null;

  const localHistory =
    historyError && !opinionsLoading && opinions.length > 0
      ? deriveLocalHistory(opinions)
      : null;

  return (
    <div className="profile-page">
      <button className="profile-back-btn" onClick={() => navigate(-1)}>← Back to search</button>

      {usedFallback && (
        <div className="profile-fallback-banner">
          Full opinion data and live statistics are available on{" "}
          <strong>judgetracker.info</strong>. Showing locally cached profile only.
        </div>
      )}

      <div className="profile-header">
        <div>
          {judge.courtName && (
            <p className="profile-court-breadcrumb">{judge.courtName}</p>
          )}
          <h2 className="profile-name">{judge.fullName}</h2>
          <p className="profile-court">
            {[judge.jurisdiction, judge.appointer ? `Appointed by ${judge.appointer}` : null].filter(Boolean).join(" · ")}
          </p>
          {judge.serviceStartYear && (
            <p className="profile-bench-since">On the bench since {judge.serviceStartYear}</p>
          )}
        </div>
      </div>

      {/* 4-stat block row */}
      <div className="profile-stat-row">
        {[
          {
            label: "Total Opinions",
            value: opinionsLoading ? "—" : opinions.length,
          },
          {
            label: "Reversals",
            value:
              historyLoading
                ? "—"
                : history
                ? history.reversals?.length ?? 0
                : localHistory
                ? localHistory.reversals?.length ?? 0
                : "—",
          },
          {
            label: "Violent Releases",
            value:
              historyLoading
                ? "—"
                : history
                ? history.violentFelonyReleases?.length ?? 0
                : localHistory
                ? localHistory.violentFelonyReleases?.length ?? 0
                : "—",
          },
          {
            label: "Citations",
            value:
              historyLoading
                ? "—"
                : history
                ? history.citations?.length ?? 0
                : localHistory
                ? localHistory.citations?.length ?? 0
                : "—",
          },
        ].map(({ label, value }) => (
          <div className="profile-stat-box" key={label}>
            <span className="profile-stat-number">{value}</span>
            <span className="profile-stat-label">{label}</span>
          </div>
        ))}
      </div>

      <div className="profile-accordions">
        <AccordionSection title="Overview" defaultOpen={true}>
          <div className="profile-bio-grid">
            <BioRow label="Full name" value={judge.fullName} />
            <BioRow label="Court" value={judge.courtName} />
            <BioRow label="Jurisdiction" value={judge.jurisdiction} />
            <BioRow label="Appointing president" value={judge.appointer} />
            <BioRow label="Party" value={judge.partyOfAppointment} />
            <BioRow label="Gender" value={judge.gender} />
            <BioRow label="Years of service" value={serviceYears} />
            <BioRow label="Cases indexed" value={judge.sampleCaseCount ? judge.sampleCaseCount.toLocaleString() : null} />
          </div>
        </AccordionSection>

        {/* Tab-filtered case table replacing the old Rulings & Opinions accordion */}
        <div className="profile-accordion profile-tab-section">
          <div className="profile-accordion-header" style={{ cursor: "default" }}>
            <span className="profile-accordion-title">
              Rulings &amp; Opinions
              {!opinionsLoading && (
                <span className="profile-accordion-badge">{opinions.length}</span>
              )}
            </span>
          </div>
          <div className="profile-accordion-body">
            <div className="profile-tab-bar">
              {["ALL", "REVERSALS", "RELEASES", "CITATIONS"].map((tab) => (
                <button
                  key={tab}
                  className={`profile-tab-btn${caseTab === tab ? " profile-tab-btn--active" : ""}`}
                  onClick={() => {
                    setCaseTab(tab);
                    setOpinionsPage(0);
                    setFilterText("");
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {caseTab === "ALL" && (
              <>
                {opinionsError ? (
                  <p className="profile-section-empty">{opinionsError}</p>
                ) : opinionsLoading ? (
                  <p className="profile-section-empty">Loading opinions...</p>
                ) : (
                  <>
                    <input
                      type="text"
                      className="profile-filter-input"
                      placeholder="Filter by case name..."
                      value={filterText}
                      onChange={(e) => {
                        setFilterText(e.target.value);
                        setOpinionsPage(0);
                      }}
                    />
                    {filteredOpinions.length === 0 ? (
                      <p className="profile-case-table-empty">
                        {filterText ? `No opinions match "${filterText}"` : "No opinions found for this judge yet."}
                      </p>
                    ) : (
                      <>
                        <table className="profile-case-table">
                          <thead>
                            <tr>
                              <th>Case Name</th>
                              <th>Filed</th>
                              <th>Court</th>
                              <th>Link</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pagedOpinions.map((op) => {
                              const clUrl = op.url || (op.id ? `https://www.courtlistener.com/opinion/${op.id}/` : null);
                              return (
                                <tr key={op.id}>
                                  <td className="profile-case-name-cell">{op.caseName || "Untitled case"}</td>
                                  <td>{op.dateFiled ? String(op.dateFiled).slice(0, 10) : "—"}</td>
                                  <td>{op.courtName || "—"}</td>
                                  <td>
                                    {clUrl ? (
                                      <a href={clUrl} target="_blank" rel="noopener noreferrer" className="profile-case-link">
                                        View →
                                      </a>
                                    ) : "—"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        {totalPages > 1 && (
                          <div className="profile-pagination">
                            <button
                              className="profile-page-btn"
                              onClick={() => setOpinionsPage((p) => p - 1)}
                              disabled={opinionsPage === 0}
                            >
                              ← Prev
                            </button>
                            <span className="profile-page-info">
                              Page {opinionsPage + 1} of {totalPages}
                            </span>
                            <button
                              className="profile-page-btn"
                              onClick={() => setOpinionsPage((p) => p + 1)}
                              disabled={opinionsPage >= totalPages - 1}
                            >
                              Next →
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {(caseTab === "REVERSALS" || caseTab === "RELEASES" || caseTab === "CITATIONS") && (() => {
              const srcHistory = history || localHistory;
              const key = caseTab === "REVERSALS" ? "reversals" : caseTab === "RELEASES" ? "violentFelonyReleases" : "citations";
              const label = caseTab === "REVERSALS" ? "reversals" : caseTab === "RELEASES" ? "violent felony releases" : "citations";
              if (historyLoading && opinionsLoading) {
                return <p className="profile-section-empty">Loading...</p>;
              }
              if (!srcHistory) {
                return (
                  <p className="profile-section-empty">
                    {historyError || "No ruling history available."}
                  </p>
                );
              }
              const entries = srcHistory[key] || [];
              if (entries.length === 0) {
                return <p className="profile-case-table-empty">No {label} found in the opinions retrieved.</p>;
              }
              return (
                <table className="profile-case-table">
                  <thead>
                    <tr>
                      <th>Case Name</th>
                      <th>Filed</th>
                      <th>Court</th>
                      <th>Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.id}>
                        <td className="profile-case-name-cell">{entry.caseName || "Untitled case"}</td>
                        <td>{entry.dateFiled ? String(entry.dateFiled).slice(0, 10) : "—"}</td>
                        <td>{entry.court || "—"}</td>
                        <td>
                          {entry.url ? (
                            <a href={entry.url} target="_blank" rel="noopener noreferrer" className="profile-case-link">
                              View →
                            </a>
                          ) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}
          </div>
        </div>

        <AccordionSection title="Statistics & Comparisons">
          {statsLoading ? (
            <p className="profile-section-empty">Loading statistics...</p>
          ) : (
            <JudgeComparison statsData={statsData} />
          )}
        </AccordionSection>

        <AccordionSection title="Ruling history">
          {historyLoading || (historyError && opinionsLoading) ? (
            <p className="profile-section-empty">Loading ruling history...</p>
          ) : history ? (
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
                showSnippet={true}
              />
            </div>
          ) : localHistory ? (
            <div className="history-sections">
              <p className="profile-history-derived-note">
                Derived from {opinions.length} locally-cached opinion{opinions.length !== 1 ? "s" : ""}.
                Full analysis available on <strong>judgetracker.info</strong>.
              </p>
              {localHistory.opinionsByYear.length > 0 && (
                <section className="history-section">
                  <h3 className="history-section-title">Opinions by year</h3>
                  <p className="history-section-desc">Total opinions filed per calendar year from local data.</p>
                  <div className="profile-year-count-table">
                    {localHistory.opinionsByYear.map(({ year, count }) => (
                      <div key={year} className="profile-year-count-row">
                        <span className="profile-year-count-year">{year}</span>
                        <span className="profile-year-count-bar-wrap">
                          <span
                            className="profile-year-count-bar"
                            style={{ width: `${Math.round((count / localHistory.opinionsByYear[0].count) * 100)}%` }}
                          />
                        </span>
                        <span className="profile-year-count-num">{count}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              <HistorySection
                title="Reversals"
                description="Opinions where reversal-related keywords appear in the case name or summary."
                entries={localHistory.reversals}
                showSnippet={true}
              />
              <HistorySection
                title="Violent felony releases"
                description="Opinions involving violent-charge keywords alongside bail or release language."
                entries={localHistory.violentFelonyReleases}
                showSnippet={true}
              />
              <HistorySection
                title="Citations"
                description="All locally-cached opinions for this judge, with CourtListener links."
                entries={localHistory.citations}
                showSnippet={true}
              />
            </div>
          ) : historyError ? (
            <p className="profile-section-empty">
              History data not yet indexed for this judge. Check back after their opinions are loaded.
            </p>
          ) : !history ? (
            <p className="profile-section-empty">No ruling history available.</p>
          ) : null}
        </AccordionSection>
      </div>
    </div>
  );
};

export default JudgeProfilePage;
