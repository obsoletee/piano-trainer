import { createContext } from "react";
import type { Session, User } from "@supabase/supabase-js";
import type { UserProfile } from "../types/profile";

export interface AuthContextValue {
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

export const AuthContext = createContext<AuthContextValue | null>(null);
