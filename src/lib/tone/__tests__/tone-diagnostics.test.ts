import { describe, it, expect } from 'vitest';
import { computeDiagnostics } from '../tone-diagnostics';
import type { LexicalScore, ImageScore, RegisterScore, FigureScore, EmotionScore, RhythmScore } from '../tone-types';

function makeResult(overrides: Partial<{
  lexical: Partial<LexicalScore>;
  image: Partial<ImageScore>;
  register: Partial<RegisterScore>;
  figure: Partial<FigureScore>;
  emotion: Partial<EmotionScore>;
  rhythm: Partial<RhythmScore>;
}> = {}) {
  const defaults = {
    lexical: {
      selectedToneScore: 0.6,
      highestConflicting: null,
      highestConflictingScore: 0,
      antiPatternHits: 0,
      perLine: [0, 0, 0],
    },
    image: { score: 5, total: 10, ratio: 0.5 },
    register: { formalScore: 0.7, informalScore: 0.3, isConsistent: true, dominantRegister: 'formal' as const },
    figure: { detected: [], density: 0 },
    emotion: { positiveRatio: 0.2, negativeRatio: 0.5, neutralRatio: 0.3, compoundScore: -0.3, dominantEmotion: 'negativo' },
    rhythm: { avgSyllables: 8, variance: 2, hasEnjambement: false, isConsistent: true },
  };

  return {
    lexical: { ...defaults.lexical, ...overrides.lexical },
    image: { ...defaults.image, ...overrides.image },
    register: { ...defaults.register, ...overrides.register },
    figure: { ...defaults.figure, ...overrides.figure },
    emotion: { ...defaults.emotion, ...overrides.emotion },
    rhythm: { ...defaults.rhythm, ...overrides.rhythm },
  };
}

describe('tone-diagnostics', () => {
  it('detects ABSTRACT_OVERLOAD', () => {
    const result = makeResult({
      lexical: { selectedToneScore: 0.8 },
      image: { ratio: 0.1 },
    });
    const diagnostics = computeDiagnostics(result);
    expect(diagnostics.some(d => d.id === 'ABSTRACT_OVERLOAD')).toBe(true);
  });

  it('detects TONE_POLLUTION', () => {
    const result = makeResult({
      lexical: {
        selectedToneScore: 0.5,
        highestConflicting: 'romantico',
        highestConflictingScore: 0.4,
      },
    });
    const diagnostics = computeDiagnostics(result);
    expect(diagnostics.some(d => d.id === 'TONE_POLLUTION')).toBe(true);
  });

  it('detects REGISTER_LEAK', () => {
    const result = makeResult({
      register: { isConsistent: false, formalScore: 0.5, informalScore: 0.5, dominantRegister: 'mixed' },
    });
    const diagnostics = computeDiagnostics(result);
    expect(diagnostics.some(d => d.id === 'REGISTER_LEAK')).toBe(true);
  });

  it('detects ANTIPATTERN_HIT', () => {
    const result = makeResult({
      lexical: { antiPatternHits: 3 },
    });
    const diagnostics = computeDiagnostics(result);
    expect(diagnostics.some(d => d.id === 'ANTIPATTERN_HIT')).toBe(true);
  });
});
