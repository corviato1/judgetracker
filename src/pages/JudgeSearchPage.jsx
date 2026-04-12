import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import JudgeSearchForm from "../components/JudgeSearchForm";
import JudgeIndex from "../components/JudgeIndex";
import JudgeList from "../components/JudgeList";
import JudgeDetail from "../components/JudgeDetail";
import OpinionList from "../components/OpinionList";
import { getOpinionsForJudge } from "../API/api";

const JudgeSearchPage = () => {
  const [results, setResults] = useState(null);
  const [selectedJudge, setSelectedJudge] = useState(null);
  const [opinions, setOpinions] = useState([]);
  const [filterQuery, setFilterQuery] = useState("");
  const navigate = useNavigate();

  const handleResults = (judges) => {
    if (!judges || judges.length === 0) {
      handleReset();
      return;
    }
    setResults(judges);
    setSelectedJudge(null);
    setOpinions([]);
  };

  const handleReset = () => {
    setResults(null);
    setSelectedJudge(null);
    setOpinions([]);
  };

  const handleSelectJudge = async (judge) => {
    setSelectedJudge(judge);
    const judgeOpinions = await getOpinionsForJudge(judge.id);
    setOpinions(judgeOpinions);
    navigate(`/search`);
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
          <JudgeDetail judge={selectedJudge} />
          <OpinionList opinions={opinions} />
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
