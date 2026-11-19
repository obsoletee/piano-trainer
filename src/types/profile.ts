export type AppLanguage = "ru" | "en";
export type NoteNotation = "international" | "russian";

export interface UserProfile {
  id: string;
  nickname: string;
  language: AppLanguage;
  note_notation: NoteNotation;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}
