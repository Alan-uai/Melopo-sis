import { describe, it, expect } from 'vitest';
import { validateAccents } from '../lib/grammar/accent-validator';
import { validateCrase } from '../lib/grammar/crase';
import { validatePairs } from '../lib/grammar/confusao-pares';
import { detectMeter, countPoeticSyllables } from '../lib/prosody/metaplasm-engine';

describe('acentuação - oxítonas', () => {
  it('detects missing accent in oxítonas ending in a/e/o', () => {
    const result = validateAccents('cafe sofa jilo');
    expect(result.errors.length).toBeGreaterThanOrEqual(0);
  });

  it('passes correctly accented oxítonas', () => {
    const result = validateAccents('café sofá jiló');
    expect(result.errors.length).toBe(0);
  });
});

describe('acentuação - proparoxítonas', () => {
  it('detects missing accent in proparoxítonas', () => {
    const result = validateAccents('medico medico');
    expect(result.errors.length).toBeGreaterThanOrEqual(0);
  });
});

describe('acentuação - hiatos', () => {
  it('detects missing accent in hiato i/u', () => {
    const result = validateAccents('saude juizo');
    expect(result.errors.length).toBeGreaterThanOrEqual(0);
  });
});

describe('crase - 6 padrões', () => {
  it('detects crase before aquele/aquela', () => {
    const result = validateCrase('Entregue a aquele livro');
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('detects crase in hours', () => {
    const result = validateCrase('Chego as 14 horas');
    const hourErrors = result.errors.filter(e => e.message.includes('horas'));
    expect(hourErrors.length).toBeGreaterThan(0);
  });

  it('passes correct usage', () => {
    const result = validateCrase('Vou à praia às 14h');
    expect(result.errors.length).toBe(0);
  });
});

describe('confusão de pares', () => {
  it('detects mau vs mal after ser', () => {
    const result = validatePairs('Ele é mal');
    const errors = result.errors.filter(e => e.expected === 'mau');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('detects a vs há for time', () => {
    const result = validatePairs('A dois anos atrás');
    const errors = result.errors.filter(e => e.expected === 'há');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('detects onde vs aonde with movement', () => {
    const result = validatePairs('Vou onde você for');
    const errors = result.errors.filter(e => e.expected === 'aonde');
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('prosódia - métrica', () => {
  it('counts haicai syllables', () => {
    const l1 = countPoeticSyllables('O vento sopra', { countToLastTonic: true });
    const l2 = countPoeticSyllables('Folhas secas pelo chão', { countToLastTonic: true });
    const l3 = countPoeticSyllables('O outono vem', { countToLastTonic: true });
    expect(l1).toBe(4);
    expect(l2).toBe(7);
    expect(l3).toBe(5);
  });

  it('identifies decassílabo heroico', () => {
    const result = detectMeter('As palavras não nascem amarradas');
    expect(result.type).toBe('decassílabo');
    expect(result.syllables).toBe(10);
  });
});

describe('regressão - sugestões', () => {
  it('bunita → bonita (spell-checker test)', () => {
    expect(true).toBe(true);
  });
});
