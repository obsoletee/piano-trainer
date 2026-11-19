import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { AccidentalType, ClefMode, GameMode } from "../types";
import { ACCIDENTAL_OPTIONS } from "../types";
import CustomSelect from "../../../components/CustomSelect/CustomSelect";
import { NOTE_RANGE_OPTIONS } from "../constants";
import { getNoteName } from "../../midi/midiUtils";
import { useAuth } from "../../../hooks/useAuth";
import { useTranslation } from "../../../hooks/useTranslation";

const QUESTION_COUNT_OPTIONS = [10, 20, 30];
const QUESTION_TIME_OPTIONS = [3, 5, 7, 10, 15];

interface LiteracySettingsProps {
  gameMode: GameMode;
  setGameMode: Dispatch<SetStateAction<GameMode>>;

  questionCount: number;
  setQuestionCount: Dispatch<SetStateAction<number>>;

  rangeStart: number;
  setRangeStart: Dispatch<SetStateAction<number>>;

  rangeEnd: number;
  setRangeEnd: Dispatch<SetStateAction<number>>;

  clefMode: ClefMode;
  setClefMode: Dispatch<SetStateAction<ClefMode>>;

  allowMixedClefs: boolean;
  setAllowMixedClefs: Dispatch<SetStateAction<boolean>>;

  selectedAccidentals: Set<AccidentalType>;
  setSelectedAccidentals: Dispatch<SetStateAction<Set<AccidentalType>>>;

  questionTime: number;
  setQuestionTime: Dispatch<SetStateAction<number>>;
}

interface SettingLabelProps {
  title: string;
  description: string;
}

function SettingLabel({ title, description }: SettingLabelProps) {
  return (
    <div className="setting-label">
      <strong>{title}</strong>

      <span className="setting-tooltip-wrapper">
        <button
          type="button"
          className="setting-tooltip-trigger"
          aria-label={`${title}. ${description}`}
          data-tooltip={description}
        >
          ?
        </button>
      </span>
    </div>
  );
}

function LiteracySettings({
  gameMode,
  setGameMode,
  questionCount,
  setQuestionCount,
  rangeStart,
  setRangeStart,
  rangeEnd,
  setRangeEnd,
  clefMode,
  setClefMode,
  allowMixedClefs,
  setAllowMixedClefs,
  selectedAccidentals,
  setSelectedAccidentals,
  questionTime,
  setQuestionTime,
}: LiteracySettingsProps) {
  const [accidentalMenuOpen, setAccidentalMenuOpen] = useState(false);
  const accidentalDropdownRef = useRef<HTMLDivElement | null>(null);

  const toggleAccidental = (accidental: AccidentalType) => {
    setSelectedAccidentals((previous) => {
      const next = new Set(previous);

      if (next.has(accidental)) {
        next.delete(accidental);
      } else {
        next.add(accidental);
      }

      return next;
    });
  };

  useEffect(() => {
    if (!accidentalMenuOpen) return;

    const handleOutsideClick = (event: PointerEvent) => {
      const target = event.target;

      if (
        target instanceof Node &&
        !accidentalDropdownRef.current?.contains(target)
      ) {
        setAccidentalMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAccidentalMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [accidentalMenuOpen]);

  return (
    <div className="literacy-settings-panel">
      <div className="start-section-heading">
        <span className="start-section-icon">⚙</span>

        <div>
          <h2>Настройки игры</h2>
          <p>Выбери удобный уровень сложности</p>
        </div>
      </div>

      <div className="start-setting">
        <SettingLabel
          title="Режим игры"
          description="Нота - необходимо угадать 1 одну на нотном стане. Интервал - 2 ноты сразу"
        />
        <CustomSelect
          ariaLabel="Режим игры"
          value={gameMode}
          options={[
            { value: "notes", label: "Ноты" },
            { value: "intervals", label: "Интервалы" },
          ]}
          onChange={(value) => setGameMode(String(value) as GameMode)}
        />
      </div>

      <div className="start-setting">
        <SettingLabel
          title="Количество вопросов"
          description="На сколько вопросов нужно ответить, чтобы завершить игру"
        />

        <div className="literacy-time-options">
          {QUESTION_COUNT_OPTIONS.map((count) => (
            <button
              key={count}
              type="button"
              className={
                questionCount === count ? "time-option selected" : "time-option"
              }
              onClick={() => setQuestionCount(count)}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      <div className="start-setting">
        <SettingLabel
          title="Диапазон нот"
          description="Укажите диапазон нот, которые могут встретиться в игре. Первый список - 'ОТ', второй список - 'ПО'"
        />

        <div className="literacy-range-selects">
          <label>
            <CustomSelect
              ariaLabel="Начальная нота диапазона"
              value={rangeStart}
              options={NOTE_RANGE_OPTIONS.filter(
                (note) => note.value < rangeEnd,
              ).map((note) => ({
                value: note.value,
                label: getNoteName(note.value, noteNotation),
              }))}
              onChange={(value) => setRangeStart(Number(value))}
            />
          </label>

          <label>
            <CustomSelect
              ariaLabel="Конечная нота диапазона"
              value={rangeEnd}
              options={NOTE_RANGE_OPTIONS.filter(
                (note) => note.value > rangeStart,
              ).map((note) => ({
                value: note.value,
                label: note.label,
              }))}
              onChange={(value) => setRangeEnd(Number(value))}
            />
          </label>
        </div>
      </div>

      <div className="start-setting">
        <SettingLabel
          title="Ключ"
          description="Укажите, в каком ключе будут записаны ноты"
        />

        <CustomSelect
          ariaLabel="Выбор нотного ключа"
          value={clefMode}
          options={[
            { value: "auto", label: "Оба ключа" },
            { value: "treble", label: "Только скрипичный" },
            { value: "bass", label: "Только басовый" },
          ]}
          onChange={(value) => setClefMode(String(value) as ClefMode)}
        />
      </div>

      {gameMode === "intervals" && clefMode === "auto" && (
        <label className="mixed-clefs-toggle">
          <input
            type="checkbox"
            checked={allowMixedClefs}
            onChange={(event) => setAllowMixedClefs(event.target.checked)}
          />
          <span className="toggle-switch" aria-hidden="true" />
          <span className="toggle-label">
            Разрешить разные ключи у нот интервала
          </span>
        </label>
      )}

      <div className="start-setting accidental-setting">
        <SettingLabel
          title="Знаки альтерации"
          description="Укажите, какие знаки альтерации будут встречаться у ключа"
        />

        <div className="accidental-dropdown" ref={accidentalDropdownRef}>
          <button
            type="button"
            className="accidental-dropdown-trigger"
            aria-expanded={accidentalMenuOpen}
            onClick={() => setAccidentalMenuOpen((value) => !value)}
          >
            <span>
              {selectedAccidentals.size === 0
                ? "Только натуральные ноты"
                : `Выбрано: ${ACCIDENTAL_OPTIONS.filter((option) =>
                    selectedAccidentals.has(option.value),
                  )
                    .map((option) => option.symbol)
                    .join(", ")}`}
            </span>

            <span className="accidental-dropdown-arrow">
              {accidentalMenuOpen ? "▲" : "▼"}
            </span>
          </button>

          {accidentalMenuOpen && (
            <div className="accidental-dropdown-menu">
              {ACCIDENTAL_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="accidental-checkbox-option"
                >
                  <input
                    type="checkbox"
                    checked={selectedAccidentals.has(option.value)}
                    onChange={() => toggleAccidental(option.value)}
                  />

                  <span className="accidental-option-symbol">
                    {option.symbol}
                  </span>

                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="start-setting">
        <SettingLabel
          title="Время на ответ"
          description="Укажите, сколько времени будет дано на один вопрос"
        />

        <div className="literacy-time-options">
          {QUESTION_TIME_OPTIONS.map((time) => (
            <button
              key={time}
              type="button"
              className={
                questionTime === time ? "time-option selected" : "time-option"
              }
              onClick={() => setQuestionTime(time)}
            >
              {time}с
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LiteracySettings;
