'use server';

import { ai } from '@/ai/genkit';
import { SuggestionInputSchema, SuggestionOutputSchema, type SuggestionInput, type Suggestion } from '@/ai/types';
import { loadNbrRules, loadToneRules, loadOrthographyRules, loadPunctuationRules, loadRhymeRules } from '@/lib/nbr-loader';
import { buildResearchContext } from '@/lib/nbr-rag';
import type { TextStructure } from '@/lib/poetic-forms';
import { validateAll } from '@/lib/local-validator';
import { globalCache } from '@/lib/suggestion-cache';
import { runGrammarAgent, runToneAgent } from '@/ai/agents';
import { analyzeToneLocally, mergeSuggestions } from '@/lib/tone/tone-suggestion-engine';

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
  const segSet = new Set(segments.map(s => s.trim().toLowerCase()));
  return suggestions.filter(s => {
    if (!s.originalText) return false;
    const orig = s.originalText.toLowerCase();
    if (segSet.has(orig)) return true;
    for (const seg of segSet) {
      if (seg.includes(orig) || (s.context && s.context.toLowerCase().includes(seg))) return true;
    }
    return false;
  });
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
    if (input.forceRefresh) {
      globalCache.clearByParams(cacheParams);
    }
    const { changed: changedByDiff } = globalCache.diff(input.text, cacheParams);
    const changed = input.forceRefresh
      ? input.text.split('\n').map((line, index) => ({ index, text: line }))
      : changedByDiff;

    if (changed.length === 0) {
      return { suggestions: [] };
    }

    const nbrRules = input.nbrRules || loadNbrRules(input.structure);
    const toneRules = input.toneRules || loadToneRules(input.tone);
    const orthographyRules = input.orthographyRules || loadOrthographyRules();
    const punctuationRules = input.punctuationRules || loadPunctuationRules();
    const rhymeRules = input.rhymeRules || loadRhymeRules();

    const { preferredModel, ...inputForBase } = input;
    const baseInput = {
      ...inputForBase, nbrRules, toneRules,
      orthographyRules, punctuationRules, rhymeRules,
    };

    if (input.suggestionType === 'tone') {
      const localResult = await analyzeToneLocally(
        input.text,
        input.tone,
        input.structure,
      );

      if (localResult.action === 'local') {
        globalCache.store(changed, cacheParams, localResult.suggestions);
        return { suggestions: localResult.suggestions };
      }

      const researchRules = input.researchRules || await buildResearchContext({
        structure: input.structure,
        text: input.text,
        focus: 'tone',
        tone: input.tone,
        rhyme: input.rhyme,
      });

      const toneInput = {
        ...baseInput, researchRules,
        ...(localResult.analysis ? { localToneAnalysis: JSON.stringify(localResult.analysis) } : {}),
      };

      const { suggestions, modelUsed } = await runToneAgent(input.text, toneInput, preferredModel);

      if (localResult.action === 'hybrid') {
        const merged = mergeSuggestions(localResult.suggestions, suggestions);
        globalCache.store(changed, cacheParams, merged);
        return { suggestions: merged, modelUsed };
      }

      const newSuggestions = filterSuggestionsForSegments(
        suggestions,
        changed.map(s => s.text),
      );

      globalCache.store(changed, cacheParams, newSuggestions);
      return { suggestions: newSuggestions, modelUsed };
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

    const { suggestions, modelUsed } = await runGrammarAgent(input.text, {
      ...baseInput, researchRules,
    }, preferredModel);

    const newSuggestions = filterSuggestionsForSegments(
      suggestions,
      changed.map(s => s.text),
    );

    globalCache.store(changed, cacheParams, newSuggestions);
    return { suggestions: newSuggestions, modelUsed };
  }
);
