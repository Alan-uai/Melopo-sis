import { describe, it, expect } from 'vitest';
import { NgramLM } from '@/lib/spelling/ngram-lm';

function makeLM(texts: string[]): NgramLM {
  const lm = new NgramLM();
  lm.train(texts);
  return lm;
}

describe('NgramLM', () => {
  it('scores unigrams from training corpus', () => {
    const lm = makeLM(['o tempo passa rápido']);
    expect(lm.unigramProb('tempo')).toBeGreaterThan(0);
    expect(lm.unigramProb('xyz')).toBe(0);
  });

  it('scores bigrams higher for likely pairs', () => {
    const lm = makeLM([
      'o tempo passa',
      'o tempo voa',
      'o tempo é relativo',
    ]);
    const withTempo = lm.bigramProb('o', 'tempo');
    const withoutTempo = lm.bigramProb('o', 'xyz');
    expect(withTempo).toBeGreaterThan(withoutTempo);
  });

  it('ranks suggestions by context', () => {
    const lm = makeLM([
      'o tempo passa',
      'o tempo voa',
      'a casa é bonita',
      'o teto da casa',
    ]);

    const candidates = ['tempo', 'teto'];
    const rankedContextual = lm.rankSuggestions(candidates, ['o'], ['passa']);
    expect(rankedContextual[0]).toBe('tempo');

    const candidatesCasa = ['casa', 'coisa'];
    const rankedCasa = lm.rankSuggestions(candidatesCasa, ['a'], ['é']);
    expect(rankedCasa[0]).toBe('casa');
  });

  it('handles casing normalization', () => {
    const lm = makeLM(['O Tempo Passa']);
    expect(lm.unigramProb('tempo')).toBeGreaterThan(0);
    expect(lm.unigramProb('Tempo')).toBeGreaterThan(0);
  });

  it('handles empty corpus', () => {
    const lm = new NgramLM();
    expect(lm.unigramProb('teste')).toBe(0);
    const ranked = lm.rankSuggestions(['a', 'b'], ['o'], ['c']);
    expect(ranked).toEqual(['a', 'b']);
  });

  it('serializes and deserializes correctly', () => {
    const lm = makeLM(['o tempo passa rápido']);
    const json = lm.serialize();
    const restored = NgramLM.deserialize(json);
    expect(restored.unigramProb('tempo')).toBe(lm.unigramProb('tempo'));
    expect(restored.size).toBe(lm.size);
  });

  it('handles casing normalization', () => {
    const lm = makeLM(['O Tempo Passa']);
    expect(lm.unigramProb('tempo')).toBeGreaterThan(0);
    expect(lm.unigramProb('Tempo')).toBeGreaterThan(0);
  });

  it('scores in context with left and right', () => {
    const lm = makeLM([
      'mar azul celeste',
      'céu azul claro',
      'mar agitado escuro',
    ]);
    const scoreAzul = lm.scoreInContext('azul', ['mar'], ['celeste']);
    const scoreAgitado = lm.scoreInContext('agitado', ['mar'], ['escuro']);
    const scoreUnknown = lm.scoreInContext('xyz', ['mar'], ['celeste']);

    expect(scoreAzul).toBeGreaterThan(scoreUnknown);
  });
});
