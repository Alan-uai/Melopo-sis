import fs from 'fs';
import path from 'path';
import { StemmerPt } from '@nlpjs/lang-pt';
import { getSymSpellSuggestions } from './symspell-engine';
import { isWordCorrectHunspell, getHunspellSuggestions } from './spelling/espells-engine';
import { NgramLM } from './spelling/ngram-lm';

let ngramLM: NgramLM | null = null;

function getNgramLM(): NgramLM {
  if (!ngramLM) {
    ngramLM = new NgramLM();
  }
  return ngramLM;
}

export function seedNgramLM(texts: string[]): void {
  getNgramLM().train(texts);
}

export function resetNgramLM(): void {
  ngramLM = null;
}

const stemmer = new StemmerPt();

let knownWords: Set<string> | null = null;
let knownWordsPromise: Promise<Set<string>> | null = null;

export async function getWordSet(): Promise<Set<string>> {
  if (knownWords) return knownWords;
  if (knownWordsPromise) return knownWordsPromise;

  knownWordsPromise = (async () => {
    const filePath = path.join(process.cwd(), 'src', 'lib', 'supplement-words.txt');
    const content = fs.readFileSync(filePath, 'utf8');
    knownWords = new Set(content.split('\n').filter(Boolean));
    return knownWords;
  })();

  return knownWordsPromise;
}

const VERB_SUFFIXES = [
  'o', 'as', 'a', 'amos', 'ais', 'am',
  'ei', 'aste', 'ou', 'amos', 'astes', 'aram',
  'ava', 'avas', 'ava', 'ávamos', 'áveis', 'avam',
  'ei', 'aste', 'ou', 'amos', 'astes', 'aram',
  'erei', 'erás', 'erá', 'eremos', 'ereis', 'erão',
  'ia', 'ias', 'ia', 'íamos', 'íeis', 'iam',
  'iria', 'irias', 'iria', 'iríamos', 'iríeis', 'iriam',
  'isse', 'isses', 'isse', 'íssemos', 'ísseis', 'issem',
  'indo', 'ido', 'indo', 'ida', 'idas', 'idos',
  'ndo', 'mos',
];

const PLURAL_SUFFIXES = ['s', 'es', 'ões', 'ães', 'ais', 'eis', 'ois', 'ns'];
const ADVERB_SUFFIX = 'mente';
const AUGMENTATIVE_SUFFIXES = ['ão', 'ona', 'zão', 'zona', 'aço', 'aça'];
const DIMINUTIVE_SUFFIXES = [
  'inho', 'inha', 'inhos', 'inhas',
  'zinho', 'zinha', 'zinhos', 'zinhas',
];

const PREFIXES = ['des', 'in', 'i', 'im', 'ir', 'il', 're', 'pre', 'sub', 'anti', 'super'];

function tryStemmer(words: Set<string>, word: string): boolean {
  const stem = stemmer.stem(word);
  if (stem.length > 2 && words.has(stem)) return true;
  return false;
}

function tryPrefix(words: Set<string>, word: string): boolean {
  for (const prefix of PREFIXES) {
    if (word.startsWith(prefix) && word.length > prefix.length + 2) {
      const base = word.slice(prefix.length);
      if (words.has(base)) return true;
      if (stemmer.stem(base).length > 2 && words.has(stemmer.stem(base))) return true;
    }
  }
  if (word.startsWith('in') && word.length > 5) {
    const base = word.slice(2);
    if (words.has(base)) return true;
  }
  return false;
}

function tryEnclitic(words: Set<string>, word: string): boolean {
  const enclitics = [
    { suffix: 'lo', pattern: /[aeê]r$/ },
    { suffix: 'la', pattern: /[aeê]r$/ },
    { suffix: 'lhe', pattern: /[aeê]r$/ },
    { suffix: 'los', pattern: /[aeê]r$/ },
    { suffix: 'las', pattern: /[aeê]r$/ },
    { suffix: 'lhes', pattern: /[aeê]r$/ },
    { suffix: 'no', pattern: /[mãõ]$/ },
    { suffix: 'na', pattern: /[mãõ]$/ },
    { suffix: 'nos', pattern: /[mãõ]$/ },
    { suffix: 'nas', pattern: /[mãõ]$/ },
  ];

  for (const { suffix, pattern } of enclitics) {
    if (word.endsWith(suffix) && word.length > suffix.length + 2) {
      const base = word.slice(0, -suffix.length);
      if (pattern.test(base)) {
        const restored = base.replace(/[aeê]r$/, 'r');
        if (words.has(restored)) return true;
        if (words.has(base)) return true;
      }
      if (words.has(base)) return true;
    }
  }

  const mesocliticMatch = word.match(/^(.+?)([áéó])(lo|la|los|las|no|na|nos|nas|lhe|lhes)$/);
  if (mesocliticMatch) {
    const base = mesocliticMatch[1] + 'r';
    if (words.has(base)) return true;
  }

  return false;
}

function tryCompound(words: Set<string>, word: string): boolean {
  if (!word.includes('-')) return false;
  const parts = word.split('-');
  if (parts.length === 2 && parts.every(p => p.length > 1)) {
    if (words.has(parts[0]) && words.has(parts[1])) return true;
  }
  return false;
}

function tryIrregularSuperlative(words: Set<string>, word: string): boolean {
  const irregular: Record<string, string> = {
    'facílimo': 'fácil', 'facílima': 'fácil',
    'paupérrimo': 'pobre', 'paupérrima': 'pobre',
    'pulquérrimo': 'pulcro', 'pulquérrima': 'pulcra',
    'célebre': 'célebre', 'celebérrimo': 'célebre', 'celebérrima': 'célebre',
    'integérrimo': 'íntegro', 'integérrima': 'íntegra',
    'misericordiosíssimo': 'misericordioso',
    'nobilíssimo': 'nobre', 'nobilíssima': 'nobre',
    'sapientíssimo': 'sábio', 'sapientíssima': 'sábia',
    'libérrimo': 'livre', 'libérrima': 'livre',
    'acérrimo': 'acre', 'acérrima': 'acre',
  };

  const lower = word.toLowerCase();
  if (irregular[lower]) {
    if (words.has(irregular[lower])) return true;
    const stem = stemmer.stem(irregular[lower]);
    if (stem.length > 2 && words.has(stem)) return true;
  }
  return false;
}

function stripSuffix(word: string, suffix: string): string | null {
  if (word.length <= suffix.length + 1) return null;
  if (word.endsWith(suffix)) return word.slice(0, -suffix.length);
  return null;
}

function tryVerbConjugation(words: Set<string>, word: string): boolean {
  if (word.length < 3) return false;
  for (const suffix of VERB_SUFFIXES) {
    const base = stripSuffix(word, suffix);
    if (base && words.has(base)) return true;
  }
  for (const baseEnding of ['ar', 'er', 'ir']) {
    if (word.endsWith(baseEnding)) {
      const root = word.slice(0, -2);
      if (root.length > 1 && words.has(root + 'ar')) return true;
      if (root.length > 1 && words.has(root + 'er')) return true;
      if (root.length > 1 && words.has(root + 'ir')) return true;
    }
  }
  return false;
}

function tryPlural(words: Set<string>, word: string): boolean {
  for (const suffix of PLURAL_SUFFIXES) {
    const base = stripSuffix(word, suffix);
    if (base && words.has(base)) return true;
  }
  if (word.endsWith('s')) {
    const singular = word.slice(0, -1);
    if (singular.length > 1 && words.has(singular)) return true;
  }
  return false;
}

function tryAdverb(words: Set<string>, word: string): boolean {
  const base = stripSuffix(word, ADVERB_SUFFIX);
  if (!base) return false;
  if (words.has(base)) return true;
  if (base.endsWith('a') && words.has(base.slice(0, -1) + 'o')) return true;
  return false;
}

function tryFeminine(words: Set<string>, word: string): boolean {
  if (word.endsWith('a')) {
    const masculine = word.slice(0, -1) + 'o';
    if (masculine.length > 1 && words.has(masculine)) return true;
    const masculine2 = word.slice(0, -1);
    if (masculine2.length > 1 && words.has(masculine2)) return true;
  }
  if (word.endsWith('ora')) {
    const base = word.slice(0, -3) + 'or';
    if (base.length > 1 && words.has(base)) return true;
  }
  if (word.endsWith('eira')) {
    const base = word.slice(0, -4) + 'eiro';
    if (base.length > 1 && words.has(base)) return true;
  }
  if (word.endsWith('triz')) {
    const base = word.slice(0, -4) + 'tor';
    if (base.length > 1 && words.has(base)) return true;
  }
  return false;
}

function tryDiminutiveAugmentative(words: Set<string>, word: string): boolean {
  for (const suffix of [...DIMINUTIVE_SUFFIXES, ...AUGMENTATIVE_SUFFIXES]) {
    const base = stripSuffix(word, suffix);
    if (base && words.has(base)) return true;
  }
  const eSuffixes = ['ezinho', 'ezinha', 'ezinhos', 'ezinhas'];
  for (const suffix of eSuffixes) {
    const base = stripSuffix(word, suffix);
    if (base && words.has(base)) return true;
  }
  return false;
}

function trySuperlative(words: Set<string>, word: string): boolean {
  if (word.endsWith('íssimo') || word.endsWith('íssima')) {
    const base = word.replace(/íssim[oa]$/, '');
    if (base.length > 1 && words.has(base + 'o')) return true;
    if (base.length > 1 && words.has(base)) return true;
  }
  return false;
}

function isWordKnown(words: Set<string>, word: string): boolean {
  const lower = word.toLowerCase();
  if (words.has(lower)) return true;
  if (tryStemmer(words, lower)) return true;
  if (tryVerbConjugation(words, lower)) return true;
  if (tryPlural(words, lower)) return true;
  if (tryAdverb(words, lower)) return true;
  if (tryFeminine(words, lower)) return true;
  if (tryDiminutiveAugmentative(words, lower)) return true;
  if (trySuperlative(words, lower)) return true;
  if (tryPrefix(words, lower)) return true;
  if (tryEnclitic(words, lower)) return true;
  if (tryCompound(words, lower)) return true;
  if (tryIrregularSuperlative(words, lower)) return true;
  if (lower.endsWith('mente')) {
    const base = lower.slice(0, -5);
    if (base.endsWith('a')) {
      const masc = base.slice(0, -1) + 'o';
      if (masc.length > 1 && words.has(masc)) return true;
    }
  }
  return false;
}

export async function isWordCorrect(word: string): Promise<boolean> {
  const words = await getWordSet();
  if (word.includes(' ')) {
    return word.split(/\s+/).every(w => isWordCorrect(w));
  }
  if (isWordKnown(words, word)) return true;
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
  const lower = word.toLowerCase();

  const symSpellResults = await getSymSpellSuggestions(lower);
  if (symSpellResults.length >= 3) return symSpellResults.slice(0, 5);

  const hunspellSuggestions = await getHunspellSuggestions(lower).catch(() => [] as string[]);

  const words = await getWordSet();
  const candidates: { word: string; dist: number }[] = [];

  const generated = generateAccentVariants(word);
  for (const alt of generated) {
    if (isWordKnown(words, alt)) {
      candidates.push({ word: alt, dist: levenshteinDistance(lower, alt.toLowerCase()) });
    }
  }

  const shortList = Array.from(words).filter(
    w => Math.abs(w.length - lower.length) <= 2 && w[0] === lower[0]
  );
  for (const known of shortList) {
    const dist = levenshteinDistance(lower, known);
    if (dist <= 2) {
      candidates.push({ word: known, dist });
    }
  }

  let ranked = [...new Set([...symSpellResults, ...hunspellSuggestions, ...candidates.map(c => c.word)])];

  if (leftContext || rightContext) {
    ranked = getNgramLM().rankSuggestions(ranked, leftContext ?? [], rightContext ?? []);
  }

  return ranked.slice(0, 5);
}

function generateAccentVariants(word: string): string[] {
  const variants: string[] = [];
  const accentReplacements: Record<string, string> = {
    'a': 'áàâã', 'e': 'éê', 'i': 'í', 'o': 'óôõ', 'u': 'ú',
    'c': 'ç',
    'á': 'a', 'à': 'a', 'â': 'a', 'ã': 'a',
    'é': 'e', 'ê': 'e', 'í': 'i', 'ó': 'o', 'ô': 'o', 'õ': 'o',
    'ú': 'u', 'ç': 'c',
  };
  const chars = word.split('');
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i].toLowerCase();
    const replacements = accentReplacements[ch];
    if (replacements) {
      for (const r of replacements) {
        const alt = [...chars];
        alt[i] = ch === chars[i] ? r : ch.toUpperCase() === chars[i] ? r.toUpperCase() : r;
        variants.push(alt.join(''));
      }
    }
  }
  if (/(.)\1/.test(word)) {
    variants.push(word.replace(/(.)\1+/g, '$1'));
    const deduped2 = word.replace(/(.)\1/g, '$1');
    if (deduped2 !== word.replace(/(.)\1+/g, '$1')) variants.push(deduped2);
  } else {
    for (let i = 0; i < word.length; i++) {
      variants.push(word.slice(0, i) + word[i] + word.slice(i));
    }
  }
  return variants;
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
