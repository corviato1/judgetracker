import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getJudgeById, getOpinionsForJudge, getJudgeStats } from "../API/api";
import JudgeDetail from "../components/JudgeDetail";
import OpinionList from "../components/OpinionList";
import JudgeComparison from "../components/JudgeComparison";

const JudgeProfilePage = () => {
  const { judgeId } = useParams();
  const [judge, setJudge] = useState(null);
  const [opinions, setOpinions] = useState([]);
  const [statsData, setStatsData] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!judgeId) return;

    let cancelled = false;
    setLoading(true);
    setStatsLoading(true);
    setError(null);
    setStatsData(undefined);

    async function load() {
      try {
        const [foundJudge, judgeOpinions] = await Promise.all([
          getJudgeById(judgeId),
          getOpinionsForJudge(judgeId),
        ]);
        if (!cancelled) {
          setJudge(foundJudge || null);
          setOpinions(judgeOpinions);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    async function loadStats() {
      try {
        const stats = await getJudgeStats(judgeId);
        if (!cancelled) setStatsData(stats);
      } catch (err) {
        if (!cancelled) setStatsData(null);
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    }

    load();
    loadStats();
    return () => { cancelled = true; };
  }, [judgeId]);

  if (loading) {
    return (
      <div>
        <h2 className="section-heading">Judge profile</h2>
        <p className="section-subheading">Loading judge data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2 className="section-heading">Judge profile</h2>
        <p className="section-subheading">Error: {error}</p>
      </div>
    );
  }

  if (!judge) {
    return (
      <div>
        <h2 className="section-heading">Judge profile</h2>
        <p className="section-subheading">No judge found for this identifier.</p>
      </div>
    );
  }

  return (
    <div>
      <JudgeDetail judge={judge} />
      <JudgeComparison statsData={statsLoading ? undefined : statsData} />
      <OpinionList opinions={opinions} />
    </div>
  );
};

export default JudgeProfilePage;
