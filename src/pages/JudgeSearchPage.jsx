import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import JudgeSearchForm from "../components/JudgeSearchForm";
import JudgeIndex from "../components/JudgeIndex";
import JudgeList from "../components/JudgeList";
import JudgeCard from "../components/JudgeCard";
import { listAllJudges } from "../API/api";

const TABS = [
  { id: "search", label: "Search" },
  { id: "scotus", label: "Supreme Court" },
  { id: "random", label: "Random Judge" },
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

const RandomTab = ({ allJudges }) => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    state: "any",
    courtLevel: "any",
    gender: "any",
    party: "any",
  });
  const [picking, setPicking] = useState(false);
  const [noMatch, setNoMatch] = useState(false);

  const setFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setNoMatch(false);
  };

  const handlePick = useCallback(async () => {
    setPicking(true);
    setNoMatch(false);
    try {
      const judges = allJudges || [];
      const pool = judges.filter((j) => matchesFilters(j, filters));
      if (pool.length === 0) {
        setNoMatch(true);
        return;
      }
      const picked = pool[Math.floor(Math.random() * pool.length)];
      navigate(`/judge/${picked.id}`);
    } finally {
      setPicking(false);
    }
  }, [allJudges, filters, navigate]);

  return (
    <div style={{ marginTop: "1.5rem" }}>
      <div className="duel-filter-card" style={{ maxWidth: "720px" }}>
        <h3 className="duel-filter-heading">Optional filters</h3>
        <p className="duel-filter-hint">
          All filters are optional — leave everything on "any" to get a completely random judge.
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
          className="duel-start-button"
          onClick={handlePick}
          disabled={picking || !allJudges}
        >
          {picking ? "Picking…" : !allJudges ? "Loading…" : "Pick Random Judge"}
        </button>

        {noMatch && (
          <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            No judges match those filters — try broadening your selection.
          </p>
        )}
      </div>
    </div>
  );
};

const JudgeSearchPage = () => {
  const [activeTab, setActiveTab] = useState("search");
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
        Search federal and state judges, browse current Supreme Court justices, or discover a
        judge at random.
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

      {activeTab === "random" && (
        <RandomTab allJudges={allJudges} />
      )}
    </div>
  );
};

export default JudgeSearchPage;
