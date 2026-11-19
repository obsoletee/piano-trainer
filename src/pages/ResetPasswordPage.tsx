import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "../hooks/useTranslation";
import "./AccountPages.css";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { configured } = useAuth();
  const { t } = useTranslation();
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
      setMessage(t("auth.passwordUpdated"));
      window.setTimeout(() => navigate("/profile"), 1200);
    } catch {
      setError(t("auth.passwordError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="account-page">
      <section className="account-card">
        <Link to="/login" className="account-back">{t("auth.backToLogin")}</Link>
        <h1>{t("auth.resetTitle")}</h1>
        <form onSubmit={handleSubmit} className="account-form">
          <label>{t("auth.newPassword")}<input type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="new-password" /></label>
          {error && <p className="account-message is-error">{error}</p>}
          {message && <p className="account-message">{message}</p>}
          <button className="account-submit" disabled={busy || !configured}>{busy ? t("auth.saving") : t("auth.savePassword")}</button>
        </form>
      </section>
    </main>
  );
}

export default ResetPasswordPage;
