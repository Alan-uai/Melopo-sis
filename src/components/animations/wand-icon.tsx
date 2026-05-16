"use client";

import { motion, useReducedMotion } from "framer-motion";

interface WandIconProps {
  isActive: boolean;
  size?: number;
  className?: string;
}

export function WandIcon({ isActive, size = 16, className = "" }: WandIconProps) {
  const reduced = useReducedMotion();

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
      className={className}
      animate={isActive ? {
        rotate: [0, -15, 15, -10, 10, 0],
        scale: [1, 1.15, 1.1, 1.05, 1],
      } : {
        rotate: 0,
        scale: 1,
      }}
      transition={isActive ? {
        duration: 0.6,
        ease: "easeInOut",
      } : {
        type: "spring",
        stiffness: 200,
        damping: 20,
      }}
      style={{ transformStyle: "preserve-3d" } as any}
    >
      {/* Wand stick */}
      <motion.path
        d="M7 17L17 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={isActive ? {
          strokeWidth: [1.5, 2, 1.5],
        } : {}}
        transition={{ duration: 0.4, repeat: isActive ? 1 : 0 }}
      />

      {/* Wand tip sparkle */}
      <motion.circle
        cx="17"
        cy="7"
        r="1.2"
        fill="currentColor"
        animate={isActive ? {
          r: [1.2, 2.5, 1.2],
          opacity: [0.6, 1, 0.6],
          scale: [1, 1.5, 1],
        } : {
          r: 1.2,
          opacity: 0.4,
          scale: 1,
        }}
        transition={isActive ? {
          duration: 0.6,
          repeat: 1,
          ease: "easeInOut",
        } : {
          duration: 0.3,
        }}
      />

      {/* Sparkle lines */}
      {isActive && (
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.8, 0] }}
          transition={{ duration: 0.5, repeat: 1 }}
        >
          {[
            { x1: 17, y1: 7, x2: 20, y2: 4, delay: 0 },
            { x1: 17, y1: 7, x2: 14, y2: 4, delay: 0.1 },
            { x1: 17, y1: 7, x2: 20, y2: 10, delay: 0.15 },
            { x1: 17, y1: 7, x2: 14, y2: 10, delay: 0.05 },
          ].map((line, i) => (
            <motion.line
              key={i}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="currentColor"
              strokeWidth="0.5"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.6 }}
              transition={{ delay: line.delay, duration: 0.3 }}
            />
          ))}
        </motion.g>
      )}

      {/* Glow ring */}
      <motion.circle
        cx="17"
        cy="7"
        r="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.3"
        animate={isActive ? {
          r: [4, 8, 4],
          opacity: [0.3, 0, 0.3],
        } : {
          r: 4,
          opacity: 0,
        }}
        transition={isActive ? {
          duration: 0.8,
          repeat: Infinity,
          ease: "easeOut",
        } : {
          duration: 0.3,
        }}
      />

      {/* Magic left/right sides */}
      <motion.path
        d="M7 7h10v10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={isActive ? {
          d: ["M7 7h10v10", "M7 7h8v8", "M7 7h10v10"],
          opacity: [1, 0.6, 1],
        } : {}}
        transition={{ duration: 0.5, repeat: isActive ? 1 : 0 }}
      />
    </motion.svg>
  );
}
