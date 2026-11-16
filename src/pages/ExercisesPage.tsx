import { Link } from "react-router-dom";

function ExercisesPage() {
  return (
    <main className="content-page">
      <div className="page-heading">
        <h1>Упражнения</h1>
        <p>Выбери упражнение и приступай к тренировке.</p>
      </div>

      <div className="exercise-grid">
        <Link to="/exercises/piano" className="exercise-card">
          <div className="exercise-image">🎹</div>
          <div className="exercise-info">
            <span className="exercise-category">ИНСТРУМЕНТ</span>
            <h2>Фортепиано</h2>
            <p>Играй на MIDI-клавиатуре и настраивай звучание.</p>
          </div>
        </Link>
        <Link to="/exercises/note-literacy" className="exercise-card">
          <div className="exercise-image">🎼</div>
          <div className="exercise-info">
            <span className="exercise-category">ТЕОРИЯ</span>
            <h2>Нотная грамота</h2>
            <p>Распознавай ноты на нотном стане с помощью MIDI-клавиатуры.</p>
          </div>
        </Link>
      </div>
    </main>
  );
}

export default ExercisesPage;
