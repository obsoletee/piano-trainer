import { useTranslation } from "../../../hooks/useTranslation";
import { Link } from "react-router-dom";

interface LiteracyTopbarProps {
  isPlaying: boolean;
  midiConnected: boolean;
  midiDeviceName: string;
  onExitGame: () => void;
  onConnectMidi: () => void;
}

function LiteracyTopbar({
  isPlaying,
  midiConnected,
  midiDeviceName,
  onExitGame,
  onConnectMidi,
}: LiteracyTopbarProps) {
  const { t } = useTranslation();
  return (
    <div className="literacy-topbar">
      <header className="page-heading">
        <Link to="/exercises" className="literacy-exit-button">
          {t("literacy.back")}
        </Link>

        <h1>{t("literacy.title")}</h1>

        <p>
          {t("literacy.description")}
        </p>
      </header>

      {isPlaying && (
        <button
          type="button"
          className="literacy-exit-button"
          onClick={onExitGame}
        >
          {t("literacy.exit")}
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
            {midiConnected ? midiDeviceName : t("literacy.midiDisconnected")}
          </strong>

          <small>
            {midiConnected
              ? t("literacy.midiReady")
              : t("literacy.midiConnectHint")}
          </small>

        </div>

        <button className="recognize-midi-button" onClick={onConnectMidi}>
          {t("literacy.connectMidi")}
        </button>
      </div>
    </div>
  );
}

export default LiteracyTopbar;
