'use server';

import { validateAll } from '@/lib/local-validator';
import type { TextStructure as PoeticTextStructure } from '@/lib/poetic-forms';
import type { TextStructure, Suggestion } from '@/ai/types';

export async function checkGrammarLocal(
  text: string,
  structure: TextStructure,
  rhyme: boolean,
): Promise<{ suggestions: Suggestion[] }> {
  if (!text.trim()) return { suggestions: [] };
  const result = await validateAll(text, structure as PoeticTextStructure, rhyme);
  return { suggestions: result.suggestions };
}
