import { useEffect, useRef, useState, useCallback } from "react";
import type {
  AccidentalType,
  AnswerRecord,
  ClefMode,
  GameMode,
  GameStatus,
  Question,
} from "../features/note-literacy/types";
import {
  createQuestions,
  createRangeQuestions,
} from "../features/note-literacy/utils/questionGenerator";
import { getNoteName, getQuestionNoteName } from "../features/midi/midiUtils";
import GameResults from "../features/note-literacy/components/GameResults";
import { MidiAudioPlayer } from "../features/midi/audioService";
import { useMidiInput } from "../features/midi/useMidiInput";
import LiteracySettings from "../features/note-literacy/components/LiteracySettings";
import DifficultyPanel from "../features/note-literacy/components/DifficultyPanel";
import LiteracyGame from "../features/note-literacy/components/LiteracyGame";
import LiteracyTopbar from "../features/note-literacy/components/LiteracyTopbar";
import MidiPermissionModal from "../components/MidiPermissionModal/MidiPermissionModal";
import { NOTE_RANGE_OPTIONS } from "../features/note-literacy/constants";

import "./NoteLiteracyPage.css";
import "./PianoPage.css";
import { useGameLayout } from "../hooks/useGameLayout";
import { useAuth } from "../hooks/useAuth";

const FEEDBACK_TIME = 2;

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
  const [allowMixedClefs, setAllowMixedClefs] = useState(true);
  const { setHideHeaderFooter } = useGameLayout();
  const { profile } = useAuth();
  const noteNotation = profile?.note_notation ?? "international";

  const [selectedAccidentals, setSelectedAccidentals] = useState<
    Set<AccidentalType>
  >(new Set());

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
  const rangePendingNotesRef = useRef<number[]>([]);
  const rangePairTimeoutRef = useRef<number | null>(null);

  const currentQuestion = questions[questionIndex];

  const rangeDifficulty = Math.round(
    Math.max(0, Math.min(25, (25 * (rangeEnd - rangeStart - 12)) / 60)),
  );

  const accidentalWeights: Record<AccidentalType, number> = {
    sharp: 1,
    flat: 1,
    doubleSharp: 2,
    doubleFlat: 2,
    natural: 0.5,
  };

  const accidentalDifficulty = Math.round(
    Math.min(
      25,
      (25 *
        [...selectedAccidentals].reduce(
          (total, accidental) => total + accidentalWeights[accidental],
          0,
        )) /
        6.5,
    ),
  );

  const timeDifficulty = Math.round(
    Math.max(
      0,
      Math.min(
        25,
        questionTime > 7
          ? (25 * (10 - questionTime)) / 12
          : (25 * (8 - questionTime)) / 5,
      ),
    ),
  );

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
      ? { title: "Очень легко", className: "easy" }
      : difficultyScore < 40
        ? { title: "Легко", className: "light" }
        : difficultyScore < 60
          ? { title: "Средне", className: "medium" }
          : difficultyScore < 80
            ? { title: "Сложно", className: "hard" }
            : { title: "Очень сложно", className: "extreme" };

  useEffect(() => {
    setHideHeaderFooter(status === "playing" || status === "feedback");
  }, [status, setHideHeaderFooter]);

  useEffect(() => {
    return () => {
      setHideHeaderFooter(false);
    };
  }, [setHideHeaderFooter]);

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
          noteName: getQuestionNoteName(currentQuestion, noteNotation),
          fullNoteName: getQuestionNoteName(currentQuestion, noteNotation),
          secondNoteName: getQuestionNoteName(currentQuestion.secondNote!, noteNotation),
          secondFullNoteName: getQuestionNoteName(currentQuestion.secondNote!, noteNotation),
          userNoteNumber: pressedNotes[0] ?? null,
          userNoteName:
            pressedNotes[0] == null ? null : getNoteName(pressedNotes[0], noteNotation),
          userSecondNoteName:
            pressedNotes[1] == null ? null : getNoteName(pressedNotes[1], noteNotation),
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
    [status, currentQuestion, questionTime, questionCount, noteNotation],
  );

  const handleNoteOn = useCallback(
    async (noteNumber: number, velocity = 100) => {
      if (!availableNotes.has(noteNumber)) return;

      // Сначала фиксируем ответ, не ожидая загрузки аудиосэмпла.
      setActiveNotes((previous) => new Set(previous).add(noteNumber));

      if (status === "playing" && currentQuestion) {
        if (gameMode === "intervals" && currentQuestion.secondNote) {
          const pending = rangePendingNotesRef.current;
          if (!pending.includes(noteNumber)) {
            if (pending.length === 0) {
              rangePendingNotesRef.current = [noteNumber];
              setRangePendingCount(1);
              rangePairTimeoutRef.current = window.setTimeout(() => {
                submitRangeAnswer(rangePendingNotesRef.current);
              }, 1000);
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
              noteName: getQuestionNoteName(currentQuestion, noteNotation),
              fullNoteName: getQuestionNoteName(currentQuestion, noteNotation),
              userNoteNumber: noteNumber,
              userNoteName: getNoteName(noteNumber, noteNotation),
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
      noteNotation,
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
    (gameMode === "intervals"
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
      gameMode === "intervals"
        ? createRangeQuestions(
            rangeStart,
            rangeEnd,
            availableNotes,
            clefMode,
            questionCount,
            selectedAccidentals,
            allowMixedClefs,
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
        gameMode === "intervals"
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

        if (
          gameMode === "intervals" &&
          rangePendingNotesRef.current.length > 0
        ) {
          submitRangeAnswer(rangePendingNotesRef.current);
          return;
        }

        setSkipped((value) => value + 1);

        setAnswerHistory((previous) => [
          ...previous,
          {
            noteNumber: questions[questionIndex]!.noteNumber,
            noteName: getQuestionNoteName(questions[questionIndex]!, noteNotation),
            fullNoteName:
              noteNotation === "international"
                ? questions[questionIndex]!.noteName
                : questions[questionIndex]!.fullNoteName,
            secondNoteName: questions[questionIndex]!.secondNote
              ? getQuestionNoteName(questions[questionIndex]!.secondNote!, noteNotation)
              : undefined,
            secondFullNoteName:
              noteNotation === "international"
                ? questions[questionIndex]!.secondNote?.noteName
                : questions[questionIndex]!.secondNote?.fullNoteName,
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
    }, 100);

    return () => window.clearInterval(interval);
  }, [
    status,
    questionIndex,
    questionTime,
    questions,
    gameMode,
    submitRangeAnswer,
    noteNotation,
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

  const exitGame = () => {
    setStatus("idle");
    setFeedbackType(null);
    rangePendingNotesRef.current = [];
    setRangePendingCount(0);

    if (rangePairTimeoutRef.current !== null) {
      window.clearTimeout(rangePairTimeoutRef.current);
      rangePairTimeoutRef.current = null;
    }
  };
  return (
    <main
      className={`content-page literacy-page ${status === "playing" || status === "feedback" ? "literacy-page-playing" : ""}`}
    >
      <LiteracyTopbar
        isPlaying={status === "playing" || status === "feedback"}
        midiConnected={midi.connected}
        midiDeviceName={midi.deviceName}
        midiError={midi.error}
        onExitGame={exitGame}
        onConnectMidi={() => setPermissionModalOpen(true)}
      />

      {status === "idle" && (
        <section className="literacy-start-screen">
          <LiteracySettings
            gameMode={gameMode}
            setGameMode={setGameMode}
            questionCount={questionCount}
            setQuestionCount={setQuestionCount}
            rangeStart={rangeStart}
            setRangeStart={setRangeStart}
            rangeEnd={rangeEnd}
            setRangeEnd={setRangeEnd}
            clefMode={clefMode}
            setClefMode={setClefMode}
            allowMixedClefs={allowMixedClefs}
            setAllowMixedClefs={setAllowMixedClefs}
            selectedAccidentals={selectedAccidentals}
            setSelectedAccidentals={setSelectedAccidentals}
            questionTime={questionTime}
            setQuestionTime={setQuestionTime}
          />
          <div className="literacy-launch-panel">
            <div className="launch-decoration">♫</div>

            <span className="launch-kicker">NOTE LITERACY</span>

            <h2>Готов проверить знание нот?</h2>

            <p className="launch-description">
              {gameMode === "intervals"
                ? "Смотри на две ноты на нотном стане и сыграй обе на клавиатуре в течение одной секунды. Чем быстрее и точнее ответ, тем больше баллов!"
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

            <DifficultyPanel
              rangeDifficulty={rangeDifficulty}
              accidentalDifficulty={accidentalDifficulty}
              timeDifficulty={timeDifficulty}
              clefDifficulty={clefDifficulty}
              countDifficulty={countDifficulty}
              difficultyScore={difficultyScore}
              difficultyLevel={difficultyLevel}
            />

            <button
              onClick={startGame}
              className="primary-button literacy-start-button"
            >
              Старт
            </button>

            <p className="launch-footnote">
              Можно играть с MIDI-клавиатуры или экранного пианино
            </p>
          </div>
        </section>
      )}

      {(status === "playing" || status === "feedback") && currentQuestion && (
        <LiteracyGame
          currentQuestion={currentQuestion}
          questionIndex={questionIndex}
          questionCount={questionCount}
          secondsLeft={secondsLeft}
          gameMode={gameMode}
          rangePendingCount={rangePendingCount}
          activeNotes={activeNotes}
          availableNotes={availableNotes}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          status={status}
          feedbackType={feedbackType}
          feedbackCountdown={feedbackCountdown}
          noteNotation={noteNotation}
          onNoteOn={handleNoteOn}
          onNoteOff={handleNoteOff}
        />
      )}

      {status === "finished" && (
        <GameResults
          score={score}
          questionCount={questionCount}
          accuracy={accuracy}
          correct={correct}
          partial={partial}
          mistakes={mistakes}
          skipped={skipped}
          averageResponseTime={averageResponseTime}
          answerHistory={answerHistory}
          questionTime={questionTime}
          resultLevel={resultLevel}
          onRetry={() => setStatus("idle")}
        />
      )}

      {permissionModalOpen && (
        <MidiPermissionModal
          onClose={() => setPermissionModalOpen(false)}
          onConnect={midi.connect}
        />
      )}
    </main>
  );
}

export default NoteLiteracyPage;
