import type { TextStructure } from './poetic-forms';

const POETIC_EXCEPTIONS = new Set([
  'ai', 'ei', 'oi', 'ui',
  'mãe', 'pai', 'mãe', 'céu', 'réu', 'véu',
  'fiz', 'pus', 'quis', 'trouxe', 'disse',
  'estou', 'está', 'estão', 'estava',
  'tenho', 'tens', 'temos', 'têm',
]);

const POETIC_FALSE_POSITIVES: Record<string, string> = {
  'alva': 'alva',
  'lume': 'lume',
  'fado': 'fado',
  'lide': 'lide',
  'lida': 'lida',
  'senda': 'senda',
  'lusco': 'lusco',
};

export function isPoeticFalsePositive(word: string, context?: string): boolean {
  const lower = word.toLowerCase();

  if (POETIC_EXCEPTIONS.has(lower)) return true;
  if (POETIC_FALSE_POSITIVES[lower]) return true;

  if (/^[A-Z]/.test(word) && word.length > 1 && !context) return true;

  return false;
}

const GRAMMAR_RULES_TO_SKIP_FOR_POETRY = new Set([
  'UPPERCASE_SENTENCE_START',
  'PUNCTUATION_PARAGRAPH_END',
  'SENTENCE_WHITESPACE',
  'CONCORDANCIA_NOMINAL_INVERSA',
  'MUITO_ADJETIVO_INVERSO',
]);

export function shouldSkipGrammarRule(ruleId: string): boolean {
  return GRAMMAR_RULES_TO_SKIP_FOR_POETRY.has(ruleId);
}

export interface PoeticOverrideConfig {
  skipCapitalization: boolean;
  allowSentenceFragments: boolean;
  allowInversions: boolean;
  extraWords: string[];
}

export function getPoeticOverride(structure: TextStructure): PoeticOverrideConfig {
  switch (structure) {
    case 'soneto':
    case 'decassilabo':
      return {
        skipCapitalization: true,
        allowSentenceFragments: true,
        allowInversions: true,
        extraWords: [],
      };
    case 'haicai':
      return {
        skipCapitalization: true,
        allowSentenceFragments: true,
        allowInversions: false,
        extraWords: [],
      };
    case 'poesia':
    case 'verso-livre':
      return {
        skipCapitalization: true,
        allowSentenceFragments: true,
        allowInversions: true,
        extraWords: [],
      };
    case 'cordel':
      return {
        skipCapitalization: true,
        allowSentenceFragments: false,
        allowInversions: false,
        extraWords: [],
      };
    default:
      return {
        skipCapitalization: false,
        allowSentenceFragments: false,
        allowInversions: false,
        extraWords: [],
      };
  }
}
