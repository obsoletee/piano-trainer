import {
  ACCIDENTAL_OPTIONS,
  ACCIDENTAL_NAMES,
  NATURAL_NOTE_FULL_NAMES,
  NATURAL_NOTE_NAMES,
  type AccidentalType,
  type ClefMode,
  type Question,
  type StaffClef,
} from "../types";
import { getAccidentalSymbol } from "./noteUtils";

const NATURAL_NOTE_OFFSETS = [0, 2, 4, 5, 7, 9, 11];

function getOctaveName(octave: number): string {
  const octaveNames = [
    "субконтроктавы",
    "контроктавы",
    "большой октавы",
    "малой октавы",
    "первой октавы",
    "второй октавы",
    "третьей октавы",
    "четвёртой октавы",
    "пятой октавы",
  ];

  return octaveNames[octave] ?? `${octave} октавы`;
}

export function createQuestions(
  startNote: number,
  endNote: number,
  availableNotes: Set<number>,
  clefMode: ClefMode,
  questionCount: number,
  selectedAccidentals: Set<AccidentalType>,
): Question[] {
  const candidates: Question[] = [];

  for (let octaveStart = startNote; octaveStart <= endNote; octaveStart += 12) {
    NATURAL_NOTE_OFFSETS.forEach((offset, letterIndex) => {
      const staffNoteNumber = octaveStart + offset;

      if (staffNoteNumber > endNote) return;

      const octave = Math.floor(staffNoteNumber / 12) - 1;
      const letterName = NATURAL_NOTE_NAMES[letterIndex]!;
      const fullLetterName = NATURAL_NOTE_FULL_NAMES[letterIndex]!;

      const variations: (AccidentalType | null)[] = [null];

      ACCIDENTAL_OPTIONS.forEach((option) => {
        if (selectedAccidentals.has(option.value)) {
          variations.push(option.value);
        }
      });

      variations.forEach((accidental) => {
        const option = accidental
          ? ACCIDENTAL_OPTIONS.find((item) => item.value === accidental)!
          : null;

        const noteNumber = staffNoteNumber + (option?.semitones ?? 0);

        if (
          noteNumber < startNote ||
          noteNumber > endNote ||
          !availableNotes.has(noteNumber)
        ) {
          return;
        }

        const symbol = getAccidentalSymbol(accidental);
        const accidentalName = accidental
          ? ` ${ACCIDENTAL_NAMES[accidental]}`
          : "";

        candidates.push({
          noteNumber,
          staffNoteNumber,
          clef: "treble",
          accidental,
          noteName: `${letterName}${symbol}${octave}`,
          fullNoteName: `${letterName}${symbol}${octave} / ${fullLetterName}${accidentalName} ${getOctaveName(octave)}`,
        });
      });
    });
  }

  if (candidates.length === 0) return [];

  return Array.from({ length: questionCount }, () => {
    const candidate =
      candidates[Math.floor(Math.random() * candidates.length)]!;

    const octave = Math.floor(candidate.staffNoteNumber / 12) - 1;

    let clef: StaffClef;

    if (clefMode === "treble") {
      clef = "treble";
    } else if (clefMode === "bass") {
      clef = "bass";
    } else if (octave <= 3) {
      clef = "bass";
    } else if (octave >= 5) {
      clef = "treble";
    } else {
      clef = Math.random() < 0.5 ? "treble" : "bass";
    }

    return { ...candidate, clef };
  });
}

export function createRangeQuestions(
  startNote: number,
  endNote: number,
  availableNotes: Set<number>,
  clefMode: ClefMode,
  questionCount: number,
  selectedAccidentals: Set<AccidentalType>,
  allowMixedClefs: boolean,
): Question[] {
  const pool = createQuestions(
    startNote,
    endNote,
    availableNotes,
    clefMode,
    Math.max(questionCount * 12, 120),
    selectedAccidentals,
  );
  const uniqueByPitch = new Map<number, Question>();
  pool.forEach((note) => {
    if (!uniqueByPitch.has(note.noteNumber)) {
      uniqueByPitch.set(note.noteNumber, note);
    }
  });

  const candidates = Array.from(uniqueByPitch.values());
  if (candidates.length < 2) return [];

  const questions: Question[] = [];
  for (let index = 0; index < questionCount; index += 1) {
    const firstIndex = Math.floor(Math.random() * candidates.length);
    const first = candidates[firstIndex]!;
    const compatible = candidates.filter(
      (_, candidateIndex) =>
        candidateIndex !== firstIndex &&
        (allowMixedClefs ||
          candidates[candidateIndex]!.clef === first.clef ||
          clefMode !== "auto"),
    );

    // При выключенных смешанных ключах второй ноте назначается тот же ключ.
    // Если смешение включено, сохраняем ключ каждой ноты независимо.
    const secondCandidate =
      compatible.length > 0
        ? compatible[Math.floor(Math.random() * compatible.length)]!
        : candidates.find(
            (_, candidateIndex) => candidateIndex !== firstIndex,
          )!;
    const second = {
      ...secondCandidate,
      clef:
        allowMixedClefs && clefMode === "auto"
          ? secondCandidate.clef
          : first.clef,
    };

    questions.push({ ...first, secondNote: second });
  }

  return questions;
}
