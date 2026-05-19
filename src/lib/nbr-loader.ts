import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const NBR_DIR = join(process.cwd(), 'docs', 'nbr');

const memoCache = new Map<string, string>();

const STRUCTURE_FILE_MAP: Record<string, string> = {
  soneto: 'soneto.txt',
  haicai: 'haicai.txt',
  cordel: 'cordel.txt',
  redondilha: 'redondilha.txt',
  decassilabo: 'decassilabo.txt',
  poema: 'poema-poesia.txt',
  poesia: 'poema-poesia.txt',
  trova: 'trova.txt',
  oitava: 'oitava.txt',
  decima: 'decima.txt',
  elegia: 'elegia.txt',
  ode: 'ode.txt',
  'verso-livre': 'verso-livre.txt',
  'poesia-concreta-visual': 'poesia-concreta-visual.txt',
  'poesia-marginal-slam': 'poesia-marginal-slam.txt',
  'figuras-linguagem': 'figuras-linguagem.txt',
  'revisao-poetica': 'revisao-poetica.txt',
};

const MAX_NBR_LENGTH = 50000;

export function loadOrthographyRules(): string {
  return loadRawDoc('acordo-ortografico.txt');
}

export function loadPunctuationRules(): string {
  return loadRawDoc('pontuacao-poetica.txt');
}

export function loadRhymeRules(): string {
  return loadRawDoc('rima.txt');
}

export function loadRawDoc(filename: string): string {
  const cached = memoCache.get(filename);
  if (cached !== undefined) return cached;

  const filePath = join(NBR_DIR, filename);
  try {
    const content = readFileSync(filePath, 'utf-8');
    const result = content.length > MAX_NBR_LENGTH
      ? content.slice(0, MAX_NBR_LENGTH) + '\n# ... (truncado por tamanho)'
      : content;
    memoCache.set(filename, result);
    return result;
  } catch {
    memoCache.set(filename, '');
    return '';
  }
}

export function loadNbrRules(structure: string): string {
  const cacheKey = `nbr:${structure}`;
  const cached = memoCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const filename = STRUCTURE_FILE_MAP[structure];
  if (!filename) {
    memoCache.set(cacheKey, '');
    return '';
  }

  try {
    const filePath = join(NBR_DIR, filename);
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    const relevant = extractRelevantSections(lines);

    const result = relevant.length > MAX_NBR_LENGTH
      ? relevant.slice(0, MAX_NBR_LENGTH) + '\n# ... (truncado por tamanho)'
      : relevant;

    memoCache.set(cacheKey, result);
    return result;
  } catch {
    memoCache.set(cacheKey, '');
    return '';
  }
}

export function loadToneRules(tone: string): string {
  const cacheKey = `tone:${tone}`;
  const cached = memoCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const filePath = join(NBR_DIR, 'tom.txt');

  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const sectionKey = tone.toUpperCase().trim();

    const sectionLines: string[] = [];
    let inSection = false;
    let afterSeparator = false;

    for (const line of lines) {
      const trimmed = line.trimEnd();

      if (line.startsWith('=') && line.length > 10) {
        if (inSection) {
          break;
        }
        if (afterSeparator) {
          inSection = true;
        }
        continue;
      }

      if (!inSection && trimmed === sectionKey) {
        afterSeparator = true;
        continue;
      }

      if (inSection) {
        sectionLines.push(line);
      }
    }

    if (sectionLines.length === 0) {
      memoCache.set(cacheKey, '');
      return '';
    }

    const result = sectionLines.join('\n').trim();

    const final = result.length > MAX_NBR_LENGTH
      ? result.slice(0, MAX_NBR_LENGTH) + '\n# ... (truncado por tamanho)'
      : result;

    memoCache.set(cacheKey, final);
    return final;
  } catch {
    memoCache.set(cacheKey, '');
    return '';
  }
}

function extractRelevantSections(lines: string[]): string {
  const result: string[] = [];
  let inHeader = true;

  for (const line of lines) {
    if (inHeader && line.startsWith('# ')) {
      result.push(line);
      continue;
    }
    if (inHeader && line.startsWith('=')) {
      inHeader = false;
      result.push(line);
      continue;
    }
    if (!inHeader) {
      if (line.startsWith('# ') && line.includes('—')) {
        continue;
      }
      result.push(line);
    }
  }

  return result.join('\n');
}
