"use client";

import { motion, useReducedMotion, useAnimation } from "framer-motion";
import { useEffect, useMemo } from "react";

export type BulbState = "off" | "pulling" | "on" | "blinking" | "turning-off";

interface LightbulbIconProps {
  state: BulbState;
  size?: number;
  className?: string;
}

// Mood color map for tone suggestions
const toneColors: Record<string, string> = {
  on: "hsl(45, 100%, 60%)",
  blinking: "hsl(45, 100%, 60%)",
};

export function LightbulbIcon({ state, size = 16, className = "" }: LightbulbIconProps) {
  const reduced = useReducedMotion();
  const petalControls = useAnimation();

  const petals = useMemo(
    () => [
      { id: 0, rotate: 0, delay: 0 },
      { id: 1, rotate: 72, delay: 0.06 },
      { id: 2, rotate: 144, delay: 0.12 },
      { id: 3, rotate: 216, delay: 0.18 },
      { id: 4, rotate: 288, delay: 0.24 },
    ],
    []
  );

  useEffect(() => {
    if (state === "pulling") {
      petalControls.start("open");
    } else if (state === "turning-off") {
      petalControls.start("close");
    } else if (state === "on") {
      petalControls.start("open");
    } else {
      petalControls.start("closed");
    }
  }, [state, petalControls]);

  const isOn = state === "on" || state === "blinking";
  const isOff = state === "off" || state === "turning-off";
  const isPulling = state === "pulling";
  const pullAmount = isPulling ? 8 : 0;

  if (reduced) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.272 0l-.548.548A3.99 3.99 0 0114 17.14V17a2 2 0 11-4 0v-.14a3.99 3.99 0 01-1.435-1.072l-.548-.548z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill={isOn ? "currentColor" : "none"} fillOpacity={isOn ? 0.25 : 0} />
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
      } : isPulling ? {
        y: 2,
        rotate: -3,
        scale: 0.95,
      } : isOn ? {
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
      {/* Petal mechanism (lantern flaps) */}
      {petals.map((petal) => (
        <motion.path
          key={`petal-${petal.id}`}
          d={`M12,3 L${12 + 5 * Math.cos((petal.rotate * Math.PI) / 180)},${3 + 5 * Math.sin((petal.rotate * Math.PI) / 180)} L${12 + 8 * Math.cos(((petal.rotate + 36) * Math.PI) / 180)},${3 + 8 * Math.sin(((petal.rotate + 36) * Math.PI) / 180)} Z`}
          fill="currentColor"
          fillOpacity={0.06}
          stroke="currentColor"
          strokeWidth={0.4}
          strokeOpacity={0.3}
          variants={{
            closed: { rotate: 0, scale: 0, opacity: 0, transition: { duration: 0.2 } },
            close: { rotate: 90, scale: 0, opacity: 0, transition: { delay: petal.delay, duration: 0.2 } },
            open: {
              rotate: 0,
              scale: 1,
              opacity: 0.6,
              transition: { delay: petal.delay, type: "spring", stiffness: 200, damping: 16 },
            },
          }}
          initial="closed"
          animate={petalControls}
          style={{
            transformOrigin: "12px 3px",
            transformStyle: "preserve-3d",
          } as any}
        />
      ))}

      {/* Cord */}
      <motion.g
        animate={isPulling || state === "turning-off" ? {
          y: pullAmount,
          rotate: state === "turning-off" ? [0, -3, 3, 0] : 0,
        } : { y: 0, rotate: 0 }}
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
        />
        <motion.circle cx="12" cy="4.5" r="0.8" fill="currentColor" />
      </motion.g>

      {/* Bulb body */}
      <motion.path
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.272 0l-.548.548A3.99 3.99 0 0114 17.14V17a2 2 0 11-4 0v-.14a3.99 3.99 0 01-1.435-1.072l-.548-.548z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity={isOn ? 0.25 : 0}
        animate={isOn ? { fillOpacity: [0.15, 0.3, 0.15] } : { fillOpacity: 0 }}
        transition={isOn ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
      />

      {/* Color spectrum glow - sweeps through hues when turning on, settles on warm tone */}
      <motion.circle
        cx="12"
        cy="12"
        r={11}
        fill="currentColor"
        initial={{ opacity: 0 }}
        animate={{
          opacity: isOn ? [0.06, 0.15, 0.08, 0.12, 0.06] : 0,
          scale: isOn ? [1, 1.1, 1, 1.05, 1] : 1,
        }}
        transition={isOn ? { duration: 3, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
        style={{ mixBlendMode: "screen" } as any}
      />

      {/* Secondary glow ring */}
      <motion.circle
        cx="12"
        cy="12"
        r={8}
        fill="none"
        stroke="currentColor"
        strokeWidth={0.3}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={isOn ? {
          opacity: [0.1, 0.2, 0.1],
          scale: [1, 1.15, 1],
        } : { opacity: 0, scale: 0.8 }}
        transition={isOn ? { duration: 2.5, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
        style={{ mixBlendMode: "screen" } as any}
      />

      {/* Light rays (only when fully on, not blinking) */}
      {state === "on" && (
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {[0, 45, 90, 135].map((angle) => (
            <motion.line
              key={`ray-${angle}`}
              x1={12 + 6 * Math.cos((angle * Math.PI) / 180)}
              y1={12 + 6 * Math.sin((angle * Math.PI) / 180)}
              x2={12 + 10 * Math.cos((angle * Math.PI) / 180)}
              y2={12 + 10 * Math.sin((angle * Math.PI) / 180)}
              stroke="currentColor"
              strokeWidth={0.5}
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0.3, 0.7, 0.3],
                strokeWidth: [0.4, 0.7, 0.4],
              }}
              transition={{
                duration: 1.5 + angle * 0.01,
                repeat: Infinity,
                ease: "easeInOut",
                delay: angle * 0.05,
              }}
            />
          ))}
        </motion.g>
      )}

      {/* Light particles floating around */}
      {isOn && (
        <motion.g>
          {[0, 1, 2].map((i) => (
            <motion.circle
              key={`particle-${i}`}
              cx={12}
              cy={12}
              r={0.6}
              fill="currentColor"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0.6, 0],
                x: [0, (Math.random() - 0.5) * 10],
                y: [0, -2 - Math.random() * 6],
              }}
              transition={{
                duration: 1.5 + i * 0.3,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "easeOut",
              }}
            />
          ))}
        </motion.g>
      )}
    </motion.svg>
  );
}
