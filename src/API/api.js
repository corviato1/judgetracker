import { searchJudges, fetchJudgeById, fetchJudgeOpinions, fetchJudgeStats } from "./courtListenerApi";
import { searchJudgesByName as mockSearch, getOpinionsForJudge as mockOpinions } from "./mockApi";
import sampleJudges from "../data/sampleJudges";

export async function searchJudgesByName(query) {
  try {
    return await searchJudges(query);
  } catch (err) {
    console.warn("[API] Backend unavailable, using mock data:", err.message);
    return mockSearch(query);
  }
}

export async function getOpinionsForJudge(judgeId) {
  try {
    return await fetchJudgeOpinions(String(judgeId));
  } catch (err) {
    console.warn("[API] Backend unavailable, using mock data:", err.message);
    return mockOpinions(judgeId);
  }
}

export async function getJudgeById(judgeId) {
  try {
    return await fetchJudgeById(String(judgeId));
  } catch (err) {
    console.warn("[API] Backend unavailable, using mock data:", err.message);
    return sampleJudges.find((j) => j.id === Number(judgeId)) || null;
  }
}

export async function getJudgeStats(judgeId) {
  try {
    return await fetchJudgeStats(String(judgeId));
  } catch (err) {
    console.warn("[API] Stats unavailable:", err.message);
    return null;
  }
}
