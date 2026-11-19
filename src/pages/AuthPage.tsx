import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import "./AccountPages.css";

type AuthMode = "login" | "register";

function AuthPage({ mode }: { mode: AuthMode }) {
  const navigate = useNavigate();
  const { configured } = useAuth();
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
        else setMessage("Письмо с подтверждением отправлено на указанную почту.");
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        navigate("/profile");
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Не удалось выполнить запрос.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="account-page">
      <section className="account-card">
        <Link to="/" className="account-back">← Piano Trainer</Link>
        <h1>{isRegister ? "Создать аккаунт" : "Войти в аккаунт"}</h1>
        <p className="account-subtitle">
          {isRegister ? "Сохраняй настройки и продолжай обучение на любом устройстве." : "Рады снова видеть тебя!"}
        </p>
        {!configured && <p className="account-message is-error">Supabase пока не настроен. Добавь переменные окружения из .env.example.</p>}
        <form onSubmit={handleSubmit} className="account-form">
          {isRegister && (
            <label>Никнейм
              <input value={nickname} onChange={(event) => setNickname(event.target.value)} minLength={1} maxLength={32} required autoComplete="nickname" />
            </label>
          )}
          <label>Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
          </label>
          <label>Пароль
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required autoComplete={isRegister ? "new-password" : "current-password"} />
          </label>
          {error && <p className="account-message is-error">{error}</p>}
          {message && <p className="account-message">{message}</p>}
          <button className="account-submit" type="submit" disabled={busy || !configured}>
            {busy ? "Подожди..." : isRegister ? "Зарегистрироваться" : "Войти"}
          </button>
        </form>
        <div className="account-links">
          {isRegister ? <Link to="/login">Уже есть аккаунт? Войти</Link> : <><Link to="/register">Создать аккаунт</Link><Link to="/forgot-password">Забыли пароль?</Link></>}
        </div>
      </section>
    </main>
  );
}

export default AuthPage;
