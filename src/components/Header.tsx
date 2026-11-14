import { Link, NavLink } from "react-router-dom";
import "./Header.css";

function Header() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to="/" className="site-logo">
          <span>🎹</span>
          <span>Piano Trainer</span>
        </Link>

        <nav className="site-nav">
          <NavLink to="/" end>
            Главная
          </NavLink>
          <NavLink to="/exercises">Упражнения</NavLink>
          <NavLink to="/contacts">Контакты</NavLink>
        </nav>

        <button
          className="profile-button"
          type="button"
          aria-label="Профиль"
          title="Профиль (скоро)"
          disabled
        >
          <span>♙</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
