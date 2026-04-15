import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { listAllJudges, getOpinionsForJudge } from "../API/api";

function isScotus(judge) {
  return (judge.courtName || "").toLowerCase().includes("supreme court of the united states");
}

function partyColor(party) {
  const lower = (party || "").toLowerCase();
  if (lower.includes("democrat")) return "#4a90d9";
  if (lower.includes("republican")) return "#d9534a";
  return "var(--text-muted)";
}

function groupByYear(opinions) {
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

function BioRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="profile-bio-row">
      <span className="profile-bio-label">{label}</span>
      <span className="profile-bio-value">{value}</span>
    </div>
  );
}

function YearGroup({ year, opinions }) {
  const [open, setOpen] = useState(year === String(new Date().getFullYear()) || false);
  return (
    <div className="scotus-year-group">
      <button
        className="scotus-year-header"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="scotus-year-label">{year}</span>
        <span className="scotus-year-count">{opinions.length} opinion{opinions.length !== 1 ? "s" : ""}</span>
        <span className="scotus-year-chevron">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="scotus-year-opinions">
          {opinions.map((op) => {
            const clUrl = op.url || (op.id ? `https://www.courtlistener.com/opinion/${op.id}/` : null);
            return (
              <div key={op.id} className="scotus-opinion-row">
                <div className="scotus-opinion-name">{op.caseName || "Untitled case"}</div>
                <div className="scotus-opinion-meta">
                  {[op.dateFiled ? op.dateFiled.slice(0, 10) : null, op.opinionType]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
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
            );
          })}
        </div>
      )}
    </div>
  );
}

function JusticeProfile({ justice, profileRef }) {
  const [opinions, setOpinions] = useState(null);
  const [opinionsError, setOpinionsError] = useState(null);

  useEffect(() => {
    if (!justice) return;
    let cancelled = false;
    setOpinions(null);
    setOpinionsError(null);
    getOpinionsForJudge(String(justice.id))
      .then((ops) => {
        if (!cancelled) setOpinions(Array.isArray(ops) ? ops : []);
      })
      .catch((err) => {
        if (!cancelled) {
          setOpinionsError(
            err.status === 503
              ? "Opinion data is only available on the live site."
              : err.message || "Could not load opinions."
          );
          setOpinions([]);
        }
      });
    return () => { cancelled = true; };
  }, [justice]);

  if (!justice) {
    return (
      <div className="scotus-profile-empty">
        Select a justice from the list to view their profile.
      </div>
    );
  }

  const yearsOnBench = justice.serviceStartYear
    ? new Date().getFullYear() - justice.serviceStartYear
    : null;

  const serviceYears = justice.serviceStartYear && yearsOnBench !== null
    ? `${justice.serviceStartYear} – present (${yearsOnBench} years)`
    : null;

  const genderLabel =
    justice.gender === "M" || justice.gender === "Male"
      ? "Male"
      : justice.gender === "F" || justice.gender === "Female"
      ? "Female"
      : justice.gender || null;

  const opinionGroups = opinions ? groupByYear(opinions) : null;

  return (
    <div className="scotus-profile" ref={profileRef}>
      <div className="scotus-profile-header">
        <div style={{ flex: 1 }}>
          <h2 className="profile-name" style={{ margin: "0 0 0.2rem" }}>
            {justice.fullName}
          </h2>
          <p className="profile-court" style={{ margin: 0 }}>
            Supreme Court of the United States
          </p>
        </div>
        {justice.partyOfAppointment && (
          <span
            className="scotus-party-badge"
            style={{ background: partyColor(justice.partyOfAppointment) }}
          >
            {justice.partyOfAppointment}
          </span>
        )}
      </div>

      {justice.serviceStartYear && (
        <div className="scotus-appt-year">
          <span className="scotus-appt-label">Appointed</span>
          <span className="scotus-appt-value">{justice.serviceStartYear}</span>
          {yearsOnBench !== null && (
            <span className="scotus-appt-tenure">({yearsOnBench} years on the bench)</span>
          )}
        </div>
      )}

      <div className="profile-bio-grid" style={{ marginTop: "1rem" }}>
        <BioRow label="Service Years" value={serviceYears} />
        <BioRow label="Appointing President" value={justice.appointer} />
        <BioRow label="Gender" value={genderLabel} />
      </div>

      <div className="scotus-profile-actions" style={{ marginTop: "1.25rem" }}>
        <Link
          to={`/judge/${justice.id}`}
          className="duel-start-button"
          style={{ display: "inline-block", textDecoration: "none", fontSize: "0.9rem", padding: "0.5rem 1.1rem" }}
        >
          Full profile →
        </Link>
      </div>

      <div style={{ marginTop: "1.75rem" }}>
        <h3 className="scotus-opinions-heading">Written Opinions</h3>
        {opinionsError ? (
          <p className="profile-section-empty">{opinionsError}</p>
        ) : opinions === null ? (
          <p className="profile-section-empty">Loading opinions…</p>
        ) : opinions.length === 0 ? (
          <p className="profile-section-empty">No opinions found for this justice yet.</p>
        ) : (
          <div className="scotus-year-list">
            {opinionGroups.map(({ year, opinions: ops }) => (
              <YearGroup key={year} year={year} opinions={ops} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const ScotusPage = () => {
  const [allJudges, setAllJudges] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const profileRef = useRef(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    listAllJudges()
      .then((judges) => {
        const list = Array.isArray(judges) ? judges : [];
        setAllJudges(list);
        const scotusList = list
          .filter(isScotus)
          .sort((a, b) => (a.serviceStartYear || 9999) - (b.serviceStartYear || 9999));
        if (scotusList.length > 0) {
          setSelectedId(scotusList[0].id);
        }
      })
      .catch(() => setAllJudges([]));
  }, []);

  const scotusJudges = allJudges
    ? allJudges
        .filter(isScotus)
        .sort((a, b) => (a.serviceStartYear || 9999) - (b.serviceStartYear || 9999))
    : null;

  const selectedJustice = scotusJudges
    ? scotusJudges.find((j) => j.id === selectedId) || null
    : null;

  const handleSelect = useCallback((id) => {
    setSelectedId(id);
    if (profileRef.current && window.innerWidth < 768) {
      setTimeout(() => {
        profileRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  }, []);

  return (
    <div className="scotus-page">
      <div className="scotus-page-nav">
        <Link to="/judges" className="profile-back-btn">
          ← Back to Judge Search
        </Link>
      </div>

      <h2 className="section-heading" style={{ marginTop: "0.5rem" }}>
        Supreme Court of the United States
      </h2>
      <p className="section-subheading">
        Select a justice to view their profile and written opinions.
      </p>

      <div className="scotus-split">
        <aside className="scotus-list-panel">
          {scotusJudges === null ? (
            <p className="judge-index-loading">Loading justices…</p>
          ) : scotusJudges.length === 0 ? (
            <p className="judge-index-empty">
              No SCOTUS justices found in the local index. Try using the Search tab first.
            </p>
          ) : (
            <ul className="scotus-justice-list" role="list">
              {scotusJudges.map((j) => (
                <li key={j.id}>
                  <button
                    className={`scotus-justice-btn${j.id === selectedId ? " scotus-justice-btn--active" : ""}`}
                    onClick={() => handleSelect(j.id)}
                  >
                    <span className="scotus-justice-name">{j.fullName}</span>
                    {j.serviceStartYear && (
                      <span className="scotus-justice-year">since {j.serviceStartYear}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="scotus-profile-panel">
          <JusticeProfile justice={selectedJustice} profileRef={profileRef} />
        </section>
      </div>
    </div>
  );
};

export default ScotusPage;
