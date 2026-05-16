export const ANIMATION_DURATIONS = {
  swapFlash: 600,
  inkBloom: 700,
  quillStroke: 1200,
  parchmentReveal: 2000,
  goldenSpiral: 1000,
  meterScan: 1500,
  sonnetReveal: 2000,
  haikuCount: 800,
  accordionOpen: 400,
  buttonRipple: 500,
  drawIcon: 600,
} as const;

export const EASINGS = {
  elastic: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  overshoot: "cubic-bezier(0.34, 1.3, 0.64, 1)",
  smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
  bounceOut: "cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

export const STAGGER_BASE_DELAY = 30;

export const FIBONACCI = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55];

export const SONNET_RHYME_SCHEME = [
  { group: 0, label: "A", line: 1 },
  { group: 1, label: "B", line: 2 },
  { group: 0, label: "A", line: 3 },
  { group: 1, label: "B", line: 4 },
  { group: 2, label: "C", line: 5 },
  { group: 3, label: "D", line: 6 },
  { group: 2, label: "C", line: 7 },
  { group: 3, label: "D", line: 8 },
  { group: 4, label: "E", line: 9 },
  { group: 5, label: "F", line: 10 },
  { group: 4, label: "E", line: 11 },
  { group: 5, label: "F", line: 12 },
  { group: 6, label: "G", line: 13 },
  { group: 6, label: "G", line: 14 },
] as const;

export const HAIKU_SYLLABLE_PATTERN = [5, 7, 5] as const;

export type AnimationPhase =
  | "init"
  | "active"
  | "finishing"
  | "complete"
  | "idle";

export type SwapIntensity = "low" | "medium" | "high";

export interface InkBloomConfig {
  x: number;
  y: number;
  color: string;
  intensity: SwapIntensity;
  duration?: number;
}

export interface ParticleConfig {
  count: number;
  color: string;
  spreadRadius: number;
  duration: number;
}

export function createParticles(count: number): { x: number; y: number; size: number; delay: number }[] {
  return Array.from({ length: count }, () => ({
    x: (Math.random() - 0.5) * 100,
    y: (Math.random() - 0.5) * 100,
    size: 2 + Math.random() * 4,
    delay: Math.random() * 150,
  }));
}

export function generateFibonacciSpiralPoints(
  centerX: number,
  centerY: number,
  count: number,
  maxRadius: number
): { x: number; y: number; radius: number }[] {
  const phi = (1 + Math.sqrt(5)) / 2;
  return Array.from({ length: count }, (_, i) => {
    const t = (i / count) * Math.PI * 4;
    const fibVal = i < FIBONACCI.length ? FIBONACCI[i] : FIBONACCI[FIBONACCI.length - 1];
    const r = (maxRadius * fibVal) / FIBONACCI[FIBONACCI.length - 1];
    return {
      x: centerX + r * Math.cos(t / phi) * Math.cos(t),
      y: centerY + r * Math.sin(t / phi) * Math.sin(t),
      radius: r * 0.15,
    };
  });
}

export function syllableCount(text: string): number {
  const normalized = text.toLowerCase().replace(/[^a-záâãéêíóôõúüç]/g, "");
  if (!normalized) return 0;
  const vowelGroups = normalized.match(/[aeiouáâãéêíóôõúü]+[^aeiouáâãéêíóôõúü]*/gi);
  if (!vowelGroups) return 0;
  let count = vowelGroups.length;
  const diphthongs = /[aeiou][iuáâãéêíóôõú]+$/i;
  for (const group of vowelGroups) {
    if (diphthongs.test(group)) count--;
  }
  return Math.max(1, count);
}
