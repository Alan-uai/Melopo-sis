import type { LexicalScore, Diagnostic, ToneAction, ToneSuggestionResult, AnalysisResult, ImageScore, RegisterScore, FigureScore, EmotionScore, RhythmScore } from './tone-types';
import { diagnosticToSuggestion } from './tone-explanations';
import { analyzeTone } from './tone-analyzer';
import type { Suggestion } from '@/ai/types';

export function computeConfidence(
  lexical: LexicalScore,
  diagnostics: Diagnostic[],
  image?: ImageScore,
  register?: RegisterScore,
  figure?: FigureScore,
  emotion?: EmotionScore,
  rhythm?: RhythmScore,
): number {
  let score = lexical.selectedToneScore * 0.25;
  score += (1 - lexical.highestConflictingScore) * 0.10;

  if (image) score += image.ratio * 0.10;
  if (register) score += (register.isConsistent ? 1 : 0) * 0.05;
  if (figure) score += Math.min(figure.density, 0.5) * 0.05;
  if (emotion) score += Math.abs(emotion.compoundScore) * 0.05;
  if (rhythm) score += (rhythm.isConsistent ? 1 : 0) * 0.05;

  const nonCircularIds = new Set([
    'REGISTER_LEAK', 'RHYTHM_MISMATCH', 'FIGURE_OVERLOAD',
    'FIGURE_SPARSE', 'RHYTHM_MONOTONY',
  ]);
  const nonCircularCount = diagnostics.filter(d => nonCircularIds.has(d.id)).length;
  score += Math.min(nonCircularCount * 0.05, 0.15);

  return Math.min(score, 1);
}

export function decideToneAction(analysis: AnalysisResult): ToneAction {
  const highSeverityCount = analysis.diagnostics.filter(d => d.severity === 'alta').length;

  if (analysis.confidence >= 0.65 && highSeverityCount <= 1) {
    return 'local';
  }

  return 'ai';
}

export function buildToneSuggestions(
  analysis: AnalysisResult,
  text: string,
  tone: string,
): ToneSuggestionResult {
  const nonTrivialDiagnostics = analysis.diagnostics.filter(d => {
    if (d.severity === 'baixa') {
      return analysis.diagnostics.filter(dd => dd.severity !== 'baixa').length === 0;
    }
    return true;
  });

  const suggestions: Suggestion[] = nonTrivialDiagnostics
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
