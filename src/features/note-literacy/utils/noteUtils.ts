import {
  ACCIDENTAL_OPTIONS,
  type AccidentalType,
  type StaffClef,
} from "../types";

export function getAccidentalSymbol(accidental: AccidentalType | null): string {
  if (!accidental) return "";

  return (
    ACCIDENTAL_OPTIONS.find((option) => option.value === accidental)?.symbol ??
    ""
  );
}

export function getStaffY(noteNumber: number, clef: StaffClef): number {
  const pitchSteps: Record<number, number> = {
    0: 0,
    2: 1,
    4: 2,
    5: 3,
    7: 4,
    9: 5,
    11: 6,
  };

  const octave = Math.floor(noteNumber / 12) - 1;
  const pitch = noteNumber % 12;
  const diatonicPosition = octave * 7 + (pitchSteps[pitch] ?? 0);

  // Опорные ноты нижней линии:
  // Скрипичный ключ — E4 (Ми первой октавы).
  // Басовый ключ — G2 (Соль большой октавы).
  const bottomLinePosition = clef === "treble" ? 4 * 7 + 2 : 2 * 7 + 4;

  return 180 - (diatonicPosition - bottomLinePosition) * 10;
}
