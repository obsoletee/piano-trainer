export interface MidiInput {
  id: string;
  name: string;
  onmidimessage: ((event: MidiMessageEvent) => void) | null;
}

export interface MidiMessageEvent {
  data: Uint8Array;
}

export interface MidiAccess {
  inputs: {
    values(): IterableIterator<MidiInput>;
  };
  onstatechange: (() => void) | null;
}

export type NavigatorWithMidi = Navigator & {
  requestMIDIAccess?: () => Promise<MidiAccess>;
};

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
