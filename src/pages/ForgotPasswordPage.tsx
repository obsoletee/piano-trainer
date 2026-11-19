import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "../hooks/useTranslation";
import "./AccountPages.css";

function ForgotPasswordPage() {
  const { configured } = useAuth();
  const { t } = useTranslation();
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
      setMessage(t("auth.recoverySent"));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("auth.emailError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="account-page">
      <section className="account-card">
        <Link to="/login" className="account-back">{t("auth.backToLogin")}</Link>
        <h1>{t("auth.forgotTitle")}</h1>
        <p className="account-subtitle">{t("auth.forgotDescription")}</p>
        <form onSubmit={handleSubmit} className="account-form">
          <label>{t("auth.email")}<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          {error && <p className="account-message is-error">{error}</p>}
          {message && <p className="account-message">{message}</p>}
          <button className="account-submit" disabled={busy || !configured}>{busy ? t("auth.sending") : t("auth.sendLink")}</button>
        </form>
      </section>
    </main>
  );
}

export default ForgotPasswordPage;
