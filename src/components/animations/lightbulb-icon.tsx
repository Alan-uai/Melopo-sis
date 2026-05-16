"use client";

import { motion, useReducedMotion } from "framer-motion";

export type BulbState = "off" | "pulling" | "on" | "blinking" | "turning-off";

interface LightbulbIconProps {
  state: BulbState;
  size?: number;
  className?: string;
}

export function LightbulbIcon({ state, size = 16, className = "" }: LightbulbIconProps) {
  const reduced = useReducedMotion();
  const pullAmount = state === "pulling" ? 8 : 0;
  const isOn = state === "on" || state === "blinking";
  const isOff = state === "off" || state === "turning-off";

  if (reduced) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.272 0l-.548.548A3.99 3.99 0 0114 17.14V17a2 2 0 11-4 0v-.14a3.99 3.99 0 01-1.435-1.072l-.548-.548z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill={isOn ? "currentColor" : "none"} opacity={isOn ? 1 : 0.4} />
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
      animate={isOff ? {
        rotate: [0, -5, 5, -3, 3, 0],
        scale: 1,
      } : state === "pulling" ? {
        y: 2,
        rotate: -3,
        scale: 0.95,
      } : state === "on" ? {
        rotate: 0,
        y: 0,
        scale: 1,
      } : state === "blinking" ? {
        scale: [1, 0.85, 1, 0.85, 1],
        opacity: [1, 0.6, 1, 0.6, 1],
      } : {}}
      transition={state === "blinking" ? {
        duration: 0.3,
        times: [0, 0.25, 0.5, 0.75, 1],
        repeat: 1,
      } : {
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
      style={{ transformStyle: "preserve-3d" } as any}
    >
      {/* Cord */}
      <motion.g
        animate={state === "pulling" || state === "turning-off" ? {
          y: pullAmount,
          rotate: state === "turning-off" ? [0, -3, 3, 0] : 0,
        } : {
          y: 0,
          rotate: 0,
        }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        <motion.line
          x1="12"
          y1="2"
          x2="12"
          y2="4"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          initial={false}
        />
        <motion.circle
          cx="12"
          cy="4.5"
          r="0.8"
          fill="currentColor"
          initial={false}
        />
      </motion.g>

      {/* Bulb body */}
      <motion.path
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.272 0l-.548.548A3.99 3.99 0 0114 17.14V17a2 2 0 11-4 0v-.14a3.99 3.99 0 01-1.435-1.072l-.548-.548z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={isOn ? "currentColor" : "none"}
        fillOpacity={isOn ? 0.25 : 0}
        animate={isOn ? {
          fillOpacity: [0.15, 0.3, 0.15],
        } : {
          fillOpacity: 0,
        }}
        transition={isOn ? {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        } : {
          duration: 0.3,
        }}
      />

      {/* Glow effect when on */}
      {isOn && (
        <motion.circle
          cx="12"
          cy="12"
          r="10"
          fill="currentColor"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0.08, 0.15, 0.08],
            r: [10, 12, 10],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ mixBlendMode: "screen" } as any}
        />
      )}

      {/* Light rays */}
      {isOn && (
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {[0, 45, 90, 135].map((angle) => (
            <motion.line
              key={angle}
              x1={12 + 6 * Math.cos((angle * Math.PI) / 180)}
              y1={12 + 6 * Math.sin((angle * Math.PI) / 180)}
              x2={12 + 9 * Math.cos((angle * Math.PI) / 180)}
              y2={12 + 9 * Math.sin((angle * Math.PI) / 180)}
              stroke="currentColor"
              strokeWidth="0.6"
              strokeLinecap="round"
              initial={{ opacity: 0, pathLength: 0 }}
              animate={{ opacity: 0.6, pathLength: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            />
          ))}
        </motion.g>
      )}
    </motion.svg>
  );
}
