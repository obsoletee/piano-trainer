import { Link } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";

function HomePage() {
  const { t } = useTranslation();
  return (
    <main className="home-page">
      <section className="home-hero">
        <h1>{t("home.heroTitle")}</h1>
        <p>{t("home.heroDescription")}</p>
        <Link to="/exercises" className="home-button">{t("home.heroCta")}</Link>
      </section>
      <section className="home-about">
        <div><span className="home-kicker">{t("home.aboutEyebrow")}</span>
          <h2>{t("home.aboutTitle")}</h2></div>
        <p>{t("home.aboutDescription")}</p>
      </section>
      <section className="home-training">
        <span className="home-kicker">{t("home.practice")}</span>
        <h2>{t("home.firstExercise")}</h2>
        <p>{t("home.firstExerciseDescription")}</p>
        <Link to="/exercises" className="home-text-link">{t("home.explore")}</Link>
      </section>
    </main>
  );
}
export default HomePage;
