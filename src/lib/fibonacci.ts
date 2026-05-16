export const FIBONACCI = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144];

export interface SpiralPoint {
  x: number;
  y: number;
  radius: number;
  angle: number;
  fibValue: number;
}

export function generateFibonacciSpiral(
  centerX: number,
  centerY: number,
  count: number,
  scale: number = 1
): SpiralPoint[] {
  const phi = (1 + Math.sqrt(5)) / 2;
  const maxFib = FIBONACCI[Math.min(count - 1, FIBONACCI.length - 1)];

  return Array.from({ length: count }, (_, i) => {
    const fibVal = FIBONACCI[i] ?? FIBONACCI[FIBONACCI.length - 1];
    const t = (i / count) * Math.PI * 4;
    const r = (fibVal / maxFib) * scale;
    const angle = t * phi;
    return {
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle),
      radius: 3 + (fibVal / maxFib) * 12,
      angle: angle,
      fibValue: fibVal,
    };
  });
}

export function spiralPathD(points: SpiralPoint[]): string {
  if (points.length === 0) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2;
    d += ` Q ${prev.x + (curr.x - prev.x) * 0.3} ${prev.y + (curr.y - prev.y) * 0.3} ${curr.x} ${curr.y}`;
  }
  return d;
}
