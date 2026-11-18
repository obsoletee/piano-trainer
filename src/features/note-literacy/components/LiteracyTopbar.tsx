import { Link } from "react-router-dom";

interface LiteracyTopbarProps {
  isPlaying: boolean;
  midiConnected: boolean;
  midiDeviceName: string;
  midiError: string | null;
  onExitGame: () => void;
  onConnectMidi: () => void;
}

function LiteracyTopbar({
  isPlaying,
  midiConnected,
  midiDeviceName,
  midiError,
  onExitGame,
  onConnectMidi,
}: LiteracyTopbarProps) {
  return (
    <div className="literacy-topbar">
      <header className="page-heading">
        <Link to="/exercises" className="literacy-exit-button">
          ← Упражнения
        </Link>

        <h1>Нотная грамота</h1>

        <p>
          Определи ноту на нотном стане и нажми соответствующую клавишу на
          MIDI-клавиатуре.
        </p>
      </header>

      {isPlaying && (
        <button
          type="button"
          className="literacy-exit-button"
          onClick={onExitGame}
        >
          ← Выйти в меню
        </button>
      )}

      <div
        className={
          midiConnected
            ? "connection-status is-connected"
            : "connection-status is-unrecognized"
        }
      >
        <span className="connection-dot" />

        <div className="connection-copy">
          <strong>
            {midiConnected ? midiDeviceName : "Устройство не подключено"}
          </strong>

          <small>
            {midiConnected
              ? "Устройство готово"
              : "Подключи MIDI-клавиатуру при необходимости"}
          </small>

          {midiError && <p className="error">{midiError}</p>}
        </div>

        <button className="recognize-midi-button" onClick={onConnectMidi}>
          Подключить MIDI
        </button>
      </div>
    </div>
  );
}

export default LiteracyTopbar;
