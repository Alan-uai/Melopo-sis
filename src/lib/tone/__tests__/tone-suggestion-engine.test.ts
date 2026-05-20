import { describe, it, expect } from 'vitest';
import { computeConfidence, decideToneAction, mergeSuggestions } from '../tone-suggestion-engine';
import type { LexicalScore, Diagnostic, AnalysisResult, ImageScore, RegisterScore, FigureScore, EmotionScore, RhythmScore } from '../tone-types';
import type { Suggestion } from '@/ai/types';

const mockImage: ImageScore = { score: 5, total: 10, ratio: 0.5 };
const mockRegister: RegisterScore = { formalScore: 0.8, informalScore: 0.2, isConsistent: true, dominantRegister: 'formal' };
const mockFigure: FigureScore = { detected: [], density: 0.2 };
const mockEmotion: EmotionScore = { positiveRatio: 0.3, negativeRatio: 0.1, neutralRatio: 0.6, compoundScore: 0.2, dominantEmotion: 'positivo' };
const mockRhythm: RhythmScore = { avgSyllables: 7, variance: 2.5, hasEnjambement: false, isConsistent: true };

describe('tone-suggestion-engine', () => {
  it('computeConfidence returns high for strong lexical match + diagnostics', () => {
    const lexical: LexicalScore = {
      selectedToneScore: 0.8,
      highestConflicting: null,
      highestConflictingScore: 0,
      antiPatternHits: 0,
      perLine: [0, 0],
    };
    const diagnostics: Diagnostic[] = [
      { id: 'REGISTER_LEAK', severity: 'media', dimensions: ['register'], details: {}, toneRef: 'TOM-001', toneRefQuote: '', canonicalExample: undefined },
      { id: 'RHYTHM_MISMATCH', severity: 'baixa', dimensions: ['rhythm'], details: {}, toneRef: 'TOM-004', toneRefQuote: '', canonicalExample: undefined },
    ];
    const confidence = computeConfidence(lexical, diagnostics, mockImage, mockRegister, mockFigure, mockEmotion, mockRhythm);
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
    const confidence = computeConfidence(lexical, [], mockImage, mockRegister, mockFigure, mockEmotion, mockRhythm);
    expect(confidence).toBeLessThan(0.5);
  });

  it('decideToneAction returns local for high confidence', () => {
    const analysis = { confidence: 0.85, diagnostics: [] } as unknown as AnalysisResult;
    expect(decideToneAction(analysis)).toBe('local');
  });

  it('decideToneAction returns ai for medium confidence with high severity', () => {
    const analysis = {
      confidence: 0.5,
      diagnostics: [{ id: 'TEST', severity: 'alta' as const }],
    } as unknown as AnalysisResult;
    expect(decideToneAction(analysis)).toBe('ai');
  });

  it('decideToneAction returns local for high confidence with no high severity', () => {
    const analysis = {
      confidence: 0.7,
      diagnostics: [{ id: 'TEST', severity: 'baixa' as const }],
    } as unknown as AnalysisResult;
    expect(decideToneAction(analysis)).toBe('local');
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
      { originalText: 'verso um', correctedText: 'verso corrigido', explanation: 'y', type: 'tone', alternatives: [{ text: 'alt1', explanation: 'exp1' }, { text: 'alt2', explanation: 'exp2' }] },
    ];
    const merged = mergeSuggestions(local, ai);
    expect(merged[0].correctedText).toBe('verso corrigido');
    expect(merged[0].alternatives).toEqual([{ text: 'alt1', explanation: 'exp1' }, { text: 'alt2', explanation: 'exp2' }]);
  });
});
