import type { LexicalScore, Diagnostic, ToneAction, ToneSuggestionResult, AnalysisResult } from './tone-types';
import { diagnosticToSuggestion } from './tone-explanations';
import { analyzeTone } from './tone-analyzer';
import type { Suggestion } from '@/ai/types';

export function computeConfidence(lexical: LexicalScore, diagnostics: Diagnostic[]): number {
  let score = lexical.selectedToneScore * 0.4;
  score += (1 - lexical.highestConflictingScore) * 0.2;

  const highSeverityCount = diagnostics.filter(d => d.severity === 'alta').length;
  score += Math.min(highSeverityCount * 0.15, 0.3);

  if (diagnostics.length === 0) score *= 0.5;

  return Math.min(score, 1);
}

export function decideToneAction(analysis: AnalysisResult): ToneAction {
  if (
    analysis.confidence >= 0.75 ||
    (analysis.confidence >= 0.6 && analysis.diagnostics.length >= 1)
  ) {
    return 'local';
  }

  if (
    analysis.confidence >= 0.4 &&
    analysis.diagnostics.length >= 1
  ) {
    return 'hybrid';
  }

  return 'ai';
}

export function buildToneSuggestions(
  analysis: AnalysisResult,
  text: string,
  tone: string,
): ToneSuggestionResult {
  const suggestions: Suggestion[] = analysis.diagnostics
    .filter(d => d.severity !== 'baixa' || analysis.diagnostics.length <= 2)
    .map(d => diagnosticToSuggestion(d, text, tone));

  return {
    action: decideToneAction(analysis),
    suggestions,
    confidence: analysis.confidence,
    analysis,
  };
}

export function mergeSuggestions(local: Suggestion[], ai: Suggestion[]): Suggestion[] {
  const aiByOriginal = new Map(ai.map(s => [s.originalText, s]));
  return local.map(s => {
    const aiMatch = aiByOriginal.get(s.originalText);
    if (aiMatch) {
      return { ...s, correctedText: aiMatch.correctedText, alternatives: aiMatch.alternatives };
    }
    return s;
  });
}

export async function analyzeToneLocally(
  text: string,
  tone: string,
  structure: string,
): Promise<ToneSuggestionResult> {
  const analysis = await analyzeTone(text, tone, structure);
  return buildToneSuggestions(analysis, text, tone);
}
