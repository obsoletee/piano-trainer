import { useAuth } from "../context/AuthContext";

export function useAppLanguage() {
  return useAuth().profile?.language ?? "ru";
}
