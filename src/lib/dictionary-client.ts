'use client';

import { BloomFilter, type BloomFilterConfig } from './bloom-filter';

const WORDS_URL = '/dict/words-pt-list.txt';
const BLOOM_URL = '/dict/bloom.json';

const COMMON_MISSING: string[] = ['é', 'quilômetro', 'ônibus'];

const BLOOM_CONFIG: BloomFilterConfig = {
  size: 6_000_000,
  hashCount: 7,
};

interface DictionaryState {
  wordSet: Set<string> | null;
  wordArray: string[] | null;
  bloomFilter: BloomFilter | null;
  initPromise: Promise<void> | null;
  initialized: boolean;
}

const state: DictionaryState = {
  wordSet: null,
  wordArray: null,
  bloomFilter: null,
  initPromise: null,
  initialized: false,
};

const CAPS_REGEX = /^[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][a-záàâãéèêíïóôõöúçñ]+$/;

function base64ToBytes(b64: string): Uint8Array {
  const binaryStr = atob(b64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

export async function ensureInit(): Promise<void> {
  if (state.initialized) return;
  if (state.initPromise) return state.initPromise;

  state.initPromise = (async () => {
    try {
      const [textRes, bloomRes] = await Promise.all([
        fetch(WORDS_URL),
        fetch(BLOOM_URL),
      ]);

      const content = await textRes.text();
      const words = content.split('\n').filter(Boolean);

      state.wordArray = [...words, ...COMMON_MISSING];
      state.wordSet = new Set(state.wordArray);

      const bloomRaw = await bloomRes.json();
      const bits = base64ToBytes(bloomRaw.bits_b64);
      state.bloomFilter = new BloomFilter(
        { size: bloomRaw.size, hashCount: bloomRaw.hashCount },
        bits
      );

      state.initialized = true;
    } catch (e) {
      console.error('[dictionary-client] Failed to load words:', e);
      state.wordArray = [...COMMON_MISSING];
      state.wordSet = new Set(COMMON_MISSING);
      const fallbackBloom = new BloomFilter(BLOOM_CONFIG);
      for (const w of COMMON_MISSING) fallbackBloom.add(w);
      state.bloomFilter = fallbackBloom;
      state.initialized = true;
    }
  })();

  return state.initPromise;
}

export async function isWordCorrect(word: string): Promise<boolean> {
  await ensureInit();

  if (state.wordSet!.has(word)) return true;

  if (word.includes(' ')) {
    const parts = word.split(/\s+/);
    const results = await Promise.all(parts.map(w => isWordCorrect(w)));
    return results.every(r => r);
  }

  if (CAPS_REGEX.test(word)) return true;

  if (state.bloomFilter!.mayContain(word.toLowerCase())) return true;

  return false;
}

export async function getAllWords(): Promise<string[]> {
  await ensureInit();
  return state.wordArray ?? [];
}

export function isClientDictReady(): boolean {
  return state.initialized;
}
