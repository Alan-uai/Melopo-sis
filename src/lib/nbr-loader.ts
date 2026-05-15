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
