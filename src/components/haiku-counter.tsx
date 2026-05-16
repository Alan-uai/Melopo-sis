"use client";

import { useMemo } from "react";
import { syllableCount, HAIKU_SYLLABLE_PATTERN } from "@/lib/animation";
import { useReducedMotion, useStaggeredReveal } from "@/hooks/use-animation";

interface HaikuCounterProps {
  lines: [string, string, string];
  className?: string;
}

export function HaikuCounter({ lines, className }: HaikuCounterProps) {
  const reducedMotion = useReducedMotion();

  const counts = useMemo(
    () => lines.map((line) => syllableCount(line)),
    [lines]
  );

  const expected = HAIKU_SYLLABLE_PATTERN;
  const styles = useStaggeredReveal(3, 150);

  return (
    <div className={`flex items-center justify-center gap-6 ${className ?? ""}`} role="status" aria-label="Contagem de sílabas do haicai">
      {counts.map((count, i) => {
        const isCorrect = count === expected[i];
        const color = isCorrect ? "hsl(var(--anim-generate))" : "hsl(var(--anim-correct))";
        return (
          <div
            key={i}
            className="flex flex-col items-center gap-1"
            style={reducedMotion ? undefined : styles[i]}
          >
            <div className="relative flex items-center justify-center">
              <svg width="72" height="72" viewBox="0 0 72 72" className="haiku-brush-svg" aria-hidden="true">
                <path
                  d={`M ${10 + i * 5} 60 Q 30 30, ${50 - i * 3} 20 Q 60 12, ${55 + i * 2} 8`}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  opacity={0.4}
                />
                {!reducedMotion && (
                  <text
                    x="36"
                    y="40"
                    textAnchor="middle"
                    fill={color}
                    fontSize="22"
                    fontWeight="600"
                    fontFamily="var(--font-literata), serif"
                  >
                    {count}
                  </text>
                )}
              </svg>
              {reducedMotion && (
                <span
                  className="absolute text-lg font-semibold"
                  style={{ color }}
                >
                  {count}
                </span>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground">
              {expected[i]} sílabas
            </span>
            {!isCorrect && (
              <span className="text-[9px] text-destructive">
                {count > expected[i] ? `-${count - expected[i]}` : `+${expected[i] - count}`}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
