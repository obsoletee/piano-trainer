import { VelocityCurve } from "../components/VelocityCurve";
import { getNoteName } from "../features/midi/midiUtils";

import {
  MidiAudioPlayer,
  type VelocityCurveSettings,
} from "../features/midi/audioService";

import "../App.css";
import "./PianoPage.css";
import { useState, useRef, useEffect } from "react";

const INITIAL_CURVE: VelocityCurveSettings = {
  min: 0.5,
  max: 1,
  shape: 1.65,
};

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

function requestMidiAccess(): Promise<MIDIAccess> {
  const midiNavigator = navigator as Navigator & {
    requestMIDIAccess?: () => Promise<MIDIAccess>;
  };

  if (!midiNavigator.requestMIDIAccess) {
    return Promise.reject(
      new Error(
        "Ваш браузер не поддерживает Web MIDI API. Попробуй Chrome или Edge.",
      ),
    );
  }

  return midiNavigator.requestMIDIAccess();
}

function PianoPage() {
  const [connected, setConnected] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [error, setError] = useState("");
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [velocityCurve, setVelocityCurve] =
    useState<VelocityCurveSettings>(INITIAL_CURVE);
  const [audioReady, setAudioReady] = useState(false);
  const [activeNotes, setActiveNotes] = useState<Map<number, boolean>>(
    new Map(),
  );

  const audioPlayerRef = useRef<MidiAudioPlayer | null>(null);
  const inputsRef = useRef<MIDIInput[]>([]);
  const accessRef = useRef<MIDIAccess | null>(null);
  const latestNoteEventRef = useRef(0);

  useEffect(() => {
    audioPlayerRef.current?.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    audioPlayerRef.current?.setVelocityCurve(velocityCurve);
  }, [velocityCurve]);

  useEffect(() => {
    return () => {
      inputsRef.current.forEach((input) => {
        input.onmidimessage = null;
      });

      inputsRef.current = [];

      if (accessRef.current) {
        accessRef.current.onstatechange = null;
      }

      accessRef.current = null;

      const player = audioPlayerRef.current;
      audioPlayerRef.current = null;

      player?.destroy();
    };
  }, []);

  const initializeAudio = async () => {
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new MidiAudioPlayer();
    }

    await audioPlayerRef.current.initialize();

    audioPlayerRef.current.setVolume(volume);
    audioPlayerRef.current.setVelocityCurve(velocityCurve);

    setAudioReady(audioPlayerRef.current.isAudioReady());
  };

  const attachInputs = (access: MIDIAccess) => {
    inputsRef.current.forEach((input) => {
      input.onmidimessage = null;
    });

    const inputs = Array.from(access.inputs.values());
    inputsRef.current = inputs;

    if (inputs.length === 0) {
      setConnected(false);
      setDeviceName("");
      return;
    }

    inputs.forEach((input) => {
      input.onmidimessage = (event) => {
        const data = event.data;

        if (!data || data.length < 3) return;

        const status = data[0];
        const noteNumber = data[1];
        const velocity = data[2];

        if (
          status === undefined ||
          noteNumber === undefined ||
          velocity === undefined
        ) {
          return;
        }

        const command = status & 0xf0;
        const player = audioPlayerRef.current;

        if (command === 0x90 && velocity > 0) {
          const noteEventId = ++latestNoteEventRef.current;

          setError("");

          // Если аудиодвижок ещё не создан, пытаемся создать его
          if (!audioPlayerRef.current) {
            void initializeAudio()
              .then(() => {
                const player = audioPlayerRef.current;

                if (!player) {
                  throw new Error("Аудиодвижок не создан");
                }

                return player.noteOn(noteNumber, velocity);
              })
              .then(() => {
                setActiveNotes((current) => {
                  const next = new Map(current);
                  next.set(noteNumber, true);
                  return next;
                });
              })
              .catch((err) => {
                console.error("Не удалось активировать аудио:", err);

                setActiveNotes((current) => {
                  const next = new Map(current);
                  next.set(noteNumber, false);
                  return next;
                });

                if (latestNoteEventRef.current !== noteEventId) return;
              });

            return;
          }

          const player = audioPlayerRef.current;

          void player
            .noteOn(noteNumber, velocity)
            .then(() => {
              setActiveNotes((current) => {
                const next = new Map(current);
                next.set(noteNumber, true);
                return next;
              });
            })
            .catch((err) => {
              console.error("Ошибка воспроизведения сэмпла:", err);

              setActiveNotes((current) => {
                const next = new Map(current);
                next.set(noteNumber, false);
                return next;
              });

              if (latestNoteEventRef.current !== noteEventId) return;
            });
        } else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
          player?.noteOff(noteNumber);

          setActiveNotes((current) => {
            const next = new Map(current);
            next.delete(noteNumber);
            return next;
          });
        }
      };
    });

    setDeviceName(
      inputs
        .map((input) => input.name)
        .filter(Boolean)
        .join(", "),
    );

    setConnected(true);

    setError("");
  };

  const reconnectMidiAndAudio = async () => {
    try {
      setError("");

      // Сначала активируем аудио в рамках нажатия на кнопку
      await initializeAudio();

      // Затем повторно получаем доступ к MIDI
      const access = await requestMidiAccess();

      accessRef.current = access;
      attachInputs(access);

      access.onstatechange = () => attachInputs(access);

      setPermissionModalOpen(false);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось повторно распознать устройство.",
      );

      setAudioReady(audioPlayerRef.current?.isAudioReady() ?? false);
    }
  };

  const connectMidi = async () => {
    try {
      setError("");

      // Сначала получаем доступ к MIDI
      const access = await requestMidiAccess();

      accessRef.current = access;
      attachInputs(access);

      access.onstatechange = () => attachInputs(access);

      setPermissionModalOpen(false);

      // Затем отдельно пытаемся инициализировать аудио
      try {
        await initializeAudio();
      } catch (audioError) {
        console.error("Ошибка инициализации аудио:", audioError);
        setError(
          audioError instanceof Error
            ? audioError.message
            : "Не удалось инициализировать аудиодвижок.",
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось получить доступ к MIDI.",
      );

      setPermissionModalOpen(true);
    }
  };

  // Автоматическое подключение при загрузке страницы.
  useEffect(() => {
    let cancelled = false;

    const checkMidiPermission = async () => {
      try {
        const permission = await navigator.permissions.query({
          name: "midi" as PermissionName,
        });

        if (cancelled) return;

        if (permission.state === "granted") {
          // Сначала подключаем MIDI, не ожидая запуска аудио
          const access = await requestMidiAccess();

          if (cancelled) return;

          accessRef.current = access;
          attachInputs(access);
          access.onstatechange = () => attachInputs(access);

          setPermissionModalOpen(false);
          setError("");

          // Затем создаём аудиодвижок.
          // Если браузер пока не разрешает запуск аудио,
          // подключение MIDI всё равно останется активным.
          try {
            await initializeAudio();
          } catch (audioError) {
            console.warn(
              "Аудио ожидает взаимодействия с пользователем:",
              audioError,
            );
          }
        } else {
          // Доступа нет — показываем внутренний попап.
          setPermissionModalOpen(true);

          if (permission.state === "denied") {
            setError(
              "Доступ к MIDI заблокирован. Разреши его в настройках сайта в браузере.",
            );
          }
        }
      } catch (err) {
        if (cancelled) return;

        setPermissionModalOpen(true);

        setError(
          err instanceof Error
            ? err.message
            : "Не удалось проверить разрешение MIDI.",
        );
      }
    };

    void checkMidiPermission();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="app piano-app">
      <header className="piano-page-heading">
        <div>
          <span className="eyebrow">PIANO TRAINER</span>
          <h1>Фортепиано</h1>
          <p>Интерактивный инструмент для MIDI-клавиатуры</p>
        </div>
      </header>

      <div
        className={
          connected && audioReady
            ? "connection-status is-connected"
            : "connection-status is-unrecognized"
        }
      >
        <span className="connection-dot" />

        <div className="connection-copy">
          <strong>
            {!audioReady
              ? "MIDI устройство не распознано"
              : connected
                ? deviceName
                : "MIDI не подключено"}
          </strong>

          <small>
            {audioReady && connected
              ? "Устройство готово"
              : "Требуется повторное подключение"}
          </small>
        </div>

        {!audioReady && (
          <button
            className="recognize-midi-button"
            onClick={reconnectMidiAndAudio}
          >
            Повторно распознать MIDI
          </button>
        )}
      </div>

      <div className="piano-layout">
        <aside className="piano-sidebar">
          <section className="panel volume-panel">
            <div className="section-heading">
              <div>
                <h2>Громкость</h2>
              </div>

              <strong className="value-display">
                {Math.round(volume * 100)}%
              </strong>
            </div>

            <input
              className="volume-slider"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              style={{
                background: `linear-gradient(to right, #8b73f4 0%, #8b73f4 ${volume * 100}%, #373644 ${volume * 100}%, #373644 100%)`,
              }}
              onChange={(event) => setVolume(Number(event.target.value))}
              aria-label="Общая громкость"
            />

            <div className="range-labels">
              <span>0%</span>
              <span>100%</span>
            </div>
          </section>

          <section className="panel curve-panel">
            <h2>Кривая Velocity</h2>

            <p className="panel-description">
              Настройка зависимости громкости от силы нажатия.
            </p>

            <VelocityCurve
              settings={velocityCurve}
              onChange={setVelocityCurve}
            />

            <button
              className="reset-button"
              onClick={() => setVelocityCurve({ ...INITIAL_CURVE })}
            >
              Кривая по умолчанию
            </button>
          </section>
        </aside>

        <div className="piano-workspace">
          <section className="panel keyboard-panel">
            <div className="section-heading">
              <div>
                <h2>Клавиатура</h2>
              </div>

              <span className="section-note">88 клавиш</span>
            </div>

            <div className="piano-scroll">
              <div className="piano-keyboard">
                {WHITE_NOTE_NUMBERS.map((noteNumber) => (
                  <div
                    key={noteNumber}
                    className={`piano-key white-key ${
                      activeNotes.has(noteNumber) ? "key-active" : ""
                    }`}
                    aria-label={getNoteName(noteNumber)}
                    title={getNoteName(noteNumber)}
                  >
                    {noteNumber % 12 === 0 && (
                      <span className="key-label">
                        {getNoteName(noteNumber)}
                      </span>
                    )}
                  </div>
                ))}

                {BLACK_NOTE_NUMBERS.map((noteNumber) => (
                  <div
                    key={noteNumber}
                    className={`piano-key black-key ${
                      activeNotes.has(noteNumber) ? "key-active" : ""
                    }`}
                    style={{
                      left: `${getBlackKeyPosition(noteNumber)}%`,
                    }}
                    aria-label={getNoteName(noteNumber)}
                    title={getNoteName(noteNumber)}
                  />
                ))}
              </div>
            </div>

            <div className="keyboard-caption">
              Нажимай клавиши MIDI-клавиатуры, чтобы увидеть их на экране
            </div>
          </section>

          <section className="panel note-panel">
            <div className="section-heading">
              <div>
                <h2 className="playing-heading">
                  <span className="playing-indicator" />
                  Сейчас играют
                </h2>
              </div>

              <span className="active-notes-count">
                {activeNotes.size} {activeNotes.size === 1 ? "нота" : "нот"}
              </span>
            </div>

            {activeNotes.size > 0 ? (
              <div className="active-notes-list">
                {Array.from(activeNotes.entries())
                  .sort(([a], [b]) => a - b)
                  .map(([noteNumber, audioFound]) => (
                    <div className="active-note-item" key={noteNumber}>
                      <span className="active-note-name">
                        Нота {getNoteName(noteNumber)}
                      </span>

                      <span className="active-note-status">
                        {audioFound
                          ? "— играет"
                          : "— играет (аудио не найдено)"}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="no-active-notes">Сейчас ничего не играет</div>
            )}
          </section>

          {error && !permissionModalOpen && (
            <p className="error page-error">{error}</p>
          )}
        </div>
      </div>

      {permissionModalOpen && (
        <div className="modal-backdrop">
          <section
            className="permission-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="permission-title"
          >
            <div className="modal-icon">♫</div>

            <span className="section-kicker">WELCOME</span>

            <h2 id="permission-title">Подключи MIDI-клавиатуру</h2>

            <p>
              Разреши доступ к MIDI-устройствам, чтобы приложение могло получать
              нажатия клавиш и воспроизводить сэмплы.
            </p>

            {error && <p className="error">{error}</p>}

            <button className="primary-button" onClick={connectMidi}>
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

export default PianoPage;
