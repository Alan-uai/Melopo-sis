"use client";

import { useMemo } from "react";
import { scanMeter } from "@/lib/meter-scanner";
import { useReducedMotion } from "@/hooks/use-animation";

interface MeterVisualizerProps {
  text: string;
  width?: number;
  height?: number;
  className?: string;
}

export function MeterVisualizer({
  text,
  width = 300,
  height = 60,
  className,
}: MeterVisualizerProps) {
  const reducedMotion = useReducedMotion();

  const scan = useMemo(() => scanMeter(text), [text]);

  const wavePoints = useMemo(() => {
    if (scan.waveform.length === 0) return "";
    const stepX = width / (scan.waveform.length + 1);
    const midY = height / 2;
    return scan.waveform
      .map(
        (val, i) =>
          `${i > 0 ? "L" : "M"} ${(i + 0.5) * stepX} ${midY - val * (height * 0.35)}`
      )
      .join(" ");
  }, [scan.waveform, width, height]);

  if (reducedMotion) {
    return (
      <div className={className} role="img" aria-label="Visualização de métrica poética">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
          <path d={wavePoints} fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth={1} opacity={0.3} />
        </svg>
      </div>
    );
  }

  return (
    <div className={className} role="img" aria-label="Visualização de métrica poética">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <defs>
          <clipPath id="meter-wave-clip">
            <rect x="0" y="0" width={width} height={height} />
          </clipPath>
        </defs>

        <g className="motion-safe:animate-meter-wave" style={{ clipPath: "url(#meter-wave-clip)" } as React.CSSProperties}>
          <path
            d={wavePoints}
            fill="none"
            stroke="hsl(var(--accent))"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.6}
          />

          {scan.marks.map((mark, i) => {
            if (!mark.stressed) return null;
            const stepX = width / (scan.waveform.length + 1);
            const x = (i + 0.5) * stepX;
            const midY = height / 2;
            const y = midY - 1 * (height * 0.35) - 8;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={3}
                fill="hsl(var(--primary))"
                opacity={0.7}
                className="stress-mark"
                style={{ animationDelay: `${i * 0.2}s` } as React.CSSProperties}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}
