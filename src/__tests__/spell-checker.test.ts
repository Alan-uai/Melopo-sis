import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/build-word-set', () => ({
  getWordSet: vi.fn().mockResolvedValue(
    new Set([
      'casa', 'vento', 'poema', 'poesia', 'amor', 'dor',
      'noite', 'lua', 'sol', 'mar', 'céu', 'terra',
      'feliz', 'triste', 'bela', 'vida', 'morte', 'sonho',
      'faz', 'diz', 'quer', 'pode', 'sabe', 'vai', 'vem',
      'tempo', 'mundo', 'alma', 'coração', 'silêncio',
      'muito', 'pouco', 'todo', 'mesmo', 'grande',
      'bonito', 'bonita',
    ])
  ),
}));

import { checkText } from '@/lib/spell-checker';

describe('checkText', () => {
  it('returns no errors for correctly spelled text', async () => {
    const result = await checkText('casa bonita');
    expect(result.errors).toHaveLength(0);
  });

  it('detects misspelled words', async () => {
    const result = await checkText('casa bunita');
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].word).toBe('bunita');
  });

  it('provides suggestions for misspelled words', async () => {
    const result = await checkText('casa bunita');
    expect(result.errors[0].suggestions.length).toBeGreaterThan(0);
  });

  it('handles empty text', async () => {
    const result = await checkText('');
    expect(result.errors).toHaveLength(0);
  });

  it('handlines text with only numbers', async () => {
    const result = await checkText('123 456');
    expect(result.errors).toHaveLength(0);
  });

  it('reports correct position of misspelling', async () => {
    const result = await checkText('uma casa bunita');
    const error = result.errors.find(e => e.word === 'bunita');
    expect(error).toBeDefined();
    expect(error!.position).toBe(9);
  });
});
