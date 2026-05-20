import { ensureInit, isWordCorrect, getAllWords } from '../lib/dictionary-client';
import { SymSpell, Verbosity, DistanceAlgorithm } from 'symspell-ts';
import { keyboardWeightedDistance } from '../lib/keyboard-layout';

interface SpellCheckMessage {
  id: string;
  type: 'check' | 'warmup';
  text?: string;
}

interface SpellCheckResponse {
  id: string;
  type: 'result' | 'warmup-complete' | 'error';
  errors?: Array<{ word: string; position: number; suggestions: string[] }>;
  error?: string;
}

interface MisspelledToken {
  word: string;
  position: number;
}

let isWarm = false;
let suggestEngine: SymSpell | null = null;
let suggestInitPromise: Promise<void> | null = null;

const WORD_REGEX = /[a-zA-ZáàâãéèêíïóôõöúçñüÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑÜ]+(?:-[a-zA-ZáàâãéèêíïóôõöúçñüÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑÜ]+)*/g;

function tokenize(text: string): Array<{ word: string; position: number }> {
  const tokens: Array<{ word: string; position: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = WORD_REGEX.exec(text)) !== null) {
    tokens.push({ word: m[0], position: m.index });
  }
  return tokens;
}

function isPunctuationOrNumber(word: string): boolean {
  return /^[\d.,!?;:()\[\]{}\"'«»\-—…\s]+$/.test(word);
}

async function initSuggestEngine(): Promise<void> {
  if (suggestEngine) return;
  if (suggestInitPromise) return suggestInitPromise;

  suggestInitPromise = (async () => {
    const words = await getAllWords();
    const s = new SymSpell(DistanceAlgorithm.DamerauOSA, 3, 7, 0);
    for (const w of words) {
      s.createDictionaryEntry(w, 1);
    }
    suggestEngine = s;
  })();

  return suggestInitPromise;
}

async function getSuggestions(word: string): Promise<string[]> {
  const lower = word.toLowerCase();
  if (!suggestEngine) return [];

  const results = suggestEngine.lookup(lower, Verbosity.All, 3);
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

async function performSpellCheck(text: string): Promise<SpellCheckResponse['errors']> {
  const tokens = tokenize(text);
  const checkableTokens = tokens.filter(t => !isPunctuationOrNumber(t.word));

  if (checkableTokens.length === 0) return [];

  await ensureInit();

  const misspelledTokens: MisspelledToken[] = [];

  for (const { word, position } of checkableTokens) {
    const correct = await isWordCorrect(word);
    if (!correct) {
      misspelledTokens.push({ word, position });
    }
  }

  if (misspelledTokens.length === 0) return [];

  await initSuggestEngine();

  const result = await Promise.all(
    misspelledTokens.map(async (t) => ({
      word: t.word,
      position: t.position,
      suggestions: await getSuggestions(t.word),
    }))
  );

  return result;
}

self.onmessage = async (e: MessageEvent<SpellCheckMessage>) => {
  const { id, type, text } = e.data;

  try {
    if (type === 'warmup') {
      await ensureInit();
      initSuggestEngine().catch(() => {});
      isWarm = true;
      const response: SpellCheckResponse = { id, type: 'warmup-complete' };
      self.postMessage(response);
      return;
    }

    if (type === 'check' && text !== undefined) {
      const errors = await performSpellCheck(text);
      const response: SpellCheckResponse = { id, type: 'result', errors };
      self.postMessage(response);
      return;
    }
  } catch (error) {
    const response: SpellCheckResponse = {
      id,
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    self.postMessage(response);
  }
};

export {};
