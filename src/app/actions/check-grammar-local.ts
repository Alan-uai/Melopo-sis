'use server';

import { validateAll } from '@/lib/local-validator';
import type { Suggestion } from '@/ai/types';

export async function checkGrammarLocal(
  text: string,
  structure: string,
  rhyme: boolean,
): Promise<{ suggestions: Suggestion[] }> {
  if (!text.trim()) return { suggestions: [] };

  const result = await validateAll(text, structure as 'poema', rhyme);
  return { suggestions: result.suggestions };
}
