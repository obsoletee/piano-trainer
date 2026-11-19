import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import type { UserProfile } from "../types/profile";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  configured: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<UserProfile, "nickname" | "language" | "note_notation" | "avatar_url">>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const currentUser = (await supabase.auth.getUser()).data.user;
    if (!currentUser) {
      setProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (error) throw error;
    setProfile(data as UserProfile | null);
  }, []);

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSession(data.session);
      if (data.session) {
        try {
          await refreshProfile();
        } catch (error) {
          console.error("Не удалось загрузить профиль:", error);
        }
      }
      if (active) setLoading(false);
    };

    void initialize();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        setLoading(false);
        return;
      }
      queueMicrotask(() => {
        void refreshProfile().catch((error) =>
          console.error("Не удалось загрузить профиль:", error),
        );
      });
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [refreshProfile]);

  const updateProfile = useCallback<AuthContextValue["updateProfile"]>(
    async (updates) => {
      if (!session?.user) throw new Error("Необходимо войти в аккаунт.");
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", session.user.id)
        .select("*")
        .single();
      if (error) throw error;
      setProfile(data as UserProfile);
    },
    [session],
  );

  const uploadAvatar = useCallback<AuthContextValue["uploadAvatar"]>(
    async (file) => {
      if (!session?.user) throw new Error("Необходимо войти в аккаунт.");
      if (!file.type.startsWith("image/")) throw new Error("Выбери файл изображения.");
      if (file.size > 5 * 1024 * 1024) throw new Error("Размер изображения не должен превышать 5 МБ.");

      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${session.user.id}/avatar-${Date.now()}.${extension}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });
      if (error) throw error;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      await updateProfile({ avatar_url: data.publicUrl });
      return data.publicUrl;
    },
    [session, updateProfile],
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        configured: isSupabaseConfigured,
        refreshProfile,
        updateProfile,
        uploadAvatar,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth должен использоваться внутри AuthProvider.");
  return context;
}
