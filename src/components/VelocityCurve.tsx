import type { PointerEvent } from "react";
import type { VelocityCurveSettings } from "../features/midi/audioService";

interface VelocityCurveProps {
  settings: VelocityCurveSettings;
  onChange: (settings: VelocityCurveSettings) => void;
}

const WIDTH = 620;
const HEIGHT = 260;
const PADDING = 34;
const GRAPH_WIDTH = WIDTH - PADDING * 2;
const GRAPH_HEIGHT = HEIGHT - PADDING * 2;
const CURVE_STEPS = 40;

function getGain(settings: VelocityCurveSettings, progress: number): number {
  return settings.min + (settings.max - settings.min) * Math.pow(progress, settings.shape);
}

function toSvgPoint(x: number, gain: number) {
  return {
    x: PADDING + x * GRAPH_WIDTH,
    y: PADDING + (1 - gain) * GRAPH_HEIGHT,
  };
}

export function VelocityCurve({ settings, onChange }: VelocityCurveProps) {
  const path = Array.from({ length: CURVE_STEPS + 1 }, (_, index) => {
    const progress = index / CURVE_STEPS;
    const position = toSvgPoint(progress, getGain(settings, progress));
    return `${index === 0 ? "M" : "L"} ${position.x} ${position.y}`;
  }).join(" ");

  const updateEndpoint = (endpoint: "min" | "max", event: PointerEvent<SVGCircleElement>) => {
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) return;
    const bounds = svg.getBoundingClientRect();
    const relativeY = (event.clientY - bounds.top) / bounds.height;
    const graphY = Math.max(0, Math.min(1, (relativeY * HEIGHT - PADDING) / GRAPH_HEIGHT));
    const value = Math.round((1 - graphY) * 100) / 100;

    if (endpoint === "min") {
      onChange({ ...settings, min: Math.min(value, settings.max) });
    } else {
      onChange({ ...settings, max: Math.max(value, settings.min) });
    }
  };

  const endpoints = [
    { name: "min" as const, x: 0, gain: settings.min },
    { name: "max" as const, x: 1, gain: settings.max },
  ];

  return (
    <div className="curve-editor">
      <div className="curve-legend">
        <span>Выходная громкость</span>
        <span>Сила нажатия MIDI</span>
      </div>
      <svg className="velocity-graph" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img"
        aria-label="Кривая зависимости громкости от силы нажатия">
        {[0, 0.25, 0.5, 0.75, 1].map((value) => {
          const y = PADDING + (1 - value) * GRAPH_HEIGHT;
          return (
            <g key={value}>
              <line x1={PADDING} y1={y} x2={WIDTH - PADDING} y2={y} className="graph-grid" />
              <text x={PADDING - 9} y={y + 4} textAnchor="end" className="graph-label">
                {Math.round(value * 100)}%
              </text>
            </g>
          );
        })}
        <line x1={PADDING} y1={HEIGHT - PADDING} x2={WIDTH - PADDING}
          y2={HEIGHT - PADDING} className="graph-axis" />
        <line x1={PADDING} y1={PADDING} x2={PADDING} y2={HEIGHT - PADDING} className="graph-axis" />
        <path d={path} className="curve-line" />
        {endpoints.map((endpoint) => {
          const position = toSvgPoint(endpoint.x, endpoint.gain);
          return (
            <g key={endpoint.name}>
              <circle cx={position.x} cy={position.y} r="12" className="curve-point-hit"
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                  if (event.buttons === 1) updateEndpoint(endpoint.name, event);
                }}
                onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)}
              />
              <circle cx={position.x} cy={position.y} r="5" className="curve-point" />
            </g>
          );
        })}
        <text x={PADDING} y={HEIGHT - 8} className="graph-label">0</text>
        <text x={WIDTH - PADDING} y={HEIGHT - 8} textAnchor="end" className="graph-label">127</text>
      </svg>
      <div className="curve-hint">
        Перетаскивай левую точку, чтобы задать минимальную громкость, а правую — максимальную.
      </div>
      <div className="curve-values">
        <span>Минимум: <strong>{Math.round(settings.min * 100)}%</strong></span>
        <span>Максимум: <strong>{Math.round(settings.max * 100)}%</strong></span>
      </div>
    </div>
  );
}
