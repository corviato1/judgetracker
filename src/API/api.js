import { searchJudges, fetchJudgeById, fetchJudgeOpinions, fetchJudgeStats, fetchAllJudges, fetchJudgeHistory } from "./courtListenerApi";

export async function searchJudgesByName(query) {
  return await searchJudges(query);
}

export async function getOpinionsForJudge(judgeId) {
  return await fetchJudgeOpinions(String(judgeId));
}

export async function getJudgeById(judgeId) {
  return await fetchJudgeById(String(judgeId));
}

export async function listAllJudges() {
  return await fetchAllJudges();
}

export async function getJudgeStats(judgeId) {
  try {
    return await fetchJudgeStats(String(judgeId));
  } catch (err) {
    console.warn("[API] Stats unavailable:", err.message);
    return null;
  }
}

export async function getJudgeHistory(judgeId) {
  return await fetchJudgeHistory(String(judgeId));
}
