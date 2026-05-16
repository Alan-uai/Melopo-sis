export type TextStructure = "poesia" | "poema" | "soneto" | "haicai" | "cordel" | "redondilha" | "decassilabo" | "trova" | "oitava" | "decima" | "elegia" | "ode" | "verso-livre";

export interface StructureValidation {
  valid: boolean;
  errors: StructureError[];
}

export interface StructureError {
  line?: number;
  message: string;
  severity: 'alta' | 'media' | 'baixa';
}

export function validateStructure(text: string, structure: TextStructure): StructureValidation {
  switch (structure) {
    case 'soneto': return validateSoneto(text);
    case 'haicai': return validateHaicai(text);
    case 'cordel': return validateCordel(text);
    case 'redondilha': return validateRedondilha(text);
    case 'decassilabo': return validateDecassilabo(text);
    case 'trova': return validateTrova(text);
    case 'oitava': return validateOitava(text);
    case 'decima': return validateDecima(text);
    default: return { valid: true, errors: [] };
  }
}

export function validateSyllableCount(text: string, structure: TextStructure): StructureError[] {
  const errors: StructureError[] = [];
  const lines = text.split('\n').filter(l => l.trim());

  const expected =
    structure === 'haicai' ? [5, 7, 5] as const :
    structure === 'redondilha' ? null :
    structure === 'decassilabo' ? null :
    structure === 'soneto' ? null :
    null;

  if (expected && lines.length === 3) {
    for (let i = 0; i < 3; i++) {
      const syllables = countPoeticSyllables(lines[i]);
      if (syllables !== expected[i]) {
        errors.push({
          line: i + 1,
          message: `Haicai: verso ${i + 1} deveria ter ${expected[i]} sílabas poéticas. Encontradas: ${syllables}.`,
          severity: 'media',
        });
      }
    }
    return errors;
  }

  if (structure === 'redondilha' || structure === 'soneto' || structure === 'decassilabo' || structure === 'cordel' || structure === 'trova' || structure === 'oitava') {
    const isCordel = structure === 'cordel';
    const isRedondilha = structure === 'redondilha';
    const isDecassilabo = structure === 'decassilabo' || structure === 'soneto';
    const isTrova = structure === 'trova';
    const isOitava = structure === 'oitava';

    const expectedSyllables = isCordel ? 7 : isRedondilha ? null : isDecassilabo ? 10 : isTrova ? 7 : isOitava ? 10 : null;

    for (let i = 0; i < lines.length; i++) {
      const syllables = countPoeticSyllables(lines[i]);

      if (isRedondilha) {
        if (syllables !== 5 && syllables !== 7) {
          errors.push({
            line: i + 1,
            message: `Redondilha: verso ${i + 1} deve ter 5 (redondilha menor) ou 7 (redondilha maior) sílabas poéticas. Encontradas: ${syllables}.`,
            severity: 'media',
          });
        }
        continue;
      }

      if (expectedSyllables && syllables !== expectedSyllables) {
        errors.push({
          line: i + 1,
          message: isCordel
            ? `Cordel: verso ${i + 1} deve ter ${expectedSyllables} sílabas poéticas. Encontradas: ${syllables}.`
            : isTrova
            ? `Trova: verso ${i + 1} deve ter ${expectedSyllables} sílabas poéticas (redondilha maior). Encontradas: ${syllables}.`
            : isOitava
            ? `Oitava: verso ${i + 1} deve ter ${expectedSyllables} sílabas poéticas (decassílabo heroico). Encontradas: ${syllables}.`
            : `Verso ${i + 1} deve ter ${expectedSyllables} sílabas poéticas (${structure}). Encontradas: ${syllables}.`,
          severity: 'media',
        });
      }
    }
  }

  return errors;
}

export function validateAccentPositions(text: string, structure: TextStructure): StructureError[] {
  const errors: StructureError[] = [];
  if (structure !== 'decassilabo' && structure !== 'soneto') return errors;

  const lines = text.split('\n').filter(l => l.trim());

  if (structure === 'soneto') {
    const stanzas = splitIntoStanzas(text);
    const totalLines = lines.length;
    if (totalLines !== 14) return errors;
  }

  for (let i = 0; i < lines.length; i++) {
    const positions = getAccentPositions(lines[i]);
    if (!positions.length) continue;

    const has6 = positions.includes(6);
    const has10 = positions.includes(10);

    if (!has6 && !has10) continue;

    if (structure === 'decassilabo' || structure === 'soneto') {
      if (!has10) {
        errors.push({
          line: i + 1,
          message: `Verso ${i + 1} sem acento obrigatório na 10ª sílaba poética (verso decassílabo).`,
          severity: 'media',
        });
      }
    }
  }

  return errors;
}

export function validatePunctuation(text: string): StructureError[] {
  const errors: StructureError[] = [];
  const retRegex = /\.{2,}/g;
  let match: RegExpExecArray | null;

  while ((match = retRegex.exec(text)) !== null) {
    if (match[0].length !== 3) {
      errors.push({
        message: `[PON-08] Reticências devem ter exatamente 3 pontos. Encontrados: ${match[0].length}.`,
        severity: 'media',
      });
    }
  }

  const exclOpen = (text.match(/[!?]/g) || []).length;
  const exclClose = (text.match(/[!?]/g) || []).length;

  const openParens = (text.match(/\(/g) || []).length;
  const closeParens = (text.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    errors.push({
      message: `[PON-16] Parênteses desbalanceados: ${openParens} abertos, ${closeParens} fechados.`,
      severity: 'media',
    });
  }

  return errors;
}

function countLines(text: string): number {
  return text.split('\n').filter(l => l.trim()).length;
}

function validateSoneto(text: string): StructureValidation {
  const errors: StructureError[] = [];
  const lines = text.split('\n').filter(l => l.trim());

  if (lines.length !== 14) {
    errors.push({
      line: 1,
      message: `[SON-01] Soneto deve ter 14 versos. Encontrados: ${lines.length}.`,
      severity: 'alta',
    });
  }

  const stanzas = splitIntoStanzas(text);
  if (stanzas.length > 0) {
    if (stanzas.length !== 4) {
      errors.push({
        line: 1,
        message: `[SON-02] Soneto deve ter 4 estrofes (2 quartetos + 2 tercetos). Encontradas: ${stanzas.length}.`,
        severity: 'alta',
      });
    } else {
      if (stanzas[0].length !== 4 || stanzas[1].length !== 4) {
        errors.push({
          line: 1,
          message: `[SON-02] As duas primeiras estrofes do soneto devem ser quartetos (4 versos cada). Estrofe 1: ${stanzas[0].length}, Estrofe 2: ${stanzas[1].length}.`,
          severity: 'alta',
        });
      }
      if (stanzas[2].length !== 3 || stanzas[3].length !== 3) {
        errors.push({
          line: stanzas[0].length + stanzas[1].length + 1,
          message: `[SON-02] As duas últimas estrofes do soneto devem ser tercetos (3 versos cada). Estrofe 3: ${stanzas[2].length}, Estrofe 4: ${stanzas[3].length}.`,
          severity: 'alta',
        });
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

function validateHaicai(text: string): StructureValidation {
  const errors: StructureError[] = [];
  const lines = text.split('\n').filter(l => l.trim());

  if (lines.length !== 3) {
    errors.push({
      line: 1,
      message: `Haicai deve ter exatamente 3 versos. Encontrados: ${lines.length}.`,
      severity: 'alta',
    });
  }

  return { valid: errors.length === 0, errors };
}

function validateCordel(text: string): StructureValidation {
  const errors: StructureError[] = [];
  const stanzas = splitIntoStanzas(text);

  for (let i = 0; i < stanzas.length; i++) {
    if (stanzas[i].length !== 6 && stanzas[i].length !== 7 && stanzas[i].length !== 10) {
      errors.push({
        line: 1,
        message: `Cordel: estrofe ${i + 1} deve ter 6 (sextilha), 7 (septilha) ou 10 (décima) versos. Encontrados: ${stanzas[i].length}.`,
        severity: 'media',
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

function validateRedondilha(text: string): StructureValidation {
  const errors: StructureError[] = [];
  const lines = text.split('\n').filter(l => l.trim());

  if (lines.length === 0) return { valid: true, errors: [] };

  const stanzas = splitIntoStanzas(text);
  for (let i = 0; i < stanzas.length; i++) {
    if (stanzas[i].length < 4 || stanzas[i].length > 8) {
      errors.push({
        line: 1,
        message: `Redondilha: estrofe ${i + 1} deve ter entre 4 e 8 versos. Encontrados: ${stanzas[i].length}.`,
        severity: 'media',
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

function validateTrova(text: string): StructureValidation {
  const errors: StructureError[] = [];
  const lines = text.split('\n').filter(l => l.trim());

  if (lines.length % 4 !== 0) {
    errors.push({
      line: 1,
      message: `[TRV-01] Trova/quadra deve ter número de versos múltiplo de 4. Encontrados: ${lines.length}.`,
      severity: 'media',
    });
  }

  return { valid: errors.length === 0, errors };
}

function validateOitava(text: string): StructureValidation {
  const errors: StructureError[] = [];
  const stanzas = splitIntoStanzas(text);

  for (let i = 0; i < stanzas.length; i++) {
    if (stanzas[i].length !== 8) {
      errors.push({
        line: 1,
        message: `[OIT-01] Oitava: estrofe ${i + 1} deve ter 8 versos. Encontrados: ${stanzas[i].length}.`,
        severity: 'media',
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

function validateDecima(text: string): StructureValidation {
  const errors: StructureError[] = [];
  const stanzas = splitIntoStanzas(text);

  for (let i = 0; i < stanzas.length; i++) {
    if (stanzas[i].length !== 10) {
      errors.push({
        line: 1,
        message: `[DCM-01] Décima: estrofe ${i + 1} deve ter 10 versos. Encontrados: ${stanzas[i].length}.`,
        severity: 'media',
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

function validateDecassilabo(text: string): StructureValidation {
  const errors: StructureError[] = [];
  const lines = text.split('\n').filter(l => l.trim());

  for (let i = 0; i < lines.length; i++) {
    const syllables = countPoeticSyllables(lines[i]);
    if (syllables !== 10 && syllables > 0) {
      errors.push({
        line: i + 1,
        message: `Decassílabo: verso ${i + 1} deve ter 10 sílabas poéticas. Encontradas: ${syllables}.`,
        severity: 'media',
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

function splitIntoStanzas(text: string): string[][] {
  const blocks = text.split(/\n\s*\n/);
  return blocks
    .map(b => b.split('\n').filter(l => l.trim()))
    .filter(s => s.length > 0);
}

export function countPoeticSyllables(line: string): number {
  const cleaned = line
    .toLowerCase()
    .replace(/[^a-záàâãéèêíïóôõöúçñü\s]/g, '')
    .trim();

  if (!cleaned) return 0;

  const words = cleaned.split(/\s+/);

  const poeticWords: string[] = [];
  let i = 0;
  while (i < words.length) {
    const current = words[i];
    if (i < words.length - 1) {
      const next = words[i + 1];
      if (
        (current.endsWith('a') || current.endsWith('e') || current.endsWith('i') || current.endsWith('o') || current.endsWith('u') ||
         current.endsWith('á') || current.endsWith('é') || current.endsWith('í') || current.endsWith('ó') || current.endsWith('ú') ||
         current.endsWith('ã') || current.endsWith('õ') || current.endsWith('à') || current.endsWith('ê')) &&
        (next.startsWith('a') || next.startsWith('e') || next.startsWith('i') || next.startsWith('o') || next.startsWith('u') ||
         next.startsWith('á') || next.startsWith('é') || next.startsWith('í') || next.startsWith('ó') || next.startsWith('ú') ||
         next.startsWith('ã') || next.startsWith('õ') || next.startsWith('à') || next.startsWith('ê') || next.startsWith('h'))
      ) {
        poeticWords.push(current + next);
        i += 2;
        continue;
      }
    }
    poeticWords.push(current);
    i++;
  }

  return poeticWords.reduce((sum, word) => sum + countVowelGroups(word), 0);
}

function countVowelGroups(word: string): number {
  if (!word) return 0;
  const groups = word.match(/[aeiouáàâãéèêíïóôõöúç]+/gi);
  return groups ? groups.length : 0;
}

function getAccentPositions(line: string): number[] {
  const syllables = countPoeticSyllables(line);
  if (syllables !== 10) return [];

  const positions: number[] = [];
  const cleaned = line
    .toLowerCase()
    .replace(/[^a-záàâãéèêíïóôõöúçñü\s]/g, '')
    .trim();

  const words = cleaned.split(/\s+/);

  let wordStart = 1;
  for (const word of words) {
    const vowelCount = countVowelGroups(word);
    const stressPos = findStressInWord(word);

    if (stressPos !== -1) {
      const absolutePos = wordStart + stressPos;
      if (absolutePos <= syllables) {
        positions.push(absolutePos);
      }
    }

    wordStart += vowelCount;

    if (word !== words[words.length - 1]) {
      const nextWord = words[words.indexOf(word) + 1];
      if (nextWord) {
        const lastVowel = word.match(/[aeiouáàâãéèêíïóôõöú]+$/i);
        const firstVowel = nextWord.match(/^[aeiouáàâãéèêíïóôõöúh]/i);
        if (lastVowel && firstVowel) {
          wordStart--;
        }
      }
    }
  }

  return positions;
}

function findStressInWord(word: string): number {
  const acutePattern = /[áàâãéèêíïóôõöú]/;
  const match = word.match(acutePattern);
  if (match) {
    const vowelGroupBefore = word.slice(0, match.index).match(/[aeiou]+/gi);
    const vowelGroupsBefore = vowelGroupBefore ? vowelGroupBefore.join('').length : 0;
    return vowelGroupsBefore;
  }

  const vowelGroups = word.match(/[aeiou]+/gi);
  if (!vowelGroups || vowelGroups.length === 0) return -1;

  if (word.endsWith('r') || word.endsWith('s') || word.endsWith('l') || word.endsWith('z')) {
    return vowelGroups.slice(0, -1).join('').length;
  }

  if (word.endsWith('am') || word.endsWith('em')) {
    return vowelGroups.slice(0, -1).join('').length;
  }

  return vowelGroups.slice(0, -1).join('').length;
}
