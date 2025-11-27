import React, { useState } from "react";

import QuizIntro from "../components/QuizIntro";
import QuizQuestionCard from "../components/QuizQuestionCard";
import QuizResult from "../components/QuizResult";

import quizQuestions from "../data/quizQuestions";
import sampleJudges from "../data/sampleJudges";

const WhichJudgeGamePage = () => {
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]); // { questionId, answerId }
  const [result, setResult] = useState(null);

  const currentQuestion = quizQuestions[currentIndex];

  const handleStart = () => {
    setStarted(true);
    setCurrentIndex(0);
    setAnswers([]);
    setResult(null);
  };

  const handleAnswer = (questionId, answerId) => {
    // store answer
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
    // score judges
    const scoreByJudgeId = {};

    allAnswers.forEach((entry) => {
      const question = quizQuestions.find((q) => q.id === entry.questionId);
      if (!question) return;

      const answer = question.answers.find(
        (a) => a.id === entry.answerId
      );
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
      scoredJudges.length > 1 &&
      top &&
      scoredJudges[1].score === top.score;

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
        Answer a handful of case-style questions and see which judge in
        this demo dataset your instincts most resemble. This is a playful
        Buzzfeed-style quiz, not a scientific measurement, but it
        illustrates how JudgeTracker could map users’ preferences to real
        judicial tendencies.
      </p>

      {!started && !result && <QuizIntro onStart={handleStart} />}

      {started && !result && currentQuestion && (
        <>
          <div className="quiz-progress">
            Question {currentIndex + 1} of {quizQuestions.length}
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
        <QuizResult
          result={result}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
};

export default WhichJudgeGamePage;
