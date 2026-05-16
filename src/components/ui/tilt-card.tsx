"use client";

import { useRef, useCallback, type ReactNode, type CSSProperties } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  tiltDegree?: number;
  glareColor?: string;
  scaleOnHover?: number;
  onClick?: () => void;
  style?: CSSProperties;
}

export function TiltCard({
  children,
  className = "",
  tiltDegree = 8,
  glareColor = "hsl(var(--accent) / 0.15)",
  scaleOnHover = 1.02,
  onClick,
  style,
}: TiltCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(y, { stiffness: 300, damping: 30 });
  const rotateY = useSpring(x, { stiffness: 300, damping: 30 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (prefersReducedMotion || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = (e.clientX - centerX) / rect.width;
      const deltaY = (e.clientY - centerY) / rect.height;
      x.set(deltaX * tiltDegree);
      y.set(-deltaY * tiltDegree);
    },
    [prefersReducedMotion, tiltDegree, x, y]
  );

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  const glareOpacity = useSpring(0, { stiffness: 200, damping: 30 });

  const handleGlareMove = useCallback(
    (e: React.MouseEvent) => {
      if (prefersReducedMotion || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const pctX = ((e.clientX - rect.left) / rect.width) * 100;
      const pctY = ((e.clientY - rect.top) / rect.height) * 100;
      glareX.set(pctX);
      glareY.set(pctY);
      glareOpacity.set(1);
    },
    [prefersReducedMotion, glareX, glareY, glareOpacity]
  );

  const handleGlareLeave = useCallback(() => {
    glareOpacity.set(0);
  }, [glareOpacity]);

  if (prefersReducedMotion) {
    return (
      <div ref={ref} className={className} onClick={onClick} style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={(e) => {
        handleMouseMove(e);
        handleGlareMove(e);
      }}
      onMouseLeave={() => {
        handleMouseLeave();
        handleGlareLeave();
      }}
      onClick={onClick}
      style={{
        ...style,
        rotateX,
        rotateY,
        transformStyle: "preserve-3d" as any,
      }}
      whileHover={{ scale: scaleOnHover }}
    >
      {children}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{
          background: `radial-gradient(circle at ${glareX}% ${glareY}%, ${glareColor} 0%, transparent 60%)`,
          opacity: glareOpacity,
        }}
      />
    </motion.div>
  );
}
