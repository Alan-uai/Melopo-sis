'use server';

import { validateSpellOnly, validateAll } from '@/lib/local-validator';
import type { Suggestion } from '@/ai/types';

const SPELL_ONLY_CACHE = new Map<string, Suggestion[]>();
const MAX_CACHE_SIZE = 500;

function hashText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

export async function checkSpellingOnly(
  text: string,
  _structure?: string
): Promise<{ suggestions: Suggestion[] }> {
  if (!text.trim()) return { suggestions: [] };

  const cacheKey = `spell:${hashText(text)}`;

  const cached = SPELL_ONLY_CACHE.get(cacheKey);
  if (cached) {
    return { suggestions: cached };
  }

  const result = await validateSpellOnly(text);

  if (SPELL_ONLY_CACHE.size >= MAX_CACHE_SIZE) {
    const firstKey = SPELL_ONLY_CACHE.keys().next().value;
    if (firstKey) SPELL_ONLY_CACHE.delete(firstKey);
  }
  SPELL_ONLY_CACHE.set(cacheKey, result.suggestions);

  return { suggestions: result.suggestions };
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