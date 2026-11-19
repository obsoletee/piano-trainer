import { Link } from "react-router-dom";
import { useAppLanguage } from "../hooks/useAppLanguage";

function HomePage() {
  const en = useAppLanguage() === "en";
  return (
    <main className="home-page">
      <section className="home-hero">
        <h1>{en ? "Discover the world of music" : "Открой для себя мир музыки"}</h1>
        <p>{en
          ? "An interactive platform for learning piano. Practice, develop your musical ear and improve your skills at your own pace."
          : "Интерактивная платформа для обучения игре на пианино. Тренируйся, развивай музыкальный слух и совершенствуй свои навыки в удобном темпе."}</p>
        <Link to="/exercises" className="home-button">{en ? "Start learning" : "Начать обучение"}</Link>
      </section>
      <section className="home-about">
        <div><span className="home-kicker">{en ? "ABOUT" : "О ПРОЕКТЕ"}</span>
          <h2>{en ? "Your musical journey starts here" : "Твой путь к музыке начинается здесь"}</h2></div>
        <p>{en
          ? "Piano Trainer brings together tools and exercises for independent piano learning. Practice, experiment with sound and gradually improve your skills."
          : "Piano Trainer — проект, объединяющий инструменты и упражнения для самостоятельного обучения игре на фортепиано. Здесь ты сможешь практиковаться, экспериментировать со звуком и постепенно улучшать свои навыки."}</p>
      </section>
      <section className="home-training">
        <span className="home-kicker">{en ? "PRACTICE" : "ПРАКТИКА"}</span>
        <h2>{en ? "Start with your first exercise" : "Начни с первого упражнения"}</h2>
        <p>{en ? "Connect a MIDI keyboard and play the virtual instrument." : "Попробуй подключить MIDI-клавиатуру и поиграть на виртуальном инструменте."}</p>
        <Link to="/exercises" className="home-text-link">{en ? "Explore exercises →" : "Перейти к упражнениям →"}</Link>
      </section>
    </main>
  );
}
export default HomePage;
