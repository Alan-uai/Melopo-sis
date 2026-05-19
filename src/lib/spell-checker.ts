import { tokenize } from './tokenize';
import { isWordCorrect, getWordSuggestions } from './dictionary';

export interface SpellingError {
  word: string;
  position: number;
  suggestions: string[];
}

export interface SpellCheckResult {
  errors: SpellingError[];
}

function isPunctuationOrNumber(word: string): boolean {
  return /^[\d.,!?;:()\[\]{}\"'«»\-—…\s]+$/.test(word);
}

export async function checkText(text: string): Promise<SpellCheckResult> {
  const errors: SpellingError[] = [];
  const tokens = tokenize(text);

  for (let i = 0; i < tokens.length; i++) {
    const { word, position } = tokens[i];

    if (isPunctuationOrNumber(word)) continue;
    if (await isWordCorrect(word)) continue;

    const leftCtx = i > 0 ? tokens.slice(Math.max(0, i - 2), i).map(t => t.word) : [];
    const rightCtx = i < tokens.length - 1 ? tokens.slice(i + 1, Math.min(tokens.length, i + 3)).map(t => t.word) : [];

    const suggestions = await getWordSuggestions(word, leftCtx, rightCtx);
    errors.push({ word, position, suggestions });
  }

  return { errors };
}
