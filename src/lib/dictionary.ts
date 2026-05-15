import fs from 'fs';
import path from 'path';
import nspell from 'nspell';

type NSpellInstance = ReturnType<typeof nspell>;

let spellInstance: NSpellInstance | null = null;
let spellPromise: Promise<NSpellInstance> | null = null;
let supplementSet: Set<string> | null = null;
let supplementPromise: Promise<Set<string>> | null = null;

function getDictPaths() {
  const base = path.join(
    process.cwd(),
    'node_modules',
    'dictionary-pt',
  );
  return {
    aff: path.join(base, 'index.aff'),
    dic: path.join(base, 'index.dic'),
  };
}

export async function getSpell(): Promise<NSpellInstance> {
  if (spellInstance) return spellInstance;
  if (spellPromise) return spellPromise;

  spellPromise = (async () => {
    const { aff: affPath, dic: dicPath } = getDictPaths();
    const aff = fs.readFileSync(affPath);
    const dic = fs.readFileSync(dicPath);
    spellInstance = nspell(aff, dic);
    return spellInstance;
  })();

  return spellPromise;
}

export async function getSupplement(): Promise<Set<string>> {
  if (supplementSet) return supplementSet;
  if (supplementPromise) return supplementPromise;

  supplementPromise = (async () => {
    const filePath = path.join(process.cwd(), 'src', 'lib', 'supplement-words.txt');
    const content = fs.readFileSync(filePath, 'utf8');
    const words = content.split('\n').filter(Boolean);
    supplementSet = new Set(words);
    return supplementSet;
  })();

  return supplementPromise;
}

export async function isWordCorrect(word: string): Promise<boolean> {
  const [spell, supplement] = await Promise.all([getSpell(), getSupplement()]);
  const lower = word.toLowerCase();
  if (spell.correct(word)) return true;
  if (supplement.has(lower)) return true;
  return false;
}

export async function getWordSuggestions(word: string): Promise<string[]> {
  const [spell, supplement] = await Promise.all([getSpell(), getSupplement()]);
  const suggestions = spell.suggest(word);
  if (suggestions.length > 0) return suggestions.slice(0, 5);

  const lower = word.toLowerCase();
  const knownWordsArray = Array.from(supplement) as string[];
  const shortList = knownWordsArray.filter(
    w => Math.abs(w.length - lower.length) <= 2 && w[0] === lower[0]
  );
  const scored = shortList
    .map(w => ({ word: w, dist: levenshteinDistance(lower, w) }))
    .filter((s): s is { word: string; dist: number } => s.dist <= 2)
    .sort((a, b) => a.dist - b.dist);

  return [...new Set(scored.map(s => s.word))].slice(0, 5);
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
  }
  return matrix[b.length][a.length];
}
