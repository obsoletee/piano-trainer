import { useEffect, useRef, useState } from "react";

import { VelocityCurve } from "./components/VelocityCurve";
import { getNoteName } from "./features/midi/midiUtils";
import {
  MidiAudioPlayer,
  type VelocityCurveSettings,
} from "./features/midi/audioService";

import "./App.css";

const INITIAL_CURVE: VelocityCurveSettings = { min: 0.5, max: 1, shape: 1 };

function App() {
  const [connected, setConnected] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [lastNote, setLastNote] = useState("");
  const [message, setMessage] = useState(
    "Ожидание подключения MIDI-клавиатуры",
  );
  const [error, setError] = useState("");
  const [permissionModalOpen, setPermissionModalOpen] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [velocityCurve, setVelocityCurve] =
    useState<VelocityCurveSettings>(INITIAL_CURVE);

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
      if (accessRef.current) accessRef.current.onstatechange = null;
      audioPlayerRef.current?.destroy();
    };
  }, []);

  const attachInputs = (access: MIDIAccess) => {
    inputsRef.current.forEach((input) => {
      input.onmidimessage = null;
    });

    const inputs = Array.from(access.inputs.values());
    inputsRef.current = inputs;

    if (inputs.length === 0) {
      setConnected(false);
      setDeviceName("");
      setMessage(
        "MIDI-устройство не найдено. Подключи клавиатуру и повтори запрос.",
      );
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
        )
          return;

        const command = status & 0xf0;
        const player = audioPlayerRef.current;

        if (command === 0x90 && velocity > 0) {
          const noteName = getNoteName(noteNumber);
          const noteEventId = ++latestNoteEventRef.current;
          setLastNote(`Нота ${noteName}`);
          setMessage(`Нажата клавиша ${noteName}`);
          setError("");

          if (player) {
            void player.noteOn(noteNumber, velocity).catch(() => {
              if (latestNoteEventRef.current !== noteEventId) return;
              setLastNote(`Нота ${noteName} (аудио не найдено)`);
              setMessage("Для этой ноты пока нет подходящего сэмпла");
            });
          }
        } else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
          player?.noteOff(noteNumber);
          setMessage(`Отпущена клавиша ${getNoteName(noteNumber)}`);
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
    setMessage("MIDI-клавиатура готова к работе");
    setError("");
  };

  const connectMidi = async () => {
    try {
      setError("");
      const midiNavigator = navigator as Navigator & {
        requestMIDIAccess?: () => Promise<MIDIAccess>;
      };

      if (!midiNavigator.requestMIDIAccess) {
        setError(
          "Ваш браузер не поддерживает Web MIDI API. Попробуй Chrome или Edge.",
        );
        return;
      }

      if (!audioPlayerRef.current) {
        const player = new MidiAudioPlayer();
        await player.initialize();
        player.setVolume(volume);
        player.setVelocityCurve(velocityCurve);
        audioPlayerRef.current = player;
      } else {
        await audioPlayerRef.current.initialize();
      }

      const access = await midiNavigator.requestMIDIAccess();
      accessRef.current = access;
      attachInputs(access);
      access.onstatechange = () => attachInputs(access);
      setPermissionModalOpen(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось получить доступ к MIDI.",
      );
    }
  };

  return (
    <main className="app">
      <div
        className={
          connected ? "connection-status is-connected" : "connection-status"
        }
      >
        <span className="connection-dot" />
        <span className="connection-copy">
          <strong>{connected ? deviceName : "MIDI не подключено"}</strong>
          <small>
            {connected ? "Устройство готово" : "Ожидание устройства"}
          </small>
        </span>
      </div>

      <header className="header">
        <div className="eyebrow">MIDI PERFORMANCE TOOL</div>
        <h1>MIDI CONTROL</h1>
        <p>Управление звуком через MIDI-клавиатуру</p>
      </header>

      <section className="panel volume-panel">
        <div className="section-heading">
          <div>
            <span className="section-kicker">MASTER</span>
            <h2>Общая громкость</h2>
          </div>
          <strong className="value-display">{Math.round(volume * 100)}%</strong>
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
        <div className="section-heading">
          <div>
            <span className="section-kicker">RESPONSE</span>
            <h2>Кривая Velocity</h2>
          </div>
          <span className="section-note">Настройка чувствительности</span>
        </div>
        <p className="panel-description">
          Две точки задают минимальную и максимальную громкость. Регулятор ниже
          меняет характер перехода между ними.
        </p>
        <VelocityCurve settings={velocityCurve} onChange={setVelocityCurve} />
        <div className="smoothness-control">
          <div className="section-heading">
            <label htmlFor="curve-shape">Плавность перехода</label>
            <strong className="value-display">
              {velocityCurve.shape.toFixed(2)}×
            </strong>
          </div>
          <input
            id="curve-shape"
            className="volume-slider"
            type="range"
            min="0.4"
            max="2.5"
            step="0.05"
            value={velocityCurve.shape}
            style={{
              background: `linear-gradient(to right, #8b73f4 0%, #8b73f4 ${((velocityCurve.shape - 0.4) / 2.1) * 100}%, #373644 ${((velocityCurve.shape - 0.4) / 2.1) * 100}%, #373644 100%)`,
            }}
            onChange={(event) =>
              setVelocityCurve((current) => ({
                ...current,
                shape: Number(event.target.value),
              }))
            }
            aria-label="Плавность перехода громкости"
          />
          <div className="range-labels">
            <span>Быстрее к максимуму</span>
            <span>Медленнее к максимуму</span>
          </div>
        </div>
        <button
          className="reset-button"
          onClick={() => setVelocityCurve({ ...INITIAL_CURVE })}
        >
          Сбросить кривую
        </button>
      </section>

      <section className="panel note-panel">
        <span className="section-kicker">MIDI INPUT</span>
        <h2>Последнее событие</h2>
        <div
          className={`note${lastNote.includes("аудио не найдено") ? " note-missing" : ""}`}
        >
          {lastNote || "—"}
        </div>
        <p className="message">{message}</p>
      </section>

      {error && !permissionModalOpen && (
        <p className="error page-error">{error}</p>
      )}

      <footer>MIDI CONTROL · Prototype v0.3</footer>

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
              Запрос появляется при каждой загрузке страницы
            </span>
          </section>
        </div>
      )}
    </main>
  );
}

export default App;
