import { validateAccents } from './accent-validator';
import { validateCrase } from './crase';
import { validatePairs } from './confusao-pares';
import { validateConcordancia } from './concordancia';
import type { Suggestion } from '@/ai/types';

export interface GrammarValidationResult {
  suggestions: Suggestion[];
}

export async function validateGrammar(text: string): Promise<GrammarValidationResult> {
  const suggestions: Suggestion[] = [];

  const [accentResult, craseResult, pairResult, concordanciaResult] = await Promise.all([
    Promise.resolve(validateAccents(text)),
    Promise.resolve(validateCrase(text)),
    Promise.resolve(validatePairs(text)),
    validateConcordancia(text),
  ]);

  for (const err of accentResult.errors) {
    suggestions.push({
      originalText: err.word,
      correctedText: err.expected,
      explanation: err.message,
      type: 'grammar',
      severity: 'alta',
      context: text.slice(Math.max(0, err.position - 30), err.position + 30),
      alternatives: [{ text: err.expected, explanation: err.message }],
    });
  }

  for (const err of craseResult.errors) {
    suggestions.push({
      originalText: err.word,
      correctedText: err.expected,
      explanation: err.message,
      type: 'grammar',
      severity: 'alta',
      context: text.slice(Math.max(0, err.position - 30), err.position + 30),
      alternatives: [{ text: err.expected, explanation: err.message }],
    });
  }

  for (const err of pairResult.errors) {
    suggestions.push({
      originalText: err.word,
      correctedText: err.expected,
      explanation: err.message,
      type: 'grammar',
      severity: 'media',
      context: text.slice(Math.max(0, err.position - 30), err.position + 30),
      alternatives: [{ text: err.expected, explanation: err.message }],
    });
  }

  for (const err of concordanciaResult.errors) {
    suggestions.push({
      originalText: err.word,
      correctedText: err.expected,
      explanation: err.message,
      type: 'grammar',
      severity: 'alta',
      context: text.slice(Math.max(0, err.position - 30), err.position + 30),
      alternatives: [{ text: err.expected, explanation: err.message }],
    });
  }

  return { suggestions };
}
