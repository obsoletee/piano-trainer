export type GameStatus = "idle" | "playing" | "feedback" | "finished";

export type StaffClef = "treble" | "bass";
export type ClefMode = "auto" | "treble" | "bass";
export type GameMode = "notes" | "intervals";

export type AccidentalType =
  "sharp" | "flat" | "doubleSharp" | "doubleFlat" | "natural";

export interface AccidentalOption {
  value: AccidentalType;
  label: string;
  symbol: string;
  semitones: number;
}

export const ACCIDENTAL_OPTIONS: AccidentalOption[] = [
  { value: "sharp", label: "Диезы", symbol: "♯", semitones: 1 },
  { value: "flat", label: "Бемоли", symbol: "♭", semitones: -1 },
  { value: "doubleSharp", label: "Дубль-диезы", symbol: "𝄪", semitones: 2 },
  { value: "doubleFlat", label: "Дубль-бемоли", symbol: "𝄫", semitones: -2 },
  { value: "natural", label: "Бекары", symbol: "♮", semitones: 0 },
];

export const NATURAL_NOTE_NAMES = ["C", "D", "E", "F", "G", "A", "B"];
export const NATURAL_NOTE_FULL_NAMES = [
  "До",
  "Ре",
  "Ми",
  "Фа",
  "Соль",
  "Ля",
  "Си",
];

export const ACCIDENTAL_NAMES: Record<AccidentalType, string> = {
  sharp: "диез",
  flat: "бемоль",
  doubleSharp: "дубль-диез",
  doubleFlat: "дубль-бемоль",
  natural: "бекар",
};

export interface Question {
  noteNumber: number;
  staffNoteNumber: number;
  clef: StaffClef;
  accidental: AccidentalType | null;
  noteName: string;
  fullNoteName: string;
  secondNote?: Question;
}

export type AnswerOutcome = "correct" | "partial" | "incorrect" | "skipped";

export interface AnswerRecord {
  noteNumber: number;
  noteName: string;
  fullNoteName: string;
  userNoteNumber: number | null;
  userNoteName: string | null;
  outcome: AnswerOutcome;
  responseTime: number;
  points: number;
  secondNoteName?: string;
  secondFullNoteName?: string;
  userSecondNoteName?: string | null;
  correctNotes?: number;
}
