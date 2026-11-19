import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import "./AccountPages.css";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { configured } = useAuth();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setMessage("Пароль обновлён. Теперь можно войти с новым паролем.");
      window.setTimeout(() => navigate("/profile"), 1200);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Не удалось обновить пароль.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="account-page">
      <section className="account-card">
        <Link to="/login" className="account-back">← Ко входу</Link>
        <h1>Новый пароль</h1>
        <form onSubmit={handleSubmit} className="account-form">
          <label>Новый пароль<input type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="new-password" /></label>
          {error && <p className="account-message is-error">{error}</p>}
          {message && <p className="account-message">{message}</p>}
          <button className="account-submit" disabled={busy || !configured}>{busy ? "Сохраняем..." : "Сохранить пароль"}</button>
        </form>
      </section>
    </main>
  );
}

export default ResetPasswordPage;
