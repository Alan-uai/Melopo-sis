import wordsPt from 'words-pt';
import { getSymSpellSuggestions } from './symspell-engine';
import { isWordCorrectHunspell, getHunspellSuggestions } from './spelling/espells-engine';

let initPromise: Promise<void> | null = null;

async function ensureInit(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = new Promise((resolve, reject) => {
    wordsPt.init({ removeNames: false }, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  return initPromise;
}

export async function isWordCorrect(word: string): Promise<boolean> {
  await ensureInit();
  if (word.includes(' ')) {
    return word.split(/\s+/).every(w => isWordCorrect(w));
  }
  if (wordsPt.isWord(word)) return true;
  if (/^[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][a-záàâãéèêíïóôõöúçñ]+$/.test(word)) {
    return true;
  }
  const hunspellOk = await isWordCorrectHunspell(word).catch(() => false);
  if (hunspellOk) return true;
  return false;
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
  const hunspellSuggestions = await getHunspellSuggestions(lower).catch(() => [] as string[]);
  return [...new Set([...symSpellResults, ...hunspellSuggestions])].slice(0, 5);
}

export async function getAllWords(): Promise<string[]> {
  await ensureInit();
  return wordsPt.getArray();
}
