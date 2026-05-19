interface LTSuggestion {
  value: string;
  shortDescription?: string;
}

interface LTMatch {
  message: string;
  shortMessage: string;
  replacements: { value: string }[];
  offset: number;
  length: number;
  rule: {
    id: string;
    description: string;
    issueType: string;
    category: { id: string; name: string };
  };
}

interface LTResponse {
  software: { name: string };
  language: { name: string; code: string };
  matches: LTMatch[];
}

const LT_URL = process.env.LANGUAGETOOL_URL || 'http://localhost:8010/v2/check';

export interface LanguageToolError {
  message: string;
  shortMessage: string;
  replacements: string[];
  offset: number;
  length: number;
  ruleId: string;
  category: string;
}

export async function checkWithLanguageTool(
  text: string,
  language = 'pt-BR',
  enabledRules?: string[],
  disabledRules?: string[]
): Promise<LanguageToolError[]> {
  const params = new URLSearchParams({
    text,
    language,
  });

  if (disabledRules?.length) {
    for (const rule of disabledRules) {
      params.append('disabledRules', rule);
    }
  }

  if (enabledRules?.length) {
    for (const rule of enabledRules) {
      params.append('enabledRules', rule);
    }
  }

  try {
    const response = await fetch(LT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return [];

    const data = (await response.json()) as LTResponse;
    return data.matches.map(m => ({
      message: m.message,
      shortMessage: m.shortMessage,
      replacements: m.replacements.map(r => r.value),
      offset: m.offset,
      length: m.length,
      ruleId: m.rule.id,
      category: m.rule.category.name,
    }));
  } catch {
    return [];
  }
}

export const POETRY_DISABLED_RULES = [
  'UPPERCASE_SENTENCE_START',
  'PUNCTUATION_PARAGRAPH_END',
  'MUITO_ADJETIVO_INVERSO',
  'SENTENCE_WHITESPACE',
];

export async function checkPoetryWithLanguageTool(text: string): Promise<LanguageToolError[]> {
  return checkWithLanguageTool(text, 'pt-BR', undefined, POETRY_DISABLED_RULES);
}
