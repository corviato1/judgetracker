import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import sampleJudges from "../data/sampleJudges";
import { getOpinionsForJudge } from "../API/mockApi";

import JudgeDetail from "../components/JudgeDetail";
import OpinionList from "../components/OpinionList";

const JudgeProfilePage = () => {
  const { judgeId } = useParams();
  const [judge, setJudge] = useState(null);
  const [opinions, setOpinions] = useState([]);

  useEffect(() => {
    if (!judgeId) return;
    const numericId = Number(judgeId);
    const foundJudge = sampleJudges.find((j) => j.id === numericId);
    setJudge(foundJudge || null);

    const fetchOpinions = async () => {
      const judgeOpinions = await getOpinionsForJudge(numericId);
      setOpinions(judgeOpinions);
    };

    fetchOpinions();
  }, [judgeId]);

  if (!judge) {
    return (
      <div>
        <h2 className="section-heading">Judge profile</h2>
        <p className="section-subheading">
          No judge found for this identifier in the sample dataset.
        </p>
      </div>
    );
  }

  return (
    <div>
      <JudgeDetail judge={judge} />
      <OpinionList opinions={opinions} />
    </div>
  );
};

export default JudgeProfilePage;
