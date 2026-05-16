"use client";

import { motion, useReducedMotion } from "framer-motion";

interface PencilStrikeProps {
  text: string;
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function PencilStrike({
  text,
  width = 200,
  height = 24,
  color = "hsl(var(--accent))",
  className,
}: PencilStrikeProps) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return (
      <span className={`line-through text-muted-foreground ${className ?? ""}`}>
        {text}
      </span>
    );
  }

  return (
    <span className={`relative inline-flex items-center preserve-3d ${className ?? ""}`}>
      <motion.span
        className="opacity-50 line-through block"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 0.3 }}
      >
        {text}
      </motion.span>
      <motion.svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        initial={{ rotateX: -15, rotateY: 10, opacity: 0 }}
        animate={{
          rotateX: 0,
          rotateY: 0,
          opacity: 1,
          transition: {
            rotateX: { type: "spring", stiffness: 150, damping: 20 },
            rotateY: { type: "spring", stiffness: 150, damping: 20 },
            opacity: { duration: 0.2 },
          },
        }}
      >
        <defs>
          <linearGradient id="pencil-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0" />
            <stop offset="20%" stopColor={color} stopOpacity="0.8" />
            <stop offset="80%" stopColor={color} stopOpacity="0.8" />
            <stop offset="100%" stopColor={color} stopOpacity="0.2" />
          </linearGradient>
        </defs>

        <motion.line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2 - 2}
          stroke="url(#pencil-grad)"
          strokeWidth={2.5}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />

        <motion.polygon
          points={`${width},${height / 2 - 6} ${width + 8},${height / 2 - 2} ${width},${height / 2 + 2}`}
          fill={color}
          initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
          animate={{ opacity: 0.8, scale: 1, rotate: 0 }}
          transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
        />
      </motion.svg>
    </span>
  );
}
