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

export function getNoteName(noteNumber: number): string {
  const note = NOTE_NAMES[noteNumber % 12];
  const octave = Math.floor(noteNumber / 12) - 1;

  return `${note}${octave}`;
}

export function getSampleFileName(noteNumber: number): string {
  const noteName = getNoteName(noteNumber);

  return `${noteName.replace("#", "_sharp")}.ogg`;
}
