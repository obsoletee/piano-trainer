import { useTranslation } from "../../../hooks/useTranslation";
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
  const { t } = useTranslation();
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
          <h2>{t("literacy.correct")}</h2>
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
          <h2>{t("literacy.partial")}</h2>
          <strong>{t("literacy.partialHint")}</strong>
          <p>
            {currentQuestion.fullNoteName} и{" "}
            {currentQuestion.secondNote?.fullNoteName}
          </p>
        </>
      )}

      {feedbackType === "incorrect" && (
        <>
          <span className="feedback-icon">×</span>
          <h2>{t("literacy.incorrect")}</h2>
          <strong>
            {t("literacy.correctAnswer")} {currentQuestion.fullNoteName}
            {currentQuestion.secondNote
              ? ` + ${currentQuestion.secondNote.fullNoteName}`
              : ""}
          </strong>
        </>
      )}

      {feedbackType === "timeout" && (
        <>
          <h2>{t("literacy.timeout")}</h2>
          <strong>
            {t("literacy.correctAnswer")} {currentQuestion.fullNoteName}
            {currentQuestion.secondNote
              ? ` + ${currentQuestion.secondNote.fullNoteName}`
              : ""}
          </strong>
        </>
      )}

      <p>{t("literacy.nextQuestion")} {feedbackCountdown.toFixed(1)} {t("literacy.seconds")}</p>
    </div>
  );
}
