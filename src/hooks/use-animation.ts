"use client";

import { useState, useEffect, useRef, useCallback } from "react";

import type { AnimationPhase, SwapIntensity } from "@/lib/animation";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}

export function useAnimationState(initial: AnimationPhase = "idle") {
  const [phase, setPhase] = useState<AnimationPhase>(initial);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const transitionTo = useCallback(
    (next: AnimationPhase, delay?: number) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (delay != null && delay > 0) {
        timerRef.current = setTimeout(() => setPhase(next), delay);
      } else {
        setPhase(next);
      }
    },
    []
  );

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase("idle");
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { phase, setPhase, transitionTo, reset };
}

export function useInkOrigin() {
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);

  const capture = useCallback(
    (e: React.MouseEvent<HTMLElement> | MouseEvent) => {
      const rect = (e.currentTarget as HTMLElement)?.getBoundingClientRect?.() ?? { left: 0, top: 0 };
      setOrigin({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    []
  );

  const clear = useCallback(() => setOrigin(null), []);

  return { origin, capture, clear };
}

export function useStaggeredReveal(
  count: number,
  baseDelay: number = 30
) {
  return Array.from({ length: count }, (_, i) => ({
    "--stagger-index": i,
    animationDelay: `${i * baseDelay}ms`,
  })) as React.CSSProperties[];
}

export function useLongPress(
  callback: () => void,
  threshold: number = 400
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pressing, setPressing] = useState(false);

  const onPointerDown = useCallback(() => {
    setPressing(true);
    timerRef.current = setTimeout(() => {
      callback();
      setPressing(false);
    }, threshold);
  }, [callback, threshold]);

  const onPointerUp = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPressing(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { pressing, onPointerDown, onPointerUp };
}

export function useSwapIntensity(intensity: SwapIntensity = "medium") {
  const durationMap: Record<SwapIntensity, number> = {
    low: 300,
    medium: 600,
    high: 900,
  };

  const particleCountMap: Record<SwapIntensity, number> = {
    low: 2,
    medium: 5,
    high: 8,
  };

  return {
    duration: durationMap[intensity],
    particleCount: particleCountMap[intensity],
  };
}
