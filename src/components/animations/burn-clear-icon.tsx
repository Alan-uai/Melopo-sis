"use client";

import { motion, AnimatePresence, useReducedMotion, type Variants } from "framer-motion";
import { useMemo, useId } from "react";

interface BurnClearIconProps {
  phase: "idle" | "burning" | "done";
  size?: number;
  accentColor?: string;
  className?: string;
}

const emberPositions = [
  { x: 6, y: 18 }, { x: 10, y: 20 }, { x: 14, y: 17 }, { x: 17, y: 19 },
  { x: 8, y: 15 }, { x: 16, y: 14 },
];

export function BurnClearIcon({
  phase,
  size = 16,
  accentColor = "hsl(var(--destructive))",
  className = "",
}: BurnClearIconProps) {
  const reduced = useReducedMotion();
  const uid = useId();

  const ashParticles = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        angle: (i / 8) * 360 + Math.random() * 30,
        dist: 6 + Math.random() * 10,
        delay: 0.5 + Math.random() * 0.4,
        size: 1 + Math.random() * 1.5,
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
        {phase === "done" ? (
          <>
            <rect x={6} y={3} width={12} height={18} rx={1} fill="none" stroke={accentColor} strokeWidth="1.2" strokeOpacity={0.3} />
            <line x1={9} y1={3} x2={9} y2={2} stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            <line x1={15} y1={3} x2={15} y2={2} stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </>
        ) : (
          <>
            <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <line x1={10} y1={11} x2={10} y2={17} stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeOpacity={0.5} />
            <line x1={14} y1={11} x2={14} y2={17} stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeOpacity={0.5} />
          </>
        )}
      </svg>
    );
  }

  const rad = (deg: number) => (deg * Math.PI) / 180;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <motion.svg
            key="trash"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            exit={{ opacity: 0, scale: 0.8, rotate: 20 }}
            transition={{ duration: 0.2 }}
          >
            <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <motion.line x1={10} y1={11} x2={10} y2={17} stroke="currentColor" strokeWidth="1" strokeLinecap="round" initial={{ pathLength: 1 }} exit={{ pathLength: 0 }} transition={{ duration: 0.3 }} />
            <motion.line x1={14} y1={11} x2={14} y2={17} stroke="currentColor" strokeWidth="1" strokeLinecap="round" initial={{ pathLength: 1 }} exit={{ pathLength: 0 }} transition={{ duration: 0.3 }} />
          </motion.svg>
        )}

        {phase === "burning" && (
          <motion.svg
            key="burning"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <defs>
              <filter id={`burn-glow-${uid}`}>
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <clipPath id={`burn-mask-${uid}`}>
                <motion.rect
                  x={0}
                  y={0}
                  width={24}
                  height={24}
                  initial={{ height: 24 }}
                  animate={{ height: [24, 16, 8, 0] }}
                  transition={{ duration: 0.8, ease: "easeIn" }}
                />
              </clipPath>
            </defs>

            {/* Paper outline */}
            <motion.rect
              x={4}
              y={3}
              width={16}
              height={18}
              rx={1}
              stroke="currentColor"
              strokeWidth={1.2}
              fill="none"
              strokeOpacity={0.6}
              clipPath={`url(#burn-mask-${uid})`}
            />

            {/* Text lines erasing top to bottom */}
            {[7, 10, 13, 16].map((y, i) => (
              <motion.line
                key={`line-${i}`}
                x1={7}
                y1={y}
                x2={17}
                y2={y}
                stroke="currentColor"
                strokeWidth={0.6}
                strokeOpacity={0.4}
                strokeLinecap="round"
                initial={{ pathLength: 1 }}
                animate={{ pathLength: [1, 0.5, 0], opacity: [0.4, 0.2, 0] }}
                transition={{ delay: i * 0.1, duration: 0.4, ease: "easeIn" }}
              />
            ))}

            {/* Corner curl */}
            <motion.path
              d="M18 21l2-2v2h-2z"
              fill={accentColor}
              fillOpacity={0.4}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.6 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            />

            {/* Embers floating up */}
            {emberPositions.map((pos, i) => (
              <motion.circle
                key={`ember-${i}`}
                cx={pos.x}
                cy={pos.y}
                r={1 + Math.random() * 0.5}
                fill={accentColor}
                filter={`url(#burn-glow-${uid})`}
                initial={{ opacity: 0, y: 0 }}
                animate={{
                  opacity: [0, 0.8, 0],
                  y: [0, -4 - Math.random() * 6],
                  x: [0, (Math.random() - 0.5) * 6],
                }}
                transition={{
                  delay: 0.2 + i * 0.08,
                  duration: 0.6 + Math.random() * 0.3,
                  ease: "easeOut",
                }}
              />
            ))}
          </motion.svg>
        )}

        {phase === "done" && (
          <motion.svg
            key="fresh"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            initial={{ opacity: 0, y: -5, scale: 0.7 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { type: "spring", stiffness: 300, damping: 20 },
            }}
            exit={{ opacity: 0 }}
          >
            {/* Fresh blank paper */}
            <motion.rect
              x={4}
              y={3}
              width={16}
              height={18}
              rx={1}
              stroke="currentColor"
              strokeWidth={1.2}
              strokeOpacity={0.3}
              fill="none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
            {/* Small sparkle */}
            <motion.circle
              cx={12}
              cy={12}
              r={1.5}
              fill={accentColor}
              fillOpacity={0}
              animate={{
                fillOpacity: [0, 0.3, 0],
                r: [1.5, 3, 1.5],
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </motion.svg>
        )}
      </AnimatePresence>
    </div>
  );
}
