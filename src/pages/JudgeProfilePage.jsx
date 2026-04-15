import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getJudgeById, getLocalJudge, getOpinionsForJudge, getJudgeStats, getJudgeHistory } from "../API/api";
import JudgeComparison from "../components/JudgeComparison";
import OpinionCard from "../components/OpinionCard";

const REVERSAL_RE = /\b(revers|overrul|vacat|overturned|remand)\b/i;
const VIOLENT_RE = /\b(assault|murder|homicide|robbery|rape|kidnap|weapon|firearm|gun|battery|manslaughter|carjack|arson|trafficking|sex.offend|armed)\b/i;
const RELEASE_RE = /\b(bail|bond|releas|detention|pretrial|custody)\b/i;

function deriveLocalHistory(opinions) {
  const reversals = [];
  const violentFelonyReleases = [];
  const citations = [];
  for (const op of opinions) {
    const combined = `${op.caseName || ""} ${op.summary || ""}`;
    const clUrl = op.url || (op.id ? `https://www.courtlistener.com/opinion/${op.id}/` : null);
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
  return {
    reversals: reversals.slice(0, 20),
    violentFelonyReleases: violentFelonyReleases.slice(0, 20),
    citations: citations.slice(0, 30),
    derived: true,
  };
}

function groupOpinionsByYear(opinions) {
  const groups = {};
  for (const op of opinions) {
    const year = op.dateFiled ? String(op.dateFiled).slice(0, 4) : "Unknown";
    if (!groups[year]) groups[year] = [];
    groups[year].push(op);
  }
  const sortedYears = Object.keys(groups).sort((a, b) => {
    const numA = parseInt(a, 10);
    const numB = parseInt(b, 10);
    if (isNaN(numA) && isNaN(numB)) return a.localeCompare(b);
    if (isNaN(numA)) return 1;
    if (isNaN(numB)) return -1;
    return numB - numA;
  });
  return sortedYears.map((year) => ({ year, opinions: groups[year] }));
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
  const [expandedOpinionId, setExpandedOpinionId] = useState(null);
  const [opinionsPage, setOpinionsPage] = useState(0);
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
    setExpandedOpinionId(null);
    setOpinionsPage(0);

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

  const handleExpand = useCallback((id) => {
    setExpandedOpinionId(id);
  }, []);


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

  const opinionYearGroups = groupOpinionsByYear(
    opinions.filter((op) =>
      !filterText || (op.caseName || "").toLowerCase().includes(filterText.toLowerCase())
    )
  );

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
          <h2 className="profile-name">{judge.fullName}</h2>
          <p className="profile-court">
            {[judge.courtName, judge.jurisdiction].filter(Boolean).join(" · ")}
          </p>
          {judge.serviceStartYear && (
            <p className="profile-bench-since">On the bench since {judge.serviceStartYear}</p>
          )}
        </div>
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

        <AccordionSection
          title="Rulings & Opinions"
          badge={opinionsLoading ? null : opinions.length || 0}
        >
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
                  setExpandedOpinionId(null);
                }}
              />
              {opinionYearGroups.length === 0 ? (
                <p className="profile-section-empty">
                  {filterText
                    ? `No opinions match "${filterText}"`
                    : "No opinions found for this judge yet."}
                </p>
              ) : (
                <div className="profile-opinions-by-year">
                  {opinionYearGroups.map(({ year, opinions: yearOps }) => (
                    <div key={year} className="profile-year-group">
                      <div className="profile-year-heading">
                        <span className="profile-year-label">{year}</span>
                        <span className="profile-year-count">{yearOps.length} opinion{yearOps.length !== 1 ? "s" : ""}</span>
                      </div>
                      <div className="opinion-list">
                        {yearOps.map((op) => (
                          <OpinionCard
                            key={op.id}
                            opinion={op}
                            expandedId={expandedOpinionId}
                            onExpand={handleExpand}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </AccordionSection>

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
