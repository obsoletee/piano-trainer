import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "../hooks/useTranslation";
import "./AccountPages.css";

type AuthMode = "login" | "register";

function AuthPage({ mode }: { mode: AuthMode }) {
  const navigate = useNavigate();
  const { configured } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isRegister = mode === "register";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      if (isRegister) {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { nickname: nickname.trim() },
            emailRedirectTo: window.location.origin,
          },
        });
        if (authError) throw authError;
        if (data.session) navigate("/profile");
        else setMessage(t("auth.confirmationSent"));
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        navigate("/profile");
      }
    } catch {
      setError(t("auth.requestFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="account-page">
      <section className="account-card">
        <Link to="/" className="account-back">{t("auth.backToHome")}</Link>
        <h1>{isRegister ? t("auth.registerTitle") : t("auth.loginTitle")}</h1>
        <p className="account-subtitle">
          {isRegister ? t("auth.registerSubtitle") : t("auth.loginSubtitle")}
        </p>
        {!configured && <p className="account-message is-error">{t("auth.supabaseMissing")}</p>}
        <form onSubmit={handleSubmit} className="account-form">
          {isRegister && (
            <label>{t("auth.nickname")}
              <input value={nickname} onChange={(event) => setNickname(event.target.value)} minLength={1} maxLength={32} required autoComplete="nickname" />
            </label>
          )}
          <label>{t("auth.email")}
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
          </label>
          <label>{t("auth.password")}
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required autoComplete={isRegister ? "new-password" : "current-password"} />
          </label>
          {error && <p className="account-message is-error">{error}</p>}
          {message && <p className="account-message">{message}</p>}
          <button className="account-submit" type="submit" disabled={busy || !configured}>
            {busy ? t("auth.wait") : isRegister ? t("auth.signUp") : t("auth.signIn")}
          </button>
        </form>
        <div className="account-links">
          {isRegister ? <Link to="/login">{t("auth.alreadyHaveAccount")}</Link> : <><Link to="/register">{t("auth.createAccount")}</Link><Link to="/forgot-password">{t("auth.forgotPassword")}</Link></>}
        </div>
      </section>
    </main>
  );
}

export default AuthPage;
