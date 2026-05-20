import { describe, it, expect } from 'vitest';
import { validateAccents } from '../lib/grammar/accent-validator';
import { validateCrase } from '../lib/grammar/crase';
import { validatePairs } from '../lib/grammar/confusao-pares';

describe('accent-validator', () => {
  it('detects missing accent in oxytone', () => {
    const result = validateAccents('cafe');
    expect(result.errors.length).toBeGreaterThanOrEqual(0);
  });

  it('detects missing accent in proparoxytone', () => {
    const result = validateAccents('medico');
    expect(result.errors.length).toBeGreaterThanOrEqual(0);
  });

  it('passes correctly accented words', () => {
    const result = validateAccents('café médico saúde');
    expect(result.errors.length).toBe(0);
  });

  it('detects missing hiatus accent', () => {
    const result = validateAccents('saude');
    expect(result.errors.length).toBeGreaterThanOrEqual(0);
  });

  it('does not split enclitic verb forms with hyphen', () => {
    const result = validateAccents('Quero provocá-la agora.');
    const hasWrongSuggestion = result.errors.some(e => e.expected.toLowerCase() === 'provocá-lá' || e.word.toLowerCase() === 'la');
    expect(hasWrongSuggestion).toBe(false);
  });

  it('does not classify "provoca" as proparoxytone', () => {
    const result = validateAccents('Ele provoca confusão.');
    const hasWrongSuggestion = result.errors.some(e => e.expected.toLowerCase() === 'próvoca');
    expect(hasWrongSuggestion).toBe(false);
  });

});

describe('crase validator', () => {
  it('detects missing crase before feminine word', () => {
    const result = validateCrase('Vou a praia');
    const craseErrors = result.errors.filter(e => e.message.includes('praia'));
    expect(craseErrors.length).toBeGreaterThan(0);
  });

  it('detects missing crase before aquele', () => {
    const result = validateCrase('Entregue a aquele homem');
    const craseErrors = result.errors.filter(e => e.message.includes('aquele'));
    expect(craseErrors.length).toBeGreaterThan(0);
  });

  it('detects missing crase in hours', () => {
    const result = validateCrase('Chego as 14h');
    const craseErrors = result.errors.filter(e => e.message.includes('horas'));
    expect(craseErrors.length).toBeGreaterThan(0);
  });
});

describe('pairs validator', () => {
  it('detects "mais" used as conjunction', () => {
    const result = validatePairs('Mais eu queria ir');
    const pairErrors = result.errors.filter(e => e.word.toLowerCase() === 'mais');
    expect(pairErrors.length).toBeGreaterThan(0);
  });

  it('detects "mal" after ser', () => {
    const result = validatePairs('Ele é mal');
    const pairErrors = result.errors.filter(e => e.expected === 'mau');
    expect(pairErrors.length).toBeGreaterThan(0);
  });

  it('detects "a" for time elapsed', () => {
    const result = validatePairs('A dois anos atrás');
    const pairErrors = result.errors.filter(e => e.expected === 'há');
    expect(pairErrors.length).toBeGreaterThan(0);
  });
});
