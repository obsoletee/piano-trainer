import { useTranslation } from "../../../hooks/useTranslation";
import type { CSSProperties } from "react";
import type { AnswerRecord } from "../types";

interface ResultLevel {
  title: string;
  subtitle: string;
  description: string;
  className: string;
  symbol: string;
}

interface GameResultsProps {
  score: number;
  questionCount: number;
  accuracy: number;
  correct: number;
  partial: number;
  mistakes: number;
  skipped: number;
  averageResponseTime: number;
  answerHistory: AnswerRecord[];
  questionTime: number;
  resultLevel: ResultLevel;
  onRetry: () => void;
}

export default function GameResults({
  score,
  questionCount,
  accuracy,
  correct,
  partial,
  mistakes,
  skipped,
  averageResponseTime,
  answerHistory,
  questionTime,
  resultLevel,
  onRetry,
}: GameResultsProps) {
  const { t } = useTranslation();
  return (
    <section className={`literacy-results ${resultLevel.className}`}>
      <div className="results-main-card">
        <div className="results-eyebrow">
          <span className="results-eyebrow-dot" />
          {t("literacy.resultEyebrow")}
        </div>

        <h2>{t("literacy.completed")}</h2>

        <div className="results-score-layout">
          <div
            className="results-score-ring"
            style={
              {
                "--target-angle": `${score * 3.6}deg`,
              } as CSSProperties
            }
          >
            <div className="results-score-ring-inner">
              <strong>{score.toFixed(1).replace(".0", "")}%</strong>
              <span>{t("literacy.outOf")}</span>
            </div>
          </div>

          <div className="results-score-copy">
            <span className="results-score-label">{t("literacy.yourScore")}</span>
            <h3>{resultLevel.title}</h3>
            <p>{resultLevel.subtitle}</p>
          </div>
        </div>

        <div className="results-metrics">
          <div className="result-metric result-metric-correct">
            <span className="result-metric-icon">✓</span>
            <strong>
              {correct} / {questionCount}
            </strong>
            <span>{t("literacy.correctAnswers")}</span>
            <small>{accuracy}% {t("literacy.accuracy")}</small>
          </div>

          <div className="result-metric result-metric-correct">
            <span className="result-metric-icon">◐</span>
            <strong>{partial}</strong>
            <span>{t("literacy.partlyCorrect")}</span>
            <small>{t("literacy.oneOfTwo")}</small>
          </div>

          <div className="result-metric result-metric-incorrect">
            <span className="result-metric-icon">×</span>
            <strong>{mistakes}</strong>
            <span>{t("literacy.mistakes")}</span>
            <small>{t("literacy.wrongAnswers")}</small>
          </div>

          <div className="result-metric result-metric-skipped">
            <span className="result-metric-icon">⌛</span>
            <strong>{skipped}</strong>
            <span>{t("literacy.skipped")}</span>
            <small>{t("literacy.timeExpired")}</small>
          </div>

          <div className="result-metric result-metric-time">
            <span className="result-metric-icon">◷</span>
            <strong>{averageResponseTime.toFixed(2)} {t("literacy.seconds")}</strong>
            <span>{t("literacy.averageTime")}</span>
            <small>{t("literacy.averageTime")}</small>
          </div>
        </div>

        <div className="results-history">
          <div className="results-history-heading">
            <strong>{t("literacy.history")}</strong>
            <span>
              {answerHistory.length} {t("literacy.of")} {questionCount}
            </span>
          </div>

          <div className="results-history-list">
            {answerHistory.map((answer, index) => (
              <div
                key={`${index}-${answer.noteNumber}-${answer.secondNoteName ?? "single"}`}
                className={`results-history-item ${answer.outcome} ${
                  answer.outcome === "correct" &&
                  answer.responseTime !== null &&
                  answer.responseTime > questionTime / 2
                    ? "slow-correct"
                    : ""
                }`}
                title={
                  answer.outcome === "correct"
                    ? `${t("literacy.correct")}: ${answer.noteName}${answer.secondNoteName ? ` + ${answer.secondNoteName}` : ""}`
                    : answer.outcome === "partial"
                      ? `${t("literacy.partial")}: ${answer.noteName} + ${answer.secondNoteName}`
                      : answer.outcome === "incorrect"
                        ? `${t("literacy.shownNote")}: ${answer.noteName}${answer.secondNoteName ? ` + ${answer.secondNoteName}` : ""}, ${t("literacy.yourAnswer")}: ${answer.userNoteName}`
                        : `${t("literacy.skipped")}: ${answer.noteName}`
                }
              >
                <span className="history-question-number">{index + 1}</span>

                <strong>
                  {answer.outcome === "correct"
                    ? "✓"
                    : answer.outcome === "partial"
                      ? "◐"
                      : answer.outcome === "incorrect"
                        ? "×"
                        : "–"}
                </strong>

                <span className="history-note">
                  {answer.outcome === "incorrect" ? (
                    <>
                      <span>
                        {answer.userNoteName ?? "—"}
                        {answer.userSecondNoteName
                          ? ` + ${answer.userSecondNoteName}`
                          : ""}
                      </span>
                      <small>
                        {t("literacy.correctAnswer")}: {answer.noteName}
                        {answer.secondNoteName
                          ? ` + ${answer.secondNoteName}`
                          : ""}
                      </small>
                    </>
                  ) : answer.outcome === "partial" ? (
                    <>
                      <span>
                        {answer.noteName} + {answer.secondNoteName}
                      </span>
                      <small>{t("literacy.oneOfTwo")}</small>
                    </>
                  ) : (
                    <>
                      {answer.noteName}
                      {answer.secondNoteName
                        ? ` + ${answer.secondNoteName}`
                        : ""}
                    </>
                  )}
                </span>

                <span
                  className={`history-response-time ${
                    answer.outcome === "correct" &&
                    answer.responseTime !== null &&
                    answer.responseTime > questionTime / 2
                      ? "slow-response-time"
                      : ""
                  }`}
                >
                  {answer.responseTime?.toFixed(1)} {t("literacy.seconds")}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onRetry}
          className="primary-button results-retry-button"
        >
          {t("literacy.retry")}
        </button>
      </div>

      <aside className="results-visual-card">
        <div className="results-visual-orbit orbit-one" />
        <div className="results-visual-orbit orbit-two" />
        <div className="results-visual-glow" />

        <div className="results-visual-symbol">
          <span>{resultLevel.symbol}</span>
        </div>

        <div className="results-visual-copy">
          <span>NOTE LITERACY</span>
          <h3>{resultLevel.title}</h3>
          <p>{resultLevel.description}</p>
        </div>

        <div className="results-visual-footer">
          <span>{t("literacy.completed")}</span>
          <span>{Math.round(score)} / 100</span>
        </div>
      </aside>
    </section>
  );
}
