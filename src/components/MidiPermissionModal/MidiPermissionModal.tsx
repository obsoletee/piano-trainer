import { useEffect, useRef, useState } from "react";
import { useTranslation } from "../../hooks/useTranslation";
import "./MidiPermissionModal.css";

interface MidiPermissionModalProps {
  onClose: () => void;
  onConnect: () => void;
}

function MidiPermissionModal({ onClose, onConnect }: MidiPermissionModalProps) {
  const { t } = useTranslation();
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
          aria-label="{t("midi.close")}"
        >
          ×
        </button>

        <div className="modal-icon">♫</div>

        <span className="section-kicker">WELCOME</span>

        <h2 id="permission-title">{t("midi.title")}</h2>

        <p>
          Разреши доступ к MIDI-устройствам, чтобы приложение могло получать
          нажатия клавиш и распознавать ноты.
        </p>

        <button className="primary-button" onClick={onConnect}>
          {t("midi.allow")}
        </button>

        <span className="modal-footnote">
          {t("midi.footnote")}
        </span>
      </section>
    </div>
  );
}

export default MidiPermissionModal;
