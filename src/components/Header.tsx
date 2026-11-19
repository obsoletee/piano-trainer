import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "../hooks/useTranslation";
import "./Header.css";

function Header() {
  const { user, profile, loading, signOut } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuError, setMenuError] = useState("");
  const nickname = profile?.nickname || user?.email || "Pianist";
  const labels = { home: t("header.home"), exercises: t("header.exercises"), contacts: t("header.contacts"), login: t("header.login") };

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
        setMenuError("");
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setMenuError("");
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSignOut = async (destination: "/login" | "/") => {
    setMenuError("");
    try {
      await signOut();
      setMenuOpen(false);
      navigate(destination);
    } catch {
      setMenuError(t("profile.signOutError"));
    }
  };

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
          <span className="profile-loading" aria-label={t("header.loadingProfile")} />
        ) : user ? (
          <div className="profile-menu-root" ref={menuRef}>
            <button
              type="button"
              className={`profile-account profile-menu-trigger ${menuOpen ? "is-open" : ""}`}
              aria-label={t("header.profileMenu")}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              title={nickname}
              onClick={() => {
                setMenuOpen((open) => !open);
                setMenuError("");
              }}
            >
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : <span>{nickname.charAt(0).toUpperCase()}</span>}
            </button>
            {menuOpen && (
              <div className="profile-popover" role="menu">
                <div className="profile-popover-heading">
                  <span className="profile-popover-name">{nickname}</span>
                  <span className="profile-popover-email">{user.email}</span>
                </div>
                <Link to="/profile" role="menuitem" className="profile-popover-item" onClick={() => setMenuOpen(false)}>
                  <span className="profile-popover-icon" aria-hidden="true">◈</span>
                  {t("profile.menuProfile")}
                </Link>
                <button type="button" role="menuitem" className="profile-popover-item" onClick={() => void handleSignOut("/login")}>
                  <span className="profile-popover-icon" aria-hidden="true">⇄</span>
                  {t("profile.switchAccount")}
                </button>
                <button type="button" role="menuitem" className="profile-popover-item is-danger" onClick={() => void handleSignOut("/")}>
                  <span className="profile-popover-icon" aria-hidden="true">↪</span>
                  {t("profile.logout")}
                </button>
                {menuError && <p className="profile-popover-error">{menuError}</p>}
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className="profile-login">{labels.login}</Link>
        )}
      </div>
    </header>
  );
}
export default Header;
