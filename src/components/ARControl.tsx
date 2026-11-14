import { useRef } from "react";
import type { PointerEvent, KeyboardEvent } from "react";
import type { ARSettings } from "../features/midi/audioService";

interface ARControlProps {
  settings: ARSettings;
  onChange: (settings: ARSettings) => void;
}

interface KnobProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

const SIZE = 64;
const CENTER = 32;
const RADIUS = 25;

function getPoint(angle: number) {
  const radians = (angle * Math.PI) / 180;

  return {
    x: CENTER + RADIUS * Math.cos(radians),
    y: CENTER + RADIUS * Math.sin(radians),
  };
}

function getArcPath(startAngle: number, endAngle: number) {
  const start = getPoint(startAngle);
  const end = getPoint(endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function Knob({ label, value, min, max, onChange }: KnobProps) {
  const dragStart = useRef<{
    y: number;
    value: number;
  } | null>(null);

  const range = max - min;
  const progress = range === 0 ? 0 : (value - min) / range;

  const angle = 135 + progress * 270;
  const needleEnd = getPoint(angle);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();

    dragStart.current = {
      y: event.clientY,
      value,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return;

    const deltaY = dragStart.current.y - event.clientY;
    const nextValue = dragStart.current.value + (deltaY / 160) * range;

    onChange(Math.round(Math.max(min, Math.min(max, nextValue)) * 100) / 100);
  };

  const handlePointerUp = () => {
    dragStart.current = null;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = 0.01;

    if (event.key === "ArrowUp" || event.key === "ArrowRight") {
      event.preventDefault();
      onChange(Math.min(max, value + step));
    }

    if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
      event.preventDefault();
      onChange(Math.max(min, value - step));
    }

    if (event.key === "Home") {
      onChange(min);
    }

    if (event.key === "End") {
      onChange(max);
    }
  };

  return (
    <div className="ar-knob-control">
      <span className="ar-knob-label">{label}</span>

      <div
        className="ar-knob"
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${Math.round(value * 1000)} миллисекунд`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onLostPointerCapture={handlePointerUp}
        onKeyDown={handleKeyDown}
      >
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="ar-knob-svg">
          <path d={getArcPath(135, 405)} className="ar-knob-track" />

          <path d={getArcPath(135, angle)} className="ar-knob-progress" />

          <circle cx={CENTER} cy={CENTER} r="18" className="ar-knob-body" />

          <line
            x1={CENTER}
            y1={CENTER}
            x2={needleEnd.x}
            y2={needleEnd.y}
            className="ar-knob-needle"
          />
        </svg>
      </div>

      <strong className="ar-knob-value">{Math.round(value * 1000)} мс</strong>
    </div>
  );
}

function ARControl({ settings, onChange }: ARControlProps) {
  return (
    <div className="ar-controls">
      <Knob
        label="Attack"
        value={settings.attack}
        min={0}
        max={2}
        onChange={(attack) => onChange({ ...settings, attack })}
      />

      <Knob
        label="Release"
        value={settings.release}
        min={0}
        max={5}
        onChange={(release) => onChange({ ...settings, release })}
      />
    </div>
  );
}

export default ARControl;
