import React, { useState } from "react";

import QuizIntro from "../components/QuizIntro";
import QuizQuestionCard from "../components/QuizQuestionCard";
import QuizResult from "../components/QuizResult";

import quizQuestions from "../data/quizQuestions";
import sampleJudges from "../data/sampleJudges";

const WhichJudgeGamePage = () => {
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);

  const currentQuestion = quizQuestions[currentIndex];
  const total = quizQuestions.length;
  const progressPct = total > 0 ? Math.round(((currentIndex + 1) / total) * 100) : 0;

  const sectionQuestions = currentQuestion
    ? quizQuestions.filter((q) => q.section === currentQuestion.section)
    : [];
  const sectionIndexWithin = currentQuestion
    ? sectionQuestions.findIndex((q) => q.id === currentQuestion.id)
    : 0;
  const sectionProgressLabel = currentQuestion
    ? `${currentQuestion.sectionLabel} — Question ${sectionIndexWithin + 1} of ${sectionQuestions.length} in this section`
    : "";

  const handleStart = () => {
    setStarted(true);
    setCurrentIndex(0);
    setAnswers([]);
    setResult(null);
  };

  const handleAnswer = (questionId, answerId) => {
    const nextAnswers = [
      ...answers.filter((a) => a.questionId !== questionId),
      { questionId, answerId },
    ];
    setAnswers(nextAnswers);

    const isLastQuestion = currentIndex === quizQuestions.length - 1;
    if (isLastQuestion) {
      const computedResult = computeResult(nextAnswers);
      setResult(computedResult);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleRestart = () => {
    setStarted(false);
    setCurrentIndex(0);
    setAnswers([]);
    setResult(null);
  };

  const computeResult = (allAnswers) => {
    const scoreByJudgeId = {};

    allAnswers.forEach((entry) => {
      const question = quizQuestions.find((q) => q.id === entry.questionId);
      if (!question) return;

      const answer = question.answers.find((a) => a.id === entry.answerId);
      if (!answer || !answer.weights) return;

      Object.entries(answer.weights).forEach(([judgeIdString, weight]) => {
        const judgeId = Number(judgeIdString);
        if (!scoreByJudgeId[judgeId]) scoreByJudgeId[judgeId] = 0;
        scoreByJudgeId[judgeId] += weight;
      });
    });

    const scoredJudges = sampleJudges
      .map((judge) => ({
        judge,
        score: scoreByJudgeId[judge.id] || 0,
      }))
      .sort((a, b) => b.score - a.score);

    const top = scoredJudges[0] || null;
    const isTie =
      scoredJudges.length > 1 && top && scoredJudges[1].score === top.score;

    return {
      topMatch: top,
      breakdown: scoredJudges,
      isTie,
    };
  };

  return (
    <div>
      <h2 className="section-heading">Which judge are you?</h2>
      <p className="section-subheading">
        Answer 15 case-style questions and see which judicial philosophy your
        instincts most resemble. Questions are drawn from real patterns in
        judicial opinions and rulings history — the result maps your reasoning
        style to one of five distinct approaches to the law.
      </p>

      {!started && !result && <QuizIntro onStart={handleStart} />}

      {started && !result && currentQuestion && (
        <>
          <div className="quiz-progress-wrapper" style={{ marginTop: "1.25rem", marginBottom: "0.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.35rem" }}>
              <span className="small-label" style={{ fontSize: "0.78rem", letterSpacing: "0.06em", color: "#a0aec0" }}>
                {sectionProgressLabel}
              </span>
              <span style={{ fontSize: "0.8rem", color: "#718096" }}>
                {currentIndex + 1} / {total}
              </span>
            </div>
            <div
              style={{
                height: "5px",
                borderRadius: "3px",
                background: "rgba(255,255,255,0.08)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progressPct}%`,
                  background: "linear-gradient(90deg, #667eea, #764ba2)",
                  borderRadius: "3px",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>

          <QuizQuestionCard
            question={currentQuestion}
            onAnswer={(answerId) =>
              handleAnswer(currentQuestion.id, answerId)
            }
          />
        </>
      )}

      {result && (
        <QuizResult result={result} onRestart={handleRestart} />
      )}
    </div>
  );
};

export default WhichJudgeGamePage;
