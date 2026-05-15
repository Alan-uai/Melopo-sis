import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const NBR_DIR = join(process.cwd(), 'docs', 'nbr');

const STRUCTURE_FILE_MAP: Record<string, string> = {
  soneto: 'soneto.txt',
  haicai: 'haicai.txt',
  cordel: 'cordel.txt',
  redondilha: 'redondilha.txt',
  decassilabo: 'decassilabo.txt',
  poema: 'poema-poesia.txt',
  poesia: 'poema-poesia.txt',
};

const MAX_NBR_LENGTH = 6000;

export function loadOrthographyRules(): string {
  return loadRawDoc('acordo-ortografico.txt');
}

export function loadPunctuationRules(): string {
  return loadRawDoc('pontuacao-poetica.txt');
}

function loadRawDoc(filename: string): string {
  const filePath = join(NBR_DIR, filename);
  try {
    const content = readFileSync(filePath, 'utf-8');
    if (content.length > MAX_NBR_LENGTH) {
      return content.slice(0, MAX_NBR_LENGTH) + '\n# ... (truncado por tamanho)';
    }
    return content;
  } catch {
    return '';
  }
}

export function loadNbrRules(structure: string): string {
  const filename = STRUCTURE_FILE_MAP[structure];
  if (!filename) {
    return '';
  }

  try {
    const filePath = join(NBR_DIR, filename);
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    const relevant = extractRelevantSections(lines);

    if (relevant.length > MAX_NBR_LENGTH) {
      return relevant.slice(0, MAX_NBR_LENGTH) + '\n# ... (truncado por tamanho)';
    }

    return relevant;
  } catch {
    return '';
  }
}

export function loadToneRules(tone: string): string {
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

    if (sectionLines.length === 0) return '';

    const result = sectionLines.join('\n').trim();

    if (result.length > MAX_NBR_LENGTH) {
      return result.slice(0, MAX_NBR_LENGTH) + '\n# ... (truncado por tamanho)';
    }

    return result;
  } catch {
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
