import { describe, it, expect, beforeAll } from 'vitest';
import { isWordCorrectHunspell, getHunspellSuggestions } from '../lib/spelling/espells-engine';

describe('espells engine', { timeout: 30000 }, () => {
  beforeAll(async () => {
    await isWordCorrectHunspell('warmup');
  }, 30000);

  it('rejects misspelled word', async () => {
    const correct = await isWordCorrectHunspell('xablau');
    expect(correct).toBe(false);
  });

  it('accepts correctly spelled word', async () => {
    const correct = await isWordCorrectHunspell('casa');
    expect(correct).toBe(true);
  });

  it('accepts correctly spelled word with accents', async () => {
    const correct = await isWordCorrectHunspell('coração');
    expect(correct).toBe(true);
  });

  it('provides suggestions for misspelled word', async () => {
    const suggestions = await getHunspellSuggestions('bunita');
    expect(suggestions).toContain('bonita');
  });

  it('provides suggestions for accent errors', async () => {
    const suggestions = await getHunspellSuggestions('coracao');
    expect(suggestions.length).toBeGreaterThan(0);
  });

  it('handles compound words', async () => {
    const correct = await isWordCorrectHunspell('guarda-chuva');
    expect(correct).toBe(true);
  });
});
