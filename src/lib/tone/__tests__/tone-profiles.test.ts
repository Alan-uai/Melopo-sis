import { describe, it, expect } from 'vitest';
import { getToneProfiles } from '../tone-profiles';

describe('tone-profiles', () => {
  const sections = getToneProfiles();

  it('parses 19 tone sections', () => {
    expect(sections.length).toBe(19);
  });

  it('parses all TOM rules (TOM-001 to TOM-085)', () => {
    const allProfiles = sections.flatMap(s => s.profiles);
    const codes = allProfiles.map(p => p.code);
    expect(allProfiles.length).toBe(85);
    expect(codes[0]).toBe('TOM-001');
    expect(codes[codes.length - 1]).toBe('TOM-085');
  });

  it('extracts keywords from melancolico vocabulario profile', () => {
    const melancolico = sections.find(s => s.name === 'melancolico');
    expect(melancolico).toBeDefined();
    const vocab = melancolico!.profiles.find(p => p.category === 'vocabulario');
    expect(vocab).toBeDefined();
    expect(vocab!.keywords.length).toBeGreaterThan(3);
    expect(vocab!.keywords).toContain('treva');
    expect(vocab!.keywords).toContain('luto');
  });

  it('categorizes profiles correctly', () => {
    const categories = new Set(sections.flatMap(s =>
      s.profiles.map(p => p.category)
    ));
    expect(categories.has('vocabulario')).toBe(true);
    expect(categories.has('imagens')).toBe(true);
    expect(categories.has('anti-padrao')).toBe(true);
  });

  it('each profile has required fields', () => {
    for (const section of sections) {
      for (const profile of section.profiles) {
        expect(profile.code).toBeTruthy();
        expect(profile.title).toBeTruthy();
        expect(profile.description).toBeTruthy();
        expect(['alta', 'media', 'baixa']).toContain(profile.severity);
      }
    }
  });
});
