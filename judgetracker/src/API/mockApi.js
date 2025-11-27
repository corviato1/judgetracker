import sampleJudges from "../data/sampleJudges";
import sampleOpinions from "../data/sampleOpinions";

const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export const searchJudgesByName = async (name) => {
  const normalized = name.toLowerCase();
  await delay(400); // simulate network delay

  return sampleJudges.filter((judge) =>
    judge.fullName.toLowerCase().includes(normalized)
  );
};

export const getOpinionsForJudge = async (judgeId) => {
  await delay(400); // simulate network delay
  return sampleOpinions.filter((opinion) => opinion.judgeId === judgeId);
};
