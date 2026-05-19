import { syllabifyWord } from './syllabifier';

const INITIAL_CONSONANTS = /^[bcçdfghjklmnpqrstvwxyz]/i;

const ONOMATOPOEIA = new Set([
  'tique-taque', 'tic-tac', 'plim', 'ploft', 'cocorico',
  'mec-mec', 'pum', 'bum', 'cataplum', 'zás',
  'zas', 'tchibum', 'tchau', 'nhac', 'croc',
  'tic', 'toc', 'ding-dong', 'ding', 'dong',
  'bombom', 'chip', 'clique', 'click',
  'mu', 'mé', 'me', 'bé', 'be',
  'au', 'au-au', 'miau', 'miar',
  'zum-zum', 'zum', 'zunzum',
  'tic-tac', 'tique-taque',
  'plim-plim', 'ploc', 'ploc-ploc',
  'cri-cri', 'cricri',
  'blá-blá', 'blabla', 'bla-bla',
  'atchim', 'atchim',
  'bu', 'buuu',
  'ha', 'há', 'ha-ha', 'haha',
  'ó', 'óó',
]);

export interface SoundDeviceMatch {
  type: 'aliteracao' | 'assonancia' | 'consonancia' | 'onomatopeia' | 'homeoteleuto';
  line: number;
  phoneme: string;
  evidence: string;
  positions: number[];
  confidence: number;
}

export function detectAlliteration(line: string, lineIndex: number): SoundDeviceMatch | null {
  const words = line.toLowerCase().replace(/[^a-záàâãéèêíïóôõöúüçñ\s]/g, '').trim().split(/\s+/);
  if (words.length < 3) return null;

  const initialPhonemes: { phoneme: string; position: number }[] = [];
  for (const word of words) {
    const m = word.match(INITIAL_CONSONANTS);
    if (m) {
      initialPhonemes.push({ phoneme: m[1], position: initialPhonemes.length });
    }
  }

  const freq: Record<string, number[]> = {};
  for (const { phoneme, position } of initialPhonemes) {
    if (!freq[phoneme]) freq[phoneme] = [];
    freq[phoneme].push(position);
  }

  let bestPhoneme = '';
  let bestCount = 0;
  for (const [ph, positions] of Object.entries(freq)) {
    if (positions.length > bestCount) {
      bestCount = positions.length;
      bestPhoneme = ph;
    }
  }

  if (bestCount >= 3) {
    const ratio = bestCount / words.length;
    const confidence = Math.min(0.5 + ratio * 0.4, 0.95);
    return {
      type: 'aliteracao',
      line: lineIndex + 1,
      phoneme: bestPhoneme,
      evidence: `repetição da consoante "${bestPhoneme}" em ${bestCount}/${words.length} palavras`,
      positions: freq[bestPhoneme],
      confidence,
    };
  }

  if (bestCount >= 2 && words.length <= 5) {
    return {
      type: 'aliteracao',
      line: lineIndex + 1,
      phoneme: bestPhoneme,
      evidence: `repetição da consoante "${bestPhoneme}" em ${bestCount} palavras`,
      positions: freq[bestPhoneme],
      confidence: 0.5,
    };
  }

  return null;
}

export function detectAssonance(line: string, lineIndex: number): SoundDeviceMatch | null {
  const words = line.toLowerCase().replace(/[^a-záàâãéèêíïóôõöúüçñ\s]/g, '').trim().split(/\s+/);
  if (words.length < 3) return null;

  const stressedVowels: { vowel: string; position: number }[] = [];
  for (const word of words) {
    const info = syllabifyWord(word);
    if (info.stressPosition >= 0 && info.stressPosition < info.syllables.length) {
      const syl = info.syllables[info.stressPosition];
      const vowel = syl.match(/[aeiouáàâãéèêíïóôõöúü]/i);
      if (vowel) {
        stressedVowels.push({ vowel: vowel[0], position: stressedVowels.length });
      }
    }
  }

  const freq: Record<string, number[]> = {};
  for (const { vowel, position } of stressedVowels) {
    const base = vowel.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (!freq[base]) freq[base] = [];
    freq[base].push(position);
  }

  let bestVowel = '';
  let bestCount = 0;
  for (const [v, positions] of Object.entries(freq)) {
    if (positions.length > bestCount) {
      bestCount = positions.length;
      bestVowel = v;
    }
  }

  if (bestCount >= 3) {
    const ratio = bestCount / words.length;
    const confidence = Math.min(0.4 + ratio * 0.5, 0.9);
    return {
      type: 'assonancia',
      line: lineIndex + 1,
      phoneme: bestVowel,
      evidence: `repetição da vogal tônica "${bestVowel}" em ${bestCount}/${words.length} palavras`,
      positions: freq[bestVowel],
      confidence,
    };
  }

  return null;
}

export function detectConsonance(line: string, lineIndex: number): SoundDeviceMatch | null {
  const words = line.toLowerCase().replace(/[^a-záàâãéèêíïóôõöúüçñ\s]/g, '').trim().split(/\s+/);
  if (words.length < 3) return null;

  const endingConsonants: { cons: string; position: number }[] = [];
  for (const word of words) {
    const noVowels = word.replace(/[aeiouáàâãéèêíïóôõöúü]/gi, '');
    if (noVowels) {
      endingConsonants.push({ cons: noVowels.slice(-2), position: endingConsonants.length });
    }
  }

  const freq: Record<string, number[]> = {};
  for (const { cons, position } of endingConsonants) {
    if (!freq[cons]) freq[cons] = [];
    freq[cons].push(position);
  }

  let bestCons = '';
  let bestCount = 0;
  for (const [c, positions] of Object.entries(freq)) {
    if (positions.length > bestCount) {
      bestCount = positions.length;
      bestCons = c;
    }
  }

  if (bestCount >= 3) {
    const confidence = Math.min(0.3 + (bestCount / words.length) * 0.5, 0.85);
    return {
      type: 'consonancia',
      line: lineIndex + 1,
      phoneme: bestCons,
      evidence: `repetição da consoante final "${bestCons}" em ${bestCount}/${words.length} palavras`,
      positions: freq[bestCons],
      confidence,
    };
  }

  return null;
}

export function detectOnomatopoeia(line: string, lineIndex: number): SoundDeviceMatch | null {
  const words = line.toLowerCase().split(/\s+/);
  const found = words.filter(w => ONOMATOPOEIA.has(w));
  if (found.length > 0) {
    return {
      type: 'onomatopeia',
      line: lineIndex + 1,
      phoneme: found[0],
      evidence: `"${found.join(', ')}" ${found.length > 1 ? '(repetida)' : ''}`,
      positions: words.map((w, i) => (ONOMATOPOEIA.has(w) ? i : -1)).filter(i => i >= 0),
      confidence: 0.9,
    };
  }
  return null;
}

export function detectHomeoteleuto(line: string, lineIndex: number): SoundDeviceMatch | null {
  const words = line.toLowerCase().replace(/[^a-záàâãéèêíïóôõöúüçñ\s]/g, '').trim().split(/\s+/);
  if (words.length < 3) return null;

  const endings: { ending: string; position: number }[] = [];
  for (const word of words) {
    if (word.length > 2) {
      endings.push({ ending: word.slice(-3), position: endings.length });
    }
  }

  const freq: Record<string, number[]> = {};
  for (const { ending, position } of endings) {
    if (!freq[ending]) freq[ending] = [];
    freq[ending].push(position);
  }

  let bestEnding = '';
  let bestCount = 0;
  for (const [e, positions] of Object.entries(freq)) {
    if (positions.length > bestCount) {
      bestCount = positions.length;
      bestEnding = e;
    }
  }

  if (bestCount >= 3) {
    const confidence = Math.min(0.4 + (bestCount / words.length) * 0.4, 0.85);
    return {
      type: 'homeoteleuto',
      line: lineIndex + 1,
      phoneme: bestEnding,
      evidence: `terminações semelhantes em "${bestEnding}" (${bestCount} ocorrências)`,
      positions: freq[bestEnding],
      confidence,
    };
  }

  return null;
}

export interface LineDevices {
  alliteration: SoundDeviceMatch | null;
  assonance: SoundDeviceMatch | null;
  consonance: SoundDeviceMatch | null;
  onomatopoeia: SoundDeviceMatch | null;
  homeoteleuto: SoundDeviceMatch | null;
}

export function detectAllDevices(line: string, lineNumber: number): LineDevices {
  return {
    alliteration: detectAlliteration(line, lineNumber),
    assonance: detectAssonance(line, lineNumber),
    consonance: detectConsonance(line, lineNumber),
    onomatopoeia: detectOnomatopoeia(line, lineNumber),
    homeoteleuto: detectHomeoteleuto(line, lineNumber),
  };
}

export function detectDevicesInText(text: string): SoundDeviceMatch[] {
  const lines = text.split('\n').filter(l => l.trim());
  const devices: SoundDeviceMatch[] = [];
  for (let i = 0; i < lines.length; i++) {
    const result = detectAllDevices(lines[i], i);
    for (const d of Object.values(result)) {
      if (d) devices.push(d);
    }
  }
  return devices;
}
