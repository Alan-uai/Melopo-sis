import { describe, it, expect, beforeAll } from 'vitest';
import { isWordCorrect, getWordSuggestions } from '@/lib/dictionary';

describe('dictionary integration - palavras básicas', () => {
  it.each([
    'lindo', 'linda', 'lindos', 'lindas',
    'querido', 'querida', 'queridos', 'queridas',
    'amor', 'casa', 'bonito', 'bonita', 'beleza',
    'feliz', 'triste', 'grande', 'bela',
    'saudade', 'sonho', 'vida', 'morte',
  ])('reconhece "%s"', async (word) => {
    expect(await isWordCorrect(word)).toBe(true);
  });
});

describe('dictionary integration - conjugações verbais', () => {
  it.each([
    'cantar', 'canto', 'cantas', 'canta', 'cantamos', 'cantais', 'cantam',
    'cantei', 'cantaste', 'cantou', 'cantaram', 'cantava',
    'cantaremos', 'cantaria', 'cantasse', 'cantando',
    'ser', 'sou', 'és', 'é', 'somos', 'são',
    'ter', 'tenho', 'tens', 'tem', 'temos', 'têm',
    'vir', 'venho', 'vens', 'vem', 'vimos', 'vêm',
    'poder', 'posso', 'podes', 'pode', 'podemos', 'podem',
    'fazer', 'faço', 'fazes', 'faz', 'fazemos', 'fazem',
  ])('reconhece verbo "%s"', async (word) => {
    expect(await isWordCorrect(word)).toBe(true);
  });
});

describe('dictionary integration - plural e feminino', () => {
  it.each([
    'casa', 'casas',
    'flor', 'flores',
    'coração', 'corações',
    'pão', 'pães',
    'leão', 'leões',
    'mão', 'mãos',
    'professor', 'professora',
    'cantor', 'cantora',
    'ator', 'atriz',
    'imperador', 'imperatriz',
    'europeu', 'europeia',
  ])('reconhece flexão "%s"', async (word) => {
    expect(await isWordCorrect(word)).toBe(true);
  });
});

describe('dictionary integration - advérbios e superlativos', () => {
  it.each([
    'rapidamente', 'felizmente', 'tristemente',
    'facilmente', 'naturalmente', 'perfeitamente',
    'lindíssimo', 'lindíssima', 'belíssimo',
  ])('reconhece "%s"', async (word) => {
    expect(await isWordCorrect(word)).toBe(true);
  });
});

describe('dictionary integration - palavras com acentos', () => {
  it.each([
    'paralelepípedo', 'quilômetro', 'ônibus',
    'pé', 'só', 'pôr', 'pá', 'mês',
    'herói', 'chapéu', 'céu',
    'saúde', 'juízo', 'faísca',
    'órfão', 'órgão', 'sótão',
  ])('reconhece "%s"', async (word) => {
    expect(await isWordCorrect(word)).toBe(true);
  });
});

describe('dictionary integration - nomes próprios comuns', () => {
  it.each([
    'João', 'Maria', 'José', 'Ana',
    'Pedro', 'Paulo',
    'Brasil', 'Portugal', 'Angola',
  ])('reconhece "%s"', async (word) => {
    expect(await isWordCorrect(word)).toBe(true);
  });
});

describe('dictionary integration - palavras inexistentes', () => {
  it.each([
    'xablau', 'blorple',
    'lindx', 'queridx',
  ])('rejeita "%s"', async (word) => {
    expect(await isWordCorrect(word)).toBe(false);
  });
});

describe('dictionary integration - sugestões', { timeout: 180000 }, () => {
  beforeAll(async () => {
    const { getAllWords } = await import('@/lib/dictionary');
    await getAllWords();
  }, 60000);

  it('fornece sugestões para palavra com erro', async () => {
    const suggestions = await getWordSuggestions('lindx');
    expect(suggestions).toContain('lindo');
    expect(suggestions).toContain('linda');
  });

  it('fornece sugestões para bunita', async () => {
    const suggestions = await getWordSuggestions('bunita');
    expect(suggestions).toContain('bonita');
  });
});
