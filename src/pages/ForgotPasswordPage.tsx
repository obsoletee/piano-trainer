import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import "./AccountPages.css";

function ForgotPasswordPage() {
  const { configured } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const { error: requestError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (requestError) throw requestError;
      setMessage("Если аккаунт с таким email существует, мы отправили письмо со ссылкой для восстановления.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось отправить письмо.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="account-page">
      <section className="account-card">
        <Link to="/login" className="account-back">← Назад ко входу</Link>
        <h1>Восстановление пароля</h1>
        <p className="account-subtitle">Укажи email, привязанный к аккаунту.</p>
        <form onSubmit={handleSubmit} className="account-form">
          <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          {error && <p className="account-message is-error">{error}</p>}
          {message && <p className="account-message">{message}</p>}
          <button className="account-submit" disabled={busy || !configured}>{busy ? "Отправляем..." : "Отправить ссылку"}</button>
        </form>
      </section>
    </main>
  );
}

export default ForgotPasswordPage;
