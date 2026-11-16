import { VelocityCurve } from "../components/VelocityCurve";
import { getNoteName } from "../features/midi/midiUtils";
import ARControl from "../components/ARControl";
import { Link } from "react-router-dom";
import {
  MidiAudioPlayer,
  type VelocityCurveSettings,
  type Instrument,
  type ARSettings,
  DEFAULT_AR,
} from "../features/midi/audioService";

import "../App.css";
import "./PianoPage.css";
import { useCallback, useEffect, useRef, useState } from "react";
import PianoKeyboard from "../components/PianoKeyboard/PianoKeyboard";

const INITIAL_AR: ARSettings = {
  ...DEFAULT_AR,
};
const INITIAL_CURVE: VelocityCurveSettings = {
  min: 0.5,
  max: 1,
  shape: 1.65,
};

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
  const [ar, setAr] = useState<ARSettings>(INITIAL_AR);
  const [velocityCurve, setVelocityCurve] =
    useState<VelocityCurveSettings>(INITIAL_CURVE);
  const [audioReady, setAudioReady] = useState(false);
  const [instrument, setInstrument] = useState<Instrument>("noire-piano");
  const acceptingMidiRef = useRef(false);
  const [activeNotes, setActiveNotes] = useState<Map<number, boolean>>(
    new Map(),
  );
  const [availableNotes, setAvailableNotes] = useState<Set<number>>(new Set());

  const audioPlayerRef = useRef<MidiAudioPlayer | null>(null);
  const inputsRef = useRef<MIDIInput[]>([]);
  const accessRef = useRef<MIDIAccess | null>(null);
  const latestNoteEventRef = useRef(0);
  const noteVersionsRef = useRef(new Map<number, number>());
  const initializeAudioRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    audioPlayerRef.current?.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    audioPlayerRef.current?.setAR(ar);
  }, [ar]);

  useEffect(() => {
    audioPlayerRef.current?.setVelocityCurve(velocityCurve);
  }, [velocityCurve]);

  useEffect(() => {
    let cancelled = false;

    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new MidiAudioPlayer();
    }

    const player = audioPlayerRef.current;

    player.setInstrument(instrument);

    void player.getAvailableNotes().then((notes) => {
      if (!cancelled) {
        setAvailableNotes(notes);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [instrument]);

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

  const disableMidiInput = () => {
    acceptingMidiRef.current = false;
    latestNoteEventRef.current++;
    noteVersionsRef.current.clear();

    audioPlayerRef.current?.allNotesOff();
    setActiveNotes(new Map());
  };

  const initializeAudio = useCallback(async () => {
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new MidiAudioPlayer();
    }

    await audioPlayerRef.current.initialize();

    audioPlayerRef.current.setVolume(volume);
    audioPlayerRef.current.setVelocityCurve(velocityCurve);
    audioPlayerRef.current.setAR(ar);

    setAudioReady(audioPlayerRef.current.isAudioReady());
  }, [volume, velocityCurve, ar]);

  const handlePianoNoteOn = async (noteNumber: number) => {
    if (!availableNotes.has(noteNumber)) return;
    const noteEventId = (noteVersionsRef.current.get(noteNumber) ?? 0) + 1;

    noteVersionsRef.current.set(noteNumber, noteEventId);

    try {
      // Запускаем аудио при первом нажатии на клавишу.
      await initializeAudio();

      const player = audioPlayerRef.current;

      if (!player) return;

      // Если клавишу уже отпустили, не запускаем звук.
      if (noteVersionsRef.current.get(noteNumber) !== noteEventId) {
        return;
      }

      await player.noteOn(noteNumber, 100);

      // Если клавишу отпустили во время загрузки звука,
      // сразу останавливаем ноту.
      if (noteVersionsRef.current.get(noteNumber) !== noteEventId) {
        player.noteOff(noteNumber);
        return;
      }

      setActiveNotes((current) => {
        const next = new Map(current);
        next.set(noteNumber, true);
        return next;
      });
    } catch (err) {
      console.error("Ошибка воспроизведения ноты:", err);
    }
  };

  const handlePianoNoteOff = (noteNumber: number) => {
    noteVersionsRef.current.set(
      noteNumber,
      (noteVersionsRef.current.get(noteNumber) ?? 0) + 1,
    );

    audioPlayerRef.current?.noteOff(noteNumber);

    setActiveNotes((current) => {
      const next = new Map(current);
      next.delete(noteNumber);
      return next;
    });
  };

  useEffect(() => {
    initializeAudioRef.current = initializeAudio;
  }, [initializeAudio]);

  const attachInputs = (access: MIDIAccess): boolean => {
    inputsRef.current.forEach((input) => {
      input.onmidimessage = null;
    });

    const inputs = Array.from(access.inputs.values());
    inputsRef.current = inputs;

    if (inputs.length === 0) {
      setConnected(false);
      setDeviceName("");
      return false;
    }

    inputs.forEach((input) => {
      input.onmidimessage = (event) => {
        // До успешного подключения MIDI и аудио игнорируем все события.
        if (!acceptingMidiRef.current) return;

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
          const noteEventId =
            (noteVersionsRef.current.get(noteNumber) ?? 0) + 1;
          noteVersionsRef.current.set(noteNumber, noteEventId);

          if (!player) return;

          setError("");

          void player
            .noteOn(noteNumber, velocity)
            .then(() => {
              if (
                !acceptingMidiRef.current ||
                noteVersionsRef.current.get(noteNumber) !== noteEventId
              ) {
                return;
              }

              setActiveNotes((current) => {
                const next = new Map(current);
                next.set(noteNumber, true);
                return next;
              });
            })
            .catch((err) => {
              console.error("Ошибка воспроизведения сэмпла:", err);

              if (
                !acceptingMidiRef.current ||
                noteVersionsRef.current.get(noteNumber) !== noteEventId
              ) {
                return;
              }

              setActiveNotes((current) => {
                const next = new Map(current);
                next.set(noteNumber, false);
                return next;
              });
            });
        } else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
          noteVersionsRef.current.set(
            noteNumber,
            (noteVersionsRef.current.get(noteNumber) ?? 0) + 1,
          );
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

    return true;
  };

  const connectMidi = async () => {
    disableMidiInput();

    setConnected(false);
    setAudioReady(false);

    try {
      setError("");

      // Сначала запускаем аудио в рамках нажатия пользователя.
      await initializeAudio();

      // Затем запрашиваем доступ к MIDI.
      const access = await requestMidiAccess();

      accessRef.current = access;

      const hasInputs = attachInputs(access);

      access.onstatechange = () => {
        disableMidiInput();

        const hasCurrentInputs = attachInputs(access);

        if (hasCurrentInputs && audioPlayerRef.current?.isAudioReady()) {
          acceptingMidiRef.current = true;
        } else {
          setConnected(false);
          setDeviceName("");
        }
      };

      acceptingMidiRef.current = hasInputs;

      setAudioReady(true);
      setPermissionModalOpen(false);
      setError("");
    } catch {
      disableMidiInput();

      setConnected(false);
      setDeviceName("");
      setAudioReady(false);
      setError("");

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
          const access = await requestMidiAccess();

          if (cancelled) return;

          accessRef.current = access;

          const hasInputs = attachInputs(access);

          access.onstatechange = () => {
            disableMidiInput();

            const hasCurrentInputs = attachInputs(access);

            if (hasCurrentInputs && audioPlayerRef.current?.isAudioReady()) {
              acceptingMidiRef.current = true;
            } else {
              setConnected(false);
              setDeviceName("");
            }
          };

          setPermissionModalOpen(!hasInputs);
          setError("");

          try {
            await initializeAudioRef.current();

            if (cancelled) return;

            if (hasInputs && audioPlayerRef.current?.isAudioReady()) {
              acceptingMidiRef.current = true;
            }
          } catch (audioError) {
            console.warn(
              "Аудио ожидает взаимодействия с пользователем:",
              audioError,
            );
          }

          if (!hasInputs) {
            setConnected(false);
            setDeviceName("");
            setError("");
          }
        } else {
          disableMidiInput();
          setPermissionModalOpen(true);

          if (permission.state === "denied") {
            setError("");
          }
        }
      } catch {
        if (cancelled) return;

        disableMidiInput();
        setPermissionModalOpen(true);

        setError("");
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
        <Link to="/exercises" className="piano-back-link">
          <span aria-hidden="true">←</span>
          Упражнения
        </Link>

        <div>
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
            {connected && audioReady ? deviceName : "Устройство не подключено"}
          </strong>

          <small>
            {connected && audioReady
              ? "Устройство готово"
              : "Подключи MIDI-клавиатуру при необходимости"}
          </small>
        </div>

        <button
          className="recognize-midi-button"
          onClick={() => setPermissionModalOpen(true)}
        >
          {connected && audioReady ? "Переподключить" : "Подключить MIDI"}
        </button>
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

          <section className="panel ar-panel">
            <h2>Огибающая AR</h2>

            <p className="panel-description">
              Настройка атаки и затухания звука после отпускания клавиши.
            </p>

            <ARControl settings={ar} onChange={setAr} />

            <button
              className="reset-button"
              onClick={() => setAr({ ...INITIAL_AR })}
            >
              Сбросить настройки
            </button>
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
              onClick={() => setAr({ ...INITIAL_AR })}
            >
              AR по умолчанию
            </button>
          </section>
        </aside>

        <div className="piano-workspace">
          <section className="panel keyboard-panel">
            <div className="section-heading keyboard-heading">
              <div>
                <h2>Клавиатура</h2>
              </div>

              <div className="keyboard-header-controls">
                <label className="instrument-select-wrapper">
                  <span className="instrument-label">Инструмент</span>

                  <select
                    className="instrument-select"
                    value={instrument}
                    onChange={(event) => {
                      setInstrument(event.target.value as Instrument);
                      setActiveNotes(new Map());
                    }}
                  >
                    <option value="noire-piano">Noire Piano</option>
                    <option value="electric-piano">Electric Piano</option>
                  </select>
                </label>

                <span className="keyboard-key-count">88 клавиш</span>
              </div>
            </div>

            <PianoKeyboard
              activeNotes={activeNotes}
              availableNotes={availableNotes}
              onNoteOn={handlePianoNoteOn}
              onNoteOff={handlePianoNoteOff}
            />

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
              нажатия клавиш и воспроизводить сэмплы.
            </p>

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
