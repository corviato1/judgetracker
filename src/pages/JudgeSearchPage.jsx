import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import JudgeSearchForm from "../components/JudgeSearchForm";
import JudgeIndex from "../components/JudgeIndex";
import JudgeList from "../components/JudgeList";

const JudgeSearchPage = () => {
  const [results, setResults] = useState(null);
  const [filterQuery, setFilterQuery] = useState("");
  const navigate = useNavigate();

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

  const handleSelectJudge = (judge) => {
    try {
      navigate(`/judge/${judge.id}`);
    } catch (err) {
      console.error("[JudgeSearchPage] Navigation error:", err);
    }
  };

  const hasSearchResults = results !== null;

  return (
    <div>
      <h2 className="section-heading">Judge search</h2>
      <p className="section-subheading">
        Search for a federal or state judge by name. Results are sourced from
        CourtListener's public database and cached for performance.
      </p>

      {hasSearchResults ? (
        <>
          <JudgeSearchForm
            onResults={handleResults}
            onQueryChange={(q) => {
              setFilterQuery(q);
              if (!q) handleReset();
            }}
          />
          <JudgeList judges={results} onSelectJudge={handleSelectJudge} />
        </>
      ) : (
        <>
          <JudgeIndex filterQuery={filterQuery} />
          <JudgeSearchForm
            onResults={handleResults}
            onQueryChange={(q) => {
              setFilterQuery(q);
              if (!q) handleReset();
            }}
          />
        </>
      )}
    </div>
  );
};

export default JudgeSearchPage;
