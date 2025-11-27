import React from "react";

const QuizQuestionCard = ({ question, onAnswer }) => {
  if (!question) return null;

  return (
    <section className="card" style={{ marginTop: "1rem" }}>
      <p className="small-label">Scenario</p>
      <h3 className="card-title">{question.title}</h3>
      <p className="card-description">{question.scenario}</p>

      <div className="quiz-answers">
        {question.answers.map((answer) => (
          <button
            key={answer.id}
            className="quiz-answer-button"
            onClick={() => onAnswer(answer.id)}
          >
            <div className="quiz-answer-title">{answer.label}</div>
            <div className="quiz-answer-text">{answer.description}</div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default QuizQuestionCard;
