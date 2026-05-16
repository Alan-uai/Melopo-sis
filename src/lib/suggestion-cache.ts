import { LRUCache } from 'lru-cache';
import { createHash } from 'node:crypto';
import type { Suggestion } from '@/ai/types';

const DEFAULT_MAX = 1000;
const DEFAULT_TTL_MS = 60 * 60 * 1000;

interface CacheEntry {
  segmentHash: string;
  suggestions: Suggestion[];
  timestamp: number;
}

export interface CacheParams {
  suggestionType: 'grammar' | 'tone';
  structure: string;
  tone: string;
  rhyme: boolean;
}

export interface DiffResult {
  unchanged: SegmentInfo[];
  changed: SegmentInfo[];
}

export interface SegmentInfo {
  index: number;
  text: string;
}

export class SuggestionCache {
  private cache: LRUCache<string, CacheEntry>;

  constructor(maxSize = DEFAULT_MAX, ttlMs = DEFAULT_TTL_MS) {
    this.cache = new LRUCache({ max: maxSize, ttl: ttlMs });
  }

  private hash(text: string): string {
    return createHash('sha256').update(text).digest('hex');
  }

  private makeKey(segmentText: string, params: CacheParams): string {
    const h = this.hash(segmentText);
    return `${params.suggestionType}:${params.structure}:${params.tone}:${params.rhyme}:${h}`;
  }

  private segmentText(text: string): SegmentInfo[] {
    return text.split('\n').map((l, i) => ({ index: i, text: l }));
  }

  diff(text: string, params: CacheParams): DiffResult {
    const segments = this.segmentText(text);
    const unchanged: SegmentInfo[] = [];
    const changed: SegmentInfo[] = [];

    for (const seg of segments) {
      const key = this.makeKey(seg.text, params);
      const entry = this.cache.get(key);
      const h = this.hash(seg.text);

      if (entry && entry.segmentHash === h) {
        unchanged.push(seg);
      } else {
        changed.push(seg);
      }
    }

    return { unchanged, changed };
  }

  store(
    segments: SegmentInfo[],
    params: CacheParams,
    suggestions: Suggestion[],
  ): void {
    for (const seg of segments) {
      const key = this.makeKey(seg.text, params);
      const h = this.hash(seg.text);

      const segSuggestions = suggestions.filter(s =>
        (s.context && s.context.includes(seg.text.trim()))
        || seg.text.includes(s.originalText)
      );

      this.cache.set(key, {
        segmentHash: h,
        suggestions: segSuggestions,
        timestamp: Date.now(),
      });
    }
  }

  isProcessed(text: string, params: CacheParams): boolean {
    const segments = this.segmentText(text);
    for (const seg of segments) {
      const key = this.makeKey(seg.text, params);
      const entry = this.cache.get(key);
      const h = this.hash(seg.text);
      if (!entry || entry.segmentHash !== h) {
        return false;
      }
    }
    return true;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const globalCache = new SuggestionCache();
