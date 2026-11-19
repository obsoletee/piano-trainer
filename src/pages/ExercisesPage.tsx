import { Link } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";

function ExercisesPage() {
  const { t } = useTranslation();
  return (
    <main className="content-page">
      <div className="page-heading">
        <h1>{t("exercises.title")}</h1>
        <p>{t("exercises.pageDescription")}</p>
      </div>
      <div className="exercise-grid">
        <Link to="/exercises/piano" className="exercise-card">
          <div className="exercise-image">🎹</div>
          <div className="exercise-info">
            <span className="exercise-category">{t("exercises.categoryInstrument")}</span>
            <h2>{t("exercises.piano")}</h2>
            <p>{t("exercises.pianoCardDescription")}</p>
          </div>
        </Link>
        <Link to="/exercises/note-literacy" className="exercise-card">
          <div className="exercise-image">🎼</div>
          <div className="exercise-info">
            <span className="exercise-category">{t("exercises.categoryTheory")}</span>
            <h2>{t("exercises.noteCardTitle")}</h2>
            <p>{t("exercises.noteCardDescription")}</p>
          </div>
        </Link>
      </div>
    </main>
  );
}
export default ExercisesPage;
