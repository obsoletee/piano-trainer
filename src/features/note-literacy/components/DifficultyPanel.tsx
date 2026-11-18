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
  return (
    <div className="difficulty-panel">
      <div className="difficulty-heading">
        <div>
          <strong>Сложность упражнения</strong>
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
          <span>Диапазон нот</span>
          <strong>{rangeDifficulty} / 25</strong>
        </div>
        <div>
          <span>Знаки альтерации</span>
          <strong>{accidentalDifficulty} / 25</strong>
        </div>
        <div>
          <span>Время на ответ</span>
          <strong>{timeDifficulty} / 25</strong>
        </div>
        <div>
          <span>Нотный ключ</span>
          <strong>{clefDifficulty} / 15</strong>
        </div>
        <div>
          <span>Количество вопросов</span>
          <strong>{countDifficulty} / 10</strong>
        </div>
      </div>
    </div>
  );
}

export default DifficultyPanel;
