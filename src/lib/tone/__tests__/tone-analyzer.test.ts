import { describe, it, expect } from 'vitest';
import { analyzeTone } from '../tone-analyzer';

describe('tone-analyzer', () => {
  it('detects melancolico in Augusto dos Anjos-style text', async () => {
    const text = 'Desce a treva, e no peito um vazio profundo / como a cinza que sobra do que já foi mundo';
    const result = await analyzeTone(text, 'melancolico', 'poema');
    expect(result).toBeDefined();
    expect(result.lexical.selectedToneScore).toBeGreaterThan(0);
  });

  it('detects romantico in Goncalves Dias-style text', async () => {
    const text = 'Teu nome é flor que não se murcha ao vento / e arde em mim como um lume eterno e brando';
    const result = await analyzeTone(text, 'romantico', 'poema');
    expect(result).toBeDefined();
    expect(result.lexical).toBeDefined();
  });

  it('returns low confidence for empty text', async () => {
    const result = await analyzeTone('', 'melancolico', 'poema');
    expect(result.confidence).toBeLessThan(0.5);
  });

  it('all 6 analysis passes produce results', async () => {
    const text = 'Noite escura, silêncio profundo / chora o vento sua dor no mundo';
    const result = await analyzeTone(text, 'melancolico', 'poema');
    expect(result.lexical).toBeDefined();
    expect(result.image).toBeDefined();
    expect(result.register).toBeDefined();
    expect(result.figure).toBeDefined();
    expect(result.emotion).toBeDefined();
    expect(result.rhythm).toBeDefined();
    expect(typeof result.confidence).toBe('number');
    expect(Array.isArray(result.diagnostics)).toBe(true);
  });
});
