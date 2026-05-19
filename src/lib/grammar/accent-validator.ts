interface AccentError {
  word: string;
  position: number;
  expected: string;
  message: string;
}

const TONIC_MONOSYLLABLES = new Set([
  'pé', 'fé', 'só', 'má', 'pá', 'pó', 'mês', 'vêu', 'vôo',
  'pôs', 'dói', 'céu', 'réu', 'léu', 'véu',
]);

const OXYTONE_ENDINGS = /([aeos]|ens)$/i;
const PAROXYTONE_ENDINGS = /[lrnxpsiuszãão]$/i;

const DIACRITICS: Record<string, { correct: string; message: string }> = {
  'por': { correct: 'pôr', message: 'Acento diferencial: "pôr" (verbo) vs "por" (preposição)' },
  'pode': { correct: 'pôde', message: 'Acento diferencial: "pôde" (pretérito) vs "pode" (presente)' },
};

const PLURAL_DIACRITICS: Record<string, { correct: string; message: string }> = {
  'tem': { correct: 'têm', message: 'Acento diferencial plural: "têm" (eles) vs "tem" (ele)' },
  'vem': { correct: 'vêm', message: 'Acento diferencial plural: "vêm" (eles) vs "vem" (ele)' },
};

const HIATO_PATTERNS = [
  { pattern: /([aeo])(u|i)$/, accent: 2, desc: 'hiato tônico' },
  { pattern: /([aeo])(u|i)[s]?$/, accent: 2, desc: 'hiato tônico com s' },
];

function checkMonosyllables(tokens: { word: string; position: number }[]): AccentError[] {
  const errors: AccentError[] = [];
  for (const { word, position } of tokens) {
    const lower = word.toLowerCase();
    if (TONIC_MONOSYLLABLES.has(lower) && !hasAccent(word)) {
      errors.push({
        word,
        position,
        expected: lower,
        message: `Monossílabo tônico "${lower}" deve levar acento`,
      });
    }
  }
  return errors;
}

function checkOxytone(tokens: { word: string; position: number }[]): AccentError[] {
  const errors: AccentError[] = [];
  for (const { word, position } of tokens) {
    const lower = word.toLowerCase();
    if (lower.length <= 2) continue;
    if (!OXYTONE_ENDINGS.test(lower)) continue;
    const lastSyllable = getLastSyllable(lower);
    if (lastSyllable && isTonicPair(lastSyllable) && !hasAccent(word)) {
      errors.push({
        word,
        position,
        expected: addAccentOxytone(word),
        message: `Palavra oxítona terminada em "${lastSyllable}" deve levar acento`,
      });
    }
  }
  return errors;
}

function checkParoxytone(tokens: { word: string; position: number }[]): AccentError[] {
  const errors: AccentError[] = [];
  for (const { word, position } of tokens) {
    const lower = word.toLowerCase();
    if (lower.length <= 2) continue;
    if (!PAROXYTONE_ENDINGS.test(lower)) continue;
    if (hasAccent(word)) continue;
    const penultimate = getPenultimateSyllable(lower);
    if (penultimate && isStressedVowel(penultimate)) {
      errors.push({
        word,
        position,
        expected: addAccentParoxytone(word),
        message: `Palavra paroxítona terminada em "${lower.slice(-1)}" deve levar acento na penúltima sílaba`,
      });
    }
  }
  return errors;
}

function checkProparoxytone(tokens: { word: string; position: number }[]): AccentError[] {
  const errors: AccentError[] = [];
  for (const { word, position } of tokens) {
    const lower = word.toLowerCase();
    if (lower.length <= 3) continue;
    if (hasAccent(word)) continue;
    if (isProparoxytone(lower)) {
      errors.push({
        word,
        position,
        expected: addAccentProparoxytone(word),
        message: `Toda proparoxítona leva acento: "${word}"`,
      });
    }
  }
  return errors;
}

function checkHiatus(tokens: { word: string; position: number }[]): AccentError[] {
  const errors: AccentError[] = [];
  for (const { word, position } of tokens) {
    const lower = word.toLowerCase();
    for (const { pattern, accent: _a, desc: _d } of HIATO_PATTERNS) {
      const match = lower.match(pattern);
      if (match && !hasAccent(word)) {
        const idx = match.index! + match[1].length;
        if (idx < word.length) {
          errors.push({
            word,
            position,
            expected: addAccentHiato(word, idx),
            message: `Hiato tônico: "${word}" precisa de acento no i/u`,
          });
        }
      }
    }
  }
  return errors;
}

function checkDiacritic(tokens: { word: string; position: number }[]): AccentError[] {
  const errors: AccentError[] = [];
  for (const { word, position } of tokens) {
    const lower = word.toLowerCase();
    if (DIACRITICS[lower] && !hasAccent(word)) {
      errors.push({
        word,
        position,
        expected: DIACRITICS[lower].correct,
        message: DIACRITICS[lower].message,
      });
    }
  }
  return errors;
}

function checkPluralDiacritic(tokens: { word: string; position: number }[]): AccentError[] {
  const errors: AccentError[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const { word, position } = tokens[i];
    const lower = word.toLowerCase();
    if (PLURAL_DIACRITICS[lower]) {
      const nextWord = tokens[i + 1]?.word?.toLowerCase();
      if (nextWord && isPluralSubject(nextWord)) {
        errors.push({
          word,
          position,
          expected: PLURAL_DIACRITICS[lower].correct,
          message: PLURAL_DIACRITICS[lower].message,
        });
      }
    }
  }
  return errors;
}

export interface AccentValidationResult {
  errors: AccentError[];
}

export function validateAccents(text: string): AccentValidationResult {
  const tokens = tokenize(text);
  return {
    errors: [
      ...checkMonosyllables(tokens),
      ...checkOxytone(tokens),
      ...checkParoxytone(tokens),
      ...checkProparoxytone(tokens),
      ...checkHiatus(tokens),
      ...checkDiacritic(tokens),
      ...checkPluralDiacritic(tokens),
    ],
  };
}

function tokenize(text: string): { word: string; position: number }[] {
  const tokens: { word: string; position: number }[] = [];
  const re = /[a-zA-ZáàâãéèêíïóôõöúçñüÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑÜ]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    tokens.push({ word: m[0], position: m.index });
  }
  return tokens;
}

function hasAccent(word: string): boolean {
  return /[áàâãéêíóôõúç]/i.test(word);
}

function getLastSyllable(word: string): string {
  const match = word.match(/([aeiouáàâãéêíóôõú][a-záàâãéêíóôõúç]*)$/i);
  return match ? match[1] : '';
}

function getPenultimateSyllable(word: string): string {
  const syllables = word.match(/[aeiouáàâãéêíóôõú][a-záàâãéêíóôõúç]*/gi);
  if (syllables && syllables.length >= 2) {
    return syllables[syllables.length - 2];
  }
  return '';
}

function isTonicPair(syllable: string): boolean {
  return /^[aeo][is]$/i.test(syllable) || /^[aeo][us]$/i.test(syllable);
}

function isStressedVowel(syllable: string): boolean {
  return /[aeio]/i.test(syllable[0] || '');
}

function isProparoxytone(word: string): boolean {
  const syllables = word.match(/[aeiouáàâãéêíóôõú][a-záàâãéêíóôõúç]*/gi);
  return syllables !== null && syllables.length >= 3;
}

function addAccentOxytone(word: string): string {
  if (word.endsWith('e') || word.endsWith('E')) return word.slice(0, -1) + 'é' + word.slice(-1).toLowerCase() === word.slice(-1) ? '' : '';
  if (word.endsWith('o') || word.endsWith('O')) return word.slice(0, -1) + 'ó';
  return word;
}

function addAccentParoxytone(word: string): string {
  return word.replace(/([aeio])/g, (m, p, offset) => {
    if (offset === word.length - 2) {
      const accentMap: Record<string, string> = { a: 'á', e: 'é', i: 'í', o: 'ó' };
      return accentMap[p] || p;
    }
    return p;
  });
}

function addAccentProparoxytone(word: string): string {
  const idx = word.search(/[aeio]/i);
  if (idx >= 0) {
    const ch = word[idx];
    const accentMap: Record<string, string> = { a: 'á', e: 'é', i: 'í', o: 'ó' };
    return word.slice(0, idx) + (accentMap[ch.toLowerCase()] || ch) + word.slice(idx + 1);
  }
  return word;
}

function addAccentHiato(word: string, idx: number): string {
  const ch = word[idx];
  const accentMap: Record<string, string> = { i: 'í', u: 'ú', I: 'Í', U: 'Ú' };
  return word.slice(0, idx) + (accentMap[ch] || ch) + word.slice(idx + 1);
}

function isPluralSubject(word: string): boolean {
  return /[aeos]s$/i.test(word) || /ões$/i.test(word) || /ães$/i.test(word);
}

export type { AccentError };
