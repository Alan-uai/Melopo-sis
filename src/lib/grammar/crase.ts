import { tokenize } from '@/lib/tokenize';

interface CraseError {
  word: string;
  position: number;
  expected: string;
  message: string;
}

interface CraseInfo {
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

const OBLIGATORY_FEMININE_LOCUTIONS: Record<string, CraseInfo> = {
  'a medida que': { expected: 'à medida que', message: 'Crase obrigatória em "à medida que" (locução conjuntiva proporcional)' },
  'a noite': { expected: 'à noite', message: 'Crase obrigatória em "à noite" (locução adverbial de tempo)' },
  'a tarde': { expected: 'à tarde', message: 'Crase obrigatória em "à tarde" (locução adverbial de tempo)' },
  'a frente': { expected: 'à frente', message: 'Crase obrigatória em "à frente" (locução adverbial de lugar)' },
  'a direita': { expected: 'à direita', message: 'Crase obrigatória em "à direita" (locução adverbial de lugar)' },
  'a esquerda': { expected: 'à esquerda', message: 'Crase obrigatória em "à esquerda" (locução adverbial de lugar)' },
  'a beira': { expected: 'à beira', message: 'Crase obrigatória em "à beira" (locução adverbial/prepositiva)' },
  'a procura': { expected: 'à procura', message: 'Crase obrigatória em "à procura" (locução prepositiva)' },
  'a espera': { expected: 'à espera', message: 'Crase obrigatória em "à espera" (locução prepositiva)' },
  'a maneira': { expected: 'à maneira', message: 'Crase obrigatória em "à maneira" (locução adverbial de modo)' },
  'a moda': { expected: 'à moda', message: 'Crase obrigatória em "à moda" (locução adverbial de modo)' },
  'a vontade': { expected: 'à vontade', message: 'Crase obrigatória em "à vontade" (locução adverbial de modo)' },
  'a toa': { expected: 'à toa', message: 'Crase obrigatória em "à toa" (locução adjetiva/adverbial)' },
  'a deriva': { expected: 'à deriva', message: 'Crase obrigatória em "à deriva" (locução adverbial)' },
  'a solta': { expected: 'à solta', message: 'Crase obrigatória em "à solta" (locução adverbial)' },
  'a mão': { expected: 'à mão', message: 'Crase obrigatória em "à mão" (locução adverbial)' },
  'a vista': { expected: 'à vista', message: 'Crase obrigatória em "à vista" (locução adverbial)' },
  'a escuta': { expected: 'à escuta', message: 'Crase obrigatória em "à escuta" (locução adverbial)' },
  'a espreita': { expected: 'à espreita', message: 'Crase obrigatória em "à espreita" (locução adverbial)' },
  'a larga': { expected: 'à larga', message: 'Crase obrigatória em "à larga" (locução adverbial)' },
  'a tona': { expected: 'à tona', message: 'Crase obrigatória em "à tona" (locução adverbial)' },
  'a viva força': { expected: 'à viva força', message: 'Crase obrigatória em "à viva força" (locução adverbial)' },
  'a ultima hora': { expected: 'à última hora', message: 'Crase obrigatória em "à última hora" (locução adverbial)' },
  'a farta': { expected: 'à farta', message: 'Crase obrigatória em "à farta" (locução adverbial)' },
};

const OBLIGATORY_PLURAL_LOCUTIONS: Record<string, CraseInfo> = {
  'as vezes': { expected: 'às vezes', message: 'Crase obrigatória em "às vezes" (locução adverbial de tempo)' },
  'as apalpadelas': { expected: 'às apalpadelas', message: 'Crase obrigatória em "às apalpadelas" (locução adverbial de modo)' },
  'as aranhas': { expected: 'às aranhas', message: 'Crase obrigatória em "às aranhas" (locução adverbial — mandar às aranhas)' },
  'as avessas': { expected: 'às avessas', message: 'Crase obrigatória em "às avessas" (locução adverbial de modo)' },
  'as cegas': { expected: 'às cegas', message: 'Crase obrigatória em "às cegas" (locução adverbial de modo)' },
  'as claras': { expected: 'às claras', message: 'Crase obrigatória em "às claras" (locução adverbial de modo)' },
  'as costas': { expected: 'às costas', message: 'Crase obrigatória em "às costas" (locução adverbial)' },
  'as dezenas': { expected: 'às dezenas', message: 'Crase obrigatória em "às dezenas" (locução adverbial de quantidade)' },
  'as duzias': { expected: 'às dúzias', message: 'Crase obrigatória em "às dúzias" (locução adverbial de quantidade)' },
  'as escondidas': { expected: 'às escondidas', message: 'Crase obrigatória em "às escondidas" (locução adverbial de modo)' },
  'as favas': { expected: 'às favas', message: 'Crase obrigatória em "às favas" (locução adverbial — mandar às favas)' },
  'as leguas': { expected: 'às léguas', message: 'Crase obrigatória em "às léguas" (locução adverbial de distância)' },
  'as mil maravilhas': { expected: 'às mil maravilhas', message: 'Crase obrigatória em "às mil maravilhas" (locução adverbial de modo)' },
  'as ocultas': { expected: 'às ocultas', message: 'Crase obrigatória em "às ocultas" (locução adverbial de modo)' },
  'as ordens': { expected: 'às ordens', message: 'Crase obrigatória em "às ordens" (locução de cortesia)' },
  'as pressas': { expected: 'às pressas', message: 'Crase obrigatória em "às pressas" (locução adverbial de modo)' },
  'as tontas': { expected: 'às tontas', message: 'Crase obrigatória em "às tontas" (locução adverbial de modo)' },
  'as turras': { expected: 'às turras', message: 'Crase obrigatória em "às turras" (locução adverbial — estar às turras)' },
};

const PREPOSITIVE_LOCUTIONS: Record<string, CraseInfo> = {
  'a luz de': { expected: 'à luz de', message: 'Crase obrigatória em "à luz de" (locução prepositiva)' },
  'a sombra de': { expected: 'à sombra de', message: 'Crase obrigatória em "à sombra de" (locução prepositiva)' },
  'a roda de': { expected: 'à roda de', message: 'Crase obrigatória em "à roda de" (locução prepositiva)' },
  'a volta de': { expected: 'à volta de', message: 'Crase obrigatória em "à volta de" (locução prepositiva)' },
  'a beira de': { expected: 'à beira de', message: 'Crase obrigatória em "à beira de" (locução prepositiva)' },
  'a busca de': { expected: 'à busca de', message: 'Crase obrigatória em "à busca de" (locução prepositiva)' },
  'a caca de': { expected: 'à caça de', message: 'Crase obrigatória em "à caça de" (locução prepositiva)' },
  'a cata de': { expected: 'à cata de', message: 'Crase obrigatória em "à cata de" (locução prepositiva)' },
  'a imitação de': { expected: 'à imitação de', message: 'Crase obrigatória em "à imitação de" (locução prepositiva)' },
  'a mercê de': { expected: 'à mercê de', message: 'Crase obrigatória em "à mercê de" (locução prepositiva)' },
  'a proporção que': { expected: 'à proporção que', message: 'Crase obrigatória em "à proporção que" (locução conjuntiva proporcional)' },
  'a revelia de': { expected: 'à revelia de', message: 'Crase obrigatória em "à revelia de" (locução prepositiva)' },
  'a semelhança de': { expected: 'à semelhança de', message: 'Crase obrigatória em "à semelhança de" (locução prepositiva)' },
  'a superficie de': { expected: 'à superfície de', message: 'Crase obrigatória em "à superfície de" (locução prepositiva)' },
  'a testa de': { expected: 'à testa de', message: 'Crase obrigatória em "à testa de" (locução prepositiva)' },
  'a flor da pele': { expected: 'à flor da pele', message: 'Crase obrigatória em "à flor da pele" (expressão idiomática)' },
  'a tripa forra': { expected: 'à tripa forra', message: 'Crase obrigatória em "à tripa forra" (locução adverbial)' },
  'a une': { expected: 'à une', message: 'Crase obrigatória em "à une" (locução adverbial — à una)' },
};

const ALL_LOCUTIONS: Record<string, CraseInfo> = {
  ...OBLIGATORY_FEMININE_LOCUTIONS,
  ...OBLIGATORY_PLURAL_LOCUTIONS,
  ...PREPOSITIVE_LOCUTIONS,
};

const WB = '(?<![a-zA-Záàâãéèêíïóôõöúçñü0-9])';
const WB_END = '(?![a-zA-Záàâãéèêíïóôõöúçñü0-9])';

const PROHIBITIVE_PATTERNS: { re: RegExp; message: string }[] = [
  { re: new RegExp(WB + 'à\\s+(?=[a-zA-Záàâãéèêíïóôõöúçñ]*(?:ar|er|ir|or|ur)' + WB_END + ')', 'i'), message: 'Crase proibida antes de verbo: "à" → "a"' },
  { re: new RegExp(WB + 'à\\s+(?=[a-zA-Záàâãéèêíïóôõöúçñ]*[b-df-hj-np-tv-z][ao]' + WB_END + '(?!s))', 'i'), message: 'Crase proibida antes de palavra masculina: verifique se não usa "à"' },
  { re: new RegExp(WB + 'perante\\s+à' + WB_END, 'i'), message: 'Crase proibida após a preposição "perante": use "perante a"' },
  { re: new RegExp(WB + 'para\\s+à' + WB_END, 'i'), message: 'Crase proibida após a preposição "para": use "para a"' },
  { re: new RegExp(WB + 'mediante\\s+à' + WB_END, 'i'), message: 'Crase proibida após a preposição "mediante": use "mediante a"' },
  { re: new RegExp(WB + 'conforme\\s+à' + WB_END, 'i'), message: 'Crase proibida após a preposição "conforme": use "conforme a"' },
];

const MASCULINE_ENDINGS = new Set([
  'o', 'os', 'or', 'dor', 'tor', 'sor', 'dor', 'al', 'il', 'ul',
  'el', 'ol', 'ar', 'er', 'ir', 'ur', 'ário', 'ário', 'ário', 'ada',
  'edo', 'ido', 'udo', 'ato', 'ito', 'uto', 'eto', 'oto',
  'mento', 'mentos', 'inho', 'inhos', 'alho', 'elho',
  'ume', 'ume', 'ume', 'ume',
]);

const FEMININE_ENDING_OVERRIDES = new Set([
  'mão', 'mãos', 'nação', 'nações', 'lição', 'lições',
  'paixão', 'paixões', 'razão', 'razões', 'solução', 'soluções',
  'televisão', 'televisões', 'operação', 'operações',
  'situação', 'situações', 'condição', 'condições',
  'posição', 'posições', 'seção', 'seções', 'questão', 'questões',
  'tradição', 'tradições', 'educação', 'ações',
  'profissão', 'profissões', 'expressão', 'expressões',
  'oceano', 'sistema', 'problema', 'tema', 'poema', 'drama',
  'clima', 'idioma', 'grama', 'pijama', 'telegrama', 'cinema',
  'mapa', 'sofá',
]);

const FACULTATIVE_AFTER = new Set([
  'até', 'perante', 'após',
]);

function isFeminineWord(word: string): boolean | null {
  const lower = word.toLowerCase().trim();
  if (EXCEPTED_BEFORE.has(lower)) return false;
  if (FEMININE_ENDING_OVERRIDES.has(lower)) return true;
  if (lower.endsWith('a') || lower.endsWith('dade') || lower.endsWith('ção') ||
      lower.endsWith('são') || lower.endsWith('tude') || lower.endsWith('gem') ||
      lower.endsWith('eira') || lower.endsWith('eira') || lower.endsWith('esa') ||
      lower.endsWith('isa') || lower.endsWith('triz') || lower.endsWith('ice') ||
      lower.endsWith('ude') || lower.endsWith('agem') || lower.endsWith('igem') ||
      lower.endsWith('ugem') || lower.endsWith('ante') || lower.endsWith('ente') ||
      lower.endsWith('inte') || lower.endsWith('aria') || lower.endsWith('oria')) {
    return true;
  }
  if (lower.endsWith('o') || lower.endsWith('or') || lower.endsWith('ário') ||
      lower.endsWith('nte') || lower.endsWith('dor') || lower.endsWith('tor')) {
    const exFem = ['noite', 'tarde', 'frente', 'gente', 'mente', 'ponte', 'morte', 'arte', 'parte', 'serpente', 'sorte'];
    if (exFem.includes(lower)) return true;
    return null;
  }
  return null;
}

function isMasculineWord(word: string): boolean {
  const lower = word.toLowerCase().trim();
  if (FEMININE_ENDING_OVERRIDES.has(lower)) return lower.startsWith('o') && !['oásis'].includes(lower);
  for (const ending of MASCULINE_ENDINGS) {
    if (lower.endsWith(ending)) return true;
  }
  return false;
}

function isCityName(word: string): boolean {
  return EXCEPTED_CITIES.has(word.toLowerCase());
}

function isProperName(word: string): boolean {
  return /^[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][a-záéíóúâêîôûãõç]+$/.test(word) && word.length > 1;
}

function getNextWord(text: string, position: number): string | undefined {
  const after = text.slice(position + 1);
  const match = after.match(/^\s*([a-zA-Záàâãéèêíïóôõöúçñü]+)/);
  return match?.[1];
}

function getPrevWord(text: string, position: number): string | undefined {
  const before = text.slice(0, position);
  const match = before.match(/([a-zA-Záàâãéèêíïóôõöúçñü]+)\s*$/);
  return match?.[1];
}

function checkPattern1(tokens: { word: string; position: number }[], text: string): CraseError[] {
  const errors: CraseError[] = [];
  const re = /\ba\s+(?=[a-zA-Záàâãéèêíïóôõöúçñ])/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const nextWord = getNextWord(text, m.index + m[0].length - 1);
    if (!nextWord || isCityName(nextWord) || isProperName(nextWord)) continue;

    const prevWord = getPrevWord(text, m.index);
    if (prevWord && FACULTATIVE_AFTER.has(prevWord.toLowerCase())) continue;

    if (isFeminineWord(nextWord) === true) {
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
    const dem = m[1]!;
    const demLower = dem.toLowerCase();
    const crased = demLower.startsWith('a') ? 'à' + demLower.slice(1) : `à${demLower}`;
    errors.push({
      word: dem,
      position: m.index,
      expected: crased,
      message: `Crase obrigatória: "a" + "${dem}" → "${crased}"`,
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
      expected: 'às',
      message: `Crase obrigatória em horas: "${m[1]}" → "às"`,
    });
  }
  return errors;
}

function checkLocutions(text: string): CraseError[] {
  const errors: CraseError[] = [];

  for (const [locution, info] of Object.entries(ALL_LOCUTIONS)) {
    const bareLocution = locution.replace(/^[aà]\s+/, 'a ');
    const re = new RegExp(`\\b${bareLocution.replace(/\s+/g, '\\s+')}\\b`, 'gi');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const locutionTokens = locution.split(' ');
      const firstWordIndex = m.index + text.slice(m.index).indexOf(locutionTokens[0]!);
      errors.push({
        word: locutionTokens[0]!,
        position: firstWordIndex,
        expected: info.expected.split(' ')[0]!,
        message: info.message + `: use "${info.expected}"`,
      });
    }
  }

  return errors;
}

function checkPattern5(tokens: { word: string; position: number }[], text: string): CraseError[] {
  const errors: CraseError[] = [];
  const re = /\b(a|as)\s+(?=[a-zA-Záàâãéèêíïóôõöúçñ]+(mente))/gi;
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

function checkFacultativeCrase(text: string): CraseError[] {
  const errors: CraseError[] = [];
  const re = new RegExp(WB + 'à\\s+([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][a-záéíóúâêîôûãõç]+)', 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const name = m[1]!;
    if (isProperName(name)) {
      errors.push({
        word: 'à',
        position: m.index,
        expected: 'a',
        message: `Crase facultativa diante de nomes próprios femininos: "à ${name}" é aceito, mas "a ${name}" também é correto.`,
      });
    }
  }

  const possRe = new RegExp(WB + 'à\\s+(minha|tua|sua|nossa|vossa)' + WB_END, 'gi');
  let pm: RegExpExecArray | null;
  while ((pm = possRe.exec(text)) !== null) {
    errors.push({
      word: 'à',
      position: pm.index,
      expected: 'a',
      message: `Crase facultativa diante de pronome possessivo feminino: "à ${pm[1]}" é aceito, mas "a ${pm[1]}" também é correto.`,
    });
  }

  return errors;
}

function checkProhibitiveCrase(text: string): CraseError[] {
  const errors: CraseError[] = [];

  for (const { re, message } of PROHIBITIVE_PATTERNS) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      errors.push({
        word: m[0]!.split(/\s+/)[0] || 'à',
        position: m.index,
        expected: m[0]!.replace(/\bà\b/gi, 'a'),
        message,
      });
    }
  }

  const antesDeVerboRe = new RegExp(WB + 'à\\s+(?=[a-zA-Záàâãéèêíïóôõöúçñ]+[r]' + WB_END + ')', 'gi');
  {
    let vmi: RegExpExecArray | null;
    while ((vmi = antesDeVerboRe.exec(text)) !== null) {
      const nextWord = getNextWord(text, vmi.index + 2);
      if (nextWord && (nextWord.endsWith('ar') || nextWord.endsWith('er') || nextWord.endsWith('ir') || nextWord.endsWith('or'))) {
        if (!errors.some(e => e.position === vmi!.index && e.message.includes('verbo'))) {
          errors.push({
            word: 'à',
            position: vmi!.index,
            expected: 'a',
            message: `Crase proibida antes de verbo: "à" → "a" antes de "${nextWord}"`,
          });
        }
      }
    }
  }

  const antesDeMasculinoRe = new RegExp(WB + 'à\\s+(?=[a-zA-Záàâãéèêíïóôõöúçñ]*[^aãos])' + WB_END, 'gi');
  {
    let mmi: RegExpExecArray | null;
    while ((mmi = antesDeMasculinoRe.exec(text)) !== null) {
      const nextWord = getNextWord(text, mmi.index + 2);
      if (nextWord && isFeminineWord(nextWord) === false && !isFeminineWord(nextWord)) {
        if (!errors.some(e => e.position === mmi!.index)) {
          errors.push({
            word: 'à',
            position: mmi!.index,
            expected: 'a',
            message: `Crase proibida antes de palavra masculina: "à" → "a" antes de "${nextWord}"`,
          });
        }
      }
    }
  }

  const palavraRepetidaRe = new RegExp(WB + '([a-zA-Záàâãéèêíïóôõöúçñ]+)\\s+à\\s+\\1' + WB_END, 'gi');
  let pr: RegExpExecArray | null;
  while ((pr = palavraRepetidaRe.exec(text)) !== null) {
    errors.push({
      word: 'à',
      position: pr.index + pr[0].indexOf('à'),
      expected: 'a',
      message: `Crase proibida entre palavras repetidas: "cara a cara", "gota a gota", etc. Use "a" em vez de "à".`,
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
      ...checkLocutions(text),
      ...checkPattern5(tokens, text),
      ...checkFacultativeCrase(text),
      ...checkProhibitiveCrase(text),
    ],
  };
}

export type { CraseError };
