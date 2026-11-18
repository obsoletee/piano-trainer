import type {
  AccidentalType,
  Question,
  StaffClef,
} from "../../features/note-literacy/types";
import {
  getAccidentalSymbol,
  getStaffY,
} from "../../features/note-literacy/utils/noteUtils";

function StaffSingle({
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
  const noteY = getStaffY(noteNumber, clef);
  const secondNoteY = secondNote
    ? getStaffY(secondNote.staffNoteNumber, clef)
    : null;
  const notePositions = [
    { y: noteY, x: 260, accidental },
    ...(secondNote && secondNoteY !== null
      ? [{ y: secondNoteY, x: 370, accidental: secondNote.accidental }]
      : []),
  ];
  const ledgerLines: { y: number; x1: number; x2: number }[] = [];

  notePositions.forEach(({ y, x }) => {
    if (y > 180) {
      for (let lineY = 200; lineY <= y; lineY += 20) {
        ledgerLines.push({ y: lineY, x1: x - 25, x2: x + 25 });
      }
    }
    if (y < 100) {
      for (let lineY = 80; lineY >= y; lineY -= 20) {
        ledgerLines.push({ y: lineY, x1: x - 25, x2: x + 25 });
      }
    }
  });

  const minNoteY = Math.min(...notePositions.map((position) => position.y));
  const maxNoteY = Math.max(...notePositions.map((position) => position.y));
  const viewBoxTop = Math.min(0, minNoteY - 60);
  const viewBoxBottom = Math.max(230, maxNoteY + 20);
  const viewBoxHeight = viewBoxBottom - viewBoxTop;
  const clefSymbol = clef === "treble" ? "𝄞" : "𝄢";
  const clefName = clef === "treble" ? "скрипичном" : "басовом";

  return (
    <svg
      className="literacy-staff"
      viewBox={`0 ${viewBoxTop} 500 ${viewBoxHeight}`}
      role="img"
      aria-label={
        secondNote
          ? `Две ноты на нотном стане в ${clefName} ключе`
          : `Нота на нотном стане в ${clefName} ключе`
      }
    >
      {[100, 120, 140, 160, 180].map((y) => (
        <line
          key={y}
          x1="65"
          y1={y}
          x2="435"
          y2={y}
          stroke="currentColor"
          strokeWidth="1.5"
        />
      ))}

      <text
        x="75"
        y="164"
        fontSize="100"
        fill="currentColor"
        fontFamily="serif"
      >
        {clefSymbol}
      </text>

      {ledgerLines.map((line, index) => (
        <line
          key={`${line.x1}-${line.y}-${index}`}
          x1={line.x1}
          y1={line.y}
          x2={line.x2}
          y2={line.y}
          stroke="currentColor"
          strokeWidth="1.5"
        />
      ))}

      {notePositions.map((position) => (
        <g key={`${position.x}-${position.y}`}>
          {position.accidental && (
            <text
              className="staff-accidental"
              x={position.x - 70}
              y={position.y + 10}
              fontSize="38"
              textAnchor="middle"
              fill="currentColor"
              fontFamily="serif"
            >
              {getAccidentalSymbol(position.accidental)}
            </text>
          )}
          <ellipse
            className="staff-note"
            cx={position.x}
            cy={position.y}
            rx="11"
            ry="7.5"
            transform={`rotate(-20 ${position.x} ${position.y})`}
          />
          <line
            className="staff-note-stem"
            x1={position.x + 10}
            y1={position.y - 2}
            x2={position.x + 10}
            y2={position.y - 48}
          />
        </g>
      ))}
    </svg>
  );
}

export default StaffSingle;
