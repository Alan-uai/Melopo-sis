'use client';

export async function warmupSpellEngines(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    await fetch('/api/warmup-spell', { 
      method: 'POST', 
      keepalive: true,
      signal: AbortSignal.timeout(5000)
    }).catch(() => {});
  } catch {
    // Silently fail warmup
  }
}

export function isWarmedUp(): boolean {
  return false;
}

export function resetWarmup(): void {
  // No-op
}