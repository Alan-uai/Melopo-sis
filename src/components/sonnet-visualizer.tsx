"use client";

import { useMemo } from "react";
import { SONNET_RHYME_SCHEME } from "@/lib/animation";
import { useReducedMotion } from "@/hooks/use-animation";

interface SonnetVisualizerProps {
  lines?: string[];
  className?: string;
}

const RHYME_COLORS = [
  "hsl(var(--rhyme-color-0))",
  "hsl(var(--rhyme-color-1))",
  "hsl(var(--rhyme-color-2))",
  "hsl(var(--rhyme-color-3))",
  "hsl(var(--rhyme-color-4))",
  "hsl(var(--rhyme-color-5))",
];

export function SonnetVisualizer({ lines, className }: SonnetVisualizerProps) {
  const reducedMotion = useReducedMotion();

  const lineLabels = useMemo(
    () => SONNET_RHYME_SCHEME.map((s) => s.label),
    []
  );

  const groupColors = useMemo(
    () => SONNET_RHYME_SCHEME.map((s) => RHYME_COLORS[s.group % RHYME_COLORS.length]),
    []
  );

  const connectionPairs = useMemo(() => {
    const pairs: [number, number][] = [];
    for (let i = 0; i < SONNET_RHYME_SCHEME.length; i++) {
      for (let j = i + 1; j < SONNET_RHYME_SCHEME.length; j++) {
        if (SONNET_RHYME_SCHEME[i].group === SONNET_RHYME_SCHEME[j].group) {
          pairs.push([i, j]);
        }
      }
    }
    return pairs;
  }, []);

  const lineH = 24;
  const height = SONNET_RHYME_SCHEME.length * lineH + 24;
  const width = 220;
  const leftCol = 40;
  const rightCol = width - 30;

  return (
    <div className={`${className ?? ""}`} role="img" aria-label="Estrutura de soneto com esquema de rimas ABAB CDCD EFEF GG">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        {connectionPairs.map(([i, j]) => {
          const y1 = 14 + i * lineH;
          const y2 = 14 + j * lineH;
          const color = groupColors[i];

          if (reducedMotion) {
            return (
              <line
                key={`conn-${i}-${j}`}
                x1={rightCol}
                y1={y1}
                x2={rightCol + 18}
                y2={y2}
                stroke={color}
                strokeWidth={1}
                opacity={0.3}
              />
            );
          }

          return (
            <line
              key={`conn-${i}-${j}`}
              x1={rightCol}
              y1={y1}
              x2={rightCol + 18}
              y2={y2}
              stroke={color}
              strokeWidth={1}
              strokeLinecap="round"
              opacity={0.5}
              className="sonnet-connector-line"
              style={{
                animationDelay: `${Math.min(i, j) * 60}ms`,
              }}
            />
          );
        })}

        {SONNET_RHYME_SCHEME.map((s, i) => {
          const y = 14 + i * lineH;
          return (
            <g key={i}>
              {!reducedMotion && (
                <rect
                  x={leftCol - 2}
                  y={y - 7}
                  width={rightCol - leftCol + 4}
                  height={lineH - 4}
                  rx={3}
                  fill={groupColors[i]}
                  opacity={1}
                  className="animate-sonnet-line"
                  style={{ animationDelay: `${i * 60}ms` }}
                />
              )}
              {reducedMotion && (
                <rect
                  x={leftCol - 2}
                  y={y - 7}
                  width={rightCol - leftCol + 4}
                  height={lineH - 4}
                  rx={3}
                  fill={groupColors[i]}
                  opacity={0.3}
                />
              )}
              <text
                x={leftCol - 14}
                y={y + 4}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill={groupColors[i]}
                fontFamily="var(--font-literata), serif"
              >
                {s.label}
              </text>
              <text
                x={leftCol + 6}
                y={y + 4}
                fontSize="9"
                fill="hsl(var(--muted-foreground))"
                fontFamily="var(--font-literata), serif"
              >
                {i + 1}
              </text>
              <text
                x={leftCol + 22}
                y={y + 4}
                fontSize="9"
                fill="hsl(var(--foreground))"
                fontFamily="var(--font-literata), serif"
                className="truncate"
              >
                {lines?.[i] ?? ""}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
