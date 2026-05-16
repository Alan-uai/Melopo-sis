"use client";

import { useReducedMotion } from "@/hooks/use-animation";

interface QuillPenProps {
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function QuillPen({
  width = 120,
  height = 40,
  color = "hsl(var(--accent))",
  className,
}: QuillPenProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return null;
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`quill-pen-svg ${className ?? ""}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="quill-ink" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0.6" />
          <stop offset="50%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      <path
        d={`
          M 0 ${height / 2}
          Q ${width * 0.1} ${height * 0.3}
          ${width * 0.25} ${height * 0.4}
          Q ${width * 0.4} ${height * 0.5}
          ${width * 0.5} ${height * 0.38}
          Q ${width * 0.6} ${height * 0.25}
          ${width * 0.7} ${height * 0.35}
          Q ${width * 0.8} ${height * 0.45}
          ${width * 0.9} ${height * 0.4}
          L ${width} ${height * 0.42}
        `}
        fill="none"
        stroke="url(#quill-ink)"
        strokeWidth="0"
        strokeLinecap="round"
        className="motion-safe:animate-quill-stroke"
      />

      <path
        d={`
          M 0 ${height / 2}
          Q ${width * 0.15} ${height * 0.35}
          ${width * 0.3}  ${height * 0.42}
          Q ${width * 0.45} ${height * 0.5}
          ${width * 0.55} ${height * 0.4}
        `}
        fill="none"
        stroke={color}
        strokeWidth="0.5"
        strokeLinecap="round"
        opacity="0.5"
        className="motion-safe:animate-quill-stroke"
        style={{ animationDelay: "0.1s" } as React.CSSProperties}
      />
    </svg>
  );
}
