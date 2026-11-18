import { useEffect, useRef, useState, useCallback } from "react";
import { MidiAudioPlayer } from "../features/midi/audioService";
import { Link } from "react-router-dom";
import { useMidiInput } from "../features/midi/useMidiInput";
import PianoKeyboard from "../components/PianoKeyboard/PianoKeyboard";
import CustomSelect from "../components/CustomSelect/CustomSelect";
import "./NoteLiteracyPage.css";
import type { CSSProperties } from "react";
import "./PianoPage.css";

const QUESTION_COUNT_OPTIONS = [10, 20, 30];
const QUESTION_TIME_OPTIONS = [3, 5, 7, 10, 15];
const FEEDBACK_TIME = 2;

const NOTE_RANGE_OPTIONS = Array.from({ length: 7 }, (_, index) => ({
  value: 36 + index * 12,
  label: `C${index + 2}`,
}));

const NATURAL_NOTE_OFFSETS = [0, 2, 4, 5, 7, 9, 11];

type GameStatus = "idle" | "playing" | "feedback" | "finished";

type StaffClef = "treble" | "bass";
type ClefMode = "auto" | "treble" | "bass";
type GameMode = "notes" | "ranges";

type AccidentalType =
  "sharp" | "flat" | "doubleSharp" | "doubleFlat" | "natural";

interface AccidentalOption {
  value: AccidentalType;
  label: string;
  symbol: string;
  semitones: number;
}

const ACCIDENTAL_OPTIONS: AccidentalOption[] = [
  { value: "sharp", label: "Диезы", symbol: "♯", semitones: 1 },
  { value: "flat", label: "Бемоли", symbol: "♭", semitones: -1 },
  { value: "doubleSharp", label: "Дубль-диезы", symbol: "𝄪", semitones: 2 },
  { value: "doubleFlat", label: "Дубль-бемоли", symbol: "𝄫", semitones: -2 },
  { value: "natural", label: "Бекары", symbol: "♮", semitones: 0 },
];

const NATURAL_NOTE_NAMES = ["C", "D", "E", "F", "G", "A", "B"];
const NATURAL_NOTE_FULL_NAMES = ["До", "Ре", "Ми", "Фа", "Соль", "Ля", "Си"];

const ACCIDENTAL_NAMES: Record<AccidentalType, string> = {
  sharp: "диез",
  flat: "бемоль",
  doubleSharp: "дубль-диез",
  doubleFlat: "дубль-бемоль",
  natural: "бекар",
};

interface Question {
  noteNumber: number;
  staffNoteNumber: number;
  clef: StaffClef;
  accidental: AccidentalType | null;
  noteName: string;
  fullNoteName: string;
  secondNote?: Question;
}

type AnswerOutcome = "correct" | "partial" | "incorrect" | "skipped";

interface AnswerRecord {
  noteNumber: number;
  noteName: string;
  fullNoteName: string;
  userNoteNumber: number | null;
  userNoteName: string | null;
  outcome: AnswerOutcome;
  responseTime: number;
  points: number;
  secondNoteName?: string;
  secondFullNoteName?: string;
  userSecondNoteName?: string | null;
  correctNotes?: number;
}

function getAccidentalSymbol(accidental: AccidentalType | null): string {
  if (!accidental) return "";

  return (
    ACCIDENTAL_OPTIONS.find((option) => option.value === accidental)?.symbol ??
    ""
  );
}

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

function createQuestions(
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

function createRangeQuestions(
  startNote: number,
  endNote: number,
  availableNotes: Set<number>,
  clefMode: ClefMode,
  questionCount: number,
  selectedAccidentals: Set<AccidentalType>,
): Question[] {
  const pool = createQuestions(
    startNote,
    endNote,
    availableNotes,
    clefMode,
    Math.max(questionCount * 8, 80),
    selectedAccidentals,
  );
  const uniqueByPitch = new Map<number, Question>();
  pool.forEach((note) => {
    if (!uniqueByPitch.has(note.noteNumber))
      uniqueByPitch.set(note.noteNumber, note);
  });
  const candidates = Array.from(uniqueByPitch.values());
  if (candidates.length < 2) return [];

  return Array.from({ length: questionCount }, () => {
    const firstIndex = Math.floor(Math.random() * candidates.length);
    let secondIndex = Math.floor(Math.random() * (candidates.length - 1));
    if (secondIndex >= firstIndex) secondIndex += 1;
    const first = candidates[firstIndex]!;
    const second = { ...candidates[secondIndex]!, clef: first.clef };
    return { ...first, secondNote: second };
  });
}

function getNoteName(noteNumber: number): string {
  const names = [
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

  const pitch = noteNumber % 12;
  const octave = Math.floor(noteNumber / 12) - 1;

  return `${names[pitch]}${octave}`;
}

function getStaffY(noteNumber: number, clef: StaffClef): number {
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

type SettingLabelProps = {
  title: string;
  description: string;
};

function SettingLabel({ title, description }: SettingLabelProps) {
  return (
    <div className="setting-label">
      <strong>{title}</strong>

      <span className="setting-tooltip-wrapper">
        <button
          type="button"
          className="setting-tooltip-trigger"
          aria-label={`${title}. ${description}`}
          data-tooltip={description}
        >
          ?
        </button>
      </span>
    </div>
  );
}

function NoteLiteracyPage() {
  const [status, setStatus] = useState<GameStatus>("idle");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [availableNotes, setAvailableNotes] = useState<Set<number>>(new Set());
  const [questionTime, setQuestionTime] = useState(5);
  const [rangeStart, setRangeStart] = useState(60);
  const [rangeEnd, setRangeEnd] = useState(84);
  const [questionCount, setQuestionCount] = useState(20);
  const [gameMode, setGameMode] = useState<GameMode>("notes");
  const [partial, setPartial] = useState(0);
  const [rangePendingCount, setRangePendingCount] = useState(0);
  const [clefMode, setClefMode] = useState<ClefMode>("auto");

  const [selectedAccidentals, setSelectedAccidentals] = useState<
    Set<AccidentalType>
  >(new Set());

  const [accidentalMenuOpen, setAccidentalMenuOpen] = useState(false);

  const [secondsLeft, setSecondsLeft] = useState(5);
  const [feedbackCountdown, setFeedbackCountdown] = useState(2);
  const [feedbackType, setFeedbackType] = useState<
    "correct" | "partial" | "incorrect" | "timeout" | null
  >(null);

  const [score, setScore] = useState(0);
  const [answerHistory, setAnswerHistory] = useState<AnswerRecord[]>([]);

  const questionStartedAtRef = useRef(0);
  const audioPlayerRef = useRef<MidiAudioPlayer | null>(null);
  const noteVersionsRef = useRef(new Map<number, number>());
  const accidentalDropdownRef = useRef<HTMLDivElement | null>(null);
  const rangePendingNotesRef = useRef<number[]>([]);
  const rangePairTimeoutRef = useRef<number | null>(null);

  const currentQuestion = questions[questionIndex];

  const rangeWidth = rangeEnd - rangeStart;

  const rangeDifficulty = Math.round((25 * (rangeWidth - 12)) / (72 - 12));

  const accidentalWeights: Record<AccidentalType, number> = {
    sharp: 1,
    flat: 1,
    doubleSharp: 2,
    doubleFlat: 2,
    natural: 0.5,
  };

  const selectedAccidentalWeight = Array.from(selectedAccidentals).reduce(
    (total, accidental) => total + accidentalWeights[accidental],
    0,
  );

  const accidentalDifficulty = Math.round(
    (25 * selectedAccidentalWeight) / 6.5,
  );

  const timeDifficulty =
    questionTime > 7
      ? Math.round((25 * (10 - questionTime)) / 12)
      : Math.round((25 * (8 - questionTime)) / 5);

  const clefDifficulty = clefMode === "auto" ? 15 : 0;

  const countDifficulty = Math.round((10 * (questionCount - 10)) / 20);

  const difficultyScore = Math.min(
    100,
    rangeDifficulty +
      accidentalDifficulty +
      timeDifficulty +
      clefDifficulty +
      countDifficulty,
  );

  const difficultyLevel =
    difficultyScore < 20
      ? "Очень легко"
      : difficultyScore < 40
        ? "Легко"
        : difficultyScore < 60
          ? "Средне"
          : difficultyScore < 80
            ? "Сложно"
            : "Очень сложно";

  const difficultyColor =
    difficultyScore < 20
      ? "easy"
      : difficultyScore < 40
        ? "light"
        : difficultyScore < 60
          ? "medium"
          : difficultyScore < 80
            ? "hard"
            : "extreme";

  const toggleAccidental = (accidental: AccidentalType) => {
    setSelectedAccidentals((previous) => {
      const next = new Set(previous);

      if (next.has(accidental)) {
        next.delete(accidental);
      } else {
        next.add(accidental);
      }

      return next;
    });
  };

  useEffect(() => {
    if (!accidentalMenuOpen) return;

    const handleOutsideClick = (event: PointerEvent) => {
      const target = event.target;

      if (
        target instanceof Node &&
        !accidentalDropdownRef.current?.contains(target)
      ) {
        setAccidentalMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAccidentalMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [accidentalMenuOpen]);

  useEffect(
    () => () => {
      if (rangePairTimeoutRef.current !== null) {
        window.clearTimeout(rangePairTimeoutRef.current);
      }
    },
    [],
  );

  const initializeAudio = useCallback(async () => {
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new MidiAudioPlayer();
    }

    await audioPlayerRef.current.initialize();
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new MidiAudioPlayer();
    }

    void audioPlayerRef.current.getAvailableNotes().then((notes) => {
      if (!cancelled) {
        setAvailableNotes(notes);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const advanceQuestion = useCallback(() => {
    if (questionIndex + 1 >= questions.length) {
      setStatus("finished");
      return;
    }

    setQuestionIndex((current) => current + 1);
    setSecondsLeft(questionTime);
    setFeedbackType(null);
    setStatus("playing");
  }, [questionIndex, questionTime, questions.length]);

  const submitRangeAnswer = useCallback(
    (pressedNotes: number[]) => {
      if (status !== "playing" || !currentQuestion?.secondNote) return;
      if (rangePairTimeoutRef.current !== null) {
        window.clearTimeout(rangePairTimeoutRef.current);
        rangePairTimeoutRef.current = null;
      }
      rangePendingNotesRef.current = [];
      setRangePendingCount(0);

      const targets = [
        currentQuestion.noteNumber,
        currentQuestion.secondNote.noteNumber,
      ];
      const matched = new Set<number>();
      pressedNotes.forEach((note) => {
        if (targets.includes(note)) matched.add(note);
      });
      const correctNotes = matched.size;
      const responseTime = Math.min(
        questionTime,
        Math.max(0, (Date.now() - questionStartedAtRef.current) / 1000),
      );
      // Скоростной коэффициент плавно уменьшается с 100% до 80% к концу таймера.
      const speedMultiplier = 1 - 0.2 * (responseTime / questionTime);
      const accuracyMultiplier = correctNotes / 2;
      const earnedPoints =
        (100 / questionCount) * accuracyMultiplier * speedMultiplier;

      if (correctNotes === 2) {
        setCorrect((value) => value + 1);
        setFeedbackType("correct");
      } else if (correctNotes === 1) {
        setPartial((value) => value + 1);
        setFeedbackType("partial");
      } else {
        setMistakes((value) => value + 1);
        setFeedbackType("incorrect");
      }

      setScore((value) => value + earnedPoints);
      setAnswerHistory((previous) => [
        ...previous,
        {
          noteNumber: currentQuestion.noteNumber,
          noteName: currentQuestion.noteName,
          fullNoteName: currentQuestion.fullNoteName,
          secondNoteName: currentQuestion.secondNote!.noteName,
          secondFullNoteName: currentQuestion.secondNote!.fullNoteName,
          userNoteNumber: pressedNotes[0] ?? null,
          userNoteName:
            pressedNotes[0] == null ? null : getNoteName(pressedNotes[0]),
          userSecondNoteName:
            pressedNotes[1] == null ? null : getNoteName(pressedNotes[1]),
          correctNotes,
          outcome:
            correctNotes === 2
              ? "correct"
              : correctNotes === 1
                ? "partial"
                : "incorrect",
          responseTime,
          points: earnedPoints,
        },
      ]);
      setFeedbackCountdown(FEEDBACK_TIME);
      setStatus("feedback");
    },
    [status, currentQuestion, questionTime, questionCount],
  );

  const handleNoteOn = useCallback(
    async (noteNumber: number, velocity = 100) => {
      if (!availableNotes.has(noteNumber)) return;

      // Сначала фиксируем ответ, не ожидая загрузки аудиосэмпла.
      setActiveNotes((previous) => new Set(previous).add(noteNumber));

      if (status === "playing" && currentQuestion) {
        if (gameMode === "ranges" && currentQuestion.secondNote) {
          const pending = rangePendingNotesRef.current;
          if (!pending.includes(noteNumber)) {
            if (pending.length === 0) {
              rangePendingNotesRef.current = [noteNumber];
              setRangePendingCount(1);
              rangePairTimeoutRef.current = window.setTimeout(() => {
                submitRangeAnswer(rangePendingNotesRef.current);
              }, 500);
            } else {
              submitRangeAnswer([...pending, noteNumber]);
            }
          }
        } else {
          const isCorrect = noteNumber === currentQuestion.noteNumber;
          const responseTime = Math.min(
            questionTime,
            Math.max(0, (Date.now() - questionStartedAtRef.current) / 1000),
          );
          const speedMultiplier =
            responseTime <= questionTime / 2
              ? 1
              : 1 -
                0.2 * ((responseTime - questionTime / 2) / (questionTime / 2));

          const earnedPoints = isCorrect
            ? (100 / questionCount) * speedMultiplier
            : 0;

          if (isCorrect) {
            setCorrect((value) => value + 1);
            setFeedbackType("correct");
          } else {
            setMistakes((value) => value + 1);
            setFeedbackType("incorrect");
          }

          setScore((value) => value + earnedPoints);
          setAnswerHistory((previous) => [
            ...previous,
            {
              noteNumber: currentQuestion.noteNumber,
              noteName: currentQuestion.noteName,
              fullNoteName: currentQuestion.fullNoteName,
              userNoteNumber: noteNumber,
              userNoteName: getNoteName(noteNumber),
              outcome: isCorrect ? "correct" : "incorrect",
              responseTime,
              points: earnedPoints,
            },
          ]);
          setFeedbackCountdown(FEEDBACK_TIME);
          setStatus("feedback");
        }
      }

      // Звук воспроизводится независимо от того, идёт ли сейчас вопрос.
      const noteEventId = (noteVersionsRef.current.get(noteNumber) ?? 0) + 1;
      noteVersionsRef.current.set(noteNumber, noteEventId);

      try {
        await initializeAudio();
        const player = audioPlayerRef.current;
        if (
          !player ||
          noteVersionsRef.current.get(noteNumber) !== noteEventId
        ) {
          return;
        }

        await player.noteOn(noteNumber, velocity);
        if (noteVersionsRef.current.get(noteNumber) !== noteEventId) {
          player.noteOff(noteNumber);
        }
      } catch (err) {
        console.error("Ошибка воспроизведения ноты:", err);
      }
    },
    [
      availableNotes,
      status,
      currentQuestion,
      gameMode,
      questionTime,
      questionCount,
      submitRangeAnswer,
      initializeAudio,
    ],
  );

  const handleNoteOff = useCallback((noteNumber: number) => {
    noteVersionsRef.current.set(
      noteNumber,
      (noteVersionsRef.current.get(noteNumber) ?? 0) + 1,
    );

    audioPlayerRef.current?.noteOff(noteNumber);

    setActiveNotes((previous) => {
      const next = new Set(previous);
      next.delete(noteNumber);
      return next;
    });
  }, []);

  const midi = useMidiInput(
    {
      onNoteOn: handleNoteOn,
      onNoteOff: handleNoteOff,
    },
    () => setPermissionModalOpen(false),
  );

  const accuracy = Math.round(
    (gameMode === "ranges"
      ? (correct * 2 + partial) / (questionCount * 2)
      : correct / questionCount) * 100,
  );

  const answeredQuestions = answerHistory.filter(
    (answer) => answer.outcome !== "skipped",
  );

  const averageResponseTime =
    answeredQuestions.length > 0
      ? answeredQuestions.reduce(
          (total, answer) => total + (answer.responseTime ?? 0),
          0,
        ) / answeredQuestions.length
      : 0;

  const resultLevel =
    score >= 90
      ? {
          title: "Великолепно!",
          subtitle: "Ты отлично читаешь ноты",
          description: "Почти безупречное исполнение. Продолжай в том же духе!",
          className: "result-excellent",
          symbol: "✦",
        }
      : score >= 70
        ? {
            title: "Отличный результат!",
            subtitle: "Ты уверенно справляешься",
            description:
              "Хорошее знание нот. Ещё немного практики — и будет максимум!",
            className: "result-great",
            symbol: "✧",
          }
        : score >= 40
          ? {
              title: "Хорошее начало!",
              subtitle: "Есть куда расти",
              description: "Ты уже знаешь немало нот. Продолжай тренироваться!",
              className: "result-good",
              symbol: "◇",
            }
          : {
              title: "Продолжай практику!",
              subtitle: "Каждая попытка делает тебя лучше",
              description:
                "Не торопись и постепенно запоминай расположение нот.",
              className: "result-practice",
              symbol: "◎",
            };

  const startGame = () => {
    const newQuestions =
      gameMode === "ranges"
        ? createRangeQuestions(
            rangeStart,
            rangeEnd,
            availableNotes,
            clefMode,
            questionCount,
            selectedAccidentals,
          )
        : createQuestions(
            rangeStart,
            rangeEnd,
            availableNotes,
            clefMode,
            questionCount,
            selectedAccidentals,
          );

    if (newQuestions.length === 0) {
      window.alert(
        gameMode === "ranges"
          ? "В выбранном диапазоне недостаточно разных доступных нот для построения диапазонов. Расширь диапазон или проверь настройки."
          : "В выбранном диапазоне нет доступных нот для игры.",
      );
      return;
    }

    setQuestions(newQuestions);
    setQuestionIndex(0);
    setCorrect(0);
    setMistakes(0);
    setPartial(0);
    setSkipped(0);
    rangePendingNotesRef.current = [];
    setRangePendingCount(0);
    if (rangePairTimeoutRef.current !== null)
      window.clearTimeout(rangePairTimeoutRef.current);
    setScore(0);
    setAnswerHistory([]);
    questionStartedAtRef.current = Date.now();
    setSecondsLeft(questionTime);
    setFeedbackType(null);
    setFeedbackCountdown(FEEDBACK_TIME);
    setStatus("playing");
  };

  // Таймер текущего вопроса.
  useEffect(() => {
    if (status !== "playing") return;

    const startTime = Date.now();
    const duration = questionTime * 1000;

    questionStartedAtRef.current = startTime;

    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);

      setSecondsLeft(Math.ceil(remaining / 100) / 10);

      if (remaining <= 0) {
        window.clearInterval(interval);

        if (gameMode === "ranges" && rangePendingNotesRef.current.length > 0) {
          submitRangeAnswer(rangePendingNotesRef.current);
          return;
        }

        setSkipped((value) => value + 1);

        setAnswerHistory((previous) => [
          ...previous,
          {
            noteNumber: questions[questionIndex]!.noteNumber,
            noteName: questions[questionIndex]!.noteName,
            fullNoteName: questions[questionIndex]!.fullNoteName,
            secondNoteName: questions[questionIndex]!.secondNote?.noteName,
            secondFullNoteName:
              questions[questionIndex]!.secondNote?.fullNoteName,
            userNoteNumber: null,
            userNoteName: null,
            outcome: "skipped",
            responseTime: questionTime,
            points: 0,
          },
        ]);

        setFeedbackType("timeout");
        setFeedbackCountdown(FEEDBACK_TIME);
        setStatus("feedback");
      }
    }, 50);

    return () => window.clearInterval(interval);
  }, [
    status,
    questionIndex,
    questionTime,
    questions,
    gameMode,
    submitRangeAnswer,
  ]);

  // Небольшая пауза после ответа.
  useEffect(() => {
    if (status !== "feedback") return;

    const startTime = Date.now();

    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, FEEDBACK_TIME * 1000 - elapsed);

      setFeedbackCountdown(Math.ceil(remaining / 100) / 10);

      if (remaining <= 0) {
        window.clearInterval(interval);
        advanceQuestion();
      }
    }, 50);

    return () => window.clearInterval(interval);
  }, [status, advanceQuestion]);

  return (
    <main className="content-page literacy-page">
      <div className="literacy-topbar">
        <header className="page-heading">
          <Link to="/exercises" className="piano-back-link">
            ← Упражнения
          </Link>

          <h1>Нотная грамота</h1>

          <p>
            Определи ноту на нотном стане и нажми соответствующую клавишу на
            MIDI-клавиатуре.
          </p>
        </header>

        <div
          className={
            midi.connected
              ? "connection-status is-connected"
              : "connection-status is-unrecognized"
          }
        >
          <span className="connection-dot" />

          <div className="connection-copy">
            <strong>
              {midi.connected ? midi.deviceName : "Устройство не подключено"}
            </strong>

            <small>
              {midi.connected
                ? "Устройство готово"
                : "Подключи MIDI-клавиатуру при необходимости"}
            </small>

            {midi.error && <p className="error">{midi.error}</p>}
          </div>

          <button
            className="recognize-midi-button"
            onClick={() => setPermissionModalOpen(true)}
          >
            Подключить MIDI
          </button>
        </div>
      </div>

      {status === "idle" && (
        <section className="literacy-start-screen">
          <div className="literacy-settings-panel">
            <div className="start-section-heading">
              <span className="start-section-icon">⚙</span>

              <div>
                <h2>Настройки игры</h2>
                <p>Выбери удобный уровень сложности</p>
              </div>
            </div>

            <div className="start-setting">
              <SettingLabel
                title="Режим игры"
                description="Выбери, что нужно определять на нотном стане"
              />
              <CustomSelect
                ariaLabel="Режим игры"
                value={gameMode}
                options={[
                  { value: "notes", label: "Ноты — одна нота за вопрос" },
                  {
                    value: "ranges",
                    label: "Диапазоны — две ноты одновременно",
                  },
                ]}
                onChange={(value) => setGameMode(String(value) as GameMode)}
              />
            </div>

            <div className="start-setting">
              <SettingLabel
                title="Количество вопросов"
                description="Сколько нот нужно определить за одну игру"
              />

              <div className="literacy-time-options">
                {QUESTION_COUNT_OPTIONS.map((count) => (
                  <button
                    key={count}
                    type="button"
                    className={
                      questionCount === count
                        ? "time-option selected"
                        : "time-option"
                    }
                    onClick={() => setQuestionCount(count)}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            <div className="start-setting">
              <SettingLabel
                title="Диапазон нот"
                description="Какие ноты будут встречаться в игре"
              />

              <div className="literacy-range-selects">
                <label>
                  <strong>От</strong>

                  <CustomSelect
                    ariaLabel="Начальная нота диапазона"
                    value={rangeStart}
                    options={NOTE_RANGE_OPTIONS.filter(
                      (note) => note.value < rangeEnd,
                    ).map((note) => ({
                      value: note.value,
                      label: note.label,
                    }))}
                    onChange={(value) => setRangeStart(Number(value))}
                  />
                </label>

                <label>
                  <strong>До</strong>

                  <CustomSelect
                    ariaLabel="Конечная нота диапазона"
                    value={rangeEnd}
                    options={NOTE_RANGE_OPTIONS.filter(
                      (note) => note.value > rangeStart,
                    ).map((note) => ({
                      value: note.value,
                      label: note.label,
                    }))}
                    onChange={(value) => setRangeEnd(Number(value))}
                  />
                </label>
              </div>
            </div>

            <div className="start-setting">
              <SettingLabel
                title="Нотный ключ"
                description="Выбери, в каком ключе показывать ноты"
              />

              <CustomSelect
                ariaLabel="Выбор нотного ключа"
                value={clefMode}
                options={[
                  { value: "auto", label: "Оба ключа" },
                  { value: "treble", label: "Только скрипичный" },
                  { value: "bass", label: "Только басовый" },
                ]}
                onChange={(value) => setClefMode(String(value) as ClefMode)}
              />
            </div>

            <div className="start-setting accidental-setting">
              <SettingLabel
                title="Знаки альтерации"
                description="Выбери, какие знаки могут встречаться в игре. Если ничего не выбрано, будут использоваться только натуральные ноты."
              />

              <div className="accidental-dropdown" ref={accidentalDropdownRef}>
                <button
                  type="button"
                  className="accidental-dropdown-trigger"
                  aria-expanded={accidentalMenuOpen}
                  onClick={() => setAccidentalMenuOpen((value) => !value)}
                >
                  <span>
                    {selectedAccidentals.size === 0
                      ? "Только натуральные ноты"
                      : `Выбрано: ${ACCIDENTAL_OPTIONS.filter((option) =>
                          selectedAccidentals.has(option.value),
                        )
                          .map((option) => option.symbol)
                          .join(", ")}`}
                  </span>

                  <span className="accidental-dropdown-arrow">
                    {accidentalMenuOpen ? "▲" : "▼"}
                  </span>
                </button>

                {accidentalMenuOpen && (
                  <div className="accidental-dropdown-menu">
                    {ACCIDENTAL_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className="accidental-checkbox-option"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAccidentals.has(option.value)}
                          onChange={() => toggleAccidental(option.value)}
                        />

                        <span className="accidental-option-symbol">
                          {option.symbol}
                        </span>

                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="start-setting">
              <SettingLabel
                title="Время на один вопрос"
                description="Сколько времени даётся на ответ"
              />

              <div className="literacy-time-options">
                {QUESTION_TIME_OPTIONS.map((time) => (
                  <button
                    key={time}
                    type="button"
                    className={
                      questionTime === time
                        ? "time-option selected"
                        : "time-option"
                    }
                    onClick={() => setQuestionTime(time)}
                  >
                    {time}с
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="literacy-launch-panel">
            <div className="launch-decoration">♫</div>

            <span className="launch-kicker">NOTE LITERACY</span>

            <h2>Готов проверить знание нот?</h2>

            <p className="launch-description">
              {gameMode === "ranges"
                ? "Смотри на две ноты на нотном стане и сыграй обе на клавиатуре с интервалом не более одной секунды. Чем быстрее и точнее ответ, тем больше баллов!"
                : "Смотри на ноту на нотном стане, находи её на клавиатуре и старайся отвечать как можно быстрее. Тренируй музыкальную грамотность и улучшай свой результат!"}
            </p>

            <div className="launch-info">
              <div>
                <strong>{questionCount}</strong>
                <span>вопросов</span>
              </div>

              <div>
                <strong>{questionTime} сек.</strong>
                <span>на ответ</span>
              </div>

              <div>
                <strong>
                  {
                    NOTE_RANGE_OPTIONS.find((note) => note.value === rangeStart)
                      ?.label
                  }
                  {" – "}
                  {
                    NOTE_RANGE_OPTIONS.find((note) => note.value === rangeEnd)
                      ?.label
                  }
                </strong>
                <span>диапазон</span>
              </div>
            </div>

            <div className="difficulty-panel">
              <div className="difficulty-heading">
                <strong>Сложность упражнения</strong>
                <span className={`difficulty-level ${difficultyColor}`}>
                  {difficultyLevel}
                </span>
              </div>

              <div className="difficulty-score">
                <strong>{difficultyScore}</strong>
                <span>/ 100</span>
              </div>

              <div
                className="difficulty-progress"
                role="progressbar"
                aria-label="Сложность упражнения"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={difficultyScore}
              >
                <div
                  className={`difficulty-progress-fill ${difficultyColor}`}
                  style={{ width: `${difficultyScore}%` }}
                />
              </div>

              <div className="difficulty-breakdown">
                <div>
                  <span>Диапазон нот</span>
                  <strong>{rangeDifficulty} / 25</strong>
                </div>

                <div>
                  <span>Знаки альтерации</span>
                  <strong>{accidentalDifficulty} / 25</strong>
                </div>

                <div>
                  <span>Время на ответ</span>
                  <strong>{timeDifficulty} / 25</strong>
                </div>

                <div>
                  <span>Нотный ключ</span>
                  <strong>{clefDifficulty} / 15</strong>
                </div>

                <div>
                  <span>Количество вопросов</span>
                  <strong>{countDifficulty} / 10</strong>
                </div>
              </div>
            </div>

            <button
              onClick={startGame}
              className="primary-button literacy-start-button"
            >
              Начать игру
              <span>→</span>
            </button>

            <p className="launch-footnote">
              Можно играть с MIDI-клавиатуры или экранного пианино
            </p>
          </div>
        </section>
      )}

      {(status === "playing" || status === "feedback") && currentQuestion && (
        <section className="literacy-card">
          <div className="literacy-game-heading">
            <strong>
              Вопрос {questionIndex + 1} из {questionCount}
            </strong>

            <strong className="literacy-timer">
              {secondsLeft.toFixed(1)} сек.
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
            {gameMode === "ranges" ? "Какие это ноты?" : "Какая это нота?"}
          </h2>

          <Staff
            noteNumber={currentQuestion.staffNoteNumber}
            clef={currentQuestion.clef}
            accidental={currentQuestion.accidental}
            secondNote={
              gameMode === "ranges" ? currentQuestion.secondNote : undefined
            }
          />

          <p className="literacy-instruction">
            {gameMode === "ranges"
              ? `Сыграй обе ноты одновременно или по очереди в течение 0,5 секунд. Уже нажато: ${rangePendingCount}/2`
              : "Нажми соответствующую клавишу на MIDI-клавиатуре"}
          </p>

          <PianoKeyboard
            activeNotes={activeNotes}
            availableNotes={availableNotes}
            onNoteOn={handleNoteOn}
            onNoteOff={handleNoteOff}
            startNote={rangeStart}
            endNote={rangeEnd}
          />

          {status === "feedback" && (
            <div
              className={`literacy-feedback-modal ${
                feedbackType === "correct"
                  ? "feedback-correct"
                  : feedbackType === "partial"
                    ? "feedback-partial"
                    : feedbackType === "incorrect"
                      ? "feedback-incorrect"
                      : "feedback-timeout"
              }`}
              role="status"
              aria-live="assertive"
            >
              {feedbackType === "correct" && (
                <>
                  <span className="feedback-icon">✓</span>
                  <h2>Правильно!</h2>
                  <strong>
                    {currentQuestion.fullNoteName}
                    {currentQuestion.secondNote
                      ? ` + ${currentQuestion.secondNote.fullNoteName}`
                      : ""}
                  </strong>
                </>
              )}

              {feedbackType === "partial" && (
                <>
                  <span className="feedback-icon">◐</span>
                  <h2>Частично верно</h2>
                  <strong>Угадана одна нота из двух</strong>
                  <p>
                    {currentQuestion.fullNoteName} и{" "}
                    {currentQuestion.secondNote?.fullNoteName}
                  </p>
                </>
              )}

              {feedbackType === "incorrect" && (
                <>
                  <span className="feedback-icon">×</span>
                  <h2>Неверно</h2>
                  <strong>
                    Правильный ответ: {currentQuestion.fullNoteName}
                    {currentQuestion.secondNote
                      ? ` + ${currentQuestion.secondNote.fullNoteName}`
                      : ""}
                  </strong>
                </>
              )}

              {feedbackType === "timeout" && (
                <>
                  <h2>Время вышло!</h2>
                  <strong>
                    Правильный ответ: {currentQuestion.fullNoteName}
                    {currentQuestion.secondNote
                      ? ` + ${currentQuestion.secondNote.fullNoteName}`
                      : ""}
                  </strong>
                </>
              )}

              <p>
                Следующий вопрос через {feedbackCountdown.toFixed(1)} секунды
              </p>
            </div>
          )}
        </section>
      )}

      {status === "finished" && (
        <section className={`literacy-results ${resultLevel.className}`}>
          <div className="results-main-card">
            <div className="results-eyebrow">
              <span className="results-eyebrow-dot" />
              РЕЗУЛЬТАТ ТРЕНИРОВКИ
            </div>

            <h2>Упражнение завершено</h2>

            <div className="results-score-layout">
              <div
                className="results-score-ring"
                style={
                  {
                    "--target-angle": `${score * 3.6}deg`,
                  } as CSSProperties
                }
              >
                <div className="results-score-ring-inner">
                  <strong>{score.toFixed(1).replace(".0", "")}%</strong>
                  <span>из 100%</span>
                </div>
              </div>

              <div className="results-score-copy">
                <span className="results-score-label">ТВОЯ ОЦЕНКА</span>
                <h3>{resultLevel.title}</h3>
                <p>{resultLevel.subtitle}</p>
              </div>
            </div>

            <div className="results-metrics">
              <div className="result-metric result-metric-correct">
                <span className="result-metric-icon">✓</span>
                <strong>
                  {correct} / {questionCount}
                </strong>
                <span>Правильные ответы</span>
                <small>{accuracy}% точности</small>
              </div>

              <div className="result-metric result-metric-correct">
                <span className="result-metric-icon">◐</span>
                <strong>{partial}</strong>
                <span>Частично верно</span>
                <small>Угадана одна нота из двух</small>
              </div>

              <div className="result-metric result-metric-incorrect">
                <span className="result-metric-icon">×</span>
                <strong>{mistakes}</strong>
                <span>Ошибки</span>
                <small>Неправильные ответы</small>
              </div>

              <div className="result-metric result-metric-skipped">
                <span className="result-metric-icon">⌛</span>
                <strong>{skipped}</strong>
                <span>Пропуски</span>
                <small>Время истекло</small>
              </div>

              <div className="result-metric result-metric-time">
                <span className="result-metric-icon">◷</span>
                <strong>{averageResponseTime.toFixed(2)} сек.</strong>
                <span>Среднее время</span>
                <small>На один данный ответ</small>
              </div>
            </div>

            <div className="results-history">
              <div className="results-history-heading">
                <strong>История ответов</strong>
                <span>
                  {answerHistory.length} из {questionCount}
                </span>
              </div>

              <div className="results-history-list">
                {answerHistory.map((answer, index) => (
                  <div
                    key={`${index}-${answer.noteNumber}-${answer.secondNoteName ?? "single"}`}
                    className={`results-history-item ${answer.outcome} ${
                      answer.outcome === "correct" &&
                      answer.responseTime !== null &&
                      answer.responseTime > questionTime / 2
                        ? "slow-correct"
                        : ""
                    }`}
                    title={
                      answer.outcome === "correct"
                        ? `Правильно: ${answer.noteName}${answer.secondNoteName ? ` + ${answer.secondNoteName}` : ""}`
                        : answer.outcome === "partial"
                          ? `Частично: ${answer.noteName} + ${answer.secondNoteName}`
                          : answer.outcome === "incorrect"
                            ? `Загадано: ${answer.noteName}${answer.secondNoteName ? ` + ${answer.secondNoteName}` : ""}, твой ответ: ${answer.userNoteName}`
                            : `Пропуск: ${answer.noteName}`
                    }
                  >
                    <span className="history-question-number">{index + 1}</span>

                    <strong>
                      {answer.outcome === "correct"
                        ? "✓"
                        : answer.outcome === "partial"
                          ? "◐"
                          : answer.outcome === "incorrect"
                            ? "×"
                            : "–"}
                    </strong>

                    <span className="history-note">
                      {answer.outcome === "incorrect" ? (
                        <>
                          <span>
                            {answer.userNoteName ?? "—"}
                            {answer.userSecondNoteName
                              ? ` + ${answer.userSecondNoteName}`
                              : ""}
                          </span>
                          <small>
                            Верно: {answer.noteName}
                            {answer.secondNoteName
                              ? ` + ${answer.secondNoteName}`
                              : ""}
                          </small>
                        </>
                      ) : answer.outcome === "partial" ? (
                        <>
                          <span>
                            {answer.noteName} + {answer.secondNoteName}
                          </span>
                          <small>Угадана 1 нота из 2</small>
                        </>
                      ) : (
                        <>
                          {answer.noteName}
                          {answer.secondNoteName
                            ? ` + ${answer.secondNoteName}`
                            : ""}
                        </>
                      )}
                    </span>

                    <span
                      className={`history-response-time ${
                        answer.outcome === "correct" &&
                        answer.responseTime !== null &&
                        answer.responseTime > questionTime / 2
                          ? "slow-response-time"
                          : ""
                      }`}
                    >
                      {answer.responseTime?.toFixed(1)} сек.
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStatus("idle")}
              className="primary-button results-retry-button"
            >
              Пройти ещё раз
            </button>
          </div>

          <aside className="results-visual-card">
            <div className="results-visual-orbit orbit-one" />
            <div className="results-visual-orbit orbit-two" />
            <div className="results-visual-glow" />

            <div className="results-visual-symbol">
              <span>{resultLevel.symbol}</span>
            </div>

            <div className="results-visual-copy">
              <span>NOTE LITERACY</span>
              <h3>{resultLevel.title}</h3>
              <p>{resultLevel.description}</p>
            </div>

            <div className="results-visual-footer">
              <span>Упражнение завершено</span>
              <span>{Math.round(score)} / 100</span>
            </div>
          </aside>
        </section>
      )}

      {permissionModalOpen && (
        <div className="modal-backdrop">
          <section
            className="permission-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="permission-title"
          >
            <button
              type="button"
              className="permission-modal-close"
              onClick={() => setPermissionModalOpen(false)}
              aria-label="Закрыть окно"
            >
              ×
            </button>

            <div className="modal-icon">♫</div>

            <span className="section-kicker">WELCOME</span>

            <h2 id="permission-title">Подключи MIDI-клавиатуру</h2>

            <p>
              Разреши доступ к MIDI-устройствам, чтобы приложение могло получать
              нажатия клавиш и распознавать ноты.
            </p>

            <button className="primary-button" onClick={midi.connect}>
              Разрешить доступ к MIDI
            </button>

            <span className="modal-footnote">
              Разрешение запрашивается через браузер
            </span>
          </section>
        </div>
      )}
    </main>
  );
}

export default NoteLiteracyPage;
