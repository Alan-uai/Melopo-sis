export type TextStructure = "poesia" | "poema" | "soneto" | "haicai" | "cordel" | "redondilha" | "decassilabo";

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
    default: return { valid: true, errors: [] };
  }
}

function countLines(text: string): number {
  return text.split('\n').filter(l => l.trim()).length;
}

function validateSoneto(text: string): StructureValidation {
  const errors: StructureError[] = [];
  const lines = text.split('\n').filter(l => l.trim());

  if (lines.length !== 14) {
    errors.push({
      message: `Soneto deve ter 14 versos. Encontrados: ${lines.length}.`,
      severity: 'alta',
    });
  }

  const stanzas = splitIntoStanzas(text);
  if (stanzas.length > 0) {
    if (stanzas.length !== 4) {
      errors.push({
        message: `Soneto deve ter 4 estrofes (2 quartetos + 2 tercetos). Encontradas: ${stanzas.length}.`,
        severity: 'alta',
      });
    } else {
      if (stanzas[0].length !== 4 || stanzas[1].length !== 4) {
        errors.push({
          message: 'As duas primeiras estrofes do soneto devem ser quartetos (4 versos cada).',
          severity: 'alta',
        });
      }
      if (stanzas[2].length !== 3 || stanzas[3].length !== 3) {
        errors.push({
          message: 'As duas últimas estrofes do soneto devem ser tercetos (3 versos cada).',
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
    if (stanzas[i].length !== 6 && stanzas[i].length !== 7) {
      errors.push({
        message: `Estrofe ${i + 1} deve ter 6 (sextilha) ou 7 (setilha) versos. Encontrados: ${stanzas[i].length}.`,
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
        message: `Estrofe ${i + 1} deve ter entre 4 e 8 versos na redondilha. Encontrados: ${stanzas[i].length}.`,
        severity: 'media',
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

function validateDecassilabo(text: string): StructureValidation {
  const errors: StructureError[] = [];
  const lines = text.split('\n').filter(l => l.trim());

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
