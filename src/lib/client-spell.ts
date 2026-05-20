'use client';

import { BloomFilter } from './bloom-filter';
import { tokenize } from './tokenize';

export interface ClientSpellResult {
  errors: Array<{
    word: string;
    position: number;
  }>;
  allTokens: number;
  checkedLocally: number;
}

interface BloomState {
  bits_b64: string;
  size: number;
  hashCount: number;
}

const BLOOM_STORAGE_KEY = 'melopoeisis_bloom_v1';

let bloomFilter: BloomFilter | null = null;
let loadPromise: Promise<BloomFilter> | null = null;

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function loadBloomFilter(): Promise<BloomFilter> {
  if (bloomFilter) return bloomFilter;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const stored = localStorage.getItem(BLOOM_STORAGE_KEY);
      if (stored) {
        const parsed: BloomState = JSON.parse(stored);
        const bits = base64ToBytes(parsed.bits_b64);
        bloomFilter = new BloomFilter(
          { size: parsed.size, hashCount: parsed.hashCount },
          bits
        );
        return bloomFilter;
      }
    } catch {
      localStorage.removeItem(BLOOM_STORAGE_KEY);
    }

    const resp = await fetch('/bloom.json');
    const state: BloomState = await resp.json();

    try {
      localStorage.setItem(BLOOM_STORAGE_KEY, JSON.stringify(state));
    } catch {
    }

    const bits = base64ToBytes(state.bits_b64);
    bloomFilter = new BloomFilter(
      { size: state.size, hashCount: state.hashCount },
      bits
    );
    return bloomFilter;
  })();

  return loadPromise;
}

export function isBloomLoaded(): boolean {
  return bloomFilter !== null;
}

export function isWordCorrect(word: string): boolean {
  if (!bloomFilter) return true;

  const lower = word.toLowerCase().trim();
  if (!lower) return true;

  if (/^[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][a-záàâãéèêíïóôõöúçñ]+$/.test(word)) {
    return true;
  }

  return bloomFilter.mayContain(lower);
}

export function getSuspiciousTokens(text: string): Array<{ word: string; position: number }> {
  if (!bloomFilter) return [];

  const tokens = tokenize(text);
  const suspicious: Array<{ word: string; position: number }> = [];

  for (const { word, position } of tokens) {
    if (!isWordCorrect(word)) {
      suspicious.push({ word, position });
    }
  }

  return suspicious;
}

export function checkTextLocally(text: string): ClientSpellResult {
  const tokens = tokenize(text);
  let checkedLocally = 0;

  const errors: Array<{ word: string; position: number }> = [];

  for (const { word, position } of tokens) {
    if (!bloomFilter) break;
    if (!isWordCorrect(word)) {
      errors.push({ word, position });
    }
    checkedLocally++;
  }

  return {
    errors,
    allTokens: tokens.length,
    checkedLocally,
  };
}

export function resetBloomFilter(): void {
  bloomFilter = null;
  loadPromise = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(BLOOM_STORAGE_KEY);
  }
}
