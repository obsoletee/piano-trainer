import "./PianoKeyboard.css";
import { getNoteName, type NoteNotation } from "../../features/midi/midiUtils";

interface PianoKeyboardProps {
  activeNotes: ReadonlySet<number> | ReadonlyMap<number, boolean>;
  availableNotes: ReadonlySet<number>;
  startNote?: number;
  endNote?: number;
  noteNotation?: NoteNotation;
  onNoteOn: (noteNumber: number) => void;
  onNoteOff: (noteNumber: number) => void;
}

const FIRST_MIDI_NOTE = 21;
const LAST_MIDI_NOTE = 108;

function PianoKeyboard({
  activeNotes,
  availableNotes,
  onNoteOn,
  onNoteOff,
  startNote = FIRST_MIDI_NOTE,
  endNote = LAST_MIDI_NOTE,
  noteNotation = "international",
}: PianoKeyboardProps) {
  const whiteNoteNumbers = Array.from(
    { length: endNote - startNote + 1 },
    (_, index) => startNote + index,
  ).filter((note) => ![1, 3, 6, 8, 10].includes(note % 12));

  const blackNoteNumbers = Array.from(
    { length: endNote - startNote + 1 },
    (_, index) => startNote + index,
  ).filter((note) => [1, 3, 6, 8, 10].includes(note % 12));

  function getBlackKeyPosition(noteNumber: number): number {
    const whiteKeysBefore = whiteNoteNumbers.filter(
      (note) => note < noteNumber,
    ).length;

    return (whiteKeysBefore / whiteNoteNumbers.length) * 100;
  }
  const handlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
    noteNumber: number,
  ) => {
    if (!availableNotes.has(noteNumber)) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    onNoteOn(noteNumber);
  };

  return (
    <div className="piano-scroll">
      <div className="piano-keyboard">
        {whiteNoteNumbers.map((noteNumber) => (
          <div
            key={noteNumber}
            className={`piano-key white-key ${
              activeNotes.has(noteNumber) ? "key-active" : ""
            } ${!availableNotes.has(noteNumber) ? "key-disabled" : ""}`}
            style={{
              width: `${100 / whiteNoteNumbers.length}%`,
            }}
            aria-disabled={!availableNotes.has(noteNumber)}
            aria-label={getNoteName(noteNumber, noteNotation)}
            title={getNoteName(noteNumber, noteNotation)}
            onPointerDown={(event) => {
              if (availableNotes.has(noteNumber)) {
                handlePointerDown(event, noteNumber);
              }
            }}
            onPointerUp={() => {
              if (availableNotes.has(noteNumber)) {
                onNoteOff(noteNumber);
              }
            }}
            onPointerCancel={() => onNoteOff(noteNumber)}
            onLostPointerCapture={() => onNoteOff(noteNumber)}
          >
            {noteNumber % 12 === 0 && (
              <span className="key-label">{getNoteName(noteNumber, noteNotation)}</span>
            )}
          </div>
        ))}

        {blackNoteNumbers.map((noteNumber) => (
          <div
            key={noteNumber}
            className={`piano-key black-key ${
              activeNotes.has(noteNumber) ? "key-active" : ""
            } ${!availableNotes.has(noteNumber) ? "key-disabled" : ""}`}
            aria-disabled={!availableNotes.has(noteNumber)}
            style={{
              left: `${getBlackKeyPosition(noteNumber)}%`,
              width: `${(100 / whiteNoteNumbers.length) * 0.72}%`,
            }}
            aria-label={getNoteName(noteNumber, noteNotation)}
            title={getNoteName(noteNumber, noteNotation)}
            onPointerDown={(event) => {
              if (availableNotes.has(noteNumber)) {
                handlePointerDown(event, noteNumber);
              }
            }}
            onPointerUp={() => {
              if (availableNotes.has(noteNumber)) {
                onNoteOff(noteNumber);
              }
            }}
            onPointerCancel={() => onNoteOff(noteNumber)}
            onLostPointerCapture={() => onNoteOff(noteNumber)}
          />
        ))}
      </div>
    </div>
  );
}

export default PianoKeyboard;
