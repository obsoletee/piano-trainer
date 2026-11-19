import { useTranslation } from "../../../hooks/useTranslation";
import type { Question } from "../types";
import Staff from "../../../components/Staff/Staff";
import PianoKeyboard from "../../../components/PianoKeyboard/PianoKeyboard";
import GameFeedback from "./GameFeedback";
import { getQuestionNoteName, type NoteNotation } from "../../midi/midiUtils";

interface LiteracyGameProps {
  currentQuestion: Question;
  questionIndex: number;
  questionCount: number;
  secondsLeft: number;
  gameMode: "notes" | "intervals";
  rangePendingCount: number;
  activeNotes: Set<number>;
  availableNotes: Set<number>;
  rangeStart: number;
  rangeEnd: number;
  status: "playing" | "feedback";
  feedbackType: "correct" | "partial" | "incorrect" | "timeout" | null;
  feedbackCountdown: number;
  noteNotation: NoteNotation;
  onNoteOn: (noteNumber: number, velocity?: number) => void;
  onNoteOff: (noteNumber: number) => void;
}

function LiteracyGame({
  currentQuestion,
  questionIndex,
  questionCount,
  secondsLeft,
  gameMode,
  rangePendingCount,
  activeNotes,
  availableNotes,
  rangeStart,
  rangeEnd,
  status,
  feedbackType,
  feedbackCountdown,
  noteNotation,
  onNoteOn,
  onNoteOff,
}: LiteracyGameProps) {
  const { t } = useTranslation();
  const displayQuestion = {
    ...currentQuestion,
    fullNoteName: getQuestionNoteName(currentQuestion, noteNotation),
    secondNote: currentQuestion.secondNote
      ? {
          ...currentQuestion.secondNote,
          fullNoteName: getQuestionNoteName(currentQuestion.secondNote, noteNotation),
        }
      : undefined,
  };

  return (
    <section className="literacy-card literacy-card-playing">
      <div className="literacy-game-heading">
        <strong>
          {t("literacy.question")} {questionIndex + 1} {t("literacy.of")} {questionCount}
        </strong>

        <strong className="literacy-timer">
          {secondsLeft.toFixed(1)} {t("literacy.seconds")}
        </strong>
      </div>

      <div className="literacy-progress">
        <div
          style={{
            width: `${((questionIndex + 1) / questionCount) * 100}%`,
          }}
        />
      </div>

      <h2>
        {gameMode === "intervals" ? t("literacy.whatNotes") : t("literacy.whatNote")}
      </h2>

      <Staff
        noteNumber={currentQuestion.staffNoteNumber}
        clef={currentQuestion.clef}
        accidental={currentQuestion.accidental}
        secondNote={
          gameMode === "intervals" ? currentQuestion.secondNote : undefined
        }
      />

      <p className="literacy-instruction">
        {gameMode === "intervals"
          ? `${t("literacy.playBoth")}: ${rangePendingCount}/2`
          : t("literacy.pressKey")}
      </p>

      <PianoKeyboard
        activeNotes={activeNotes}
        availableNotes={availableNotes}
        onNoteOn={onNoteOn}
        onNoteOff={onNoteOff}
        startNote={rangeStart}
        endNote={rangeEnd}
        noteNotation={noteNotation}
      />

      {status === "feedback" && (
        <GameFeedback
          feedbackType={feedbackType}
          currentQuestion={displayQuestion}
          feedbackCountdown={feedbackCountdown}
        />
      )}
    </section>
  );
}

export default LiteracyGame;
