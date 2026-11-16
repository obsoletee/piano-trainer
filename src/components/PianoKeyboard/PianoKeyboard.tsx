import "./PianoKeyboard.css";
import { getNoteName } from "../../features/midi/midiUtils";

interface PianoKeyboardProps {
  activeNotes: ReadonlySet<number> | ReadonlyMap<number, boolean>;
  availableNotes: ReadonlySet<number>;
  onNoteOn: (noteNumber: number) => void;
  onNoteOff: (noteNumber: number) => void;
}

const FIRST_MIDI_NOTE = 21;
const LAST_MIDI_NOTE = 108;

const WHITE_NOTE_NUMBERS = Array.from(
  { length: LAST_MIDI_NOTE - FIRST_MIDI_NOTE + 1 },
  (_, index) => FIRST_MIDI_NOTE + index,
).filter((note) => ![1, 3, 6, 8, 10].includes(note % 12));

const BLACK_NOTE_NUMBERS = Array.from(
  { length: LAST_MIDI_NOTE - FIRST_MIDI_NOTE + 1 },
  (_, index) => FIRST_MIDI_NOTE + index,
).filter((note) => [1, 3, 6, 8, 10].includes(note % 12));

function getBlackKeyPosition(noteNumber: number): number {
  const whiteKeysBefore = WHITE_NOTE_NUMBERS.filter(
    (note) => note < noteNumber,
  ).length;

  return (whiteKeysBefore / WHITE_NOTE_NUMBERS.length) * 100;
}

function PianoKeyboard({
  activeNotes,
  availableNotes,
  onNoteOn,
  onNoteOff,
}: PianoKeyboardProps) {
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
        {WHITE_NOTE_NUMBERS.map((noteNumber) => (
          <div
            key={noteNumber}
            className={`piano-key white-key ${
              activeNotes.has(noteNumber) ? "key-active" : ""
            } ${!availableNotes.has(noteNumber) ? "key-disabled" : ""}`}
            aria-disabled={!availableNotes.has(noteNumber)}
            aria-label={getNoteName(noteNumber)}
            title={getNoteName(noteNumber)}
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
              <span className="key-label">{getNoteName(noteNumber)}</span>
            )}
          </div>
        ))}

        {BLACK_NOTE_NUMBERS.map((noteNumber) => (
          <div
            key={noteNumber}
            className={`piano-key black-key ${
              activeNotes.has(noteNumber) ? "key-active" : ""
            } ${!availableNotes.has(noteNumber) ? "key-disabled" : ""}`}
            aria-disabled={!availableNotes.has(noteNumber)}
            style={{
              left: `${getBlackKeyPosition(noteNumber)}%`,
            }}
            aria-label={getNoteName(noteNumber)}
            title={getNoteName(noteNumber)}
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
