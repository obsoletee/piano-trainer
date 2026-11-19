import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { AppLanguage, NoteNotation, UserProfile } from "../types/profile";
import { useTranslation } from "../hooks/useTranslation";
import "./AccountPages.css";

function ProfileForm({ profile, email }: { profile: UserProfile; email: string }) {
  const { configured, updateProfile, uploadAvatar, signOut } = useAuth();
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [nickname, setNickname] = useState(profile.nickname);
  const [language, setLanguage] = useState<AppLanguage>(profile.language);
  const [notation, setNotation] = useState<NoteNotation>(profile.note_notation);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await updateProfile({ nickname: nickname.trim(), language, note_notation: notation });
      setMessage(t("profile.saved"));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t("profile.saveError"));
    } finally {
      setBusy(false);
    }
  };

  const handleAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await uploadAvatar(file);
      setMessage(t("profile.avatarUpdated"));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : t("profile.avatarError"));
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  };

  return (
    <main className="account-page profile-page">
      <section className="account-card profile-card">
        <Link to="/" className="account-back">{t("auth.backToHome")}</Link>
        <div className="profile-heading">
          <button type="button" className="avatar-upload" onClick={() => fileRef.current?.click()} aria-label={t("profile.changeAvatar")} disabled={busy}>
            {profile.avatar_url ? <img src={profile.avatar_url} alt={t("profile.avatarAlt")} /> : <span>{(profile.nickname || email || "P").charAt(0).toUpperCase()}</span>}
            <i>{t("profile.change")}</i>
          </button>
          <div><h1>{t("profile.title")}</h1><p>{email}</p></div>
        </div>
        <input ref={fileRef} className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleAvatar} />
        <form className="account-form" onSubmit={saveProfile}>
          <label>{t("auth.nickname")}<input value={nickname} onChange={(event) => setNickname(event.target.value)} minLength={1} maxLength={32} required /></label>
          <label>{t("profile.language")}
            <select value={language} onChange={(event) => setLanguage(event.target.value as AppLanguage)}>
              <option value="ru">{t("profile.russianLanguage")}</option><option value="en">{t("profile.englishLanguage")}</option>
            </select>
          </label>
          <label>{t("profile.notation")}
            <select value={notation} onChange={(event) => setNotation(event.target.value as NoteNotation)}>
              <option value="international">{t("profile.international")}</option>
              <option value="russian">{t("profile.russian")}</option>
            </select>
          </label>
          {error && <p className="account-message is-error">{error}</p>}
          {message && <p className="account-message">{message}</p>}
          <button className="account-submit" type="submit" disabled={busy || !configured}>{busy ? t("auth.saving") : t("profile.save")}</button>
        </form>
        <button className="account-secondary" type="button" onClick={() => void signOut()}>{t("profile.logout")}</button>
      </section>
    </main>
  );
}

function ProfilePage() {
  const { user, profile, loading } = useAuth();
  const { t } = useTranslation();
  if (loading) return <main className="account-page"><p>{t("profile.loading")}</p></main>;
  if (!user) return <Navigate to="/login" replace />;
  if (!profile) return <main className="account-page"><section className="account-card"><h1>{t("profile.loadingTitle")}</h1><p>{t("profile.loadingDescription")}</p></section></main>;
  return <ProfileForm key={profile.id} profile={profile} email={user.email ?? ""} />;
}

export default ProfilePage;
