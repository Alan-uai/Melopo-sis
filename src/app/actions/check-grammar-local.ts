'use server';

import { validateAll } from '@/lib/local-validator';
import type { Suggestion } from '@/ai/types';

const CORRECT_CACHE = new Map<string, boolean>();
const SUGGESTION_CACHE = new Map<string, Suggestion[]>();
const MAX_CACHE_SIZE = 2000;

export async function checkSpellingOnly(
  words: string[],
  _structure?: string
): Promise<{ suggestions: Suggestion[] }> {
  if (!words.length) return { suggestions: [] };

  const results: Suggestion[] = [];
  const toCheck: string[] = [];

  for (const word of words) {
    const lower = word.toLowerCase();
    const cachedCorrect = CORRECT_CACHE.get(lower);
    if (cachedCorrect === true) continue;
    if (cachedCorrect === false) {
      const cachedSugs = SUGGESTION_CACHE.get(lower);
      if (cachedSugs) {
        results.push(...cachedSugs);
        continue;
      }
    }
    toCheck.push(word);
  }

  if (toCheck.length === 0) return { suggestions: results };

  const { isWordCorrect, getWordSuggestions } = await import('@/lib/dictionary');

  for (const word of toCheck) {
    const correct = await isWordCorrect(word);
    const lower = word.toLowerCase();

    if (correct) {
      CORRECT_CACHE.set(lower, true);
      if (CORRECT_CACHE.size > MAX_CACHE_SIZE) {
        const first = CORRECT_CACHE.keys().next().value;
        if (first) CORRECT_CACHE.delete(first);
      }
      continue;
    }

    CORRECT_CACHE.set(lower, false);
    const suggestions = await getWordSuggestions(word);

    const sug: Suggestion = {
      originalText: word,
      correctedText: suggestions[0] || word,
      explanation: suggestions.length > 0
        ? `Erro ortográfico: "${word}" não encontrado no dicionário. Sugestões: ${suggestions.join(', ')}.`
        : `Erro ortográfico: "${word}" não encontrado no dicionário.`,
      type: 'grammar',
      severity: 'alta',
      context: word,
      alternatives: suggestions.map(s => ({ text: s, explanation: `Alternativa ortográfica para "${word}".` })),
    };

    results.push(sug);
    SUGGESTION_CACHE.set(lower, [sug]);

    if (SUGGESTION_CACHE.size > MAX_CACHE_SIZE) {
      const first = SUGGESTION_CACHE.keys().next().value;
      if (first) SUGGESTION_CACHE.delete(first);
    }
  }

  return { suggestions: results };
}

export async function checkGrammarLocal(
  text: string,
  structure: string,
  rhyme: boolean,
): Promise<{ suggestions: Suggestion[] }> {
  if (!text.trim()) return { suggestions: [] };

  const result = await validateAll(text, structure as 'poema', rhyme);
  return { suggestions: result.suggestions };
}
