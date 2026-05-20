import { tokenize } from '@/lib/tokenize';

interface AccentError {
  word: string;
  position: number;
  expected: string;
  message: string;
}

const MONOSYLLABLE_MAP: Record<string, string> = {
  'pe': 'pé', 'fe': 'fé', 'so': 'só', 'ma': 'má', 'pa': 'pá', 'po': 'pó',
  'mes': 'mês', 'tres': 'três',
  'pos': 'pós', 'pois': 'pois',
  'doi': 'dói', 'ceu': 'céu', 'reu': 'réu', 'leu': 'léu', 'veu': 'véu',
  'ca': 'cá', 'la': 'lá', 'da': 'dá', 'das': 'dás', 'dao': 'dão',
  'te': 'té', 'se': 'sé', 'gas': 'gás', 'cha': 'chá', 'tras': 'trás',
  'nos': 'nós', 'vos': 'vós',
  'le': 'lê', 've': 'vê', 'de': 'dê', 'cre': 'crê', 'poe': 'põe',
  'nao': 'não', 'cao': 'cão', 'pao': 'pão', 'mao': 'mão',
  'sa': 'sá', 'ta': 'tá', 'fa': 'fá', 'ba': 'bá',
};

const ATONIC_MONOSYLLABLES = new Set([
  'o', 'a', 'os', 'as', 'um', 'uns',
  'me', 'te', 'se', 'lhe', 'lhes',
  'nos', 'vos', 'lhe', 'lhes',
  'de', 'da', 'do', 'das', 'dos',
  'em', 'na', 'no', 'nas', 'nos',
  'por', 'para', 'pra', 'pro',
  'que', 'quem', 'com', 'sem', 'sob', 'sub', 'per',
  'mas', 'nem', 'pois', 'sim', 'também',
  'se', 'se', 'lhe',
]);

const KNOWN_ACCENTED_MONOSYLLABLES = new Set([
  'pé', 'sé', 'fé', 'cá', 'lá', 'dá', 'dás', 'dão',
  'má', 'pá', 'pó', 'só', 'mês', 'pôs',
  'dói', 'céu', 'réu', 'vêu', 'léu', 'véu', 'vôo',
  'gás', 'chá', 'trás', 'nós', 'vós',
]);

const OXYTONE_ENDINGS = /([aeo]s?|ens)$/i;
const PAROXYTONE_ENDINGS = /[lrlnxpsziuszã]$/i;

const DIACRITICS: Record<string, { correct: string; message: string }> = {
  'por': { correct: 'pôr', message: 'Acento diferencial: "pôr" (verbo) vs "por" (preposição)' },
  'pode': { correct: 'pôde', message: 'Acento diferencial: "pôde" (pretérito) vs "pode" (presente)' },
};

const EXTRA_DIACRITICS: Record<string, { correct: string; message: string }> = {
  'pára': { correct: 'para', message: 'Abolido pelo AO 1990: "para" (verbo) sem acento' },
  'pélo': { correct: 'pelo', message: 'Abolido pelo AO 1990: "pelo" sem acento (contração de "per" + "lo")' },
  'pólo': { correct: 'polo', message: 'Abolido pelo AO 1990: "polo" sem acento (extremidade, jogo)' },
  'pêlo': { correct: 'pelo', message: 'Abolido pelo AO 1990: "pelo" sem acento (substantivo)' },
  'vôo': { correct: 'voo', message: 'Abolido pelo AO 1990: "voo" sem acento' },
  'enjôo': { correct: 'enjoo', message: 'Abolido pelo AO 1990: "enjoo" sem acento' },
};

const PLURAL_DIACRITICS: Record<string, { correct: string; message: string }> = {
  'tem': { correct: 'têm', message: 'Acento diferencial plural: "têm" (eles) vs "tem" (ele)' },
  'vem': { correct: 'vêm', message: 'Acento diferencial plural: "vêm" (eles) vs "vem" (ele)' },
  'mantém': { correct: 'mantêm', message: 'Acento diferencial plural: "mantêm" (eles) vs "mantém" (ele)' },
  'detém': { correct: 'detêm', message: 'Acento diferencial plural: "detêm" (eles) vs "detém" (ele)' },
  'intervém': { correct: 'intervêm', message: 'Acento diferencial plural: "intervêm" (eles) vs "intervém" (ele)' },
  'retém': { correct: 'retêm', message: 'Acento diferencial plural: "retêm" (eles) vs "retém" (ele)' },
  'contém': { correct: 'contêm', message: 'Acento diferencial plural: "contêm" (eles) vs "contém" (ele)' },
  'obtém': { correct: 'obtêm', message: 'Acento diferencial plural: "obtêm" (eles) vs "obtém" (ele)' },
};

const HIATO_PATTERNS = [
  { pattern: /([aeo])(u|i)$/, desc: 'hiato tônico' },
  { pattern: /([aeo])(u|i)[s]?$/, desc: 'hiato tônico com s' },
];

const OPEN_DIPHTHONG_OXYTONES_ACCENTED = new Set(['éi', 'éis', 'éu', 'éus', 'ói', 'óis']);
const OPEN_DIPHTHONG_OXYTONES = new Set(['ei', 'eis', 'eu', 'eus', 'oi', 'ois']);

const DIPHTHONG_TO_ACCENT: Record<string, string> = {
  'ei': 'éi', 'eis': 'éis', 'eu': 'éu', 'eus': 'éus',
  'oi': 'ói', 'ois': 'óis',
};

const EM_ENS_OXYTONES: Record<string, string> = {
  'alguem': 'alguém',
  'ninguem': 'ninguém',
  'tambem': 'também',
  'porem': 'porém',
  'contem': 'contém',
  'detem': 'detém',
  'mantem': 'mantém',
  'retem': 'retém',
  'intervem': 'intervém',
  'obtem': 'obtém',
  'convem': 'convém',
  'provem': 'provém',
  'advem': 'advém',
  'parabens': 'parabéns',
  'hifens': 'hifens',
  'abdomens': 'abdomens',
};

const WORDS_WITH_WRONG_ACCENT_COMMON: Record<string, string> = {
  'àrvore': 'árvore',
  'àgua': 'água',
  'àguia': 'águia',
  'àrea': 'área',
  'àtomo': 'átomo',
  'àncora': 'âncora',
  'àlibi': 'álibi',
  'âmago': 'âmago',
  'ânimo': 'ânimo',
  'àpice': 'ápice',
  'égoista': 'egoísta',
  'saùde': 'saúde',
  'baù': 'baú',
  'faisca': 'faísca',
  'feiura': 'feiura',
  'bocaiuva': 'bocaúva',
  'caida': 'caída',
  'saida': 'saída',
  'juiz': 'juiz',
};

function checkMonosyllables(tokens: { word: string; position: number }[]): AccentError[] {
  const errors: AccentError[] = [];
  for (const { word, position } of tokens) {
    const lower = word.toLowerCase();
    if (!hasAccent(word) && MONOSYLLABLE_MAP[lower]) {
      errors.push({
        word,
        position,
        expected: MONOSYLLABLE_MAP[lower],
        message: `Monossílabo tônico "${lower}" deve levar acento`,
      });
    }
  }
  return errors;
}


const KNOWN_PROPAROXYTONES_NEEDING_ACCENT: Record<string, string> = {
  medico: 'médico',
  musica: 'música',
  lampada: 'lâmpada',
  arvore: 'árvore',
  publico: 'público',
};

const KNOWN_OXYTONES_NEEDING_ACCENT: Record<string, string> = {
  'voce': 'você',
  'cafe': 'café',
  'sofa': 'sofá',
  'jilo': 'jiló',
  'carijo': 'carijó',
};

function checkOxytone(tokens: { word: string; position: number }[]): AccentError[] {
  const errors: AccentError[] = [];
  for (const { word, position } of tokens) {
    const lower = word.toLowerCase();
    if (lower.length <= 2) continue;
    if (!OXYTONE_ENDINGS.test(lower)) continue;
    if (hasAccent(word)) continue;

    const syllables = lower.match(SYLLABLE_RE);
    if (syllables && syllables.length <= 1) continue;

    const lastSyllable = getLastSyllable(lower);

    if (lastSyllable && isTonicPair(lastSyllable)) {
      errors.push({
        word,
        position,
        expected: addAccentOxytone(word),
        message: `Palavra oxítona terminada em "${lastSyllable}" deve levar acento`,
      });
      continue;
    }

    if (KNOWN_OXYTONES_NEEDING_ACCENT[lower]) {
      errors.push({
        word,
        position,
        expected: KNOWN_OXYTONES_NEEDING_ACCENT[lower],
        message: `Oxítona "${word}" deve levar acento: "${KNOWN_OXYTONES_NEEDING_ACCENT[lower]}"`,
      });
      continue;
    }
  }
  return errors;
}

const MONOSYLLABIC_DIPHTHONGS = new Set([
  'foi', 'sai', 'cai', 'dei', 'sei', 'hei', 'põe', 'pois',
  'mais', 'menos', 'nem',
]);

const OPEN_DIPHTHONG_EXCLUDED = new Set([
  'azeite', 'feira', 'seita', 'neve', 'leite', 'peixe',
  'deixa', 'queixa', 'treino', 'veiga', 'seiva',
  'heine', 'heidi',
]);

function checkOpenDiphthongOxytone(tokens: { word: string; position: number }[]): AccentError[] {
  const errors: AccentError[] = [];
  for (const { word, position } of tokens) {
    const lower = word.toLowerCase();
    if (lower.length <= 2) continue;
    if (OPEN_DIPHTHONG_EXCLUDED.has(lower)) continue;
    if (MONOSYLLABIC_DIPHTHONGS.has(lower)) continue;

    const syllables = lower.match(SYLLABLE_RE);
    if (syllables && syllables.length <= 1) continue;

    for (const diphthong of OPEN_DIPHTHONG_OXYTONES) {
      if (lower.endsWith(diphthong) && !hasAccent(word)) {
        const accented = DIPHTHONG_TO_ACCENT[diphthong] || diphthong;
        errors.push({
          word,
          position,
          expected: addAccentOpenDiphthong(word, diphthong, accented),
          message: `Oxítona terminada em ditongo aberto "${diphthong}" deve levar acento`,
        });
        break;
      }
    }
  }
  return errors;
}

function checkEMENSOxytone(tokens: { word: string; position: number }[]): AccentError[] {
  const errors: AccentError[] = [];
  for (const { word, position } of tokens) {
    const lower = word.toLowerCase();
    if (EM_ENS_OXYTONES[lower] && !hasAccent(word)) {
      const correct = EM_ENS_OXYTONES[lower];
      errors.push({
        word,
        position,
        expected: correct,
        message: `Oxítona terminada em -em/-ens deve levar acento: "${correct}"`,
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
    if (MONOSYLLABIC_DIPHTHONGS.has(lower)) continue;
    if (MONOSYLLABLE_MAP[lower]) continue;

    const syllables = lower.match(SYLLABLE_RE);
    if (syllables && syllables.length <= 1) continue;
    if (syllables && /[lr]$/i.test(lower) && syllables.length < 3) continue;

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
    if (WORDS_WITH_WRONG_ACCENT_COMMON[lower]) continue;

    const expected = KNOWN_PROPAROXYTONES_NEEDING_ACCENT[lower];
    if (expected) {
      errors.push({
        word,
        position,
        expected,
        message: `Toda proparoxítona leva acento: "${word}"`,
      });
    }
  }
  return errors;
}

const OXYTONE_DIPHTHONG_ENDINGS = /(?:ai|ei|oi)$/i;

function checkHiatus(tokens: { word: string; position: number }[]): AccentError[] {
  const errors: AccentError[] = [];
  for (const { word, position } of tokens) {
    const lower = word.toLowerCase();

    if (OXYTONE_DIPHTHONG_ENDINGS.test(lower) && lower.length <= 3) continue;

    const endsInOpenDiphthong = [...OPEN_DIPHTHONG_OXYTONES].some(d => lower.endsWith(d));
    if (endsInOpenDiphthong && lower.endsWith('oi')) continue;

    for (const { pattern } of HIATO_PATTERNS) {
      const match = lower.match(pattern);
      if (match && !hasAccent(word)) {
        const idx = match.index! + match[1]!.length;
        if (idx < word.length) {
          if (lower.endsWith('oi') && lower.length <= 4) {
            const known = new Set(['foi', 'dois', 'boi', 'noite', 'coisa', 'voip', 'goi']);
            if (known.has(lower)) continue;
          }
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

function checkExtraDiacritic(tokens: { word: string; position: number }[]): AccentError[] {
  const errors: AccentError[] = [];
  for (const { word, position } of tokens) {
    const lower = word.toLowerCase();
    if (EXTRA_DIACRITICS[lower] && hasAccent(word)) {
      errors.push({
        word,
        position,
        expected: EXTRA_DIACRITICS[lower].correct,
        message: EXTRA_DIACRITICS[lower].message,
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

    for (const [sgKey, info] of Object.entries(PLURAL_DIACRITICS)) {
      if (lower === sgKey) {
        const nextWord = tokens[i + 1]?.word?.toLowerCase();
        if (nextWord && isPluralSubject(nextWord)) {
          errors.push({
            word,
            position,
            expected: info.correct,
            message: info.message,
          });
          break;
        }
      }
    }

    const singularForm = Object.entries(PLURAL_DIACRITICS).find(([_, info]) => info.correct.toLowerCase() === lower);
    if (singularForm && hasAccent(word)) {
      const nextWord = tokens[i + 1]?.word?.toLowerCase();
      if (nextWord && isPluralSubject(nextWord) === false && isPluralSubject(nextWord) !== undefined) {
        errors.push({
          word,
          position,
          expected: singularForm[0],
          message: `Acento diferencial: use "${singularForm[0]}" (singular) em vez de "${word}" para sujeito singular`,
        });
        break;
      }
    }
  }
  return errors;
}

function checkWrongAccents(tokens: { word: string; position: number }[]): AccentError[] {
  const errors: AccentError[] = [];

  for (const { word, position } of tokens) {
    const lower = word.toLowerCase();

    if (WORDS_WITH_WRONG_ACCENT_COMMON[lower]) {
      errors.push({
        word,
        position,
        expected: WORDS_WITH_WRONG_ACCENT_COMMON[lower],
        message: `Acento incorreto em "${word}": o correto é "${WORDS_WITH_WRONG_ACCENT_COMMON[lower]}"`,
      });
      continue;
    }

    if (lower.length === 1 && hasAccent(word)) {
      if (!KNOWN_ACCENTED_MONOSYLLABLES.has(lower)) {
        errors.push({
          word,
          position,
          expected: word.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
          message: `Monossílabo átono "${lower}" não deve levar acento`,
        });
      }
      continue;
    }

    if (hasAccent(word) && ATONIC_MONOSYLLABLES.has(lower)) {
      errors.push({
        word,
        position,
        expected: word.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
        message: `Monossílabo átono "${word}" não deve levar acento`,
      });
      continue;
    }

    if (hasAccent(word) && lower.length > 2) {
      const vowelCount = (lower.match(/[aeiouáàâãéêíóôõú]/gi) || []).length;
      if (vowelCount >= 2) {
        const accentCount = (lower.match(/[áàâãéêíóôõú]/gi) || []).length;
        if (accentCount > 1) {
          errors.push({
            word,
            position,
            expected: word,
            message: `Palavra "${word}" tem múltiplos acentos — verificar se está correta`,
          });
          continue;
        }

        if (!isProparoxytone(lower)) {
          const endsWithLrnx = /[lrnx]$/i.test(lower);
          const endsWithS = /s$/i.test(lower) && !/[áàâãéêíóôõú]s$/i.test(lower);
          const endsWithZ = /z$/i.test(lower);
          const endsWithI = /i$/i.test(lower);
          const endsWithU = /u$/i.test(lower);
          const endsWithUm = /[uú]m$/i.test(lower);
          const endsWithAo = /[aá]o$/i.test(lower);
          const endsWithPs = /ps$/i.test(lower);

          const isParoxytoneEnding = endsWithLrnx || endsWithS || endsWithZ || endsWithI || endsWithU || endsWithUm || endsWithAo || endsWithPs || /[ãâêéíóôõ][s]?$/i.test(lower);

          const isOxytoneEnding = /([aeoáéóáéó]|ens)$/i.test(lower);

          if (!isParoxytoneEnding && !isOxytoneEnding) {
            const hasHiato = /[aeoáéó][iíuú]/i.test(lower);
            if (!hasHiato && !/[áéó][aeo]/i.test(lower)) {
              const lastTwo = lower.slice(-2);
              if (!/^[aeoáéó][is]$/i.test(lastTwo)) {
                errors.push({
                  word,
                  position,
                  expected: word.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
                  message: `Acento desnecessário em "${word}": palavras paroxítonas só recebem acento quando terminadas em l, n, r, x, ps, s, z, i, u, um, ã, ão`,
                });
                continue;
              }
            }
          }
        }
      }
    }

    const wrongHiatoMatch = lower.match(/^[^aeiouáàâãéêíóôõú]*[aeioáéó][iíuú]/i);
    if (wrongHiatoMatch && hasAccent(word)) {
      const wordWithoutDiacritic = word.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (wordWithoutDiacritic !== word) {
        const correctAccentPosition = wordWithoutDiacritic.search(/[aeio][iu]/i);
        if (correctAccentPosition >= 0) {
          const withoutAccent = wordWithoutDiacritic;
          const correctlyAccented = addAccentHiato(withoutAccent, correctAccentPosition + 1);
          if (correctlyAccented === wordWithoutDiacritic) {
            continue;
          }
          if (correctlyAccented !== word) {
            const hasHiatoPattern = /[aeio][iíuú]/i.test(word);
            if (hasHiatoPattern) {
              const accentIdx = wordWithoutDiacritic.search(/[aeio](?=[iu])/i);
              if (accentIdx >= 0) {
                const newWord = wordWithoutDiacritic.slice(0, accentIdx + 1) +
                  addAccentToChar(wordWithoutDiacritic[accentIdx + 1]!) +
                  wordWithoutDiacritic.slice(accentIdx + 2);
                if (newWord !== word && newWord !== wordWithoutDiacritic) {
                  errors.push({
                    word,
                    position,
                    expected: newWord,
                    message: `Acento mal posicionado em hiato: "${word}" — o acento deve ficar no i/u, não na vogal anterior`,
                  });
                }
              }
            }
          }
        }
      }
    }
  }

  return errors;
}

function addAccentToChar(ch: string): string {
  const accents: Record<string, string> = { 'i': 'í', 'u': 'ú', 'I': 'Í', 'U': 'Ú' };
  return accents[ch] || ch;
}

export interface AccentValidationResult {
  errors: AccentError[];
}

export function validateAccents(text: string): AccentValidationResult {
  const tokens = tokenize(text);
  const allErrors = [
    ...checkMonosyllables(tokens),
    ...checkOxytone(tokens),
    ...checkOpenDiphthongOxytone(tokens),
    ...checkEMENSOxytone(tokens),
    ...checkParoxytone(tokens),
    ...checkProparoxytone(tokens),
    ...checkHiatus(tokens),
    ...checkDiacritic(tokens),
    ...checkExtraDiacritic(tokens),
    ...checkPluralDiacritic(tokens),
    ...checkWrongAccents(tokens),
  ];

  const wordPositionMap = new Map<string, { err: AccentError; priority: number }>();
  for (const err of allErrors) {
    const key = `${err.position}_${err.word.toLowerCase()}`;
    const existing = wordPositionMap.get(key);
    const isDictionaryCheck = /^(Monossílabo|Acento diferencial|Abolido|Oxítona ".+?" deve)/.test(err.message);
    const isSpecificCheck = /^(Oxítona terminada|Toda proparoxítona|Hiato tônico|Acento incorreto)/.test(err.message);
    const priority = isDictionaryCheck ? 0 : isSpecificCheck ? 1 : 2;
    if (!existing || priority < existing.priority) {
      wordPositionMap.set(key, { err, priority });
    }
  }

  return { errors: [...wordPositionMap.values()].map(e => e.err) };
}

function hasAccent(word: string): boolean {
  return /[áàâãéêíóôõúç]/i.test(word);
}

const VOWELS_RE = /[aeiouáàâãéêíóôõú]/i;
const CONSONANTS_RE = /[^aeiouáàâãéêíóôõú]/i;
const SYLLABLE_RE = /[aeiouáàâãéêíóôõú][^aeiouáàâãéêíóôõú]*/gi;

function getLastSyllable(word: string): string {
  const match = word.match(SYLLABLE_RE);
  return match ? match[match.length - 1] : '';
}

function getPenultimateSyllable(word: string): string {
  const syllables = word.match(SYLLABLE_RE);
  if (syllables && syllables.length >= 2) {
    return syllables[syllables.length - 2];
  }
  return '';
}

function isProparoxytone(word: string): boolean {
  const syllables = word.match(SYLLABLE_RE);
  return syllables !== null && syllables.length >= 3;
}

function isTonicPair(syllable: string): boolean {
  return /^[aeoáéó][is]$/i.test(syllable) || /^[aeoáéó][us]$/i.test(syllable);
}

function isStressedVowel(syllable: string): boolean {
  return /[aeiouáéíóú]/i.test(syllable);
}

function addAccentMonosyllable(word: string): string {
  const lower = word.toLowerCase();
  if (MONOSYLLABLE_MAP[lower]) return MONOSYLLABLE_MAP[lower];
  if (lower.endsWith('e')) return word.slice(0, -1) + 'é';
  if (lower.endsWith('o')) return word.slice(0, -1) + 'ó';
  if (lower.endsWith('a')) return word.slice(0, -1) + 'á';
  return word;
}

function addAccentOxytone(word: string): string {
  const lower = word.toLowerCase();
  if (lower.endsWith('e')) return word.slice(0, -1) + 'é';
  if (lower.endsWith('o')) return word.slice(0, -1) + 'ó';
  if (lower.endsWith('a')) return word.slice(0, -1) + 'á';
  if (lower.endsWith('em')) return word.slice(0, -2) + 'ém';
  if (lower.endsWith('ens')) return word.slice(0, -3) + 'éns';
  return word;
}

function addAccentOpenDiphthong(word: string, diphthong: string, accented: string): string {
  const lower = word.toLowerCase();
  const idx = lower.lastIndexOf(diphthong);
  if (idx < 0) return word;

  return word.slice(0, idx) + accented + word.slice(idx + diphthong.length);
}

function addAccentParoxytone(word: string): string {
  const vowels = [...word].reduce<{ char: string; idx: number }[]>((acc, ch, idx) => {
    if (/[aeiouáéíóú]/i.test(ch)) acc.push({ char: ch, idx });
    return acc;
  }, []);
  if (vowels.length >= 2) {
    const { char, idx } = vowels[vowels.length - 2];
    const accentMap: Record<string, string> = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú', A: 'Á', E: 'É', I: 'Í', O: 'Ó', U: 'Ú' };
    const alreadyAccented = /[áéíóú]/i.test(char);
    if (!alreadyAccented) {
      return word.slice(0, idx) + (accentMap[char.toLowerCase()] || char) + word.slice(idx + 1);
    }
  }
  return word;
}

function addAccentProparoxytone(word: string): string {
  const vowels = [...word].reduce<{ char: string; idx: number }[]>((acc, ch, idx) => {
    if (/[aeiouáéíóú]/i.test(ch)) acc.push({ char: ch, idx });
    return acc;
  }, []);
  const targetIdx = Math.max(0, vowels.length - 3);
  if (vowels[targetIdx]) {
    const { char, idx } = vowels[targetIdx];
    const accentMap: Record<string, string> = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú', A: 'Á', E: 'É', I: 'Í', O: 'Ó', U: 'Ú' };
    const alreadyAccented = /[áéíóú]/i.test(char);
    if (!alreadyAccented) {
      return word.slice(0, idx) + (accentMap[char.toLowerCase()] || char) + word.slice(idx + 1);
    }
  }
  return word;
}

function addAccentHiato(word: string, idx: number): string {
  const ch = word[idx];
  const accentMap: Record<string, string> = { i: 'í', u: 'ú', I: 'Í', U: 'Ú' };
  return word.slice(0, idx) + (accentMap[ch] || ch) + word.slice(idx + 1);
}

function isPluralSubject(word: string): boolean | null {
  if (/[aeos]s$/i.test(word)) return true;
  if (/ões$/i.test(word)) return true;
  if (/ães$/i.test(word)) return true;
  if (word.endsWith('s') && !word.endsWith('ss')) return true;
  return null;
}

export type { AccentError };
