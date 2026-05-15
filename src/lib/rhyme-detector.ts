export interface RhymeAnalysis {
  scheme: string;
  matches: RhymeMatch[];
  errors: RhymeError[];
  stanzaSchemes: string[];
}

export interface RhymeMatch {
  lineA: number;
  lineB: number;
  rhymeGroup: string;
  perfect: boolean;
}

export interface RhymeError {
  lineA: number;
  lineB: number;
  expectedRhyme: string;
  actualEndingA: string;
  actualEndingB: string;
  message: string;
}

const STRESSED_VOWEL: Record<string, string> = {
  'a': 'a', 'á': 'a', 'à': 'a', 'â': 'a', 'ã': 'a',
  'e': 'e', 'é': 'e', 'ê': 'e',
  'i': 'i', 'í': 'i',
  'o': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o',
  'u': 'u', 'ú': 'u',
};

function getRhymeEnding(word: string): string {
  const lower = word.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (/[aeiou]([aeiou]m)$/.test(lower)) return lower.slice(-3);

  if (/[aeiou][ns]$/.test(lower)) return lower.slice(-2);

  const tonicMatch = lower.match(/([aeiou][^aeiou]*)$/);
  if (tonicMatch) return tonicMatch[1];

  return lower.slice(-3);
}

export function extractLastWord(line: string): string {
  const clean = line.replace(/[^\wáàâãéèêíïóôõöúçñü\s-]/gi, '').trim();
  const words = clean.split(/[\s-]+/);
  return words[words.length - 1] || '';
}

export function analyzeRhymeScheme(text: string): RhymeAnalysis {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) {
    return { scheme: '', matches: [], errors: [], stanzaSchemes: [] };
  }

  const lastWords = lines.map(extractLastWord);
  const endings = lastWords.map(w => getRhymeEnding(w));

  const assignedLetters: string[] = [];
  const endingToLetter: Record<string, string> = {};
  let nextLetter = 'A';

  for (const ending of endings) {
    if (!ending) {
      assignedLetters.push('');
      continue;
    }
    if (endingToLetter[ending]) {
      assignedLetters.push(endingToLetter[ending]);
    } else {
      const letter = nextLetter;
      endingToLetter[ending] = letter;
      assignedLetters.push(letter);
      nextLetter = String.fromCharCode(letter.charCodeAt(0) + 1);
    }
  }

  const scheme = assignedLetters.join('');

  const matches: RhymeMatch[] = [];
  const letterGroups: Record<string, number[]> = {};
  for (let i = 0; i < assignedLetters.length; i++) {
    const l = assignedLetters[i];
    if (!l) continue;
    if (!letterGroups[l]) letterGroups[l] = [];
    letterGroups[l].push(i);
  }

  for (const [, indices] of Object.entries(letterGroups)) {
    if (indices.length >= 2) {
      for (let i = 0; i < indices.length; i++) {
        for (let j = i + 1; j < indices.length; j++) {
          const endingA = endings[indices[i]];
          const endingB = endings[indices[j]];
          matches.push({
            lineA: indices[i] + 1,
            lineB: indices[j] + 1,
            rhymeGroup: assignedLetters[indices[i]],
            perfect: endingA === endingB,
          });
        }
      }
    }
  }

  const stanzas = splitIntoStanzas(text);
  const stanzaSchemes: string[] = [];
  const errors: RhymeError[] = [];

  let globalLineOffset = 0;
  for (const stanza of stanzas) {
    if (stanza.length < 2) {
      globalLineOffset += stanza.length;
      continue;
    }

    const stanzaWords = stanza.map(extractLastWord);
    const stanzaEndings = stanzaWords.map(w => getRhymeEnding(w));
    const stanzaLetters: string[] = [];
    const stanzaEndingToLetter: Record<string, string> = {};
    let stanzaLetter = 'A';

    for (const ending of stanzaEndings) {
      if (!ending) { stanzaLetters.push(''); continue; }
      if (stanzaEndingToLetter[ending]) {
        stanzaLetters.push(stanzaEndingToLetter[ending]);
      } else {
        const l = stanzaLetter;
        stanzaEndingToLetter[ending] = l;
        stanzaLetters.push(l);
        stanzaLetter = String.fromCharCode(l.charCodeAt(0) + 1);
      }
    }
    stanzaSchemes.push(stanzaLetters.join(''));
    globalLineOffset += stanza.length;
  }

  return { scheme, matches, errors, stanzaSchemes };
}

function splitIntoStanzas(text: string): string[][] {
  const blocks = text.split(/\n\s*\n/);
  return blocks
    .map(b => b.split('\n').filter(l => l.trim()))
    .filter(s => s.length > 0);
}

export function detectRhymeErrors(text: string, expectedScheme?: string): RhymeError[] {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const lastWords = lines.map(extractLastWord);
  const endings = lastWords.map(w => getRhymeEnding(w));

  const errors: RhymeError[] = [];
  const stanzaLines: number[] = [];

  const stanzas = splitIntoStanzas(text);
  let lineNum = 1;
  for (const stanza of stanzas) {
    if (stanza.length >= 2) {
      const scheme = expectedScheme || 'alternating';
      const stanzaEndings = stanza.map((_, i) => endings[lineNum - 1 + i]);

      if (scheme === 'alternating' || scheme === 'ABAB') {
        for (let i = 0; i < stanzaEndings.length - 2; i += 2) {
          if (stanzaEndings[i] && stanzaEndings[i + 2] && stanzaEndings[i] !== stanzaEndings[i + 2]) {
            errors.push({
              lineA: lineNum + i,
              lineB: lineNum + i + 2,
              expectedRhyme: stanzaEndings[i],
              actualEndingA: stanzaEndings[i],
              actualEndingB: stanzaEndings[i + 2],
              message: `O verso ${lineNum + i + 2} deveria rimar com o verso ${lineNum + i + 1} (esquema esperado: ${stanzaEndings[i]}).`,
            });
          }
        }
      }
    }
    lineNum += stanza.length;
  }

  return errors;
}
