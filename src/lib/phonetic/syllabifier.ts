const VOWELS = /[aeiouáàâãéèêíïóôõöúü]/i;
const STRESSED_VOWELS = /[áâãéêíóôõú]/i;
const NASAL_VOWELS = /[ãõâêô]/i;
const DIPHTHONG_ORAL = /[aeo][iu]/i;
const DIPHTHONG_NASAL = /[ãõ][iu]/i;
const DIPHTHONG_DECRESCENT = /[aeo][iuãõ]/i;
const TRIPHTHONG = /[aeo][iu][aeo]/i;

const CONS_CLUSTERS = new Set([
  'bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr',
  'pl', 'pr', 'tl', 'tr', 'vl', 'vr',
  'ch', 'lh', 'nh', 'gu', 'qu',
  'ps', 'pn', 'mn', 'pt', 'ft', 'gn', 'tm',
]);

const FINAL_NASAL = /[mnrlz]$/i;

export interface SyllableInfo {
  syllables: string[];
  stressPosition: number;
  vowelCount: number;
}

function normalizeWord(word: string): string {
  return word.toLowerCase().normalize('NFD');
}

function countVowelGroups(word: string): number {
  const groups = word.match(/[aeiouáàâãéèêíïóôõöúü]+/gi);
  return groups ? groups.length : 0;
}

function isDiphthong(a: string, b: string): boolean {
  const pair = (a + b).toLowerCase();
  if (/[aeoáéó][iuíú]/.test(pair)) return true;
  if (/[iuíú][aeoáéó]/.test(pair)) return true;
  if (/[ãõ][iu]/.test(pair)) return true;
  if (/[aeo][ĩũ]/.test(pair)) return true;
  return false;
}

function isTriphthong(a: string, b: string, c: string): boolean {
  return isDiphthong(a, b) && isDiphthong(b, c);
}

export function syllabifyWord(word: string): SyllableInfo {
  const normalized = normalizeWord(word).replace(/[^a-záàâãéèêíïóôõöúüç]+/g, '');
  if (!normalized) return { syllables: [], stressPosition: -1, vowelCount: 0 };

  const vowelGroups: string[] = [];
  let current = '';
  let i = 0;

  while (i < normalized.length) {
    const ch = normalized[i];

    if (/[aeiouáàâãéèêíïóôõöúü]/i.test(ch)) {
      current += ch;
      i++;
      while (i < normalized.length && /[aeiouáàâãéèêíïóôõöúü]/i.test(normalized[i])) {
        if (isDiphthong(ch, normalized[i]) || isDiphthong(current.slice(-1), normalized[i])) {
          const nextNext = normalized[i + 1];
          if (nextNext && /[aeiouáàâãéèêíïóôõöúü]/i.test(nextNext) && isTriphthong(ch, normalized[i], nextNext)) {
            current += normalized[i];
            current += nextNext;
            i += 2;
            continue;
          }
          current += normalized[i];
          i++;
        } else {
          vowelGroups.push(current);
          current = normalized[i];
          i++;
        }
      }
      vowelGroups.push(current);
      current = '';
    } else {
      current += ch;
      i++;
    }

    if (current && i < normalized.length && /[aeiouáàâãéèêíïóôõöúü]/i.test(normalized[i])) {
      const consCluster = current.toLowerCase();
      const nextVowel = normalized[i];

      if (current.length === 1 && consCluster === 's' && vowelGroups.length > 0) {
        continue;
      }

      if (current.length <= 2 && CONS_CLUSTERS.has(consCluster.replace(/[^a-z]/g, ''))) {
        continue;
      }

      if (vowelGroups.length > 0) {
        const lastVowelGroup = vowelGroups[vowelGroups.length - 1];
        const lastChar = lastVowelGroup.slice(-1);
        if ('aeoáéó'.includes(lastChar) && nextVowel.match(/[iuíú]/)) {
          vowelGroups[vowelGroups.length - 1] = lastVowelGroup + current.charAt(0);
          current = current.slice(1);
        }
      }
    }
  }

  if (current) {
    if (vowelGroups.length > 0) {
      vowelGroups[vowelGroups.length - 1] += current;
    } else {
      vowelGroups.push(current);
    }
  }

  if (vowelGroups.length === 0) {
    vowelGroups.push(normalized);
  }

  const stressPosition = findStressPosition(normalized, vowelGroups);
  const vowelCount = vowelGroups.length;

  return { syllables: vowelGroups, stressPosition, vowelCount };
}

function findStressPosition(word: string, vowelGroups: string[]): number {
  const acuteMatch = word.match(/[áâãéêíóôõú]/);
  if (acuteMatch) {
    const prefix = word.slice(0, acuteMatch.index);
    let groupIndex = 0;
    let pos = 0;
    for (const group of vowelGroups) {
      const end = pos + group.length;
      if (acuteMatch.index! < end) return groupIndex;
      groupIndex++;
      pos = end;
    }
    return vowelGroups.length - 1;
  }

  const circumflexMatch = word.match(/[âêô]/);
  if (circumflexMatch) {
    const prefix = word.slice(0, circumflexMatch.index);
    let groupIndex = 0;
    let pos = 0;
    for (const group of vowelGroups) {
      const end = pos + group.length;
      if (circumflexMatch.index! < end) return groupIndex;
      groupIndex++;
      pos = end;
    }
    return vowelGroups.length - 1;
  }

  if (FINAL_NASAL.test(word)) {
    return vowelGroups.length - 1;
  }

  if (word.endsWith('i') || word.endsWith('u') || word.endsWith('iu')) {
    return vowelGroups.length - 1;
  }

  return vowelGroups.length - 1;
}

export function syllabifyText(text: string): SyllableInfo[] {
  return text
    .split(/\s+/)
    .filter(w => w.trim())
    .map(w => syllabifyWord(w));
}

export function countSyllables(word: string): number {
  return syllabifyWord(word).vowelCount;
}
