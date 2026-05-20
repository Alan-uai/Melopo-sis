import fs from 'fs';
import path from 'path';
import { getSymSpellSuggestions } from './symspell-engine';

const WORDS_FILE = path.join(process.cwd(), 'src', 'lib', 'words-pt-list.txt');

const COMMON_MISSING: string[] = ['é', 'quilômetro', 'ônibus'];

interface BloomFilterConfig {
  size: number;
  hashCount: number;
}

const BLOOM_CONFIG: BloomFilterConfig = {
  size: 1_000_000,
  hashCount: 7,
};

class BloomFilter {
  private bits: Uint8Array;
  private size: number;
  private hashCount: number;

  constructor(config: BloomFilterConfig) {
    this.size = config.size;
    this.hashCount = config.hashCount;
    this.bits = new Uint8Array(Math.ceil(this.size / 8));
  }

  private hash(str: string, seed: number): number {
    let h1 = seed;
    for (let i = 0; i < str.length; i++) {
      h1 = Math.imul(31, h1) + str.charCodeAt(i) | 0;
    }
    return Math.abs(h1 % this.size);
  }

  add(item: string): void {
    for (let i = 0; i < this.hashCount; i++) {
      const idx = this.hash(item, i * 31337);
      this.bits[Math.floor(idx / 8)] |= 1 << (idx % 8);
    }
  }

  mayContain(item: string): boolean {
    for (let i = 0; i < this.hashCount; i++) {
      const idx = this.hash(item, i * 31337);
      if ((this.bits[Math.floor(idx / 8)] & (1 << (idx % 8))) === 0) {
        return false;
      }
    }
    return true;
  }
}

interface SpellCache {
  correct: Map<string, boolean>;
  suggestions: Map<string, string[]>;
}

const INIT_STATE = {
  wordSet: null as Set<string> | null,
  wordArray: null as string[] | null,
  bloomFilter: null as BloomFilter | null,
  spellCache: null as SpellCache | null,
  initPromise: null as Promise<void> | null,
  initialized: false,
};

async function ensureInit(): Promise<void> {
  if (INIT_STATE.initialized) return;
  if (INIT_STATE.initPromise) return INIT_STATE.initPromise;

  INIT_STATE.initPromise = (async () => {
    try {
      const content = fs.readFileSync(WORDS_FILE, 'latin1');
      const words = content.split('\n').filter(Boolean);

      INIT_STATE.wordArray = [...words, ...COMMON_MISSING];
      INIT_STATE.wordSet = new Set(INIT_STATE.wordArray);

      const bloom = new BloomFilter(BLOOM_CONFIG);
      for (const w of words) {
        bloom.add(w.toLowerCase());
      }
      for (const w of COMMON_MISSING) {
        bloom.add(w.toLowerCase());
      }
      INIT_STATE.bloomFilter = bloom;

      INIT_STATE.spellCache = {
        correct: new Map<string, boolean>(),
        suggestions: new Map<string, string[]>(),
      };

      INIT_STATE.initialized = true;
    } catch (e) {
      console.error('[dictionary] Failed to load words:', e);
      INIT_STATE.wordArray = [...COMMON_MISSING];
      INIT_STATE.wordSet = new Set(COMMON_MISSING);
      INIT_STATE.bloomFilter = new BloomFilter(BLOOM_CONFIG);
      for (const w of COMMON_MISSING) INIT_STATE.bloomFilter.add(w);
      INIT_STATE.spellCache = { correct: new Map(), suggestions: new Map() };
      INIT_STATE.initialized = true;
    }
  })();

  return INIT_STATE.initPromise;
}

async function warmupEngines(): Promise<void> {
  await ensureInit();
  const { isWordCorrectHunspell } = await import('./spelling/espells-engine');
  await isWordCorrectHunspell('warmup');
  await getSymSpellSuggestions('casa');
}

export { warmupEngines };

const CAPS_REGEX = /^[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][a-záàâãéèêíïóôõöúçñ]+$/;

export async function isWordCorrect(word: string): Promise<boolean> {
  await ensureInit();

  if (INIT_STATE.spellCache!.correct.has(word)) {
    return INIT_STATE.spellCache!.correct.get(word)!;
  }

  if (word.includes(' ')) {
    const parts = word.split(/\s+/);
    const results = await Promise.all(parts.map(w => isWordCorrect(w)));
    const allCorrect = results.every(r => r);
    INIT_STATE.spellCache!.correct.set(word, allCorrect);
    return allCorrect;
  }

  if (INIT_STATE.wordSet!.has(word)) {
    INIT_STATE.spellCache!.correct.set(word, true);
    return true;
  }

  if (CAPS_REGEX.test(word)) {
    INIT_STATE.spellCache!.correct.set(word, true);
    return true;
  }

  if (INIT_STATE.bloomFilter!.mayContain(word.toLowerCase())) {
    const { isWordCorrectHunspell } = await import('./spelling/espells-engine');
    const correct = await isWordCorrectHunspell(word).catch(() => false);
    INIT_STATE.spellCache!.correct.set(word, correct);
    return correct;
  }

  INIT_STATE.spellCache!.correct.set(word, false);
  return false;
}

export async function getWordSuggestions(
  word: string,
  _leftContext?: string[],
  _rightContext?: string[]
): Promise<string[]> {
  await ensureInit();
  const lower = word.toLowerCase();

  if (INIT_STATE.spellCache!.suggestions.has(lower)) {
    return INIT_STATE.spellCache!.suggestions.get(lower)!;
  }

  const [symSpellResults, hunspellSuggestions] = await Promise.all([
    getSymSpellSuggestions(lower),
    import('./spelling/espells-engine').then(m => m.getHunspellSuggestions(lower).catch(() => [] as string[])),
  ]);

  const combined = [...new Set([...symSpellResults, ...hunspellSuggestions])].slice(0, 5);
  INIT_STATE.spellCache!.suggestions.set(lower, combined);
  return combined;
}

export async function getAllWords(): Promise<string[]> {
  await ensureInit();
  return INIT_STATE.wordArray ?? [];
}

export function isInitialized(): boolean {
  return INIT_STATE.initialized;
}

export function getCacheStats(): { correctSize: number; suggestionsSize: number } {
  return {
    correctSize: INIT_STATE.spellCache?.correct.size ?? 0,
    suggestionsSize: INIT_STATE.spellCache?.suggestions.size ?? 0,
  };
}