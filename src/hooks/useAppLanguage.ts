import { useAuth } from "./useAuth";

export function useAppLanguage() {
  return useAuth().profile?.language ?? "ru";
}
