"use client";

import { motion, useReducedMotion } from "framer-motion";

interface ProgressRingProps {
  isActive: boolean;
  size?: number;
  color?: string;
  duration?: number;
}

export function ProgressRing({
  isActive,
  size = 36,
  color = "hsl(var(--accent))",
  duration = 1.2,
}: ProgressRingProps) {
  const reduced = useReducedMotion();
  const strokeWidth = 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  if (reduced || !isActive) return null;

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="absolute inset-0 pointer-events-none"
      initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
      animate={{ opacity: 1, rotate: 0, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference, opacity: 0.3 }}
        animate={{
          strokeDashoffset: 0,
          opacity: 0.6,
          transition: { duration, ease: "easeInOut" },
        }}
      />
    </motion.svg>
  );
}
