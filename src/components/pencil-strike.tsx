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
  height = 28,
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

  const midY = height / 2;
  // Wavy calligraphic strike path
  const strikePath = `M0,${midY + 2} 
    C${width * 0.15},${midY - 3} 
    ${width * 0.3},${midY + 5} 
    ${width * 0.5},${midY - 1} 
    C${width * 0.65},${midY - 4} 
    ${width * 0.8},${midY + 4} 
    ${width},${midY}`;

  const smudgePath = `M${width - 2},${midY - 1} 
    Q${width + 6},${midY - 4} 
    ${width + 4},${midY + 3} 
    Q${width + 1},${midY + 6} 
    ${width - 1},${midY + 1}Z`;

  return (
    <span className={`relative inline-flex items-center preserve-3d ${className ?? ""}`}>
      {/* Original text fades */}
      <motion.span
        className="block"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0.35 }}
        transition={{ duration: 0.3 }}
      >
        {text}
      </motion.span>

      <motion.svg
        width={width + 12}
        height={height + 8}
        viewBox={`0 0 ${width + 12} ${height + 8}`}
        className="absolute inset-0 pointer-events-none"
        style={{ left: -4, top: -4 }}
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
          <linearGradient id="strike-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0" />
            <stop offset="15%" stopColor={color} stopOpacity="0.9" />
            <stop offset="50%" stopColor={color} stopOpacity="0.7" />
            <stop offset="85%" stopColor={color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={color} stopOpacity="0.3" />
          </linearGradient>
          <filter id="pencil-smudge">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
        </defs>

        {/* Pencil dropping from top */}
        <motion.g
          initial={{ y: -20, rotate: 45, opacity: 0 }}
          animate={{ y: 0, rotate: 0, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 18,
            delay: 0.05,
            duration: 0.4,
          }}
        >
          {/* Pencil body */}
          <motion.rect
            x={-2}
            y={midY - 5}
            width={6}
            height={10}
            rx={0.5}
            fill={color}
            fillOpacity={0.3}
            stroke={color}
            strokeWidth={0.5}
            animate={{ y: [midY - 5, midY + 2, midY - 1] }}
            transition={{ delay: 1, duration: 0.3, ease: "easeInOut" }}
          />
          {/* Pencil tip */}
          <motion.polygon
            points={`-2,${midY + 5} 4,${midY + 5} 1,${midY + 8}`}
            fill={color}
            fillOpacity={0.5}
          />
        </motion.g>

        {/* Main calligraphic strike-through */}
        <motion.path
          d={strikePath}
          stroke="url(#strike-grad)"
          strokeWidth={2.5}
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.3, duration: 0.9, ease: "easeInOut" }}
        />

        {/* Thinner secondary stroke for calligraphy feel */}
        <motion.path
          d={`M0,${midY + 3} 
            C${width * 0.2},${midY - 2} 
            ${width * 0.4},${midY + 4} 
            ${width * 0.6},${midY} 
            C${width * 0.75},${midY - 3} 
            ${width * 0.9},${midY + 3} 
            ${width},${midY + 1}`}
          stroke={color}
          strokeWidth={0.8}
          strokeOpacity={0.3}
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.5, duration: 0.7, ease: "easeInOut" }}
        />

        {/* Ink smudge / blot at the end */}
        <motion.path
          d={smudgePath}
          fill={color}
          fillOpacity={0}
          filter="url(#pencil-smudge)"
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: 1,
            opacity: [0, 0.25, 0.1],
            fillOpacity: [0, 0.25, 0.1],
          }}
          transition={{ delay: 0.9, duration: 0.5, ease: "easeOut" }}
        />

        {/* Small ink splatter dots */}
        {[
          { x: width + 5, y: midY - 4, r: 0.8, delay: 1.0 },
          { x: width + 8, y: midY + 5, r: 0.5, delay: 1.05 },
          { x: width + 3, y: midY + 7, r: 0.6, delay: 1.1 },
        ].map((dot, i) => (
          <motion.circle
            key={`splat-${i}`}
            cx={dot.x}
            cy={dot.y}
            r={dot.r}
            fill={color}
            fillOpacity={0.4}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.4 }}
            transition={{ delay: dot.delay, duration: 0.2 }}
          />
        ))}

        {/* Eraser dust cloud - sweeps right-to-left */}
        <motion.g
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: [0, 0.15, 0], x: [-5, -20] }}
          transition={{ delay: 1.3, duration: 0.6, ease: "easeOut" }}
        >
          {[
            { cx: width - 10, cy: midY - 3, r: 3 },
            { cx: width - 15, cy: midY + 2, r: 2 },
            { cx: width - 8, cy: midY + 4, r: 1.5 },
          ].map((d, i) => (
            <circle
              key={`dust-${i}`}
              cx={d.cx}
              cy={d.cy}
              r={d.r}
              fill={color}
              opacity={0.08}
              filter="url(#pencil-smudge)"
            />
          ))}
        </motion.g>
      </motion.svg>
    </span>
  );
}
