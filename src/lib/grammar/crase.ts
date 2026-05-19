interface CraseError {
  word: string;
  position: number;
  expected: string;
  message: string;
}

const EXCEPTED_BEFORE = new Set([
  'você', 'vocês', 'senhor', 'senhora', 'senhores', 'senhoras',
  'deus', 'deusa',
  'casa', 'terra',
]);

const EXCEPTED_CITIES = new Set([
  'brasília', 'salvador', 'porto alegre', 'são paulo',
  'curitiba', 'belo horizonte', 'fortaleza', 'recife',
  'manaus', 'belém', 'natal', 'joão pessoa',
]);

const FEMININE_LOCUTIONS = new Set([
  'as vezes', 'a medida que', 'a noite', 'a tarde',
  'a frente', 'a direita', 'a esquerda', 'a beira',
  'a procura', 'a espera', 'a maneira', 'a moda',
]);

function isFeminineWord(word: string): boolean {
  if (EXCEPTED_BEFORE.has(word.toLowerCase())) return false;
  if (word.endsWith('a') || word.endsWith('dade') || word.endsWith('ção') ||
      word.endsWith('são') || word.endsWith('tude') || word.endsWith('gem')) {
    return true;
  }
  return false;
}

function isCityName(word: string): boolean {
  return EXCEPTED_CITIES.has(word.toLowerCase());
}

function getNextWord(text: string, position: number): string | undefined {
  const after = text.slice(position + 1);
  const match = after.match(/^\s*([a-zA-Záàâãéèêíïóôõöúçñü]+)/);
  return match?.[1];
}

function checkPattern1(tokens: { word: string; position: number }[], text: string): CraseError[] {
  const errors: CraseError[] = [];
  const re = /\ba\s+(?=[a-zA-Záàâãéèêíïóôõöúçñ])/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const nextWord = getNextWord(text, m.index + m[0].length - 1);
    if (!nextWord || isCityName(nextWord)) continue;
    if (isFeminineWord(nextWord)) {
      errors.push({
        word: 'a',
        position: m.index,
        expected: 'à',
        message: `Crase obrigatória antes de palavra feminina: "a" → "à" antes de "${nextWord}"`,
      });
    }
  }
  return errors;
}

function checkPattern2(tokens: { word: string; position: number }[], text: string): CraseError[] {
  const errors: CraseError[] = [];
  const re = /\ba\s+(aquele|aquela|aquilo|aquelas|aqueles)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    errors.push({
      word: m[1],
      position: m.index,
      expected: `à${m[1]!.toLowerCase().slice(0)}`.replace('àa', 'à'),
      message: `Crase obrigatória: "a" + "${m[1]}" → "à${m[1]!.slice(0, 1).toLowerCase()}${m[1]!.slice(1)}"`,
    });
  }
  return errors;
}

function checkPattern3(tokens: { word: string; position: number }[], text: string): CraseError[] {
  const errors: CraseError[] = [];
  const re = /\b(as?)\s+(\d{1,2})\s*h/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    errors.push({
      word: m[1]!,
      position: m.index,
      expected: m[1]!.toLowerCase() === 'a' ? 'às' : 'às',
      message: `Crase obrigatória em horas: "${m[1]}" → "às"`,
    });
  }
  return errors;
}

function checkPattern4(tokens: { word: string; position: number }[], text: string): CraseError[] {
  const errors: CraseError[] = [];
  for (const locution of FEMININE_LOCUTIONS) {
    const re = new RegExp(`\\b${locution.replace(/\s+/g, '\\s+')}\\b`, 'gi');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      errors.push({
        word: locution.split(' ')[0]!,
        position: m.index,
        expected: locution.split(' ').map((w, i) => i === 0 ? 'à' : w).join(' '),
        message: `Crase em locução feminina: "${locution}"`,
      });
    }
  }
  return errors;
}

function checkPattern5(tokens: { word: string; position: number }[], text: string): CraseError[] {
  const errors: CraseError[] = [];
  const re = /\b(a|as)\s+(?=[a-zA-Záàâãéèêíïóôõöúçñ]+(mente|mente))/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    errors.push({
      word: m[1]!,
      position: m.index,
      expected: 'à',
      message: `Crase obrigatória em adjunto adverbial feminino: "${m[1]}" → "à"`,
    });
  }
  return errors;
}

export interface CraseValidationResult {
  errors: CraseError[];
}

export function validateCrase(text: string): CraseValidationResult {
  const tokens = tokenize(text);
  return {
    errors: [
      ...checkPattern1(tokens, text),
      ...checkPattern2(tokens, text),
      ...checkPattern3(tokens, text),
      ...checkPattern4(tokens, text),
      ...checkPattern5(tokens, text),
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

export type { CraseError };
