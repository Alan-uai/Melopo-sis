import { checkText } from './spell-checker';
import type { SpellingError } from './spell-checker';
import { validateStructure, validateSyllableCount, validateAccentPositions, validateRhyme, validatePunctuation } from './poetic-forms';
import type { TextStructure } from './poetic-forms';
import type { Suggestion } from '@/ai/types';

export interface LocalValidationResult {
  suggestions: Suggestion[];
}

export async function validateAll(
  text: string,
  structure: TextStructure,
  rhyme: boolean
): Promise<LocalValidationResult> {
  const suggestions: Suggestion[] = [];

  const spellResult = await checkText(text);
  const structureValidation = validateStructure(text, structure);
  const syllableErrors = validateSyllableCount(text, structure);
  const accentErrors = validateAccentPositions(text, structure);
  const rhymeErrors = validateRhyme(text, structure, rhyme);
  const punctuationErrors = validatePunctuation(text);

  const lines = text.split('\n');

  for (const err of spellResult.errors) {
    let contextLine = '';
    let charCount = 0;
    for (const line of lines) {
      if (charCount + line.length >= err.position) {
        contextLine = line;
        break;
      }
      charCount += line.length + 1;
    }

    suggestions.push({
      originalText: err.word,
      correctedText: err.suggestions[0] || err.word,
      explanation: err.suggestions.length > 0
        ? `Erro ortográfico: "${err.word}" não encontrado no dicionário. Sugestões: ${err.suggestions.join(', ')}.`
        : `Erro ortográfico: "${err.word}" não encontrado no dicionário.`,
      type: 'grammar',
      severity: 'alta',
      context: contextLine,
      alternatives: err.suggestions,
    });
  }

  for (const err of structureValidation.errors) {
    suggestions.push({
      originalText: err.line ? lines[err.line - 1] || text.slice(0, 60) : text.slice(0, 60),
      correctedText: '',
      explanation: err.message,
      type: 'grammar',
      severity: err.severity,
      context: text,
      alternatives: [],
    });
  }

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

  for (const err of rhymeErrors) {
    suggestions.push({
      originalText: err.line ? lines[err.line - 1] || text.slice(0, 60) : text.slice(0, 60),
      correctedText: '',
      explanation: err.message,
      type: 'grammar',
      severity: err.severity,
      context: text,
      alternatives: [],
    });
  }

  for (const err of punctuationErrors) {
    suggestions.push({
      originalText: text.slice(0, 60),
      correctedText: '',
      explanation: err.message,
      type: 'grammar',
      severity: err.severity,
      context: text,
      alternatives: [],
    });
  }

  return { suggestions };
}
