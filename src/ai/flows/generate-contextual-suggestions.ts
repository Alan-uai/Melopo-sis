'use server';

import { ai } from '@/ai/genkit';
import { SuggestionInputSchema, SuggestionOutputSchema, type SuggestionInput, type Suggestion } from '@/ai/types';
import { loadNbrRules, loadToneRules, loadOrthographyRules, loadPunctuationRules, loadRhymeRules } from '@/lib/nbr-loader';
import { buildResearchContext } from '@/lib/nbr-rag';
import type { TextStructure } from '@/lib/poetic-forms';
import { validateAll } from '@/lib/local-validator';
import { globalCache } from '@/lib/suggestion-cache';
import { runGrammarAgent, runToneAgent } from '@/ai/agents';

export async function generateContextualSuggestions(input: SuggestionInput) {
  return suggestionFlow(input);
}



function getParams(input: SuggestionInput) {
  return {
    suggestionType: input.suggestionType === 'all' ? 'grammar' as const : input.suggestionType,
    structure: input.structure,
    tone: input.tone,
    rhyme: input.rhyme,
  };
}

function filterSuggestionsForSegments(
  suggestions: Suggestion[],
  segments: string[],
): Suggestion[] {
  return suggestions.filter(s =>
    segments.some(seg =>
      (s.context && s.context.includes(seg.trim()))
      || seg.includes(s.originalText)
    )
  );
}

const suggestionFlow = ai.defineFlow(
  {
    name: 'suggestionFlow',
    inputSchema: SuggestionInputSchema,
    outputSchema: SuggestionOutputSchema,
  },
  async (input) => {
    if (!input.text.trim()) {
      return { suggestions: [] };
    }

    const cacheParams = getParams(input);
    const { changed } = globalCache.diff(input.text, cacheParams);

    if (changed.length === 0) {
      return { suggestions: [] };
    }

    const nbrRules = input.nbrRules || loadNbrRules(input.structure);
    const toneRules = input.toneRules || loadToneRules(input.tone);
    const orthographyRules = input.orthographyRules || loadOrthographyRules();
    const punctuationRules = input.punctuationRules || loadPunctuationRules();
    const rhymeRules = input.rhymeRules || loadRhymeRules();

    const baseInput = {
      ...input, nbrRules, toneRules,
      orthographyRules, punctuationRules, rhymeRules,
    };

    if (input.suggestionType === 'tone') {
      const researchRules = input.researchRules || await buildResearchContext({
        structure: input.structure,
        text: input.text,
        focus: 'tone',
        tone: input.tone,
        rhyme: input.rhyme,
      });

      const suggestions = await runToneAgent(input.text, {
        ...baseInput, researchRules,
      });

      const newSuggestions = filterSuggestionsForSegments(
        suggestions,
        changed.map(s => s.text),
      );

      globalCache.store(changed, cacheParams, newSuggestions);
      return { suggestions: newSuggestions };
    }

    const localResult = await validateAll(
      input.text,
      input.structure as TextStructure,
      input.rhyme,
    );

    const localNew = filterSuggestionsForSegments(
      localResult.suggestions,
      changed.map(s => s.text),
    );

    if (localNew.length > 0) {
      globalCache.store(changed, cacheParams, localNew);
      return { suggestions: localNew };
    }

    const researchRules = input.researchRules || await buildResearchContext({
      structure: input.structure,
      text: input.text,
      focus: 'grammar',
      rhyme: input.rhyme,
    });

    const suggestions = await runGrammarAgent(input.text, {
      ...baseInput, researchRules,
    });

    const newSuggestions = filterSuggestionsForSegments(
      suggestions,
      changed.map(s => s.text),
    );

    globalCache.store(changed, cacheParams, newSuggestions);
    return { suggestions: newSuggestions };
  }
);
