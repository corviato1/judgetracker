import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import JudgeSearchForm from "../components/JudgeSearchForm";
import JudgeList from "../components/JudgeList";
import JudgeDetail from "../components/JudgeDetail";
import OpinionList from "../components/OpinionList";
import { getOpinionsForJudge } from "../API/api";

const JudgeSearchPage = () => {
  const [results, setResults] = useState([]);
  const [selectedJudge, setSelectedJudge] = useState(null);
  const [opinions, setOpinions] = useState([]);
  const navigate = useNavigate();

  const handleResults = (judges) => {
    setResults(judges);
    setSelectedJudge(null);
    setOpinions([]);
  };

  const handleSelectJudge = async (judge) => {
    setSelectedJudge(judge);
    const judgeOpinions = await getOpinionsForJudge(judge.id);
    setOpinions(judgeOpinions);
    navigate(`/search`);
  };

  return (
    <div>
      <h2 className="section-heading">Judge search</h2>
      <p className="section-subheading">
        Search for a federal or state judge by name. Results are sourced from
        CourtListener's public database and cached for performance.
      </p>

      <JudgeSearchForm onResults={handleResults} />
      <JudgeList judges={results} onSelectJudge={handleSelectJudge} />
      <JudgeDetail judge={selectedJudge} />
      <OpinionList opinions={opinions} />
    </div>
  );
};

export default JudgeSearchPage;
