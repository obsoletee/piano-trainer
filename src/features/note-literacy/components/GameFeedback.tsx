import type { Question } from "../types";

type FeedbackType = "correct" | "partial" | "incorrect" | "timeout" | null;

interface GameFeedbackProps {
  feedbackType: FeedbackType;
  currentQuestion: Question;
  feedbackCountdown: number;
}

export default function GameFeedback({
  feedbackType,
  currentQuestion,
  feedbackCountdown,
}: GameFeedbackProps) {
  return (
    <div
      className={`literacy-feedback-modal ${
        feedbackType === "correct"
          ? "feedback-correct"
          : feedbackType === "partial"
            ? "feedback-partial"
            : feedbackType === "incorrect"
              ? "feedback-incorrect"
              : "feedback-timeout"
      }`}
      role="status"
      aria-live="assertive"
    >
      {feedbackType === "correct" && (
        <>
          <span className="feedback-icon">✓</span>
          <h2>Правильно!</h2>
          <strong>
            {currentQuestion.fullNoteName}
            {currentQuestion.secondNote
              ? ` + ${currentQuestion.secondNote.fullNoteName}`
              : ""}
          </strong>
        </>
      )}

      {feedbackType === "partial" && (
        <>
          <span className="feedback-icon">◐</span>
          <h2>Частично верно</h2>
          <strong>Угадана одна нота из двух</strong>
          <p>
            {currentQuestion.fullNoteName} и{" "}
            {currentQuestion.secondNote?.fullNoteName}
          </p>
        </>
      )}

      {feedbackType === "incorrect" && (
        <>
          <span className="feedback-icon">×</span>
          <h2>Неверно</h2>
          <strong>
            Правильный ответ: {currentQuestion.fullNoteName}
            {currentQuestion.secondNote
              ? ` + ${currentQuestion.secondNote.fullNoteName}`
              : ""}
          </strong>
        </>
      )}

      {feedbackType === "timeout" && (
        <>
          <h2>Время вышло!</h2>
          <strong>
            Правильный ответ: {currentQuestion.fullNoteName}
            {currentQuestion.secondNote
              ? ` + ${currentQuestion.secondNote.fullNoteName}`
              : ""}
          </strong>
        </>
      )}

      <p>Следующий вопрос через {feedbackCountdown.toFixed(1)} секунды</p>
    </div>
  );
}
