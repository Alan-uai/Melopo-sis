"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useMemo } from "react";

interface ParticleBurstProps {
  isActive: boolean;
  count?: number;
  color?: string;
  originX?: number;
  originY?: number;
}

export function ParticleBurst({
  isActive,
  count = 8,
  color = "hsl(var(--accent))",
  originX = 0,
  originY = 0,
}: ParticleBurstProps) {
  const reduced = useReducedMotion();

  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * 360 + Math.random() * 20;
        const distance = 20 + Math.random() * 30;
        const rad = (angle * Math.PI) / 180;
        return {
          id: i,
          x: Math.cos(rad) * distance,
          y: Math.sin(rad) * distance,
          scale: 0.3 + Math.random() * 0.7,
          rotate: Math.random() * 360,
        };
      }),
    [count]
  );

  if (reduced) return null;

  return (
    <AnimatePresence>
      {isActive && (
        <div
          className="absolute inset-0 pointer-events-none z-50"
          style={{ top: originY, left: originX }}
        >
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute w-1 h-1 rounded-full"
              style={{
                backgroundColor: color,
                top: "50%",
                left: "50%",
              }}
              initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
              animate={{
                x: p.x,
                y: p.y,
                scale: p.scale,
                opacity: 0,
                rotate: p.rotate,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.5 + Math.random() * 0.3,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
