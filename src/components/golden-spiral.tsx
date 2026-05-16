"use client";

import { useMemo } from "react";
import { generateFibonacciSpiral, spiralPathD } from "@/lib/fibonacci";
import { useReducedMotion } from "@/hooks/use-animation";

interface GoldenSpiralProps {
  width?: number;
  height?: number;
  pointCount?: number;
  scale?: number;
  color?: string;
  className?: string;
}

export function GoldenSpiral({
  width = 200,
  height = 200,
  pointCount = 8,
  scale = 80,
  color = "hsl(var(--anim-finish))",
  className,
}: GoldenSpiralProps) {
  const reducedMotion = useReducedMotion();

  const points = useMemo(
    () => generateFibonacciSpiral(width / 2, height / 2, pointCount, scale),
    [width, height, pointCount, scale]
  );

  const pathD = useMemo(() => spiralPathD(points), [points]);

  if (reducedMotion) {
    return (
      <svg
        width={width}
        height={height}
        className={className}
        aria-hidden="true"
      >
        <path d={pathD} fill="none" stroke={color} strokeWidth={1.5} opacity={0.3} />
      </svg>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      className={`${className ?? ""} golden-spiral-svg`}
      aria-hidden="true"
    >
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={0.6}
      />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={0}
          fill="none"
          stroke={color}
          strokeWidth={0.5}
          className="animate-expand-circle"
          style={{
            "--fib-radius": p.radius,
            animationDelay: `${i * 80}ms`,
          } as React.CSSProperties}
        />
      ))}
    </svg>
  );
}
