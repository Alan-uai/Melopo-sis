import { useCallback, useEffect, useRef, useState } from 'react';

interface SpellingError {
  word: string;
  position: number;
  suggestions: string[];
}

interface SpellCheckResult {
  errors: SpellingError[];
}

interface UseSpellCheckReturn {
  checkSpelling: (text: string) => Promise<SpellCheckResult>;
  warmup: () => void;
  isWarm: boolean;
  isChecking: boolean;
}

const CACHE_MAX_SIZE = 200;
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  result: SpellCheckResult;
  timestamp: number;
}

const GLOBAL_CACHE = new Map<string, CacheEntry>();
let sharedWorker: Worker | null = null;
let workerReady = false;
let pendingResolvers: Map<string, (result: SpellCheckResult) => void> = new Map();

function getWorker(): Worker | null {
  if (typeof window === 'undefined') return null;

  if (!sharedWorker) {
    try {
      const workerPath = '/spell-worker.js';
      sharedWorker = new Worker(workerPath);

      sharedWorker.onmessage = (e: MessageEvent) => {
        const { id, type, errors } = e.data;

        if (type === 'warmup-complete') {
          workerReady = true;
          return;
        }

        if (type === 'result') {
          const resolve = pendingResolvers.get(id);
          if (resolve) {
            resolve({ errors: errors || [] });
            pendingResolvers.delete(id);
          }
          return;
        }

        if (type === 'error') {
          console.error('[spell-worker] Error in worker');
          const resolve = pendingResolvers.get(id);
          if (resolve) {
            resolve({ errors: [] });
            pendingResolvers.delete(id);
          }
          return;
        }
      };

      sharedWorker.onerror = () => {
        console.error('[spell-worker] Worker error');
        workerReady = false;
        sharedWorker = null;
      };

      sharedWorker.postMessage({ id: 'init-warmup', type: 'warmup' });
    } catch {
      return null;
    }
  }

  return sharedWorker;
}

function textHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

export function useSpellCheck(): UseSpellCheckReturn {
  const [isWarm, setIsWarm] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    getWorker();
    setIsWarm(true);
  }, []);

  const checkSpelling = useCallback(async (text: string): Promise<SpellCheckResult> => {
    if (!text.trim()) return { errors: [] };

    const cacheKey = textHash(text);
    const now = Date.now();

    const cached = GLOBAL_CACHE.get(cacheKey);
    if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
      return cached.result;
    }

    setIsChecking(true);

    try {
      const worker = getWorker();
      if (worker) {
        const result = await new Promise<SpellCheckResult>((resolve) => {
          const reqId = `req-${++requestIdRef.current}-${Date.now()}`;
          pendingResolvers.set(reqId, (res) => {
            if (res.errors.length === 0) {
              GLOBAL_CACHE.set(cacheKey, { result: res, timestamp: now });
              if (GLOBAL_CACHE.size > CACHE_MAX_SIZE) {
                const oldestKey = GLOBAL_CACHE.keys().next().value;
                if (oldestKey) GLOBAL_CACHE.delete(oldestKey);
              }
            }
            setIsChecking(false);
            resolve(res);
          });

          worker.postMessage({ id: reqId, type: 'check', text });

          setTimeout(() => {
            if (pendingResolvers.has(reqId)) {
              pendingResolvers.delete(reqId);
              setIsChecking(false);
              resolve({ errors: [] });
            }
          }, 30000);
        });

        return result;
      }

      setIsChecking(false);
      return { errors: [] };
    } catch {
      setIsChecking(false);
      return { errors: [] };
    }
  }, []);

  const warmup = useCallback(() => {
    const worker = getWorker();
    if (worker) {
      worker.postMessage({ id: `warmup-${Date.now()}`, type: 'warmup' });
    }
  }, []);

  return { checkSpelling, warmup, isWarm, isChecking };
}

export function clearSpellCache(): void {
  GLOBAL_CACHE.clear();
}
