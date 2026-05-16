import { validateSyllableCount, validateAccentPositions } from '@/lib/poetic-forms';
import type { TextStructure } from '@/lib/poetic-forms';
import type { Suggestion } from '@/ai/types';

export async function runMeterAgent(
  text: string,
  structure: TextStructure,
): Promise<Suggestion[]> {
  const lines = text.split('\n');
  const suggestions: Suggestion[] = [];

  const syllableErrors = validateSyllableCount(text, structure);
  for (const err of syllableErrors) {
    suggestions.push({
      originalText: err.line ? lines[err.line - 1] || '' : text.slice(0, 60),
      correctedText: '',
      explanation: err.message,
      type: 'grammar',
      severity: err.severity,
      context: err.line ? lines[err.line - 1] || '' : text,
      alternatives: [],
    });
  }

  const accentErrors = validateAccentPositions(text, structure);
  for (const err of accentErrors) {
    suggestions.push({
      originalText: err.line ? lines[err.line - 1] || '' : text.slice(0, 60),
      correctedText: '',
      explanation: err.message,
      type: 'grammar',
      severity: err.severity,
      context: err.line ? lines[err.line - 1] || '' : text,
      alternatives: [],
    });
  }

  return suggestions;
}
