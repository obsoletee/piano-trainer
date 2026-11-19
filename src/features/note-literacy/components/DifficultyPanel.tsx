import { useTranslation } from "../../../hooks/useTranslation";
interface DifficultyLevel {
  title: string;
  className: string;
}

interface DifficultyPanelProps {
  rangeDifficulty: number;
  accidentalDifficulty: number;
  timeDifficulty: number;
  clefDifficulty: number;
  countDifficulty: number;
  difficultyScore: number;
  difficultyLevel: DifficultyLevel;
}

function DifficultyPanel({
  rangeDifficulty,
  accidentalDifficulty,
  timeDifficulty,
  clefDifficulty,
  countDifficulty,
  difficultyScore,
  difficultyLevel,
}: DifficultyPanelProps) {
  const { t } = useTranslation();
  return (
    <div className="difficulty-panel">
      <div className="difficulty-heading">
        <div>
          <strong>{t("literacy.difficulty")}</strong>
          <span className={`difficulty-level ${difficultyLevel.className}`}>
            {difficultyLevel.title}
          </span>
        </div>

        <strong>{difficultyScore} / 100</strong>
      </div>

      <div
        className="difficulty-progress"
        role="progressbar"
        aria-label="Сложность упражнения"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={difficultyScore}
      >
        <div
          className={`difficulty-progress-fill ${difficultyLevel.className}`}
          style={{ width: `${difficultyScore}%` }}
        />
      </div>

      <div className="difficulty-breakdown">
        <div>
          <span>{t("literacy.rangeScore")}</span>
          <strong>{rangeDifficulty} / 25</strong>
        </div>
        <div>
          <span>{t("literacy.accidentals")}</span>
          <strong>{accidentalDifficulty} / 25</strong>
        </div>
        <div>
          <span>{t("literacy.time")}</span>
          <strong>{timeDifficulty} / 25</strong>
        </div>
        <div>
          <span>{t("literacy.clefScore")}</span>
          <strong>{clefDifficulty} / 15</strong>
        </div>
        <div>
          <span>{t("literacy.countScore")}</span>
          <strong>{countDifficulty} / 10</strong>
        </div>
      </div>
    </div>
  );
}

export default DifficultyPanel;
