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
  const tokens = tokenize(text);
  const checkableTokens = tokens.filter(t => !isPunctuationOrNumber(t.word));

  if (checkableTokens.length === 0) {
    return { errors: [] };
  }

  const checkResults = await Promise.all(
    checkableTokens.map(async ({ word, position }) => {
      const correct = await isWordCorrect(word);
      if (correct) return null;
      return { word, position };
    })
  );

  const misspelledTokens = checkResults.filter((r): r is { word: string; position: number } => r !== null);

  if (misspelledTokens.length === 0) {
    return { errors: [] };
  }

  const errorsWithSuggestions = await Promise.all(
    misspelledTokens.map(async ({ word, position }) => {
      const suggestions = await getWordSuggestions(word);
      return { word, position, suggestions };
    })
  );

  return { errors: errorsWithSuggestions };
}

export function checkTextSync(text: string): { tokens: Array<{ word: string; position: number }>; misspelled: number[] } {
  const tokens = tokenize(text);
  const checkableTokens = tokens.filter(t => !isPunctuationOrNumber(t.word));
  return {
    tokens: checkableTokens.map(t => ({ word: t.word, position: t.position })),
    misspelled: checkableTokens.map((t, i) => i),
  };
}
