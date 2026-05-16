"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/use-animation";

interface InkBloomProps {
  x: number;
  y: number;
  color?: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onComplete?: () => void;
}

interface InkDrop {
  id: number;
  dx: number;
  dy: number;
  size: number;
  delay: number;
  duration: number;
}

function createDrops(count: number): InkDrop[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    dx: (Math.random() - 0.5) * 120,
    dy: (Math.random() - 0.5) * 60 + 20,
    size: 4 + Math.random() * 12,
    delay: Math.random() * 200,
    duration: 500 + Math.random() * 400,
  }));
}

export function InkBloom({ x, y, color = "hsl(var(--accent))", containerRef, onComplete }: InkBloomProps) {
  const [drops] = useState(() => createDrops(6));
  const reducedMotion = useReducedMotion();
  const containerRect = containerRef.current?.getBoundingClientRect();

  if (reducedMotion || !containerRect) return null;

  return (
    <div
      className="absolute pointer-events-none z-50"
      style={{
        left: x - 30,
        top: y - 30,
        width: 60,
        height: 60,
      }}
    >
      <svg width="60" height="60" viewBox="0 0 60 60" aria-hidden="true">
        <defs>
          <filter id="ink-turbulence">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>

        <circle cx="30" cy="30" r="0" fill={color} opacity="0.35" filter="url(#ink-turbulence)">
          <animate attributeName="r" from="0" to="28" dur="0.7s" fill="freeze" calcMode="spline" keySplines="0.25 0.1 0.25 1" />
          <animate attributeName="opacity" from="0.5" to="0" dur="0.7s" fill="freeze" />
        </circle>

        {drops.map((drop) => (
          <circle
            key={drop.id}
            cx={30}
            cy={30}
            r={drop.size}
            fill={color}
            opacity="0.3"
            filter="url(#ink-turbulence)"
          >
            <animate
              attributeName="cx"
              from={30}
              to={30 + drop.dx}
              dur={`${drop.duration}ms`}
              begin={`${drop.delay}ms`}
              fill="freeze"
              calcMode="spline"
              keySplines="0.42 0 0.58 1"
            />
            <animate
              attributeName="cy"
              from={30}
              to={30 + drop.dy}
              dur={`${drop.duration}ms`}
              begin={`${drop.delay}ms`}
              fill="freeze"
              calcMode="spline"
              keySplines="0.42 0 0.58 1"
            />
            <animate
              attributeName="opacity"
              from="0.4"
              to="0"
              dur={`${drop.duration}ms`}
              begin={`${drop.delay}ms`}
              fill="freeze"
            />
          </circle>
        ))}
      </svg>
    </div>
  );
}
