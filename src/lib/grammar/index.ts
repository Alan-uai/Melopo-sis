import { validateAccents } from './accent-validator';
import { validateCrase } from './crase';
import { validatePairs } from './confusao-pares';
import type { Suggestion } from '@/ai/types';

export interface GrammarValidationResult {
  suggestions: Suggestion[];
}

export function validateGrammar(text: string): GrammarValidationResult {
  const suggestions: Suggestion[] = [];

  const accentResult = validateAccents(text);
  for (const err of accentResult.errors) {
    suggestions.push({
      originalText: err.word,
      correctedText: err.expected,
      explanation: err.message,
      type: 'grammar',
      severity: 'alta',
      context: text.slice(Math.max(0, err.position - 30), err.position + 30),
      alternatives: [err.expected],
    });
  }

  const craseResult = validateCrase(text);
  for (const err of craseResult.errors) {
    suggestions.push({
      originalText: err.word,
      correctedText: err.expected,
      explanation: err.message,
      type: 'grammar',
      severity: 'alta',
      context: text.slice(Math.max(0, err.position - 30), err.position + 30),
      alternatives: [err.expected],
    });
  }

  const pairResult = validatePairs(text);
  for (const err of pairResult.errors) {
    suggestions.push({
      originalText: err.word,
      correctedText: err.expected,
      explanation: err.message,
      type: 'grammar',
      severity: 'media',
      context: text.slice(Math.max(0, err.position - 30), err.position + 30),
      alternatives: [err.expected],
    });
  }

  return { suggestions };
}
