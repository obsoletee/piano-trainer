import type {
  AccidentalType,
  Question,
  StaffClef,
} from "../../features/note-literacy/types";
import StaffSingle from "./StaffSingle";
import "./Staff.css";

function Staff({
  noteNumber,
  clef,
  accidental,
  secondNote,
}: {
  noteNumber: number;
  clef: StaffClef;
  accidental: AccidentalType | null;
  secondNote?: Question;
}) {
  if (secondNote && secondNote.clef !== clef) {
    const notes = [
      { noteNumber, clef, accidental },
      {
        noteNumber: secondNote.staffNoteNumber,
        clef: secondNote.clef,
        accidental: secondNote.accidental,
      },
    ].sort(
      (a, b) => (a.clef === "treble" ? -1 : 1) - (b.clef === "treble" ? -1 : 1),
    );

    return (
      <div
        className="literacy-staff-pair"
        aria-label="Интервал в двух нотных ключах"
      >
        {notes.map((note, index) => (
          <StaffSingle
            key={`${note.clef}-${index}`}
            noteNumber={note.noteNumber}
            clef={note.clef}
            accidental={note.accidental}
          />
        ))}
      </div>
    );
  }

  return (
    <StaffSingle
      noteNumber={noteNumber}
      clef={clef}
      accidental={accidental}
      secondNote={secondNote}
    />
  );
}

export default Staff;
