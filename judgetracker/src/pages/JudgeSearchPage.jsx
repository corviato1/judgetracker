import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import JudgeSearchForm from "../components/JudgeSearchForm";
import JudgeList from "../components/JudgeList";
import JudgeDetail from "../components/JudgeDetail";
import OpinionList from "../components/OpinionList";
import { getOpinionsForJudge } from "../API/mockApi";

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
      <h2 className="section-heading">Judge search demo</h2>
      <p className="section-subheading">
        This is a fully front-end prototype wired to sample data. In the
        production version, this search will query a backend that aggregates
        public case law, dockets, and judge metadata.
      </p>

      <JudgeSearchForm onResults={handleResults} />
      <JudgeList judges={results} onSelectJudge={handleSelectJudge} />
      <JudgeDetail judge={selectedJudge} />
      <OpinionList opinions={opinions} />
    </div>
  );
};

export default JudgeSearchPage;
