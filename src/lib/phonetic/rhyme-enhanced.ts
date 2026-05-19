import { rhymeLikeness, assonanceDegree, consonanceDegree, phoneticSimilarity } from './phonetic-distance';

export interface EnhancedRhymeMatch {
  lineA: number;
  lineB: number;
  type: 'perfeita' | 'consoante' | 'assonante' | 'slant' | 'interna';
  rhymeGroup: string;
  score: number;
  wordA: string;
  wordB: string;
  phoneticEndingA: string;
  phoneticEndingB: string;
}

export interface InternalRhymeMatch {
  line: number;
  wordA: string;
  wordB: string;
  type: 'perfeita' | 'assonante' | 'consoante';
  score: number;
}

export interface RhymeQuality {
  richness: 'pobre' | 'comum' | 'rica' | 'preciosa';
  cliche: boolean;
  phoneticDistance: number;
  syllableMatch: boolean;
}

const CLICHE_RHYME_PAIRS = new Set([
  'amor,dor', 'dor,amor', 'coração,ilusão', 'ilusão,coração',
  'paixão,coração', 'coração,paixão', 'flor,amor', 'amor,flor',
  'pranto,canto', 'canto,pranto', 'mar,cantar', 'cantar,mar',
  'sozinho,caminho', 'caminho,sozinho', 'mundo,profundo', 'profundo,mundo',
  'céu,véu', 'véu,céu', 'sol,farol', 'farol,sol',
  'ventura,ternura', 'ternura,ventura', 'vida,ferida', 'ferida,vida',
]);

export function extractLastWord(line: string): string {
  const clean = line.replace(/[^\wáàâãéèêíïóôõöúçñü\s-]/gi, '').trim();
  const words = clean.split(/[\s-]+/);
  return words[words.length - 1] || '';
}

export function getEnhancedRhymeEnding(word: string): string {
  const lower = word.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const tonicMatch = lower.match(/([aeiou][^aeiou]*)$/);
  if (tonicMatch) return tonicMatch[1];
  return lower.slice(-3);
}

export function classifyRhyme(lineA: string, lineB: string): EnhancedRhymeMatch | null {
  const wordA = extractLastWord(lineA);
  const wordB = extractLastWord(lineB);
  if (!wordA || !wordB) return null;

  const endingA = getEnhancedRhymeEnding(wordA);
  const endingB = getEnhancedRhymeEnding(wordB);

  if (endingA === endingB) {
    return {
      lineA: 0, lineB: 0, type: 'perfeita', rhymeGroup: endingA,
      score: 1.0, wordA, wordB, phoneticEndingA: endingA, phoneticEndingB: endingB,
    };
  }

  const assonance = assonanceDegree(wordA, wordB);
  const consonance = consonanceDegree(wordA, wordB);
  const overall = rhymeLikeness(wordA, wordB);

  if (assonance >= 0.7 && consonance >= 0.7) {
    return {
      lineA: 0, lineB: 0, type: 'consoante', rhymeGroup: endingA.slice(0, 2),
      score: overall, wordA, wordB, phoneticEndingA: endingA, phoneticEndingB: endingB,
    };
  }

  if (assonance >= 0.7) {
    return {
      lineA: 0, lineB: 0, type: 'assonante', rhymeGroup: wordA.match(/[aeiou]/gi)?.slice(-2).join('') || '',
      score: assonance, wordA, wordB, phoneticEndingA: endingA, phoneticEndingB: endingB,
    };
  }

  if (overall >= 0.5) {
    return {
      lineA: 0, lineB: 0, type: 'slant', rhymeGroup: endingA.slice(0, 1),
      score: overall, wordA, wordB, phoneticEndingA: endingA, phoneticEndingB: endingB,
    };
  }

  return null;
}

export function detectInternalRhyme(line: string, lineNumber: number): InternalRhymeMatch[] {
  const words = line.toLowerCase()
    .replace(/[^\wáàâãéèêíïóôõöúçñü\s]/gi, '')
    .trim()
    .split(/\s+/);

  const matches: InternalRhymeMatch[] = [];

  for (let i = 0; i < words.length - 1; i++) {
    for (let j = i + 1; j < words.length; j++) {
      if (words[i].length < 3 || words[j].length < 3) continue;
      const endingI = getEnhancedRhymeEnding(words[i]);
      const endingJ = getEnhancedRhymeEnding(words[j]);

      if (endingI === endingJ && endingI.length >= 2) {
        matches.push({
          line: lineNumber + 1,
          wordA: words[i],
          wordB: words[j],
          type: 'perfeita',
          score: 1.0,
        });
      } else {
        const assonance = assonanceDegree(words[i], words[j]);
        if (assonance >= 0.7) {
          matches.push({
            line: lineNumber + 1,
            wordA: words[i],
            wordB: words[j],
            type: 'assonante',
            score: assonance,
          });
        }
      }
    }
  }

  return matches;
}

export function analyzeRhymeQuality(wordA: string, wordB: string): RhymeQuality {
  const totalSyllablesA = (wordA.match(/[aeiouáàâãéèêíïóôõöúü]+/gi) || []).length;
  const totalSyllablesB = (wordB.match(/[aeiouáàâãéèêíïóôõöúü]+/gi) || []).length;

  const phonDist = phoneticSimilarity(wordA, wordB);

  let richness: RhymeQuality['richness'];
  if (totalSyllablesA >= 3 && totalSyllablesB >= 3) {
    const postTonicA = wordA.slice(wordA.search(/[aeiouáàâãéèêíïóôõöúü][^aeiou]*$/));
    const postTonicB = wordB.slice(wordB.search(/[aeiouáàâãéèêíïóôõöúü][^aeiou]*$/));
    if (postTonicA.length >= 4 && postTonicB.length >= 4) richness = 'preciosa';
    else richness = 'rica';
  } else if (totalSyllablesA >= 2 && totalSyllablesB >= 2) {
    richness = 'comum';
  } else {
    richness = 'pobre';
  }

  const pair = `${wordA.toLowerCase()},${wordB.toLowerCase()}`;
  const reversePair = `${wordB.toLowerCase()},${wordA.toLowerCase()}`;
  const cliche = CLICHE_RHYME_PAIRS.has(pair) || CLICHE_RHYME_PAIRS.has(reversePair);

  const syllableMatch = totalSyllablesA === totalSyllablesB;

  return { richness, cliche, phoneticDistance: 1 - phonDist, syllableMatch };
}

export function detectRhymeSchemeEnhanced(text: string): {
  perfectMatches: EnhancedRhymeMatch[];
  imperfectMatches: EnhancedRhymeMatch[];
  internalRhymes: InternalRhymeMatch[];
  qualities: Map<string, RhymeQuality>;
} {
  const lines = text.split('\n').filter(l => l.trim());
  const perfectMatches: EnhancedRhymeMatch[] = [];
  const imperfectMatches: EnhancedRhymeMatch[] = [];
  const internalRhymes: InternalRhymeMatch[] = [];
  const qualities = new Map<string, RhymeQuality>();

  for (let i = 0; i < lines.length; i++) {
    const internal = detectInternalRhyme(lines[i], i);
    internalRhymes.push(...internal);

    for (let j = i + 1; j < lines.length; j++) {
      const match = classifyRhyme(lines[i], lines[j]);
      if (!match) continue;

      const quality = analyzeRhymeQuality(match.wordA, match.wordB);
      const key = `${match.wordA}-${match.wordB}`;
      qualities.set(key, quality);

      const annotated: EnhancedRhymeMatch = {
        ...match,
        lineA: i + 1,
        lineB: j + 1,
      };

      if (match.type === 'perfeita') {
        perfectMatches.push(annotated);
      } else {
        imperfectMatches.push(annotated);
      }
    }
  }

  return { perfectMatches, imperfectMatches, internalRhymes, qualities };
}
