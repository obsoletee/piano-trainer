import { Link } from "react-router-dom";
import { useAppLanguage } from "../hooks/useAppLanguage";

function ExercisesPage() {
  const en = useAppLanguage() === "en";
  return (
    <main className="content-page">
      <div className="page-heading">
        <h1>{en ? "Exercises" : "Упражнения"}</h1>
        <p>{en ? "Choose an exercise and start practicing." : "Выбери упражнение и приступай к тренировке."}</p>
      </div>
      <div className="exercise-grid">
        <Link to="/exercises/piano" className="exercise-card">
          <div className="exercise-image">🎹</div>
          <div className="exercise-info">
            <span className="exercise-category">{en ? "INSTRUMENT" : "ИНСТРУМЕНТ"}</span>
            <h2>{en ? "Piano" : "Фортепиано"}</h2>
            <p>{en ? "Play with a MIDI keyboard and adjust the sound." : "Играй на MIDI-клавиатуре и настраивай звучание."}</p>
          </div>
        </Link>
        <Link to="/exercises/note-literacy" className="exercise-card">
          <div className="exercise-image">🎼</div>
          <div className="exercise-info">
            <span className="exercise-category">{en ? "THEORY" : "ТЕОРИЯ"}</span>
            <h2>{en ? "Note reading" : "Нотная грамота"}</h2>
            <p>{en ? "Read notes on the staff using your MIDI keyboard." : "Распознавай ноты на нотном стане с помощью MIDI-клавиатуры."}</p>
          </div>
        </Link>
      </div>
    </main>
  );
}
export default ExercisesPage;
