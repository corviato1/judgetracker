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

const STATE_OPTIONS = [
  { value: "any", label: "Any state" },
  { value: "CA", label: "California" },
  { value: "NY", label: "New York" },
  { value: "TX", label: "Texas" },
  { value: "FL", label: "Florida" },
  { value: "IL", label: "Illinois" },
  { value: "DC", label: "D.C. / Federal" },
];

const COURT_LEVEL_OPTIONS = [
  { value: "any", label: "Any court level" },
  { value: "federal_district", label: "Federal District" },
  { value: "federal_appeals", label: "Federal Appeals / Circuit" },
  { value: "state_supreme", label: "State Supreme Court" },
  { value: "state_appeals", label: "State Appeals Court" },
];

const GENDER_OPTIONS = [
  { value: "any", label: "Any gender" },
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
];

const PARTY_OPTIONS = [
  { value: "any", label: "Any party" },
  { value: "Democrat", label: "Democrat" },
  { value: "Republican", label: "Republican" },
];

function deriveCourtLevel(judge) {
  const name = ((judge.courtName || "") + " " + (judge.jurisdiction || "")).toLowerCase();
  if (name.includes("supreme court of the united states") || name.includes("scotus")) {
    return "scotus";
  }
  if (name.includes("district")) return "federal_district";
  if (name.includes("circuit") || name.includes("court of appeals")) return "federal_appeals";
  if (name.includes("supreme")) return "state_supreme";
  if (name.includes("appeal") || name.includes("appellate")) return "state_appeals";
  return "other";
}

function matchesFilters(judge, filters) {
  if (filters.state !== "any") {
    const haystack = [judge.state, judge.jurisdiction, judge.courtName]
      .filter(Boolean)
      .join(" ")
      .toUpperCase();
    if (!haystack.includes(filters.state)) return false;
  }
  if (filters.courtLevel !== "any") {
    if (deriveCourtLevel(judge) !== filters.courtLevel) return false;
  }
  if (filters.gender !== "any") {
    if ((judge.gender || "").toUpperCase() !== filters.gender) return false;
  }
  if (filters.party !== "any") {
    const party = (judge.partyOfAppointment || "").toLowerCase();
    if (!party.includes(filters.party.toLowerCase())) return false;
  }
  return true;
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
  const [filters, setFilters] = useState({
    state: "any",
    courtLevel: "any",
    gender: "any",
    party: "any",
  });
  const [picked, setPicked] = useState(null);
  const [noMatch, setNoMatch] = useState(false);
  const autoPickedRef = useRef(false);

  const pickRandom = useCallback((judges, currentFilters) => {
    const pool = (judges || []).filter((j) => matchesFilters(j, currentFilters));
    if (pool.length === 0) {
      setNoMatch(true);
      setPicked(null);
      return;
    }
    setNoMatch(false);
    const choice = pool[Math.floor(Math.random() * pool.length)];
    setPicked(choice);
  }, []);

  useEffect(() => {
    if (allJudges && allJudges.length > 0 && !autoPickedRef.current) {
      autoPickedRef.current = true;
      pickRandom(allJudges, filters);
    }
  }, [allJudges, filters, pickRandom]);

  const setFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setNoMatch(false);
  };

  const handlePick = () => {
    pickRandom(allJudges, filters);
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

  return (
    <div style={{ marginTop: "1.5rem" }}>
      <div className="duel-filter-card" style={{ maxWidth: "720px" }}>
        <h3 className="duel-filter-heading">Optional filters</h3>
        <p className="duel-filter-hint">
          Leave everything on "any" for a completely random judge.
        </p>
        <div className="duel-filter-grid">
          <label className="duel-filter-label">
            State / Region
            <select
              className="duel-filter-select"
              value={filters.state}
              onChange={(e) => setFilter("state", e.target.value)}
            >
              {STATE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>

          <label className="duel-filter-label">
            Court Level
            <select
              className="duel-filter-select"
              value={filters.courtLevel}
              onChange={(e) => setFilter("courtLevel", e.target.value)}
            >
              {COURT_LEVEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>

          <label className="duel-filter-label">
            Gender
            <select
              className="duel-filter-select"
              value={filters.gender}
              onChange={(e) => setFilter("gender", e.target.value)}
            >
              {GENDER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>

          <label className="duel-filter-label">
            Appointing Party
            <select
              className="duel-filter-select"
              value={filters.party}
              onChange={(e) => setFilter("party", e.target.value)}
            >
              {PARTY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
        </div>

        <button
          className="duel-secondary-button"
          onClick={handlePick}
          disabled={!allJudges}
          style={{ marginTop: "0.5rem" }}
        >
          {!allJudges ? "Loading…" : picked ? "Pick another →" : "Pick Random Judge"}
        </button>

        {noMatch && (
          <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            No judges match those filters — try broadening your selection.
          </p>
        )}
      </div>

      {!allJudges && (
        <p className="judge-index-loading" style={{ marginTop: "1.5rem" }}>
          Loading judges…
        </p>
      )}

      {picked && (
        <div className="duel-filter-card" style={{ marginTop: "1.5rem", maxWidth: "720px" }}>
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

const JudgeSearchPage = () => {
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
    ? allJudges.filter((j) =>
        (j.courtName || "").toLowerCase().includes("supreme court")
      )
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
            <JudgeList
              judges={results}
            />
          ) : (
            <JudgeIndex
              filterQuery={filterQuery}
              judges={allJudges}
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
                Current justices of the United States Supreme Court.
              </p>
              <div className="judge-index-grid">
                {scotusJudges.map((judge) => (
                  <JudgeCard
                    key={judge.id}
                    judge={judge}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default JudgeSearchPage;
