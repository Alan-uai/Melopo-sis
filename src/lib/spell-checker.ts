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
  const wordRegex = /[a-zA-ZáàâãéèêíïóôõöúçñüÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑÜ]+/g;
  let match: RegExpExecArray | null;

  while ((match = wordRegex.exec(text)) !== null) {
    const word = match[0];
    const position = match.index;

    if (isPunctuationOrNumber(word)) continue;
    if (await isWordCorrect(word)) continue;

    const suggestions = await getWordSuggestions(word);
    errors.push({ word, position, suggestions });
  }

  return { errors };
}
