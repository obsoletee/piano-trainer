import { useTranslation } from "../hooks/useTranslation";

function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="site-footer">
      <span>🎹 Piano Trainer</span>
      <span>Интерактивные упражнения для обучения игре на пианино</span>
      <span>Version 1.2 BETA</span>
    </footer>
  );
}

export default Footer;
