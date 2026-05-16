"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useMemo, useId } from "react";

interface InkCopyIconProps {
  phase: "idle" | "copying" | "done";
  size?: number;
  accentColor?: string;
  className?: string;
}

const containerVariants: Variants = {
  idle: {},
  copying: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
  done: {},
};

export function InkCopyIcon({
  phase,
  size = 16,
  accentColor = "hsl(var(--accent))",
  className = "",
}: InkCopyIconProps) {
  const reduced = useReducedMotion();
  const uid = useId();
  const inkDots = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        id: i,
        x: 14 + (i % 3) * 3,
        y: 8 + Math.floor(i / 3) * 3,
        delay: 0.5 + i * 0.06,
        r: 0.8 + Math.random() * 0.6,
      })),
    []
  );

  if (reduced) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <rect x={3} y={3} width={9} height={18} rx={1} stroke="currentColor" strokeWidth="1.2" fill="none" />
        <rect x={12} y={3} width={9} height={18} rx={1} stroke={accentColor} strokeWidth="1.2" fill={`${accentColor}10`} />
      </svg>
    );
  }

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      variants={containerVariants}
      initial="idle"
      animate={phase}
      style={{ transformStyle: "preserve-3d" } as any}
    >
      <defs>
        <filter id={`ink-blur-${uid}`}>
          <feGaussianBlur stdDeviation="0.5" />
        </filter>
      </defs>

      {/* Original paper on left */}
      <motion.rect
        x={3.5}
        y={3.5}
        width={7.5}
        height={17}
        rx={1}
        stroke="currentColor"
        strokeWidth={1}
        strokeOpacity={0.6}
        fill="none"
        variants={{
          idle: { opacity: 1, x: 0 },
          copying: { opacity: [1, 0.7, 1], x: [0, -1, 0], transition: { duration: 0.5 } },
          done: { opacity: 1, x: 0 },
        }}
      />

      {/* Text lines on original */}
      {[6, 9, 12, 15].map((y, i) => (
        <motion.line
          key={`orig-line-${i}`}
          x1={5}
          y1={y}
          x2={9.5}
          y2={y}
          stroke="currentColor"
          strokeWidth={0.5}
          strokeOpacity={0.4}
          strokeLinecap="round"
          variants={{
            idle: { pathLength: 1 },
            copying: { pathLength: [1, 0.3, 1], opacity: [0.4, 0.15, 0.4], transition: { duration: 0.4, delay: i * 0.06 } },
            done: { pathLength: 1, opacity: 0.4 },
          }}
        />
      ))}

      {/* Shadow paper (reflection) - appears below then rises */}
      <motion.rect
        x={12.5}
        y={3.5}
        width={7.5}
        height={17}
        rx={1}
        stroke={accentColor}
        strokeWidth={1}
        strokeOpacity={0.5}
        fill={accentColor}
        fillOpacity={0.04}
        variants={{
          idle: { opacity: 0, y: 8, scaleY: 0.3 },
          copying: {
            opacity: [0, 0.6, 1],
            y: [8, 0, 0],
            scaleY: [0.3, 1.05, 1],
            transition: { duration: 0.6, ease: "easeOut" },
          },
          done: { opacity: 1, y: 0, scaleY: 1 },
        }}
        style={{ transformOrigin: "top center" } as any}
      />

      {/* Ink dots spreading */}
      {inkDots.map((dot) => (
        <motion.circle
          key={`ink-${dot.id}`}
          cx={dot.x}
          cy={dot.y}
          r={dot.r}
          fill={accentColor}
          fillOpacity={0.5}
          variants={{
            idle: { scale: 0, opacity: 0 },
            copying: {
              scale: [0, 1.5, 1],
              opacity: [0, 0.6, 0.3],
              transition: { delay: dot.delay, duration: 0.4, ease: "easeOut" },
            },
            done: { scale: 1, opacity: 0.2 },
          }}
          filter={`url(#ink-blur-${uid})`}
        />
      ))}

      {/* Copy glow overlay */}
      <motion.rect
        x={12.5}
        y={3.5}
        width={7.5}
        height={17}
        rx={1}
        fill={accentColor}
        fillOpacity={0}
        variants={{
          idle: { fillOpacity: 0 },
          copying: { fillOpacity: [0, 0.08, 0], transition: { delay: 0.7, duration: 0.8 } },
          done: { fillOpacity: 0.03, transition: { duration: 0.3 } },
        }}
      />

      {/* Copy text lines appearing */}
      {[6, 9, 12, 15].map((y, i) => (
        <motion.line
          key={`copy-line-${i}`}
          x1={14}
          y1={y}
          x2={18.5}
          y2={y}
          stroke={accentColor}
          strokeWidth={0.5}
          strokeOpacity={0.5}
          strokeLinecap="round"
          variants={{
            idle: { pathLength: 0 },
            copying: {
              pathLength: [0, 1],
              transition: { delay: 0.7 + i * 0.08, duration: 0.3 },
            },
            done: { pathLength: 1 },
          }}
        />
      ))}
    </motion.svg>
  );
}
