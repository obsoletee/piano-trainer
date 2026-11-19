import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { AppLanguage, NoteNotation, UserProfile } from "../types/profile";
import "./AccountPages.css";

function ProfileForm({ profile, email }: { profile: UserProfile; email: string }) {
  const { configured, updateProfile, uploadAvatar, signOut } = useAuth();
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
      setMessage("Настройки профиля сохранены.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Не удалось сохранить профиль.");
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
      setMessage("Аватар обновлён.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Не удалось загрузить аватар.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  };

  return (
    <main className="account-page profile-page">
      <section className="account-card profile-card">
        <Link to="/" className="account-back">← На главную</Link>
        <div className="profile-heading">
          <button type="button" className="avatar-upload" onClick={() => fileRef.current?.click()} aria-label="Изменить аватар" disabled={busy}>
            {profile.avatar_url ? <img src={profile.avatar_url} alt="Аватар профиля" /> : <span>{(profile.nickname || email || "P").charAt(0).toUpperCase()}</span>}
            <i>Изменить</i>
          </button>
          <div><h1>Личный кабинет</h1><p>{email}</p></div>
        </div>
        <input ref={fileRef} className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleAvatar} />
        <form className="account-form" onSubmit={saveProfile}>
          <label>Никнейм<input value={nickname} onChange={(event) => setNickname(event.target.value)} minLength={1} maxLength={32} required /></label>
          <label>Язык интерфейса
            <select value={language} onChange={(event) => setLanguage(event.target.value as AppLanguage)}>
              <option value="ru">Русский</option><option value="en">English</option>
            </select>
          </label>
          <label>Система названий нот
            <select value={notation} onChange={(event) => setNotation(event.target.value as NoteNotation)}>
              <option value="international">Международная — C, D, E...</option>
              <option value="russian">Русская — До, Ре, Ми...</option>
            </select>
          </label>
          {error && <p className="account-message is-error">{error}</p>}
          {message && <p className="account-message">{message}</p>}
          <button className="account-submit" type="submit" disabled={busy || !configured}>{busy ? "Сохраняем..." : "Сохранить изменения"}</button>
        </form>
        <button className="account-secondary" type="button" onClick={() => void signOut()}>Выйти из аккаунта</button>
      </section>
    </main>
  );
}

function ProfilePage() {
  const { user, profile, loading } = useAuth();
  if (loading) return <main className="account-page"><p>Загружаем профиль...</p></main>;
  if (!user) return <Navigate to="/login" replace />;
  if (!profile) return <main className="account-page"><section className="account-card"><h1>Профиль загружается</h1><p>Если профиль не появился, попробуй обновить страницу.</p></section></main>;
  return <ProfileForm key={profile.id} profile={profile} email={user.email ?? ""} />;
}

export default ProfilePage;
