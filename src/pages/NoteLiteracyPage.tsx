import { useCallback, useEffect, useRef, useState } from "react";
import { MidiAudioPlayer } from "../features/midi/audioService";
import { Link } from "react-router-dom";
import { useMidiInput } from "../features/midi/useMidiInput";
import PianoKeyboard from "../components/PianoKeyboard/PianoKeyboard";
import "./NoteLiteracyPage.css";
import "./PianoPage.css";

const TOTAL_QUESTIONS = 15;
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

interface Question {
  noteNumber: number;
  clef: StaffClef;
}

function createQuestions(
  startNote: number,
  endNote: number,
  availableNotes: Set<number>,
  clefMode: ClefMode,
): Question[] {
  const notes: number[] = [];

  for (let octaveStart = startNote; octaveStart <= endNote; octaveStart += 12) {
    NATURAL_NOTE_OFFSETS.forEach((offset) => {
      const noteNumber = octaveStart + offset;

      if (noteNumber <= endNote && availableNotes.has(noteNumber)) {
        notes.push(noteNumber);
      }
    });
  }

  if (notes.length === 0) return [];

  return Array.from({ length: TOTAL_QUESTIONS }, () => {
    const noteNumber = notes[Math.floor(Math.random() * notes.length)]!;
    const octave = Math.floor(noteNumber / 12) - 1;

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

    return { noteNumber, clef };
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

function getFullNoteName(noteNumber: number): string {
  const names = [
    "До",
    "До-диез",
    "Ре",
    "Ре-диез",
    "Ми",
    "Фа",
    "Фа-диез",
    "Соль",
    "Соль-диез",
    "Ля",
    "Ля-диез",
    "Си",
  ];

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

  const pitch = noteNumber % 12;
  const octave = Math.floor(noteNumber / 12) - 1;

  return `${getNoteName(noteNumber)} / ${names[pitch]} ${octaveNames[octave]}`;
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
function Staff({ noteNumber, clef }: { noteNumber: number; clef: StaffClef }) {
  const noteY = getStaffY(noteNumber, clef);
  const ledgerLines: number[] = [];

  // Добавочные линейки ниже нотного стана.
  if (noteY > 180) {
    for (let y = 200; y <= noteY; y += 20) {
      ledgerLines.push(y);
    }
  }

  // Добавочные линейки выше нотного стана.
  if (noteY < 100) {
    for (let y = 80; y >= noteY; y -= 20) {
      ledgerLines.push(y);
    }
  }

  // Подстраиваем область SVG под высоту ноты.
  const viewBoxTop = Math.min(0, noteY - 60);
  const viewBoxBottom = Math.max(230, noteY + 20);
  const viewBoxHeight = viewBoxBottom - viewBoxTop;

  const clefSymbol = clef === "treble" ? "𝄞" : "𝄢";

  const clefName = clef === "treble" ? "скрипичном" : "басовом";

  return (
    <svg
      className="literacy-staff"
      viewBox={`0 ${viewBoxTop} 500 ${viewBoxHeight}`}
      role="img"
      aria-label={`Нота на нотном стане в ${clefName} ключе`}
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

      {ledgerLines.map((y) => (
        <line
          key={y}
          x1="235"
          y1={y}
          x2="285"
          y2={y}
          stroke="currentColor"
          strokeWidth="1.5"
        />
      ))}

      <ellipse
        cx="260"
        cy={noteY}
        rx="11"
        ry="7.5"
        fill="#a78bfa"
        stroke="#d8ccff"
        strokeWidth="1.5"
        transform={`rotate(-20 260 ${noteY})`}
      />

      <line
        x1="270"
        y1={noteY - 2}
        x2="270"
        y2={noteY - 48}
        stroke="#a78bfa"
        strokeWidth="2"
      />
    </svg>
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
  const [clefMode, setClefMode] = useState<ClefMode>("auto");
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [feedbackCountdown, setFeedbackCountdown] = useState(2);
  const [feedbackType, setFeedbackType] = useState<
    "correct" | "incorrect" | "timeout" | null
  >(null);

  const audioPlayerRef = useRef<MidiAudioPlayer | null>(null);
  const noteVersionsRef = useRef(new Map<number, number>());

  const currentQuestion = questions[questionIndex];

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
    if (questionIndex + 1 >= TOTAL_QUESTIONS) {
      setStatus("finished");
      return;
    }

    setQuestionIndex((current) => current + 1);
    setSecondsLeft(questionTime);
    setFeedbackType(null);
    setStatus("playing");
  }, [questionIndex, questionTime]);

  const handleNoteOn = useCallback(
    async (noteNumber: number, velocity = 100) => {
      if (!availableNotes.has(noteNumber)) return;
      const noteEventId = (noteVersionsRef.current.get(noteNumber) ?? 0) + 1;

      noteVersionsRef.current.set(noteNumber, noteEventId);

      // Запускаем звук независимо от того, идёт ли сейчас вопрос.
      try {
        await initializeAudio();

        const player = audioPlayerRef.current;

        if (!player) return;

        // Если клавишу уже отпустили, не запускаем звук.
        if (noteVersionsRef.current.get(noteNumber) !== noteEventId) {
          return;
        }

        await player.noteOn(noteNumber, velocity);

        // Если клавишу отпустили во время загрузки звука,
        // сразу останавливаем ноту.
        if (noteVersionsRef.current.get(noteNumber) !== noteEventId) {
          player.noteOff(noteNumber);
          return;
        }
      } catch (err) {
        console.error("Ошибка воспроизведения ноты:", err);
      }

      setActiveNotes((previous) => new Set(previous).add(noteNumber));

      // Проверяем ответ только во время игры.
      if (status !== "playing" || !currentQuestion) return;

      if (noteNumber === currentQuestion.noteNumber) {
        setCorrect((value) => value + 1);
        setFeedbackType("correct");
      } else {
        setMistakes((value) => value + 1);
        setFeedbackType("incorrect");
      }

      setFeedbackCountdown(FEEDBACK_TIME);
      setStatus("feedback");
    },
    [initializeAudio, status, currentQuestion, availableNotes],
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

  const startGame = () => {
    const newQuestions = createQuestions(
      rangeStart,
      rangeEnd,
      availableNotes,
      clefMode,
    );

    if (newQuestions.length === 0) return;

    setQuestions(newQuestions);
    setQuestionIndex(0);
    setCorrect(0);
    setMistakes(0);
    setSkipped(0);
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

    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);

      setSecondsLeft(Math.ceil(remaining / 100) / 10);

      if (remaining <= 0) {
        window.clearInterval(interval);
        setSkipped((value) => value + 1);
        setFeedbackType("timeout");
        setFeedbackCountdown(FEEDBACK_TIME);
        setStatus("feedback");
      }
    }, 50);

    return () => window.clearInterval(interval);
  }, [status, questionIndex, questionTime]);

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
        <section className="literacy-card">
          <h2>Готов проверить знание нот?</h2>
          <p>
            В игре 15 вопросов. Определи ноту на нотном стане и нажми
            соответствующую клавишу.
          </p>

          <div className="literacy-time-settings">
            <strong>Время на один вопрос</strong>

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

          <div className="literacy-range-settings">
            <strong>Диапазон предлагаемых нот</strong>

            <div className="literacy-range-selects">
              <label>
                <span>От</span>
                <select
                  value={rangeStart}
                  onChange={(event) =>
                    setRangeStart(Number(event.target.value))
                  }
                >
                  {NOTE_RANGE_OPTIONS.filter(
                    (note) => note.value <= rangeEnd,
                  ).map((note) => (
                    <option key={note.value} value={note.value}>
                      {note.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>До</span>
                <select
                  value={rangeEnd}
                  onChange={(event) => setRangeEnd(Number(event.target.value))}
                >
                  {NOTE_RANGE_OPTIONS.filter(
                    (note) => note.value >= rangeStart,
                  ).map((note) => (
                    <option key={note.value} value={note.value}>
                      {note.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="setting-group">
                <label htmlFor="clef-mode">Ключ</label>
                <select
                  id="clef-mode"
                  value={clefMode}
                  onChange={(event) =>
                    setClefMode(event.target.value as ClefMode)
                  }
                >
                  <option value="auto">Оба ключа</option>
                  <option value="treble">Только скрипичный</option>
                  <option value="bass">Только басовый</option>
                </select>
              </div>
            </div>
          </div>

          <button onClick={startGame} className="primary-button">
            Начать упражнение
          </button>
        </section>
      )}

      {(status === "playing" || status === "feedback") && currentQuestion && (
        <section className="literacy-card">
          <div className="literacy-game-heading">
            <strong>
              Вопрос {questionIndex + 1} из {TOTAL_QUESTIONS}
            </strong>
            <strong className="literacy-timer">
              {secondsLeft.toFixed(1)} сек.
            </strong>
          </div>

          <div className="literacy-progress">
            <div
              style={{
                width: `${((questionIndex + 1) / TOTAL_QUESTIONS) * 100}%`,
              }}
            />
          </div>

          <h2>Какая это нота?</h2>

          <Staff
            noteNumber={currentQuestion.noteNumber}
            clef={currentQuestion.clef}
          />

          <p className="literacy-instruction">
            Нажми соответствующую клавишу на MIDI-клавиатуре
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
                  <strong>{getFullNoteName(currentQuestion.noteNumber)}</strong>
                </>
              )}

              {feedbackType === "incorrect" && (
                <>
                  <span className="feedback-icon">×</span>
                  <h2>Неверно</h2>
                  <strong>
                    Правильный ответ:{" "}
                    {getFullNoteName(currentQuestion.noteNumber)}
                  </strong>
                </>
              )}

              {feedbackType === "timeout" && (
                <>
                  <h2>Время вышло!</h2>
                  <strong>
                    Правильный ответ:{" "}
                    {getFullNoteName(currentQuestion.noteNumber)}
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
        <section className="literacy-card literacy-results">
          <h2>Упражнение завершено!</h2>

          <div className="literacy-score">
            <strong>{correct}</strong>
            <span>верных ответов из {TOTAL_QUESTIONS}</span>
          </div>

          <div className="literacy-stats">
            <div>
              <strong>{correct}</strong>
              <span>Верно</span>
            </div>
            <div>
              <strong>{mistakes}</strong>
              <span>Ошибки</span>
            </div>
            <div>
              <strong>{skipped}</strong>
              <span>Пропуски</span>
            </div>
          </div>

          <button onClick={() => setStatus("idle")} className="primary-button">
            Сыграть ещё раз
          </button>
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
