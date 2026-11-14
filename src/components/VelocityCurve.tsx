import type { PointerEvent } from "react";
import type { VelocityCurveSettings } from "../features/midi/audioService";

interface VelocityCurveProps {
  settings: VelocityCurveSettings;
  onChange: (settings: VelocityCurveSettings) => void;
}

const WIDTH = 620;
const HEIGHT = 280;
const PADDING = 42;
const GRAPH_WIDTH = WIDTH - PADDING * 2;
const GRAPH_HEIGHT = HEIGHT - PADDING * 2;
const CURVE_STEPS = 40;

const MIN_SHAPE = 0.4;
const MAX_SHAPE = 2.5;

function getGain(settings: VelocityCurveSettings, progress: number): number {
  return (
    settings.min +
    (settings.max - settings.min) * Math.pow(progress, settings.shape)
  );
}

function toSvgPoint(x: number, gain: number) {
  return {
    x: PADDING + x * GRAPH_WIDTH,
    y: PADDING + (1 - gain) * GRAPH_HEIGHT,
  };
}

function getGraphY(event: PointerEvent<SVGCircleElement>): number | null {
  const svg = event.currentTarget.ownerSVGElement;

  if (!svg) return null;

  const bounds = svg.getBoundingClientRect();

  if (bounds.height === 0) return null;

  const relativeY = (event.clientY - bounds.top) / bounds.height;

  return Math.max(
    0,
    Math.min(1, (relativeY * HEIGHT - PADDING) / GRAPH_HEIGHT),
  );
}

export function VelocityCurve({ settings, onChange }: VelocityCurveProps) {
  const path = Array.from({ length: CURVE_STEPS + 1 }, (_, index) => {
    const progress = index / CURVE_STEPS;
    const position = toSvgPoint(progress, getGain(settings, progress));

    return `${index === 0 ? "M" : "L"} ${position.x} ${position.y}`;
  }).join(" ");

  const updateEndpoint = (
    endpoint: "min" | "max",
    event: PointerEvent<SVGCircleElement>,
  ) => {
    const graphY = getGraphY(event);

    if (graphY === null) return;

    const value = Math.round((1 - graphY) * 100) / 100;

    if (endpoint === "min") {
      onChange({
        ...settings,
        min: Math.min(value, settings.max),
      });
    } else {
      onChange({
        ...settings,
        max: Math.max(value, settings.min),
      });
    }
  };

  const updateShape = (event: PointerEvent<SVGCircleElement>) => {
    const graphY = getGraphY(event);

    if (graphY === null) return;

    const range = settings.max - settings.min;

    if (range <= 0) return;

    // Переводим положение средней точки в значение громкости
    const targetGain = 1 - graphY;

    // Нормализуем громкость относительно min и max
    const normalized = (targetGain - settings.min) / range;

    // Ограничиваем значение допустимым диапазоном shape
    const minNormalized = Math.pow(0.5, MAX_SHAPE);
    const maxNormalized = Math.pow(0.5, MIN_SHAPE);

    const clamped = Math.max(
      minNormalized,
      Math.min(maxNormalized, normalized),
    );

    // Получаем shape из положения средней точки
    const shape = Math.log(clamped) / Math.log(0.5);

    onChange({
      ...settings,
      shape: Math.max(MIN_SHAPE, Math.min(MAX_SHAPE, shape)),
    });
  };

  const endpoints = [
    { name: "min" as const, x: 0, gain: settings.min },
    { name: "max" as const, x: 1, gain: settings.max },
  ];

  const middlePoint = toSvgPoint(0.5, getGain(settings, 0.5));

  return (
    <div className="curve-editor">
      <div className="curve-legend">
        <span>Выходная громкость</span>
        <span>Сила нажатия MIDI</span>
      </div>

      <svg
        className="velocity-graph"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Кривая зависимости громкости от силы нажатия"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((value) => {
          const y = PADDING + (1 - value) * GRAPH_HEIGHT;

          return (
            <g key={value}>
              <line
                x1={PADDING}
                y1={y}
                x2={WIDTH - PADDING}
                y2={y}
                className="graph-grid"
              />

              <text
                x={PADDING - 9}
                y={y + 4}
                textAnchor="end"
                className="graph-label"
                fontSize="15"
              >
                {Math.round(value * 100)}%
              </text>
            </g>
          );
        })}

        <line
          x1={PADDING}
          y1={HEIGHT - PADDING}
          x2={WIDTH - PADDING}
          y2={HEIGHT - PADDING}
          className="graph-axis"
          fontSize="15"
        />

        <line
          x1={PADDING}
          y1={PADDING}
          x2={PADDING}
          y2={HEIGHT - PADDING}
          className="graph-axis"
          fontSize="15"
        />

        <path d={path} className="curve-line" />

        {/* Левая и правая точки */}
        {endpoints.map((endpoint) => {
          const position = toSvgPoint(endpoint.x, endpoint.gain);

          return (
            <g key={endpoint.name}>
              <circle
                cx={position.x}
                cy={position.y}
                r="21"
                className="curve-point-hit"
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                  if (event.buttons === 1) {
                    updateEndpoint(endpoint.name, event);
                  }
                }}
                onPointerUp={(event) => {
                  event.currentTarget.releasePointerCapture(event.pointerId);
                }}
                onPointerCancel={(event) => {
                  event.currentTarget.releasePointerCapture(event.pointerId);
                }}
              />

              <circle
                cx={position.x}
                cy={position.y}
                r="8"
                className="curve-point"
              />
            </g>
          );
        })}

        {/* Средняя точка плавности */}
        <g>
          <circle
            cx={middlePoint.x}
            cy={middlePoint.y}
            r="21"
            className="curve-point-hit curve-point-middle-hit"
            onPointerDown={(event) => {
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              if (event.buttons === 1) {
                updateShape(event);
              }
            }}
            onPointerUp={(event) => {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }}
            onPointerCancel={(event) => {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }}
          />

          <circle
            cx={middlePoint.x}
            cy={middlePoint.y}
            r="9"
            className="curve-point curve-point-middle"
          />
        </g>

        <text x={PADDING} y={HEIGHT - 8} className="graph-label">
          0
        </text>

        <text
          x={WIDTH - PADDING}
          y={HEIGHT - 8}
          textAnchor="end"
          className="graph-label"
        >
          127
        </text>
      </svg>

      <div className="curve-hint">
        Левая точка — минимум, правая — максимум, средняя — плавность кривой.
      </div>

      <div className="curve-values">
        <span>
          Минимум: <strong>{Math.round(settings.min * 100)}%</strong>
        </span>

        <span>
          Максимум: <strong>{Math.round(settings.max * 100)}%</strong>
        </span>

        <span>
          Плавность: <strong>{settings.shape.toFixed(2)}×</strong>
        </span>
      </div>
    </div>
  );
}
