import { Link } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";
import { useAppLanguage } from "../hooks/useAppLanguage";

function HomePage() {
  const { t } = useTranslation();
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
        <span className="home-kicker">{en ? t("home.practice")}</span>
        <h2>{en ? t("home.firstExercise")}</h2>
        <p>{en ? t("home.firstExerciseDescription")}</p>
        <Link to="/exercises" className="home-text-link">{en ? t("home.explore")}</Link>
      </section>
    </main>
  );
}
export default HomePage;
