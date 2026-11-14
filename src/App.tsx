import { useEffect, useRef, useState } from "react";

import { getNoteName, type NavigatorWithMidi } from "./features/midi/midiUtils";

import { MidiAudioPlayer } from "./features/midi/audioService";

import "./App.css";

function App() {
  const [connected, setConnected] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [lastNote, setLastNote] = useState("");
  const [message, setMessage] = useState("Подключите MIDI-клавиатуру");
  const [error, setError] = useState("");

  const audioPlayerRef = useRef<MidiAudioPlayer | null>(null);
  const inputsRef = useRef<MIDIInput[]>([]);

  // Очистка ресурсов при закрытии страницы
  useEffect(() => {
    return () => {
      inputsRef.current.forEach((input) => {
        input.onmidimessage = null;
      });

      audioPlayerRef.current?.destroy();
    };
  }, []);

  const connectMidi = async () => {
    try {
      setError("");

      const midiNavigator = navigator as NavigatorWithMidi;

      if (!midiNavigator.requestMIDIAccess) {
        setError("Ваш браузер не поддерживает Web MIDI API.");
        return;
      }

      // Инициализируем аудиодвижок
      if (!audioPlayerRef.current) {
        const player = new MidiAudioPlayer();

        await player.initialize();

        audioPlayerRef.current = player;
      }

      const access = await midiNavigator.requestMIDIAccess();

      const inputs = Array.from(access.inputs.values());

      if (inputs.length === 0) {
        setConnected(false);
        setMessage("MIDI-устройства не найдены");
        return;
      }

      // Убираем предыдущие обработчики
      inputsRef.current.forEach((input) => {
        input.onmidimessage = null;
      });

      inputsRef.current = inputs;

      inputs.forEach((input) => {
        input.onmidimessage = (event) => {
          const data = event.data;

          if (!data || data.length < 3) {
            return;
          }

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

          // Реагируем только на Note On
          if (command === 0x90 && velocity > 0) {
            const noteName = getNoteName(noteNumber);

            setLastNote(noteName);
            setMessage(`Нажата клавиша ${noteName}`);

            const player = audioPlayerRef.current;

            if (player) {
              void player.play(noteNumber, velocity).catch((err: unknown) => {
                setError(
                  err instanceof Error
                    ? err.message
                    : "Ошибка воспроизведения звука",
                );
              });
            }
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
      setMessage("Ожидание нажатия клавиши...");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось подключить MIDI-устройство.",
      );
    }
  };

  return (
    <main className="app">
      <header className="header">
        <h1>MIDI CONTROL</h1>
        <p>Управление через MIDI-клавиатуру</p>
      </header>

      <section className="panel">
        <h2>Устройство</h2>

        <div className="device">
          <span className="device-name">
            {connected ? deviceName : "Не подключено"}
          </span>

          <span className={connected ? "status connected" : "status"}>
            {connected ? "Подключено" : "Отключено"}
          </span>
        </div>

        <button onClick={connectMidi}>Подключить MIDI</button>

        {error && <p className="error">{error}</p>}
      </section>

      <section className="panel note-panel">
        <h2>Последнее событие</h2>

        <div className="note">{lastNote || "—"}</div>

        <p className="message">{message}</p>
      </section>

      <footer>MIDI CONTROL · Prototype v0.2</footer>
    </main>
  );
}

export default App;
