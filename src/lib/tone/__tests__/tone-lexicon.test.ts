import { describe, it, expect } from 'vitest';
import { getToneProfiles } from '../tone-profiles';
import { getToneAutomatons, getAntiPatternAutomaton, getRegisterAutomaton } from '../tone-lexicon';

describe('tone-lexicon', () => {
  const automatons = getToneAutomatons();

  it('builds 19 automatons matching 19 tone sections', () => {
    const sections = getToneProfiles();
    expect(automatons.length).toBe(sections.length);
    expect(automatons.length).toBe(19);
  });

  it('each automaton has name, ac, keywords, and profileCodes', () => {
    for (const auto of automatons) {
      expect(auto.name).toBeTruthy();
      expect(auto.ac).toBeDefined();
      expect(Array.isArray(auto.keywords)).toBe(true);
      expect(Array.isArray(auto.profileCodes)).toBe(true);
    }
  });

  it('matches tone keywords against text containing known words', () => {
    const melancolico = automatons.find(a => a.name === 'melancolico');
    expect(melancolico).toBeDefined();
    const matches = melancolico!.ac.search('treva luto sombra vazio pranto');
    expect(matches.length).toBeGreaterThan(0);
  });

  it('returns zero matches for unrelated text', () => {
    const jubiloso = automatons.find(a => a.name === 'jubiloso');
    expect(jubiloso).toBeDefined();
    const matches = jubiloso!.ac.search('treva luto sombra');
    expect(matches.length).toBe(0);
  });

  it('builds anti-pattern automaton', () => {
    const anti = getAntiPatternAutomaton();
    expect(anti).toBeDefined();
    expect(anti.search('').length).toBe(0);
  });

  it('builds register automaton', () => {
    const reg = getRegisterAutomaton();
    expect(reg).toBeDefined();
    const hits = reg.search('portanto outrossim ademais');
    expect(hits.length).toBeGreaterThan(0);
  });
});
