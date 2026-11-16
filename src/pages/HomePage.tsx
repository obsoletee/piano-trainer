import { Link } from "react-router-dom";

function HomePage() {
  return (
    <main className="home-page">
      <section className="home-hero">
        <h1>Открой для себя мир музыки</h1>
        <p>
          Интерактивная платформа для обучения игре на пианино. Тренируйся,
          развивай музыкальный слух и совершенствуй свои навыки в удобном темпе.
        </p>
        <Link to="/exercises" className="home-button">
          Начать обучение
        </Link>
      </section>

      <section className="home-about">
        <div>
          <span className="home-kicker">О ПРОЕКТЕ</span>
          <h2>Твой путь к музыке начинается здесь</h2>
        </div>
        <p>
          Piano Trainer — проект, объединяющий инструменты и упражнения для
          самостоятельного обучения игре на фортепиано. Здесь ты сможешь
          практиковаться, экспериментировать со звуком и постепенно улучшать
          свои навыки.
        </p>
      </section>

      <section className="home-training">
        <span className="home-kicker">ПРАКТИКА</span>
        <h2>Начни с первого упражнения</h2>
        <p>
          Попробуй подключить MIDI-клавиатуру и поиграть на виртуальном
          инструменте.
        </p>
        <Link to="/exercises" className="home-text-link">
          Перейти к упражнениям →
        </Link>
      </section>
    </main>
  );
}

export default HomePage;
