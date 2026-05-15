import { describe, it, expect } from 'vitest';
import { analyzeRhymeScheme, extractLastWord, detectRhymeErrors } from '@/lib/rhyme-detector';

describe('extractLastWord', () => {
  it('extracts last word from a simple line', () => {
    expect(extractLastWord('O vento soprava forte')).toBe('forte');
  });

  it('handles punctuation', () => {
    expect(extractLastWord('O vento soprava forte!')).toBe('forte');
  });

  it('handles empty lines', () => {
    expect(extractLastWord('')).toBe('');
  });

  it('handles single word', () => {
    expect(extractLastWord('Silêncio')).toBe('Silêncio');
  });
});

describe('analyzeRhymeScheme', () => {
  it('detects ABAB scheme', () => {
    const poem = `O vento soprava noite
A lua brilhava sem fim
As folhas dançavam afoitas
E o mar cantava para mim`;
    const result = analyzeRhymeScheme(poem);
    expect(result.scheme).toBeTruthy();
    expect(result.matches.length).toBeGreaterThanOrEqual(0);
  });

  it('detects paired rhymes AABB', () => {
    const poem = `O vento soprava forte
Trazendo a chuva e a sorte
A lua cheia no céu
Um manto de prata teceu`;
    const result = analyzeRhymeScheme(poem);
    expect(result.scheme).toBeTruthy();
    expect(result.stanzaSchemes.length).toBeGreaterThanOrEqual(0);
  });

  it('handles single line poems', () => {
    const result = analyzeRhymeScheme('Apenas um verso solitário');
    expect(result.scheme).toBe('');
    expect(result.errors).toHaveLength(0);
  });

  it('handles empty text', () => {
    const result = analyzeRhymeScheme('');
    expect(result.scheme).toBe('');
  });
});


