import React, { useState } from "react";
import JudgeSearchForm from "../components/JudgeSearchForm";
import JudgeIndex from "../components/JudgeIndex";
import JudgeList from "../components/JudgeList";

const JudgeSearchPage = () => {
  const [results, setResults] = useState(null);
  const [filterQuery, setFilterQuery] = useState("");

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
          <JudgeList judges={results} />
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
