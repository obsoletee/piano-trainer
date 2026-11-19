export type MidiNoteMessage =
  | { type: "noteOn"; noteNumber: number; velocity: number }
  | { type: "noteOff"; noteNumber: number };

export function parseMidiMessage(
  data: Uint8Array | null,
): MidiNoteMessage | null {
  if (!data || data.length < 3) return null;

  const status = data[0];
  const noteNumber = data[1];
  const velocity = data[2];

  if (
    status === undefined ||
    noteNumber === undefined ||
    velocity === undefined
  ) {
    return null;
  }

  const command = status & 0xf0;

  if (command === 0x90 && velocity > 0) {
    return { type: "noteOn", noteNumber, velocity };
  }

  if (command === 0x80 || (command === 0x90 && velocity === 0)) {
    return { type: "noteOff", noteNumber };
  }

  return null;
}

const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

export type NoteNotation = "international" | "russian";

const RUSSIAN_NOTE_NAMES = ["До", "До-диез", "Ре", "Ре-диез", "Ми", "Фа", "Фа-диез", "Соль", "Соль-диез", "Ля", "Ля-диез", "Си"];
const RUSSIAN_OCTAVE_NAMES = ["субконтроктавы", "контроктавы", "большой октавы", "малой октавы", "первой октавы", "второй октавы", "третьей октавы", "четвёртой октавы", "пятой октавы"];

export function getNoteName(noteNumber: number, notation: NoteNotation = "international"): string {
  const note = NOTE_NAMES[noteNumber % 12];
  const octave = Math.floor(noteNumber / 12) - 1;

  if (notation === "russian") {
    const russianName = RUSSIAN_NOTE_NAMES[noteNumber % 12] ?? "До";
    const octaveName = RUSSIAN_OCTAVE_NAMES[octave] ?? `${octave} октавы`;
    return `${russianName} ${octaveName}`;
  }

  return `${note}${octave}`;
}

export function getSampleFileName(noteNumber: number): string {
  const noteName = getNoteName(noteNumber);

  return `${noteName.replace("#", "_sharp")}.ogg`;
}

export function getQuestionNoteName(
  question: { noteName: string; fullNoteName: string },
  notation: NoteNotation,
): string {
  if (notation === "international") return question.noteName;
  return question.fullNoteName.split(" / ")[1] ?? question.fullNoteName;
}
