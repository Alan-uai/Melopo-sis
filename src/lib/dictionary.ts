import fs from 'fs';
import path from 'path';
import { getSymSpellSuggestions } from './symspell-engine';
import { isWordCorrectHunspell, getHunspellSuggestions } from './spelling/espells-engine';

const WORDS_FILE = path.join(process.cwd(), 'src', 'lib', 'words-pt-list.txt');

let wordSet: Set<string> | null = null;
let wordArray: string[] | null = null;
let initPromise: Promise<void> | null = null;

async function ensureInit(): Promise<void> {
  if (wordSet) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const content = fs.readFileSync(WORDS_FILE, 'latin1');
    wordArray = content.split('\n').filter(Boolean);
    wordSet = new Set(wordArray);
  })();

  return initPromise;
}

export async function isWordCorrect(word: string): Promise<boolean> {
  await ensureInit();
  if (word.includes(' ')) {
    return word.split(/\s+/).every(w => isWordCorrect(w));
  }
  if (wordSet!.has(word)) return true;
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
  return wordArray!;
}
