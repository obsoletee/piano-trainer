import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Header.css";

function Header() {
  const { user, profile, loading } = useAuth();
  const nickname = profile?.nickname || user?.email || "Pianist";

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to="/" className="site-logo">
          <span>🎹</span>
          <span>Piano Trainer</span>
        </Link>

        <nav className="site-nav">
          <NavLink to="/" end>Главная</NavLink>
          <NavLink to="/exercises">Упражнения</NavLink>
          <NavLink to="/contacts">Контакты</NavLink>
        </nav>

        {loading ? (
          <span className="profile-loading" aria-label="Загрузка профиля" />
        ) : user ? (
          <Link to="/profile" className="profile-account" aria-label={`Профиль: ${nickname}`} title={nickname}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" />
            ) : (
              <span>{nickname.charAt(0).toUpperCase()}</span>
            )}
          </Link>
        ) : (
          <Link to="/login" className="profile-login">Войти</Link>
        )}
      </div>
    </header>
  );
}

export default Header;
