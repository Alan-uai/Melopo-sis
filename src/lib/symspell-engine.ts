import { SymSpell, Verbosity, DistanceAlgorithm } from 'symspell-ts';
import { getAllWords } from './dictionary';
import { keyboardWeightedDistance } from './keyboard-layout';

let engine: SymSpell | null = null;
let engineInitPromise: Promise<SymSpell> | null = null;

function initEngine(): Promise<SymSpell> {
  if (engine) return Promise.resolve(engine);
  if (engineInitPromise) return engineInitPromise;

  engineInitPromise = (async () => {
    const s = new SymSpell(DistanceAlgorithm.DamerauOSA, 3, 7, 0);
    const words = await getAllWords();

    for (const w of words) {
      s.createDictionaryEntry(w, 1);
    }

    engine = s;
    return engine;
  })();

  return engineInitPromise;
}

export function resetEngine(): void {
  engine = null;
  engineInitPromise = null;
}

export async function getSymSpellSuggestions(word: string): Promise<string[]> {
  const s = await initEngine();
  const lower = word.toLowerCase();

  const results = s.lookup(lower, Verbosity.All, 3);

  const scored = results.map(item => ({
    word: item.term,
    dist: item.distance,
    keyboardPenalty: keyboardWeightedDistance(lower, item.term.toLowerCase()),
  }));

  scored.sort((a, b) => {
    const dDiff = a.dist - b.dist;
    if (dDiff !== 0) return dDiff;
    return a.keyboardPenalty - b.keyboardPenalty;
  });

  return [...new Set(scored.map(s => s.word))].slice(0, 8);
}

export function getSymSpellCount(): number {
  return engine?.wordCount ?? 0;
}
