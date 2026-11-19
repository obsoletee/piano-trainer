import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import CustomSelect from "../components/CustomSelect/CustomSelect";
import { useAuth } from "../hooks/useAuth";
import type { AppLanguage, NoteNotation, UserProfile } from "../types/profile";
import { useTranslation } from "../hooks/useTranslation";
import { supabase } from "../lib/supabase";
import "./AccountPages.css";

type ToastState = { message: string; type: "success" | "error" } | null;
type ProfileTab = "account" | "languages";

function ProfileForm({ profile, email }: { profile: UserProfile; email: string }) {
  const { configured, updateProfile, uploadAvatar, signOut } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>("account");
  const [nickname, setNickname] = useState(profile.nickname);
  const [emailValue, setEmailValue] = useState(email);
  const [language, setLanguage] = useState<AppLanguage>(profile.language);
  const [notation, setNotation] = useState<NoteNotation>(profile.note_notation);
  const [toast, setToast] = useState<ToastState>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const handleAccountSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      await updateProfile({ nickname: nickname.trim() });
      const nextEmail = emailValue.trim();
      if (nextEmail && nextEmail.toLowerCase() !== email.toLowerCase()) {
        const { error } = await supabase.auth.updateUser({ email: nextEmail });
        if (error) throw error;
        setToast({ message: t("profile.emailConfirmation"), type: "success" });
      } else {
        setToast({ message: t("profile.applied"), type: "success" });
      }
    } catch {
      setToast({ message: t("profile.accountSaveError"), type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const handleLanguagesSave = async () => {
    setBusy(true);
    try {
      await updateProfile({ language, note_notation: notation });
      setToast({ message: t("profile.applied"), type: "success" });
    } catch {
      setToast({ message: t("profile.saveError"), type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const handleAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setToast({ message: t("profile.imageOnly"), type: "error" });
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: t("profile.imageTooLarge"), type: "error" });
      event.target.value = "";
      return;
    }
    setBusy(true);
    try {
      await uploadAvatar(file);
      setToast({ message: t("profile.avatarUpdated"), type: "success" });
    } catch {
      setToast({ message: t("profile.avatarError"), type: "error" });
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  };

  const handleSignOut = async (destination: "/login" | "/") => {
    try {
      await signOut();
      navigate(destination);
    } catch {
      setToast({ message: t("profile.signOutError"), type: "error" });
    }
  };

  return (
    <main className="account-page profile-page">
      {toast && (
        <div className={`profile-toast ${toast.type === "error" ? "is-error" : ""}`} role="status" aria-live="polite">
          <span className="profile-toast-icon" aria-hidden="true">{toast.type === "error" ? "!" : "✓"}</span>
          <span>{toast.message}</span>
        </div>
      )}
      <div className="profile-shell">
        <header className="profile-page-heading">
          <div>
            <span className="profile-eyebrow">PIANO TRAINER / PERSONAL SPACE</span>
            <h1>{t("profile.title")}</h1>
            <p>{email}</p>
          </div>
          <Link to="/" className="profile-home-link">{t("auth.backToHome")}</Link>
        </header>

        <div className="profile-layout">
          <aside className="profile-sidebar">
            <div className="profile-sidebar-user">
              <button type="button" className="avatar-upload profile-avatar" onClick={() => fileRef.current?.click()} aria-label={t("profile.changeAvatar")} disabled={busy}>
                {profile.avatar_url ? <img src={profile.avatar_url} alt={t("profile.avatarAlt")} /> : <span>{(profile.nickname || email || "P").charAt(0).toUpperCase()}</span>}
                <i aria-hidden="true">✎</i>
              </button>
              <div className="profile-sidebar-identity">
                <strong>{profile.nickname}</strong>
                <span>{email}</span>
              </div>
            </div>
            <div className="profile-sidebar-divider" />
            <span className="profile-sidebar-label">{t("profile.settingsLabel")}</span>
            <nav className="profile-tabs" aria-label={t("profile.settingsLabel")}>
              <button type="button" className={activeTab === "account" ? "is-active" : ""} aria-current={activeTab === "account" ? "page" : undefined} onClick={() => setActiveTab("account")}>
                <span className="profile-tab-icon" aria-hidden="true">◉</span>
                <span>{t("profile.tabAccount")}</span>
                <span className="profile-tab-arrow" aria-hidden="true">›</span>
              </button>
              <button type="button" className={activeTab === "languages" ? "is-active" : ""} aria-current={activeTab === "languages" ? "page" : undefined} onClick={() => setActiveTab("languages")}>
                <span className="profile-tab-icon" aria-hidden="true">文</span>
                <span>{t("profile.tabLanguages")}</span>
                <span className="profile-tab-arrow" aria-hidden="true">›</span>
              </button>
            </nav>
            <div className="profile-sidebar-bottom">
              <span className="profile-online-dot" />
              <span>{t("profile.accountActive")}</span>
            </div>
          </aside>

          <section className="profile-content">
            {activeTab === "account" ? (
              <div className="profile-panel">
                <div className="profile-panel-heading">
                  <span className="profile-panel-index">01 / ACCOUNT</span>
                  <h2>{t("profile.tabAccount")}</h2>
                  <p>{t("profile.accountDescription")}</p>
                </div>
                <input ref={fileRef} className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleAvatar} />
                <form className="account-form profile-settings-form" onSubmit={(event) => void handleAccountSave(event)}>
                  <label>{t("auth.nickname")}<input value={nickname} onChange={(event) => setNickname(event.target.value)} minLength={1} maxLength={32} required /></label>
                  <label>{t("auth.email")}<input type="email" value={emailValue} onChange={(event) => setEmailValue(event.target.value)} required autoComplete="email" /></label>
                  <p className="profile-field-hint">{t("profile.emailHint")}</p>
                  <button className="account-submit profile-save-button" type="submit" disabled={busy || !configured}>{busy ? t("auth.saving") : t("profile.saveAccount")}</button>
                </form>
                <div className="profile-danger-zone">
                  <div>
                    <strong>{t("profile.sessionTitle")}</strong>
                    <span>{t("profile.sessionDescription")}</span>
                  </div>
                  <div className="profile-session-actions">
                    <button type="button" className="profile-switch-button" onClick={() => void handleSignOut("/login")} disabled={busy}>{t("profile.switchAccount")}</button>
                    <button type="button" className="profile-logout-button" onClick={() => void handleSignOut("/")} disabled={busy}>{t("profile.logout")}</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="profile-panel">
                <div className="profile-panel-heading">
                  <span className="profile-panel-index">02 / PREFERENCES</span>
                  <h2>{t("profile.tabLanguages")}</h2>
                  <p>{t("profile.languagesDescription")}</p>
                </div>
                <div className="profile-language-options">
                  <label className="profile-setting-label">
                    <span><strong>{t("profile.language")}</strong><small>{t("profile.languageDescription")}</small></span>
                    <CustomSelect value={language} onChange={(value) => setLanguage(value as AppLanguage)} ariaLabel={t("profile.language")} options={[
                      { value: "ru", label: t("profile.russianLanguage") },
                      { value: "en", label: t("profile.englishLanguage") },
                    ]} />
                  </label>
                  <label className="profile-setting-label">
                    <span><strong>{t("profile.notation")}</strong><small>{t("profile.notationDescription")}</small></span>
                    <CustomSelect value={notation} onChange={(value) => setNotation(value as NoteNotation)} ariaLabel={t("profile.notation")} options={[
                      { value: "international", label: t("profile.international") },
                      { value: "russian", label: t("profile.russian") },
                    ]} />
                  </label>
                </div>
                <button className="account-submit profile-save-button" type="button" onClick={() => void handleLanguagesSave()} disabled={busy || !configured}>{busy ? t("auth.saving") : t("profile.saveLanguages")}</button>
              </div>
            )}
          </section>
        </div>
      </div>
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
