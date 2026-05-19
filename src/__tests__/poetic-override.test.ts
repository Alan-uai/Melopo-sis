import { describe, it, expect } from 'vitest';
import { isPoeticFalsePositive, getPoeticOverride, shouldSkipGrammarRule } from '../lib/grammar/poetic-override';

describe('poetic-override', () => {
  it('identifies poetic false positives', () => {
    expect(isPoeticFalsePositive('alva')).toBe(true);
    expect(isPoeticFalsePositive('lume')).toBe(true);
    expect(isPoeticFalsePositive('casa')).toBe(false);
  });

  it('identifies poetic exceptions', () => {
    expect(isPoeticFalsePositive('mãe')).toBe(true);
    expect(isPoeticFalsePositive('céu')).toBe(true);
    expect(isPoeticFalsePositive('disse')).toBe(true);
  });

  it('returns soneto override config', () => {
    const config = getPoeticOverride('soneto');
    expect(config.skipCapitalization).toBe(true);
    expect(config.allowInversions).toBe(true);
  });

  it('returns default for prose-like structures', () => {
    const config = getPoeticOverride('poesia');
    expect(config.skipCapitalization).toBe(true);
  });

  it('flags grammar rules to skip for poetry', () => {
    expect(shouldSkipGrammarRule('UPPERCASE_SENTENCE_START')).toBe(true);
    expect(shouldSkipGrammarRule('SOME_OTHER_RULE')).toBe(false);
  });
});
