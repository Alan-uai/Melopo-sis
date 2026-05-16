"use client";

import { useRef, useCallback, type ReactNode, type CSSProperties } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "framer-motion";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  tiltDegree?: number;
  glareColor?: string;
  scaleOnHover?: number;
  onClick?: () => void;
  style?: CSSProperties;
  /** Extra depth layers: how much deeper the content appears (px) */
  depth?: number;
}

export function TiltCard({
  children,
  className = "",
  tiltDegree = 8,
  glareColor = "hsl(var(--accent) / 0.15)",
  scaleOnHover = 1.02,
  onClick,
  style,
  depth = 20,
}: TiltCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(y, { stiffness: 300, damping: 30 });
  const rotateY = useSpring(x, { stiffness: 300, damping: 30 });
  const scale = useSpring(1, { stiffness: 300, damping: 30 });

  // Parallax layers move at different speeds
  const bgZ = useTransform(rotateX, [-tiltDegree, tiltDegree], [-depth * 0.3, depth * 0.3]);
  const midZ = useTransform(rotateX, [-tiltDegree, tiltDegree], [-depth * 0.1, depth * 0.1]);
  const fgZ = useTransform(rotateX, [-tiltDegree, tiltDegree], [depth * 0.2, -depth * 0.2]);

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
      scale.set(scaleOnHover);
    },
    [prefersReducedMotion, tiltDegree, scaleOnHover, x, y, scale]
  );

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
    scale.set(1);
  }, [x, y, scale]);

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
      className={`relative ${className}`}
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
        scale,
        transformStyle: "preserve-3d" as any,
      }}
      layout
    >
      {/* Parallax background layer */}
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-[inherit]"
        style={{
          z: bgZ,
          transformStyle: "preserve-3d" as any,
          opacity: 0.5,
        }}
      >
        <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-br from-transparent via-transparent to-current opacity-[0.03]" />
      </motion.div>

      {/* Content (mid layer) */}
      <motion.div
        style={{
          z: midZ,
          transformStyle: "preserve-3d" as any,
        }}
      >
        {children}
      </motion.div>

      {/* Foreground parallax edge */}
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-[inherit]"
        style={{
          z: fgZ,
          transformStyle: "preserve-3d" as any,
        }}
      >
        {/* Edge shine */}
        <div
          className="absolute inset-0 rounded-[inherit]"
          style={{
            border: "1px solid hsl(var(--accent) / 0.06)",
            boxShadow: "inset 0 1px 0 hsl(var(--accent) / 0.08)",
          }}
        />
      </motion.div>

      {/* Glare overlay */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{
          background: `radial-gradient(circle at ${glareX}% ${glareY}%, ${glareColor} 0%, transparent 70%)`,
          opacity: glareOpacity,
          z: 10,
        }}
      />
    </motion.div>
  );
}
