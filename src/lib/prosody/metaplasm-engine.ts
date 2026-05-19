export interface MetaplasmOptions {
  sinalefa: boolean;
  elisao: boolean;
  syneresis: boolean;
  diaeresis: boolean;
  countToLastTonic: boolean;
}

const DEFAULT_OPTIONS: MetaplasmOptions = {
  sinalefa: true,
  elisao: true,
  syneresis: true,
  diaeresis: false,
  countToLastTonic: false,
};

const VOWELS = /[aeiouáàâãéèêíïóôõöú]/i;
const STRONG_VOWELS = /[aáàâãeéèêoóôõ]/i;
const WEAK_VOWELS = /[iíuú]/i;
const ACCENTED = /[áàâãéèêíïóôõöú]/;

function isVowel(ch: string): boolean {
  return VOWELS.test(ch);
}

function splitVowelGroups(word: string): string[] {
  const raw = word.toLowerCase().match(/[aeiouáàâãéèêíïóôõöú]+/gi);
  if (!raw) return [];

  const groups: string[] = [];
  for (const g of raw) {
    if (g.length === 1) {
      groups.push(g);
      continue;
    }

    let current = g[0]!;
    for (let i = 1; i < g.length; i++) {
      const prev = current.slice(-1);
      const ch = g[i]!;

      const pStrong = /[aeoáàâãéèêóòôõ]/.test(prev);
      const pWeak = /[iíuú]/.test(prev);
      const cStrong = /[aeoáàâãéèêóòôõ]/.test(ch);
      const cWeak = /[iíuú]/.test(ch);

      if (pStrong && cStrong) {
        groups.push(current);
        current = ch;
      } else if (pWeak && cStrong) {
        groups.push(current);
        current = ch;
      } else {
        current += ch;
      }
    }
    groups.push(current);
  }

  return groups;
}

function vowelGroups(word: string): number {
  return splitVowelGroups(word).length;
}

function lastVowelGroup(word: string): string {
  const match = word.toLowerCase().match(/[aeiouáàâãéèêíïóôõöú]+$/);
  return match ? match[0] : '';
}

function firstVowelGroup(word: string): string {
  const match = word.toLowerCase().match(/^h?[aeiouáàâãéèêíïóôõöú]/);
  return match ? match[0].replace(/^h/, '') : '';
}

function isUnstressed(group: string): boolean {
  return !ACCENTED.test(group) && group.length <= 1;
}

function canSyneresis(word: string): boolean {
  const hiatoMatch = word.match(/([aeo][iíuú])/i);
  if (hiatoMatch) {
    const preHiato = word.slice(0, hiatoMatch.index! + hiatoMatch[1]!.length);
    const groups = preHiato.match(/[aeiouáàâãéèêíïóôõöú]+/gi);
    return groups !== null && groups.length >= 2;
  }
  return false;
}

function applySyneresis(word: string): string {
  return word.replace(/([aeo])([iíuú])/gi, '$1$2');
}

function applyDiaeresis(word: string): string {
  return word.replace(/([aeo])([iíuú])/gi, '$1-$2');
}

function isHiaticPair(a: string, b: string): boolean {
  if (!a || !b) return false;
  const lastA = a.slice(-1).toLowerCase();
  const firstB = b[0].toLowerCase();
  if (!isVowel(lastA) || !isVowel(firstB)) return false;

  const bothStrong = STRONG_VOWELS.test(lastA) && STRONG_VOWELS.test(firstB);
  if (bothStrong) return false;
  return true;
}

export function countPoeticSyllables(line: string, options?: Partial<MetaplasmOptions>): number {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const cleaned = line.toLowerCase().replace(/[^a-záàâãéèêíïóôõöúçñü\s'-]/g, '').trim();
  if (!cleaned) return 0;

  let words = cleaned.split(/\s+/);

  if (opts.diaeresis) {
    words = words.map(w => applyDiaeresis(w));
  }
  if (opts.syneresis && !opts.diaeresis) {
    words = words.map(w => canSyneresis(w) ? applySyneresis(w) : w);
  }

  const merged: string[] = [];
  let i = 0;
  while (i < words.length) {
    const current = words[i];
    if (i < words.length - 1) {
      const next = words[i + 1];
      const lv = lastVowelGroup(current);
      const fv = firstVowelGroup(next);
      const lastCh = current.slice(-1).toLowerCase();
      const firstCh = next[0]?.toLowerCase() || '';

      if (opts.sinalefa && lv && fv && isVowel(lastCh) && (isVowel(firstCh) || (firstCh === 'h' && next.length > 1))) {
        if (!isHiaticPair(lv, fv)) {
          merged.push(current + next);
          i += 2;
          continue;
        }
      }

      if (opts.elisao && lv && fv && isUnstressed(lv) && isVowel(firstCh)) {
        merged.push(current.replace(/[aeiouáàâãéèêíïóôõöú]+$/, '') + next);
        i += 2;
        continue;
      }
    }
    merged.push(current);
    i++;
  }

  let count = merged.reduce((sum, word) => sum + vowelGroups(word), 0);

  if (opts.countToLastTonic && count > 0) {
    const lastWord = words[words.length - 1] || '';
    const lastGroups = lastWord.match(/[aeiouáàâãéèêíïóôõöúç]+/gi);
    const lastGroup = lastGroups?.[lastGroups.length - 1] || '';
    const isParoxytone = !ACCENTED.test(lastGroup);
    if (isParoxytone) {
      count--;
    }
  }

  return count;
}

export interface MeterResult {
  syllables: number;
  type: string;
  accentPattern: string;
  hasCesura: boolean;
  cesuraPosition: number;
}

const METER_NAMES: Record<number, string> = {
  5: 'redondilha menor',
  6: 'verso de seis sílabas (hexassílabo)',
  7: 'redondilha maior',
  8: 'verso de oito sílabas (octossílabo)',
  10: 'decassílabo',
  12: 'alexandrino',
};

export function detectMeter(line: string): MeterResult {
  const syllables = countPoeticSyllables(line);
  const type = METER_NAMES[syllables] || `verso de ${syllables} sílabas`;

  let hasCesura = false;
  let cesuraPosition = 0;

  if (syllables === 12) {
    const firstHalf = countPoeticSyllables(line.slice(0, Math.floor(line.length / 2)));
    if (firstHalf === 6) {
      hasCesura = true;
      cesuraPosition = 6;
    }
  }

  if (syllables === 10) {
    const accentPositions = findAccentPositions(line);
    const pattern = classifyDecassilabo(accentPositions);
    return { syllables, type, accentPattern: pattern, hasCesura, cesuraPosition: 0 };
  }

  return { syllables, type, accentPattern: 'livre', hasCesura, cesuraPosition };
}

function findAccentPositions(line: string): number[] {
  const cleaned = line.toLowerCase().replace(/[^a-záàâãéèêíïóôõöúçñü\s]/g, '').trim();
  const words = cleaned.split(/\s+/);
  const positions: number[] = [];
  let pos = 1;

  for (const word of words) {
    const groups = word.match(/[aeiouáàâãéèêíïóôõöúç]+/gi);
    if (!groups) continue;

    for (let g = 0; g < groups.length; g++) {
      if (ACCENTED.test(groups[g]!)) {
        positions.push(pos + g);
      }
    }

    pos += groups.length;
    const lastVowel = word.match(/[aeiouáàâãéèêíïóôõöú]+$/);
    const nextIdx = words.indexOf(word) + 1;
    if (nextIdx < words.length) {
      const nextWord = words[nextIdx]!;
      const firstVowel = nextWord.match(/^h?[aeiouáàâãéèêíïóôõöú]/);
      if (lastVowel && firstVowel) {
        pos--;
      }
    }
  }

  return positions;
}

function classifyDecassilabo(accents: number[]): string {
  const has6 = accents.includes(6);
  const has4 = accents.includes(4);
  const has8 = accents.includes(8);

  if (has6) return 'heróico (6ª+10ª)';
  if (has4 && has8) return 'sáfico (4ª+8ª+10ª)';
  if (has4) return '4ª+10ª';
  return 'irregular';
}


