import { describe, it, expect } from 'vitest';
import { diagnosticToSuggestion } from '../tone-explanations';
import type { Diagnostic } from '../tone-types';

describe('tone-explanations', () => {
  it('generates coherent explanation for ABSTRACT_OVERLOAD', () => {
    const diagnostic: Diagnostic = {
      id: 'ABSTRACT_OVERLOAD',
      severity: 'media',
      dimensions: ['lexical', 'image'],
      details: { abstractRatio: 0.7, imageRatio: 0.1 },
      toneRef: 'TOM-001',
      toneRefQuote: 'Use imagens concretas para sugerir o sentimento',
      canonicalExample: 'Cláudio Manuel da Costa, "Sonetos": "Destes penhascos fez a natureza"',
    };
    const suggestion = diagnosticToSuggestion(diagnostic, 'Noite escura e fria', 'melancolico');
    expect(suggestion.explanation).toContain('TOM-001');
    expect(suggestion.explanation).toContain('melancolico');
    expect(suggestion.explanation).toContain('70%');
    expect(suggestion.explanation).toContain('10%');
    expect(suggestion.explanation).toContain('substitua declarações abstratas');
    expect(suggestion.type).toBe('tone');
    expect(suggestion.severity).toBe('media');
  });

  it('includes TOM rule reference in TONE_POLLUTION', () => {
    const diagnostic: Diagnostic = {
      id: 'TONE_POLLUTION',
      severity: 'alta',
      dimensions: ['lexical'],
      details: { conflictingTone: 'jubiloso', conflictingRatio: 0.8 },
      toneRef: 'TOM-005',
      toneRefQuote: 'Evite mesclar léxico de tons opostos',
    };
    const suggestion = diagnosticToSuggestion(diagnostic, 'Alegria que sufoca', 'melancolico');
    expect(suggestion.explanation).toContain('jubiloso');
    expect(suggestion.explanation).toContain('TOM-005');
    expect(suggestion.explanation).toContain('80%');
    expect(suggestion.correctedText).toBe('Alegria que sufoca');
  });

  it('handles unknown diagnostic id gracefully', () => {
    const diagnostic: Diagnostic = {
      id: 'UNKNOWN_TEST',
      severity: 'baixa',
      dimensions: [],
      details: {},
      toneRef: 'TOM-001',
      toneRefQuote: 'Regra de exemplo',
    };
    const suggestion = diagnosticToSuggestion(diagnostic, 'texto', 'melancolico');
    expect(suggestion.explanation).toContain('UNKNOWN_TEST');
    expect(suggestion.type).toBe('tone');
  });

  it('sets originalText from line number when available', () => {
    const diagnostic: Diagnostic = {
      id: 'TONE_POLLUTION',
      severity: 'alta',
      line: 2,
      dimensions: ['lexical'],
      details: { conflictingTone: 'jubiloso', conflictingRatio: 0.8 },
      toneRef: 'TOM-005',
      toneRefQuote: '',
    };
    const text = 'primeiro verso\nsegundo verso alvo\nterceiro verso';
    const suggestion = diagnosticToSuggestion(diagnostic, text, 'melancolico');
    expect(suggestion.originalText).toBe('segundo verso alvo');
  });
});
