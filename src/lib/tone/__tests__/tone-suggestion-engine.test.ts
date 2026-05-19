import { describe, it, expect } from 'vitest';
import { computeConfidence, decideToneAction, mergeSuggestions } from '../tone-suggestion-engine';
import type { LexicalScore, Diagnostic, AnalysisResult } from '../tone-types';
import type { Suggestion } from '@/ai/types';

describe('tone-suggestion-engine', () => {
  it('computeConfidence returns high for strong lexical match + diagnostics', () => {
    const lexical: LexicalScore = {
      selectedToneScore: 0.8,
      highestConflicting: null,
      highestConflictingScore: 0,
      antiPatternHits: 2,
      perLine: [0, 0],
    };
    const diagnostics: Diagnostic[] = [
      { id: 'ANTIPATTERN_HIT', severity: 'alta', dimensions: ['lexical'], details: {}, toneRef: 'TOM-005', toneRefQuote: '', canonicalExample: undefined },
    ];
    const confidence = computeConfidence(lexical, diagnostics);
    expect(confidence).toBeGreaterThan(0.5);
  });

  it('computeConfidence penalizes when no diagnostics', () => {
    const lexical: LexicalScore = {
      selectedToneScore: 0.5,
      highestConflicting: null,
      highestConflictingScore: 0,
      antiPatternHits: 0,
      perLine: [0, 0],
    };
    const confidence = computeConfidence(lexical, []);
    expect(confidence).toBeLessThan(0.5);
  });

  it('decideToneAction returns local for high confidence', () => {
    const analysis = { confidence: 0.85, diagnostics: [] } as unknown as AnalysisResult;
    expect(decideToneAction(analysis)).toBe('local');
  });

  it('decideToneAction returns hybrid for medium confidence with diagnostics', () => {
    const analysis = {
      confidence: 0.5,
      diagnostics: [{ id: 'TEST', severity: 'alta' as const }],
    } as unknown as AnalysisResult;
    expect(decideToneAction(analysis)).toBe('hybrid');
  });

  it('decideToneAction returns ai for low confidence', () => {
    const analysis = { confidence: 0.2, diagnostics: [] } as unknown as AnalysisResult;
    expect(decideToneAction(analysis)).toBe('ai');
  });

  it('mergeSuggestions merges AI alternatives into local suggestions', () => {
    const local: Suggestion[] = [
      { originalText: 'verso um', correctedText: 'verso um', explanation: 'x', type: 'tone', severity: 'media' },
    ];
    const ai: Suggestion[] = [
      { originalText: 'verso um', correctedText: 'verso corrigido', explanation: 'y', type: 'tone', alternatives: ['alt1', 'alt2'] },
    ];
    const merged = mergeSuggestions(local, ai);
    expect(merged[0].correctedText).toBe('verso corrigido');
    expect(merged[0].alternatives).toEqual(['alt1', 'alt2']);
  });
});
