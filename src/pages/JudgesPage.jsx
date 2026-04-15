import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import JudgeSearchForm from "../components/JudgeSearchForm";
import JudgeIndex from "../components/JudgeIndex";
import JudgeList from "../components/JudgeList";
import JudgeCard from "../components/JudgeCard";
import { listAllJudges } from "../API/api";

const TABS = [
  { id: "random", label: "Random Judge" },
  { id: "search", label: "Search" },
  { id: "scotus", label: "Supreme Court" },
];

function isScotus(judge) {
  return (judge.courtName || "").toLowerCase().includes("supreme court of the united states");
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

const RandomTab = ({ allJudges }) => {
  const [picked, setPicked] = useState(null);
  const [btnState, setBtnState] = useState("idle");
  const autoPickedRef = useRef(false);
  const timerRef = useRef(null);

  const pickRandom = useCallback((judges, currentPicked) => {
    const pool = judges || [];
    if (pool.length === 0) return;
    const eligible = pool.length > 1 && currentPicked
      ? pool.filter((j) => j.id !== currentPicked.id)
      : pool;
    const choice = eligible[Math.floor(Math.random() * eligible.length)];
    setPicked(choice);
  }, []);

  useEffect(() => {
    if (allJudges && allJudges.length > 0 && !autoPickedRef.current) {
      autoPickedRef.current = true;
      pickRandom(allJudges, null);
    }
  }, [allJudges, pickRandom]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handlePick = () => {
    if (btnState !== "idle" || !allJudges) return;
    setBtnState("spinning");
    pickRandom(allJudges, picked);
    timerRef.current = setTimeout(() => {
      setBtnState("done");
      timerRef.current = setTimeout(() => {
        setBtnState("idle");
      }, 600);
    }, 420);
  };

  const yearsOnBench = picked && picked.serviceStartYear
    ? new Date().getFullYear() - picked.serviceStartYear
    : null;

  const partyColor = picked
    ? (picked.partyOfAppointment || "").toLowerCase().includes("democrat")
      ? "#4a90d9"
      : (picked.partyOfAppointment || "").toLowerCase().includes("republican")
      ? "#d9534a"
      : "var(--text-muted)"
    : "var(--text-muted)";

  const buttonLabel = !allJudges
    ? "Loading…"
    : btnState === "spinning"
    ? "↻"
    : btnState === "done"
    ? "✓"
    : picked
    ? "↻  Pick another"
    : "↻  Pick Random Judge";

  return (
    <div style={{ marginTop: "1.5rem" }}>
      {!allJudges && (
        <p className="judge-index-loading">Loading judges…</p>
      )}

      {allJudges && (
        <div style={{ marginBottom: "1.25rem" }}>
          <button
            className={`random-pick-btn${btnState === "done" ? " random-pick-btn--done" : ""}`}
            onClick={handlePick}
            disabled={btnState !== "idle" || !allJudges}
          >
            <span
              className={btnState === "spinning" ? "random-pick-icon--spin" : ""}
              style={{ display: "inline-block" }}
            >
              {buttonLabel}
            </span>
          </button>
        </div>
      )}

      {picked && (
        <div className="duel-filter-card" style={{ maxWidth: "720px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
            <div>
              <h2 className="profile-name" style={{ margin: 0 }}>{picked.fullName}</h2>
              {picked.courtName && (
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.9rem", opacity: 0.75 }}>
                  {picked.courtName}
                </p>
              )}
            </div>
            {picked.partyOfAppointment && (
              <span style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                padding: "0.2rem 0.6rem",
                borderRadius: "999px",
                background: partyColor,
                color: "#fff",
                whiteSpace: "nowrap",
                alignSelf: "flex-start",
              }}>
                {picked.partyOfAppointment}
              </span>
            )}
          </div>

          <div className="profile-bio-grid">
            <BioRow label="Court" value={picked.courtName} />
            <BioRow label="Appointing President" value={picked.appointer} />
            <BioRow label="Party of Appointment" value={picked.partyOfAppointment} />
            <BioRow label="Service Started" value={picked.serviceStartYear} />
            <BioRow
              label="Years on Bench"
              value={yearsOnBench !== null ? `${yearsOnBench} years` : null}
            />
            <BioRow
              label="Gender"
              value={
                picked.gender === "M" || picked.gender === "Male"
                  ? "Male"
                  : picked.gender === "F" || picked.gender === "Female"
                  ? "Female"
                  : picked.gender || null
              }
            />
          </div>

          <div style={{ marginTop: "1.25rem" }}>
            <Link
              to={`/judge/${picked.id}`}
              className="duel-start-button"
              style={{ display: "inline-block", textDecoration: "none" }}
            >
              View full profile →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

const JudgesPage = () => {
  const [activeTab, setActiveTab] = useState("random");
  const [results, setResults] = useState(null);
  const [filterQuery, setFilterQuery] = useState("");

  const [allJudges, setAllJudges] = useState(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    listAllJudges().then((judges) => {
      setAllJudges(Array.isArray(judges) ? judges : []);
    }).catch(() => {
      setAllJudges([]);
    });
  }, []);

  const scotusJudges = allJudges
    ? [...allJudges.filter(isScotus)]
        .sort((a, b) => (a.serviceStartYear || 9999) - (b.serviceStartYear || 9999))
    : null;

  const nonScotusJudges = allJudges
    ? allJudges.filter((j) => !isScotus(j))
    : null;

  const handleResults = (judges) => {
    if (!judges || judges.length === 0) {
      setResults(null);
      return;
    }
    setResults(judges);
  };

  const handleReset = () => {
    setResults(null);
  };

  const hasSearchResults = results !== null;

  return (
    <div>
      <h2 className="section-heading">Judge Search</h2>
      <p className="section-subheading">
        Discover a random judge, search by name, or browse the Supreme Court.
      </p>

      <div className="search-tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`search-tab${activeTab === tab.id ? " search-tab-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "random" && (
        <RandomTab allJudges={allJudges} />
      )}

      {activeTab === "search" && (
        <>
          <JudgeSearchForm
            onResults={handleResults}
            onQueryChange={(q) => {
              setFilterQuery(q);
              if (!q) handleReset();
            }}
          />
          {hasSearchResults ? (
            <JudgeList judges={results} />
          ) : (
            <JudgeIndex
              filterQuery={filterQuery}
              judges={nonScotusJudges}
            />
          )}
        </>
      )}

      {activeTab === "scotus" && (
        <div style={{ marginTop: "1.5rem" }}>
          {scotusJudges === null ? (
            <p className="judge-index-loading">Loading Supreme Court justices…</p>
          ) : scotusJudges.length === 0 ? (
            <p className="judge-index-empty">
              No Supreme Court justices found in the local index yet. Use the Search tab to find
              and cache them first.
            </p>
          ) : (
            <>
              <p className="section-subheading" style={{ marginBottom: "1rem" }}>
                Justices of the United States Supreme Court, ordered by seniority.
              </p>
              <div className="judge-index-grid">
                {scotusJudges.map((judge) => (
                  <JudgeCard key={judge.id} judge={judge} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default JudgesPage;
