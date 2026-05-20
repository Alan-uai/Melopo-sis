import fs from 'fs';
import path from 'path';
import { getSymSpellSuggestions } from './symspell-engine';

const WORDS_FILE = path.join(process.cwd(), 'src', 'lib', 'words-pt-list.txt');

const COMMON_MISSING: string[] = ['é'];

let wordSet: Set<string> | null = null;
let wordArray: string[] | null = null;
let initPromise: Promise<void> | null = null;

async function ensureInit(): Promise<void> {
  if (wordSet) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const content = fs.readFileSync(WORDS_FILE, 'latin1');
      wordArray = content.split('\n').filter(Boolean);
      wordSet = new Set(wordArray);
      for (const w of COMMON_MISSING) wordSet.add(w);
      wordArray.push(...COMMON_MISSING);
    } catch {
      wordArray = [...COMMON_MISSING];
      wordSet = new Set(COMMON_MISSING);
    }
  })();

  return initPromise;
}

export async function isWordCorrect(word: string): Promise<boolean> {
  await ensureInit();
  if (word.includes(' ')) {
    const parts = word.split(/\s+/);
    const results = await Promise.all(parts.map(w => isWordCorrect(w)));
    return results.every(r => r);
  }
  if (wordSet!.has(word)) return true;
  if (/^[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][a-záàâãéèêíïóôõöúçñ]+$/.test(word)) {
    return true;
  }
  const { isWordCorrectHunspell } = await import('./spelling/espells-engine');
  return isWordCorrectHunspell(word).catch(() => false);
}

export async function getWordSuggestions(
  word: string,
  leftContext?: string[],
  rightContext?: string[]
): Promise<string[]> {
  await ensureInit();
  const lower = word.toLowerCase();
  const symSpellResults = await getSymSpellSuggestions(lower);
  if (symSpellResults.length >= 3) return symSpellResults.slice(0, 5);
  const { getHunspellSuggestions } = await import('./spelling/espells-engine');
  const hunspellSuggestions = await getHunspellSuggestions(lower).catch(() => [] as string[]);
  return [...new Set([...symSpellResults, ...hunspellSuggestions])].slice(0, 5);
}

export async function getAllWords(): Promise<string[]> {
  await ensureInit();
  return wordArray ?? [];
}
