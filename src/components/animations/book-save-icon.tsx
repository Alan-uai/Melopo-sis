"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";

interface BookSaveIconProps {
  phase: "idle" | "saving" | "done";
  size?: number;
  accentColor?: string;
  className?: string;
}

const containerVariants: Variants = {
  idle: {},
  saving: {
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
  done: {
    transition: { staggerChildren: 0.05 },
  },
};

const pageVariants: Variants = {
  idle: { scaleY: 0, opacity: 0 },
  saving: (i: number) => ({
    scaleY: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
      delay: i * 0.08,
    },
  }),
  done: { scaleY: 1, opacity: 0.9, transition: { duration: 0.3 } },
};

const coverVariants: Variants = {
  idle: { rotateX: 90, opacity: 0 },
  saving: {
    rotateX: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 200, damping: 18, delay: 0.5 },
  },
  done: { rotateX: 0, opacity: 1 },
};

const sealVariants: Variants = {
  idle: { scale: 0, y: -10, opacity: 0 },
  saving: {
    scale: [0, 1.3, 0.9, 1.05, 1],
    y: [0, 8, 4, 2, 0],
    opacity: 1,
    transition: { delay: 0.9, duration: 0.6, ease: "easeOut" },
  },
  done: {
    scale: 1,
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 400, damping: 15 },
  },
};

const spineGlowVariants: Variants = {
  idle: { opacity: 0 },
  saving: { opacity: 0 },
  done: {
    opacity: [0, 0.5, 0.2, 0.4, 0.15],
    transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
  },
};

export function BookSaveIcon({
  phase,
  size = 16,
  accentColor = "hsl(var(--accent))",
  className = "",
}: BookSaveIconProps) {
  const reduced = useReducedMotion();

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
          <path
            d="M4 19.5v-15A2.5 2.5 0 016.5 2H19a1 1 0 011 1v18a1 1 0 01-1 1H6.5A2.5 2.5 0 014 19.5z"
            stroke={accentColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={`${accentColor}20`}
          />
        ) : (
          <path
            d="M4 19.5v-15A2.5 2.5 0 016.5 2H19a1 1 0 011 1v18a1 1 0 01-1 1H6.5A2.5 2.5 0 014 19.5z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
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
      animate={phase === "saving" ? "saving" : phase === "done" ? "done" : "idle"}
      style={{ transformStyle: "preserve-3d" } as any}
    >
      {/* Pages stacking from bottom */}
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.rect
          key={`page-${i}`}
          x={5.5 + i * 0.3}
          y={6 + i * 0.6}
          width={13 - i * 0.6}
          height={13 - i * 0.3}
          rx={0.5}
          fill="currentColor"
          fillOpacity={0.08 + i * 0.02}
          stroke="currentColor"
          strokeWidth={0.3}
          strokeOpacity={0.15}
          custom={i}
          variants={pageVariants}
          style={{ transformOrigin: "bottom center", transformStyle: "preserve-3d" } as any}
        />
      ))}

      {/* Bottom cover */}
      <motion.rect
        x={5}
        y={5.5}
        width={14}
        height={14}
        rx={1}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeOpacity={0.6}
        variants={coverVariants}
        style={{ transformOrigin: "bottom center", transformStyle: "preserve-3d" } as any}
      />

      {/* Top cover (flaps down) */}
      <motion.path
        d="M5 5.5h14v-2a1 1 0 00-1-1H6a1 1 0 00-1 1v2z"
        fill="currentColor"
        fillOpacity={0.08}
        stroke="currentColor"
        strokeWidth={1.2}
        strokeOpacity={0.6}
        strokeLinejoin="round"
        variants={{
          idle: { rotateX: -90, opacity: 0 },
          saving: {
            rotateX: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 200, damping: 18, delay: 0.45 },
          },
          done: { rotateX: 0, opacity: 1 },
        }}
        style={{ transformOrigin: "bottom center", transformStyle: "preserve-3d" } as any}
      />

      {/* Wax seal */}
      <motion.g variants={sealVariants} style={{ transformStyle: "preserve-3d" } as any}>
        <motion.circle
          cx={16}
          cy={18}
          r={3.5}
          fill={accentColor}
          fillOpacity={0.25}
          stroke={accentColor}
          strokeWidth={0.8}
        />
        <motion.path
          d="M15.2 17.2L16.8 18.8M16.8 17.2L15.2 18.8"
          stroke={accentColor}
          strokeWidth={1.2}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 1.2, duration: 0.3 }}
        />
        <motion.circle
          cx={16}
          cy={18}
          r={1}
          fill={accentColor}
          fillOpacity={0.4}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1.3, type: "spring", stiffness: 400, damping: 10 }}
        />
      </motion.g>

      {/* Spine glow */}
      <motion.line
        x1={5.5}
        y1={5.5}
        x2={5.5}
        y2={19.5}
        stroke={accentColor}
        strokeWidth={2}
        strokeLinecap="round"
        variants={spineGlowVariants}
      />
    </motion.svg>
  );
}
