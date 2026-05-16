"use client";

import { useReducedMotion } from "@/hooks/use-animation";

interface PencilStrikeProps {
  text: string;
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function PencilStrike({
  text,
  width = 200,
  height = 24,
  color = "hsl(var(--accent))",
  className,
}: PencilStrikeProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return (
      <span className={`line-through text-muted-foreground ${className ?? ""}`}>
        {text}
      </span>
    );
  }

  return (
    <span className={`relative inline-flex items-center ${className ?? ""}`}>
      <span className="opacity-50 line-through">{text}</span>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="pencil-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0" />
            <stop offset="20%" stopColor={color} stopOpacity="0.8" />
            <stop offset="80%" stopColor={color} stopOpacity="0.8" />
            <stop offset="100%" stopColor={color} stopOpacity="0.2" />
          </linearGradient>
        </defs>

        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2 - 2}
          stroke="url(#pencil-grad)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray={width}
          strokeDashoffset={width}
          className="motion-safe:animate-golden-spiral-draw"
          style={{ animationDuration: "0.4s" } as React.CSSProperties}
        />

        <polygon
          points={`${width},${height / 2 - 6} ${width + 8},${height / 2 - 2} ${width},${height / 2 + 2}`}
          fill={color}
          opacity="0.8"
          className="motion-safe:animate-quill-stroke"
          style={{ animationDelay: "0.3s" } as React.CSSProperties}
        />
      </svg>
    </span>
  );
}
