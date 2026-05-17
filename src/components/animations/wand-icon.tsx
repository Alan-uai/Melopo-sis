"use client";

import { motion, useReducedMotion, useAnimation, type Variants } from "framer-motion";
import { useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

interface WandIconProps {
  isActive: boolean;
  size?: number;
  className?: string;
}

const wandVariants: Variants = {
  idle: { rotate: 0, scale: 1 },
  casting: {
    rotate: [0, -20, 20, -10, 10, 0],
    scale: [1, 1.2, 1.15, 1.05, 1],
    transition: { duration: 0.8, ease: "easeInOut" },
  },
  done: { rotate: 0, scale: 1, transition: { type: "spring", stiffness: 200, damping: 20 } },
};

const sparkleOrbit = [
  { x: 5, y: 5, angle: 0 },
  { x: 19, y: 5, angle: 90 },
  { x: 19, y: 19, angle: 180 },
  { x: 5, y: 19, angle: 270 },
];

export function WandIcon({ isActive, size = 16, className = "" }: WandIconProps) {
  const reduced = useReducedMotion();
  const controls = useAnimation();
  const runeDelay = 0.3;

  useEffect(() => {
    if (isActive) {
      controls.start("casting");
    } else {
      controls.start("idle");
    }
  }, [isActive, controls]);

  if (reduced) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M7 17L17 7M7 7h10v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
      className={cn(className, isActive && "wand-active")}
      variants={wandVariants}
      initial="idle"
      animate={controls}
      style={{ transformStyle: "preserve-3d" } as any}
    >
      {/* Magic circle / runes */}
      {isActive && (
        <motion.g
          initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: runeDelay + 0.1, duration: 0.4, ease: "easeOut" }}
        >
          {/* Outer circle */}
          <motion.circle
            cx={12}
            cy={12}
            r={9}
            stroke="currentColor"
            strokeWidth={0.4}
            strokeOpacity={0.3}
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1, rotate: [0, 360] }}
            transition={{ pathLength: { delay: runeDelay + 0.15, duration: 0.5 }, rotate: { delay: runeDelay + 0.5, duration: 3, repeat: Infinity, ease: "linear" } }}
            style={{ transformOrigin: "center" } as any}
          />

          {/* Inner circle */}
          <motion.circle
            cx={12}
            cy={12}
            r={6}
            stroke="currentColor"
            strokeWidth={0.3}
            strokeOpacity={0.2}
            fill="none"
            strokeDasharray="2 3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1, rotate: [360, 0] }}
            transition={{ pathLength: { delay: runeDelay + 0.2, duration: 0.5 }, rotate: { delay: runeDelay + 0.5, duration: 4, repeat: Infinity, ease: "linear" } }}
            style={{ transformOrigin: "center" } as any}
          />

          {/* Rune symbols */}
          {[
            { d: "M8 10l2 2-2 2", delay: runeDelay + 0.25 },
            { d: "M12 8v4", delay: runeDelay + 0.3 },
            { d: "M16 10l-2 2 2 2", delay: runeDelay + 0.35 },
            { d: "M10 16l2-2 2 2", delay: runeDelay + 0.4 },
          ].map((rune, i) => (
            <motion.path
              key={`rune-${i}`}
              d={rune.d}
              stroke="currentColor"
              strokeWidth={0.6}
              strokeOpacity={0.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.6 }}
              transition={{ delay: rune.delay, duration: 0.3 }}
            />
          ))}
        </motion.g>
      )}

      {/* Orbiting sparkles */}
      {isActive && sparkleOrbit.map((pos, i) => (
        <motion.circle
          key={`sparkle-${i}`}
          cx={pos.x}
          cy={pos.y}
          r={0.8}
          fill="currentColor"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.8, 0],
            cx: [
              pos.x,
              12 + 7 * Math.cos(((pos.angle + 45) * Math.PI) / 180),
              12 + 7 * Math.cos(((pos.angle + 90) * Math.PI) / 180),
            ],
            cy: [
              pos.y,
              12 + 7 * Math.sin(((pos.angle + 45) * Math.PI) / 180),
              12 + 7 * Math.sin(((pos.angle + 90) * Math.PI) / 180),
            ],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Scan beam - sweeps across */}
      {isActive && (
        <motion.rect
          x={0}
          y={0}
          width={3}
          height={24}
          fill="url(#beam-grad)"
          opacity={0.3}
          initial={{ x: -3 }}
          animate={{ x: [24, -3] }}
          transition={{ delay: runeDelay + 0.6, duration: 0.8, ease: "easeInOut", repeat: 1 }}
        />
      )}

      <defs>
        <linearGradient id="beam-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
          <stop offset="50%" stopColor="currentColor" stopOpacity="0.5" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Star sparkles */}
      <path className="star-1" d="M20 1l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" fill="currentColor" opacity="0" />
      <path className="star-2" d="M13 0l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" fill="currentColor" opacity="0" />

      {/* Wand stick */}
      <motion.path
        className="stick"
        d="M7 17L17 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={isActive ? { strokeWidth: [1.5, 2.5, 1.5] } : {}}
        transition={{ duration: 0.6, repeat: isActive ? Infinity : 0, repeatDelay: 1.5 }}
      />

      {/* Board */}
      <path className="board" d="M4 21h16v1.5H4z" fill="currentColor" opacity="0.15" />

      {/* Wand tip glow */}
      <motion.circle
        cx={17}
        cy={7}
        r={1.2}
        fill="currentColor"
        animate={isActive ? {
          r: [1.2, 3, 1.2],
          opacity: [0.6, 1, 0.6],
        } : {
          r: 1.2,
          opacity: 0.4,
        }}
        transition={isActive ? { duration: 0.8, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
      />

      {/* Sparkle rays */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={isActive ? { opacity: [0, 0.8, 0], transition: { duration: 0.5, repeat: Infinity, repeatDelay: 0.3 } } : { opacity: 0 }}
      >
        {[
          { x1: 17, y1: 7, x2: 21, y2: 3 },
          { x1: 17, y1: 7, x2: 13, y2: 3 },
          { x1: 17, y1: 7, x2: 21, y2: 11 },
          { x1: 17, y1: 7, x2: 13, y2: 11 },
        ].map((line, i) => (
          <motion.line
            key={`ray-${i}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="currentColor"
            strokeWidth={0.4}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: i * 0.05, duration: 0.2 }}
          />
        ))}
      </motion.g>

      {/* Expanding glow ring */}
      <motion.circle
        cx={17}
        cy={7}
        r={4}
        fill="none"
        stroke="currentColor"
        strokeWidth={0.2}
        animate={isActive ? { r: [4, 10, 4], opacity: [0.3, 0, 0.3] } : { r: 4, opacity: 0 }}
        transition={isActive ? { duration: 1.2, repeat: Infinity, ease: "easeOut" } : { duration: 0.3 }}
      />

      {/* Wand sides */}
      <motion.path
        d="M7 7h10v10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={isActive ? { d: ["M7 7h10v10", "M7 7h8v8", "M7 7h10v10"], opacity: [1, 0.5, 1] } : {}}
        transition={{ duration: 0.6, repeat: isActive ? 2 : 0 }}
      />
    </motion.svg>
  );
}
