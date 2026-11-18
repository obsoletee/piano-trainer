import { useEffect, useRef, useState } from "react";
import "./MidiPermissionModal.css";

interface MidiPermissionModalProps {
  onClose: () => void;
  onConnect: () => void;
}

function MidiPermissionModal({ onClose, onConnect }: MidiPermissionModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClose = () => {
    if (isClosing) return;

    setIsClosing(true);

    closeTimeoutRef.current = setTimeout(() => {
      onClose();
    }, 220);
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current !== null) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`modal-backdrop ${isClosing ? "is-closing" : ""}`}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <section
        className="permission-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="permission-title"
      >
        <button
          type="button"
          className="permission-modal-close"
          onClick={handleClose}
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

        <button className="primary-button" onClick={onConnect}>
          Разрешить доступ к MIDI
        </button>

        <span className="modal-footnote">
          Разрешение запрашивается через браузер
        </span>
      </section>
    </div>
  );
}

export default MidiPermissionModal;
