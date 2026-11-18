import { useEffect, useId, useRef, useState } from "react";
import "./CustomSelect.css";

export interface CustomSelectOption {
  value: string | number;
  label: string;
}

interface CustomSelectProps {
  value: string | number;
  options: CustomSelectOption[];
  onChange: (value: string | number) => void;
  ariaLabel: string;
}

function CustomSelect({
  value,
  options,
  onChange,
  ariaLabel,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  const selectedIndex = options.findIndex((option) => option.value === value);

  const selectedOption = options[selectedIndex];

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const openMenu = () => {
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setIsOpen(true);
  };

  const chooseOption = (option: CustomSelectOption) => {
    onChange(option.value);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (options.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (!isOpen) {
        openMenu();
      } else {
        setHighlightedIndex((current) => (current + 1) % options.length);
      }
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (!isOpen) {
        openMenu();
      } else {
        setHighlightedIndex(
          (current) => (current - 1 + options.length) % options.length,
        );
      }
    }

    if (event.key === "Home" && isOpen) {
      event.preventDefault();
      setHighlightedIndex(0);
    }

    if (event.key === "End" && isOpen) {
      event.preventDefault();
      setHighlightedIndex(options.length - 1);
    }

    if ((event.key === "Enter" || event.key === " ") && isOpen) {
      event.preventDefault();

      const option = options[highlightedIndex];
      if (option) chooseOption(option);
    }

    if ((event.key === "Enter" || event.key === " ") && !isOpen) {
      event.preventDefault();
      openMenu();
    }
  };

  return (
    <div className={`custom-select ${isOpen ? "is-open" : ""}`} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="custom-select-trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-activedescendant={
          isOpen ? `${listId}-option-${highlightedIndex}` : undefined
        }
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
          } else {
            openMenu();
          }
        }}
        onKeyDown={handleKeyDown}
      >
        <span>{selectedOption?.label ?? "Выбрать"}</span>
        <span className="custom-select-arrow" aria-hidden="true" />
      </button>

      <div className="custom-select-popup">
        <ul
          id={listId}
          className="custom-select-options"
          role="listbox"
          aria-label={ariaLabel}
          aria-hidden={!isOpen}
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              id={`${listId}-option-${index}`}
              role="option"
              aria-selected={option.value === value}
              className={[
                "custom-select-option",
                option.value === value ? "is-selected" : "",
                index === highlightedIndex ? "is-highlighted" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onMouseEnter={() => setHighlightedIndex(index)}
              onClick={() => chooseOption(option)}
            >
              <span>{option.label}</span>
              {option.value === value && (
                <span className="custom-select-check" aria-hidden="true">
                  ✓
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default CustomSelect;
