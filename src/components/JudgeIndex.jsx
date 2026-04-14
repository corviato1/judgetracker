import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { listAllJudges } from "../API/api";
import JudgeCard from "./JudgeCard";

const SORT_OPTIONS = [
  { value: "name", label: "Name (A–Z)" },
  { value: "court", label: "Court" },
  { value: "party", label: "Party" },
];

const JudgeIndex = ({ filterQuery }) => {
  const [allJudges, setAllJudges] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState("name");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listAllJudges().then((judges) => {
      if (cancelled) return;
      setAllJudges(Array.isArray(judges) ? judges : []);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = (filterQuery || "").trim().toLowerCase();
    let list = q
      ? allJudges.filter(
          (j) =>
            (j.fullName || "").toLowerCase().includes(q) ||
            (j.courtName || "").toLowerCase().includes(q) ||
            (j.jurisdiction || "").toLowerCase().includes(q) ||
            (j.partyOfAppointment || "").toLowerCase().includes(q)
        )
      : allJudges;

    return [...list].sort((a, b) => {
      if (sortBy === "name") {
        return (a.fullName || "").localeCompare(b.fullName || "");
      }
      if (sortBy === "court") {
        return (a.courtName || "").localeCompare(b.courtName || "");
      }
      if (sortBy === "party") {
        return (a.partyOfAppointment || "").localeCompare(b.partyOfAppointment || "");
      }
      return 0;
    });
  }, [allJudges, filterQuery, sortBy]);

  if (loading) {
    return <p className="judge-index-loading">Loading judges…</p>;
  }

  return (
    <div className="judge-index">
      <div className="judge-index-controls">
        <span className="judge-index-count">
          {filtered.length} judge{filtered.length !== 1 ? "s" : ""}
        </span>
        <div className="judge-index-sort">
          <label htmlFor="judge-sort">Sort by</label>
          <select
            id="judge-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="judge-index-empty">
          {allJudges.length === 0
            ? "No judges indexed yet. Use the search bar above to find and add judges."
            : "No judges match your filter."}
        </p>
      ) : (
        <div className="judge-index-grid">
          {filtered.map((judge) => (
            <JudgeCard
              key={judge.id}
              judge={judge}
              onSelectJudge={() => navigate(`/judge/${judge.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default JudgeIndex;
