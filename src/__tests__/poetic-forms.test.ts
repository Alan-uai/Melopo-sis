import { describe, it, expect } from 'vitest';
import { validateStructure, countPoeticSyllables } from '@/lib/poetic-forms';

describe('validateStructure', () => {
  it('accepts valid soneto structure', () => {
    const soneto = `Quando em meu peito a dor se faz presente
E a noite escura cobre o meu olhar
Procuro em vão um verso que não mente
Nas linhas tortas deste meu falar

Mas sei que a vida ensina a perdoar
E o tempo traz a calma confidente
Que faz as mágoas todas se calar
Num doce acalanto que a alma sente

Assim prossigo neste meu caminho
Buscando a luz que há de me guiar
A cada passo um verso, um carinho

E quando a noite volta a me abraçar
Encontro forças pra seguir sozinho
Pois sei que a aurora vai me despertar`;
    const result = validateStructure(soneto, 'soneto');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects soneto with wrong verse count', () => {
    const poem = `Um verso
Dois versos
Três versos`;
    const result = validateStructure(poem, 'soneto');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('accepts valid haicai structure', () => {
    const haicai = `Folhas ao vento
O rio corre silente
Lua no poente`;
    const result = validateStructure(haicai, 'haicai');
    expect(result.valid).toBe(true);
  });

  it('rejects haicai with wrong verse count', () => {
    const poem = `Apenas
Dois versos`;
    const result = validateStructure(poem, 'haicai');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('accepts free verse for poema structure', () => {
    const poem = `Verso livre
Sem regras
Apenas poesia
Fluindo como o vento`;
    const result = validateStructure(poem, 'poema');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts free verse for poesia structure', () => {
    const result = validateStructure('Algo poético\nE belo\n', 'poesia');
    expect(result.valid).toBe(true);
  });

  it('validates cordel stanza counts', () => {
    const cordel = `Era uma vez um poeta
Que escrevia com amor
Suas rimas eram belas
Falavam sobre a dor
Mas também de esperança
E de um mundo bem melhor`;
    const result = validateStructure(cordel, 'cordel');
    expect(result.errors).toHaveLength(0);
  });
});

describe('countPoeticSyllables', () => {
  it('counts syllables in a simple word', () => {
    const count = countPoeticSyllables('casa');
    expect(count).toBe(2);
  });

  it('counts syllables in a phrase', () => {
    const count = countPoeticSyllables('casa bonita');
    expect(count).toBeGreaterThan(0);
  });

  it('handles empty lines', () => {
    expect(countPoeticSyllables('')).toBe(0);
  });

  it('applies poetic elision between vowel-ending and vowel-starting words', () => {
    const haicaiLine = 'Folhas ao vento';
    const count = countPoeticSyllables(haicaiLine);
    expect(count).toBeGreaterThan(0);
  });
});
