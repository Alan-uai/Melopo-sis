export interface MetaplasmResult {
  mergedWords: string[];
  originalSyllables: number;
  poeticSyllables: number;
  metaplasms: Metaplasm[];
}

interface Metaplasm {
  type: 'elisao' | 'sinerese' | 'crase' | 'hiato';
  position: number;
  description: string;
}

const VOWEL_END = /[aeiouáàâãéèêíïóôõöúü]$/i;
const VOWEL_START = /^[aeiouáàâãéèêíïóôõöúüh]/i;
const STRONG_VOWEL = /[aáàâãeéèêoóòôõ]/i;
const WEAK_VOWEL = /[iíïuúü]/i;
const TONIC_VOWEL = /[áàâãéèêíïóôõöúü]/i;

export function applyMetaplasms(words: string[]): MetaplasmResult {
  const metaplasms: Metaplasm[] = [];
  const originalSyllables = words.reduce((s, w) => s + countSimpleVowels(w), 0);
  const merged: string[] = [];
  let i = 0;

  while (i < words.length) {
    if (i < words.length - 1) {
      const curr = words[i].toLowerCase();
      const next = words[i + 1].toLowerCase();

      if (VOWEL_END.test(curr) && VOWEL_START.test(next)) {
        if (curr.endsWith('a') && next.startsWith('a')) {
          merged.push(curr + next);
          metaplasms.push({ type: 'crase', position: i, description: `${words[i]} + ${words[i+1]} → crase` });
          i += 2;
          continue;
        }

        if (TONIC_VOWEL.test(curr.slice(-1)) || TONIC_VOWEL.test(next[0] === 'h' ? (next[1] || '') : next[0])) {
          merged.push(words[i]);
          if (i === words.length - 2) {
            merged.push(words[i + 1]);
          }
          i++;
          continue;
        }

        merged.push(curr + next);
        metaplasms.push({ type: 'elisao', position: i, description: `${words[i]} + ${words[i+1]} → elisão` });
        i += 2;
        continue;
      }
    }

    merged.push(words[i]);
    i++;
  }

  const poeticSyllables = merged.reduce((s, w) => s + countSimpleVowels(w), 0);

  detectSynaeresis(merged, metaplasms);

  return { mergedWords: merged, originalSyllables, poeticSyllables, metaplasms };
}

function countSimpleVowels(word: string): number {
  const groups = word.toLowerCase().match(/[aeiouáàâãéèêíïóôõöúü]+/gi);
  return groups ? groups.length : 0;
}

function detectSynaeresis(words: string[], metaplasms: Metaplasm[]): void {
  for (let i = 0; i < words.length; i++) {
    const word = words[i].toLowerCase();
    const vowelGroups = word.match(/[aeiouáàâãéèêíïóôõöúü]+/gi);
    if (!vowelGroups || vowelGroups.length < 2) continue;

    for (let j = 0; j < vowelGroups.length - 1; j++) {
      const a = vowelGroups[j].toLowerCase();
      const b = vowelGroups[j + 1].toLowerCase();

      if (WEAK_VOWEL.test(a) && STRONG_VOWEL.test(b) && !TONIC_VOWEL.test(a)) {
        metaplasms.push({ type: 'sinerese', position: i, description: `sinérese em "${words[i]}" (${a}+${b})` });
      } else if (STRONG_VOWEL.test(a) && WEAK_VOWEL.test(b) && !TONIC_VOWEL.test(b)) {
        metaplasms.push({ type: 'sinerese', position: i, description: `sinérese em "${words[i]}" (${a}+${b})` });
      }
    }
  }
}

import { countPoeticSyllables as countProsody } from '@/lib/prosody/metaplasm-engine';

export function countPoeticSyllablesLine(line: string): number {
  return countProsody(line);
}
