import { describe, it, expect } from 'vitest';
import { countPoeticSyllables } from '../lib/prosody/metaplasm-engine';
import { detectMeter } from '../lib/prosody/metaplasm-engine';

describe('metaplasm-engine - counting', () => {
  it('counts simple word syllables', () => {
    expect(countPoeticSyllables('casa')).toBe(2);
    expect(countPoeticSyllables('tempo')).toBe(2);
    expect(countPoeticSyllables('paralelepípedo')).toBe(7);
  });

  it('applies sinalefa between vowel-ending and vowel-starting words', () => {
    expect(countPoeticSyllables('o amor')).toBe(3);
    expect(countPoeticSyllables('a alma')).toBe(3);
  });

  it('applies elisao for unstressed final vowels', () => {
    expect(countPoeticSyllables('de amor')).toBe(2);
    expect(countPoeticSyllables('uma alma')).toBe(3);
  });

  it('applies syneresis within words', () => {
    const withSyn = countPoeticSyllables('poesia', { syneresis: true, sinalefa: false, elisao: false });
    const withoutSyn = countPoeticSyllables('poesia', { syneresis: false, sinalefa: false, elisao: false });
    expect(withSyn).toBeLessThanOrEqual(withoutSyn);
  });

  it('handles empty text', () => {
    expect(countPoeticSyllables('')).toBe(0);
    expect(countPoeticSyllables('   ')).toBe(0);
  });
});

describe('metaplasm-engine - meter detection', () => {
  it('detects redondilha maior', () => {
    const result = detectMeter('No meio do caminho');
    expect(result.syllables).toBe(7);
    expect(result.type).toContain('redondilha');
  });

  it('detects decassílabo', () => {
    const result = detectMeter('As palavras não nascem amarradas');
    expect(result.syllables).toBe(10);
    expect(result.type).toContain('decassílabo');
  });

  it('detects alexandrino', () => {
    const result = detectMeter('Há tão pouco a dizer e tão pouco a fazer');
    expect(result.syllables).toBeGreaterThanOrEqual(10);
  });

  it('classifies decassílabo accent pattern', () => {
    const result = detectMeter('As palavras não nascem amarradas');
    expect(result.accentPattern).toBeTruthy();
  });
});
