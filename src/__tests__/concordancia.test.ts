import { describe, it, expect } from 'vitest';
import { validateConcordancia } from '../lib/grammar/concordancia';

describe('concordância - sujeito-verbo', () => {
  it('detects plural subject + singular verb', async () => {
    const result = await validateConcordancia('Os meninos canta muito');
    const errors = result.errors.filter(e => e.ruleId === 'CONCORDANCIA_SUJ_VERBO');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('passes correct subject-verb agreement', async () => {
    const result = await validateConcordancia('Os meninos cantam muito');
    const errors = result.errors.filter(e => e.ruleId === 'CONCORDANCIA_SUJ_VERBO');
    expect(errors.length).toBe(0);
  });

  it('passes singular subject + singular verb', async () => {
    const result = await validateConcordancia('O menino canta muito');
    const errors = result.errors.filter(e => e.ruleId === 'CONCORDANCIA_SUJ_VERBO');
    expect(errors.length).toBe(0);
  });
});

describe('concordância - artigo-substantivo', () => {
  it('detects masculine article + feminine noun', async () => {
    const result = await validateConcordancia('o menina bonita');
    const errors = result.errors.filter(e => e.ruleId === 'CONCORDANCIA_ART_SUBST_GENERO');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('detects singular article + plural noun', async () => {
    const result = await validateConcordancia('o meninos');
    const errors = result.errors.filter(e => e.ruleId === 'CONCORDANCIA_ART_SUBST_NUMERO');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('detects plural article + singular noun', async () => {
    const result = await validateConcordancia('os menino');
    const errors = result.errors.filter(e => e.ruleId === 'CONCORDANCIA_ART_SUBST_NUMERO');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('passes correct article-noun agreement', async () => {
    const result = await validateConcordancia('a menina bonita');
    const errors = result.errors.filter(e => e.ruleId.startsWith('CONCORDANCIA_ART_SUBST'));
    expect(errors.length).toBe(0);
  });

  it('passes correct masculine article + masculine noun', async () => {
    const result = await validateConcordancia('o menino bonito');
    const errors = result.errors.filter(e => e.ruleId.startsWith('CONCORDANCIA_ART_SUBST'));
    expect(errors.length).toBe(0);
  });

  it('passes correct plural forms', async () => {
    const result = await validateConcordancia('os meninos bonitos');
    const errors = result.errors.filter(e => e.ruleId.startsWith('CONCORDANCIA_ART_SUBST'));
    expect(errors.length).toBe(0);
  });
});

describe('concordância - empty and edge cases', () => {
  it('handles empty text', async () => {
    const result = await validateConcordancia('');
    expect(result.errors.length).toBe(0);
  });

  it('handles text without nouns', async () => {
    const result = await validateConcordancia('Muito bem');
    expect(result.errors.length).toBe(0);
  });
});
