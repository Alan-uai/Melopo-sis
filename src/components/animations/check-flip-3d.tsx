"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface CheckFlip3DProps {
  show: boolean;
  size?: number;
  color?: string;
  duration?: number;
  onComplete?: () => void;
}

export function CheckFlip3D({
  show,
  size = 20,
  color = "hsl(var(--accent))",
  duration = 0.6,
  onComplete,
}: CheckFlip3DProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <AnimatePresence>
        {show && (
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onAnimationComplete={onComplete}
          >
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 13l4 4L19 7" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.span>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          key="check-flip"
          className="preserve-3d perspective-near"
          style={{
            width: size,
            height: size,
            transformStyle: "preserve-3d",
          } as any}
          initial={{ rotateY: 180, opacity: 0, scale: 0.5 }}
          animate={{
            rotateY: 0,
            opacity: 1,
            scale: 1,
            transition: {
              type: "spring",
              stiffness: 300,
              damping: 20,
              duration: duration,
            },
          }}
          exit={{
            rotateY: -180,
            opacity: 0,
            scale: 0.5,
            transition: { duration: 0.2 },
          }}
          onAnimationComplete={onComplete}
        >
          {/* Front face: checkmark */}
          <div
            className="absolute inset-0 backface-hidden flex items-center justify-center"
            style={{ backfaceVisibility: "hidden" } as any}
          >
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <motion.path
                d="M5 13l4 4L19 7"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              />
            </svg>
          </div>

          {/* Back face: spinning icon */}
          <div
            className="absolute inset-0 backface-hidden flex items-center justify-center"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" } as any}
          >
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <motion.circle
                cx="12"
                cy="12"
                r="8"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="40"
                initial={{ strokeDashoffset: 40 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 0.4 }}
              />
            </svg>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
