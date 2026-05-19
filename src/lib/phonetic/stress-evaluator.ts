import type { SyllableInfo } from './syllabifier';
import { syllabifyWord } from './syllabifier';

export interface WordStress {
  word: string;
  stressPosition: number;
  totalSyllables: number;
  stressType: 'oxitona' | 'paroxitona' | 'proparoxitona' | 'unknown';
  stressedVowel: string;
}

export interface LineStress {
  words: WordStress[];
  tonicSyllables: number[];
  ictusPositions: number[];
  dominantCadence: 'heroic' | 'sapphic' | 'mixed' | 'free';
}

export function evaluateWordStress(word: string): WordStress {
  const info = syllabifyWord(word);
  const totalSyllables = info.vowelCount;
  const stressPosition = info.stressPosition;

  let stressType: WordStress['stressType'] = 'unknown';
  if (totalSyllables >= 1) {
    if (stressPosition === totalSyllables - 1) stressType = 'oxitona';
    else if (stressPosition === totalSyllables - 2) stressType = 'paroxitona';
    else if (stressPosition <= totalSyllables - 3) stressType = 'proparoxitona';
  }

  let stressedVowel = '';
  if (stressPosition >= 0 && stressPosition < info.syllables.length) {
    const syl = info.syllables[stressPosition];
    const vowel = syl.match(/[aeiouáàâãéèêíïóôõöúü]/i);
    if (vowel) stressedVowel = vowel[0];
  }

  return { word, stressPosition, totalSyllables, stressType, stressedVowel };
}

export function evaluateLineStress(line: string): LineStress {
  const words = line.split(/\s+/).filter(w => w.trim());
  const wordStresses = words.map(w => evaluateWordStress(w));

  const tonicSyllables: number[] = [];
  let cumulativePos = 0;
  for (const ws of wordStresses) {
    if (ws.stressPosition >= 0) {
      const absolutePos = cumulativePos + ws.stressPosition;
      tonicSyllables.push(absolutePos);
    }
    cumulativePos += ws.totalSyllables;
  }

  const ictusPositions: number[] = [];
  const totalSyllables = wordStresses.reduce((s, w) => s + w.totalSyllables, 0);

  if (totalSyllables === 10) {
    const has6 = tonicSyllables.includes(5) || tonicSyllables.includes(6);
    const has10 = tonicSyllables.includes(9) || tonicSyllables.includes(10);
    const has4 = tonicSyllables.includes(3) || tonicSyllables.includes(4);
    const has8 = tonicSyllables.includes(7) || tonicSyllables.includes(8);

    let dominantCadence: LineStress['dominantCadence'];
    if (has6 && has10) dominantCadence = 'heroic';
    else if (has4 && has8) dominantCadence = 'sapphic';
    else if (has6 || has10) dominantCadence = 'heroic';
    else if (has4 || has8) dominantCadence = 'sapphic';
    else dominantCadence = 'free';

    if (has6) ictusPositions.push(6);
    if (has10) ictusPositions.push(10);
    if (has4) ictusPositions.push(4);
    if (has8) ictusPositions.push(8);

    return { words: wordStresses, tonicSyllables, ictusPositions, dominantCadence };
  }

  return { words: wordStresses, tonicSyllables, ictusPositions, dominantCadence: 'free' };
}

export function detectMetricalForm(lineStress: LineStress): string {
  const nSyllables = lineStress.words.reduce((s, w) => s + w.totalSyllables, 0);

  if (lineStress.dominantCadence === 'heroic' && nSyllables <= 10) return 'decassilabo_heroico';
  if (lineStress.dominantCadence === 'sapphic' && nSyllables <= 10) return 'decassilabo_safico';
  if (nSyllables <= 5) return 'redondilha_menor';
  if (nSyllables <= 7) return 'redondilha_maior';
  if (nSyllables <= 10) return 'decassilabo';
  if (nSyllables <= 12) {
    const hasCaesura6 = lineStress.tonicSyllables.includes(6);
    return hasCaesura6 ? 'alexandrino' : 'dodecassilabo';
  }
  return 'verso_livre';
}
