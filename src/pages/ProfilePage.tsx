import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import CustomSelect from "../components/CustomSelect/CustomSelect";
import { useAuth } from "../hooks/useAuth";
import type { AppLanguage, NoteNotation, UserProfile } from "../types/profile";
import { useTranslation } from "../hooks/useTranslation";
import { useToast } from "../components/Toast/ToastContext";
import { supabase } from "../lib/supabase";
import "./AccountPages.css";

type ProfileTab = "account" | "languages" | "management";

function ProfileForm({ profile, email }: { profile: UserProfile; email: string }) {
  const { configured, updateProfile, uploadAvatar, signOut } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { notify } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const avatarMenuRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>("account");
  const [nickname, setNickname] = useState(profile.nickname);
  const [emailValue, setEmailValue] = useState(email);
  const [language, setLanguage] = useState<AppLanguage>(profile.language);
  const [notation, setNotation] = useState<NoteNotation>(profile.note_notation);
  const [busy, setBusy] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [confirmAvatarDelete, setConfirmAvatarDelete] = useState(false);
  const [confirmAccountDelete, setConfirmAccountDelete] = useState(false);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target as Node)) {
        setAvatarMenuOpen(false);
        setConfirmAvatarDelete(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAvatarMenuOpen(false);
        setConfirmAvatarDelete(false);
        setConfirmAccountDelete(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleAccountSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      await updateProfile({ nickname: nickname.trim() });
      const nextEmail = emailValue.trim();
      if (nextEmail && nextEmail.toLowerCase() !== email.toLowerCase()) {
        const { error } = await supabase.auth.updateUser({ email: nextEmail });
        if (error) throw error;
        notify(t("profile.emailConfirmation"), "success");
      } else {
        notify(t("profile.applied"), "success");
      }
    } catch {
      notify(t("profile.accountSaveError"), "error");
    } finally {
      setBusy(false);
    }
  };

  const handleLanguagesSave = async () => {
    setBusy(true);
    try {
      await updateProfile({ language, note_notation: notation });
      notify(t("profile.applied"), "success");
    } catch {
      notify(t("profile.saveError"), "error");
    } finally {
      setBusy(false);
    }
  };

  const handleAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      notify(t("profile.imageOnly"), "error");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notify(t("profile.imageTooLarge"), "error");
      event.target.value = "";
      return;
    }
    setBusy(true);
    setAvatarMenuOpen(false);
    try {
      await uploadAvatar(file);
      notify(t("profile.avatarUpdated"), "success");
    } catch {
      notify(t("profile.avatarError"), "error");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  };

  const handleAvatarDelete = async () => {
    setBusy(true);
    try {
      const avatarPath = profile.avatar_url
        ?.split("/storage/v1/object/public/avatars/")[1]
        ?.split("?")[0];
      if (avatarPath) {
        const { error } = await supabase.storage.from("avatars").remove([decodeURIComponent(avatarPath)]);
        if (error) throw error;
      }
      await updateProfile({ avatar_url: null });
      notify(t("profile.avatarRemoved"), "success");
      setAvatarMenuOpen(false);
      setConfirmAvatarDelete(false);
    } catch {
      notify(t("profile.avatarRemoveError"), "error");
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async (destination: "/login" | "/") => {
    try {
      await signOut();
      navigate(destination);
    } catch {
      notify(t("profile.signOutError"), "error");
    }
  };

  const handleAccountDeactivation = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.functions.invoke("deactivate-account", { method: "POST" });
      if (error) throw error;
      await signOut();
      navigate("/", { replace: true });
    } catch {
      notify(t("profile.deactivateError"), "error");
      setConfirmAccountDelete(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="account-page profile-page">
      {confirmAccountDelete && (
        <div className="profile-confirm-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setConfirmAccountDelete(false);
        }}>
          <section className="profile-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="account-delete-title" aria-describedby="account-delete-description">
            <span className="profile-confirm-icon" aria-hidden="true">!</span>
            <h2 id="account-delete-title">{t("profile.deactivateTitle")}</h2>
            <p id="account-delete-description">{t("profile.deactivateWarning")}</p>
            <div className="profile-confirm-actions">
              <button type="button" className="profile-confirm-cancel" onClick={() => setConfirmAccountDelete(false)} disabled={busy}>{t("common.cancel")}</button>
              <button type="button" className="profile-confirm-danger" onClick={() => void handleAccountDeactivation()} disabled={busy}>{busy ? t("auth.saving") : t("profile.confirmDeactivate")}</button>
            </div>
          </section>
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
              <div className="profile-avatar-menu" ref={avatarMenuRef}>
                <button type="button" className="avatar-upload profile-avatar" onClick={() => {
                  setAvatarMenuOpen((open) => !open);
                  setConfirmAvatarDelete(false);
                }} aria-label={t("profile.avatarActions")} aria-expanded={avatarMenuOpen} disabled={busy}>
                  {profile.avatar_url ? <img src={profile.avatar_url} alt={t("profile.avatarAlt")} /> : <span>{(profile.nickname || email || "P").charAt(0).toUpperCase()}</span>}
                  <i aria-hidden="true">⋯</i>
                </button>
                {avatarMenuOpen && (
                  <div className="profile-avatar-popover">
                    {confirmAvatarDelete ? (
                      <>
                        <p>{t("profile.confirmAvatarDelete")}</p>
                        <div className="profile-avatar-confirm-actions">
                          <button type="button" onClick={() => setConfirmAvatarDelete(false)} disabled={busy}>{t("common.cancel")}</button>
                          <button type="button" className="is-danger" onClick={() => void handleAvatarDelete()} disabled={busy}>{t("profile.deleteAvatar")}</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => fileRef.current?.click()} disabled={busy}>{t("profile.changeAvatar")}</button>
                        {profile.avatar_url && <button type="button" className="is-danger" onClick={() => setConfirmAvatarDelete(true)} disabled={busy}>{t("profile.deleteAvatar")}</button>}
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="profile-sidebar-identity">
                <strong>{profile.nickname}</strong>
                <span>{email}</span>
              </div>
            </div>
            <input ref={fileRef} className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleAvatar} />
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
              <button type="button" className={activeTab === "management" ? "is-active" : ""} aria-current={activeTab === "management" ? "page" : undefined} onClick={() => setActiveTab("management")}>
                <span className="profile-tab-icon" aria-hidden="true">⚙</span>
                <span>{t("profile.tabManagement")}</span>
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
                <form className="account-form profile-settings-form" onSubmit={(event) => void handleAccountSave(event)}>
                  <label>{t("auth.nickname")}<input value={nickname} onChange={(event) => setNickname(event.target.value)} minLength={1} maxLength={32} required /></label>
                  <label>{t("auth.email")}<input type="email" value={emailValue} onChange={(event) => setEmailValue(event.target.value)} required autoComplete="email" /></label>
                  <p className="profile-field-hint">{t("profile.emailHint")}</p>
                  <button className="account-submit profile-save-button" type="submit" disabled={busy || !configured}>{busy ? t("auth.saving") : t("profile.saveAccount")}</button>
                </form>
              </div>
            ) : activeTab === "languages" ? (
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
            ) : (
              <div className="profile-panel profile-management-panel">
                <div className="profile-panel-heading">
                  <span className="profile-panel-index">03 / ACCOUNT CONTROL</span>
                  <h2>{t("profile.tabManagement")}</h2>
                  <p>{t("profile.managementDescription")}</p>
                </div>
                <div className="profile-management-actions">
                  <article className="profile-management-card">
                    <div className="profile-management-card-copy">
                      <strong>{t("profile.switchAccount")}</strong>
                      <p>{t("profile.switchAccountDescription")}</p>
                    </div>
                    <button type="button" className="profile-management-button" onClick={() => void handleSignOut("/login")} disabled={busy}>{t("profile.switchAccount")}</button>
                  </article>
                  <article className="profile-management-card">
                    <div className="profile-management-card-copy">
                      <strong>{t("profile.logout")}</strong>
                      <p>{t("profile.logoutDescription")}</p>
                    </div>
                    <button type="button" className="profile-management-button" onClick={() => void handleSignOut("/")} disabled={busy}>{t("profile.logout")}</button>
                  </article>
                  <article className="profile-management-card is-danger">
                    <div className="profile-management-card-copy">
                      <strong>{t("profile.deleteAccount")}</strong>
                      <p>{t("profile.deleteAccountDescription")}</p>
                    </div>
                    <button type="button" className="profile-management-button is-danger" onClick={() => setConfirmAccountDelete(true)} disabled={busy}>{t("profile.deleteAccount")}</button>
                  </article>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function ProfileLoadingScreen() {
  const { t } = useTranslation();

  return (
    <main className="profile-loading-page" aria-busy="true">
      <section className="profile-loading-card" role="status" aria-live="polite">
        <div className="profile-loading-orbit" aria-hidden="true">
          <span className="profile-loading-orbit-dot" />
          <span className="profile-loading-orbit-note">♪</span>
          <div className="profile-loading-note">♫</div>
        </div>

        <span className="profile-loading-eyebrow">PIANO TRAINER / PERSONAL SPACE</span>
        <h1>{t("profile.loadingTitle")}</h1>
        <p className="profile-loading-description">{t("profile.loadingDescription")}</p>

        <div className="profile-loading-progress" aria-hidden="true">
          <span />
        </div>
        <span className="profile-loading-caption">{t("profile.loading")}</span>
      </section>
    </main>
  );
}

function ProfilePage() {
  const { user, profile, loading } = useAuth();

  if (!user && !loading) return <Navigate to="/login" replace />;
  if (loading || (user && !profile)) return <ProfileLoadingScreen />;
  if (!profile || !user) return <Navigate to="/login" replace />;

  return <ProfileForm key={profile.id} profile={profile} email={user.email ?? ""} />;
}

export default ProfilePage;
