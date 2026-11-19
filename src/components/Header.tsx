import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAppLanguage } from "../hooks/useAppLanguage";
import "./Header.css";

function Header() {
  const { user, profile, loading } = useAuth();
  const language = useAppLanguage();
  const nickname = profile?.nickname || user?.email || "Pianist";
  const labels = language === "en"
    ? { home: "Home", exercises: "Exercises", contacts: "Contacts", login: "Sign in" }
    : { home: "Главная", exercises: "Упражнения", contacts: "Контакты", login: "Войти" };

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to="/" className="site-logo"><span>🎹</span><span>Piano Trainer</span></Link>
        <nav className="site-nav">
          <NavLink to="/" end>{labels.home}</NavLink>
          <NavLink to="/exercises">{labels.exercises}</NavLink>
          <NavLink to="/contacts">{labels.contacts}</NavLink>
        </nav>
        {loading ? (
          <span className="profile-loading" aria-label="Loading profile" />
        ) : user ? (
          <Link to="/profile" className="profile-account" aria-label={`Profile: ${nickname}`} title={nickname}>
            {profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : <span>{nickname.charAt(0).toUpperCase()}</span>}
          </Link>
        ) : (
          <Link to="/login" className="profile-login">{labels.login}</Link>
        )}
      </div>
    </header>
  );
}
export default Header;
