import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getJudgeById, getLocalJudge, getOpinionsForJudge, getJudgeStats } from "../API/api";
import JudgeComparison from "../components/JudgeComparison";
import OpinionCard from "../components/OpinionCard";

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

const JudgeProfilePage = () => {
  const { judgeId } = useParams();
  const navigate = useNavigate();

  const [judge, setJudge] = useState(null);
  const [opinions, setOpinions] = useState([]);
  const [statsData, setStatsData] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [opinionsLoading, setOpinionsLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [opinionsError, setOpinionsError] = useState(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [expandedOpinionId, setExpandedOpinionId] = useState(null);

  useEffect(() => {
    if (!judgeId) return;

    let cancelled = false;
    setLoading(true);
    setOpinionsLoading(true);
    setStatsLoading(true);
    setError(null);
    setOpinionsError(null);
    setUsedFallback(false);
    setJudge(null);
    setOpinions([]);
    setStatsData(undefined);
    setFilterText("");
    setExpandedOpinionId(null);

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

    loadJudge();
    loadOpinions();
    loadStats();
    return () => { cancelled = true; };
  }, [judgeId]);

  const handleExpand = useCallback((id) => {
    setExpandedOpinionId(id);
  }, []);

  const filteredOpinions = opinions.filter((op) =>
    !filterText || (op.caseName || "").toLowerCase().includes(filterText.toLowerCase())
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
              {filteredOpinions.length === 0 ? (
                <p className="profile-section-empty">
                  {filterText
                    ? `No opinions match "${filterText}"`
                    : "No opinions found for this judge yet."}
                </p>
              ) : (
                <div className="opinion-list">
                  {filteredOpinions.map((op) => (
                    <OpinionCard
                      key={op.id}
                      opinion={op}
                      expandedId={expandedOpinionId}
                      onExpand={handleExpand}
                    />
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
      </div>
    </div>
  );
};

export default JudgeProfilePage;
