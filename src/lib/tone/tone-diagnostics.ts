import type { AnalysisResult, Diagnostic } from './tone-types';
import { getToneProfiles } from './tone-profiles';

function getToneRefQuote(code: string): { toneRef: string; toneRefQuote: string; canonicalExample?: string } {
  const sections = getToneProfiles();
  for (const section of sections) {
    for (const p of section.profiles) {
      if (p.code === code) {
        return {
          toneRef: p.code,
          toneRefQuote: p.description ? p.description.slice(0, 80) + '...' : '',
          canonicalExample: p.canonicalExample
            ? `${p.canonicalExample.author}, "${p.canonicalExample.work}": "${p.canonicalExample.verse}"`
            : undefined,
        };
      }
    }
  }
  return { toneRef: code, toneRefQuote: '' };
}

type DiagnosticFactory = (s: AnalysisResult) => Diagnostic | null;

const DIAGNOSTICS: DiagnosticFactory[] = [
  (s) => s.lexical.selectedToneScore > 0.5 && s.image.ratio < 0.3
    ? {
        id: 'ABSTRACT_OVERLOAD',
        severity: 'media',
        dimensions: ['lexical', 'image'],
        details: { abstractRatio: s.lexical.selectedToneScore, imageRatio: s.image.ratio },
        ...getToneRefQuote('TOM-001'),
      }
    : null,

  (s) => s.lexical.highestConflicting && s.lexical.highestConflictingScore > s.lexical.selectedToneScore * 0.7
    ? {
        id: 'TONE_POLLUTION',
        severity: 'alta',
        dimensions: ['lexical'],
        details: {
          conflictingTone: s.lexical.highestConflicting,
          conflictingRatio: s.lexical.highestConflictingScore,
        },
        ...getToneRefQuote('TOM-005'),
      }
    : null,

  (s) => !s.register.isConsistent
    ? {
        id: 'REGISTER_LEAK',
        severity: 'media',
        dimensions: ['register'],
        details: { formalScore: s.register.formalScore, informalScore: s.register.informalScore },
        ...getToneRefQuote('TOM-001'),
      }
    : null,

  (s) => {
    const stanzas: Array<{ compound: number }[]> = s.diagnostics.length > 0
      ? [] : [];
    if (stanzas.length > 1) {
      const first = stanzas[0]?.[0]?.compound ?? 0;
      const last = stanzas[stanzas.length - 1]?.[0]?.compound ?? 0;
      if (Math.abs(last - first) > 0.5) {
        return {
          id: 'EMOTION_ARC_BREAK',
          severity: 'alta',
          dimensions: ['emotion'],
          details: { startEmotion: first, endEmotion: last },
          ...getToneRefQuote('TOM-002'),
        };
      }
    }
    return null;
  },

  (s) => s.lexical.antiPatternHits > 0
    ? {
        id: 'ANTIPATTERN_HIT',
        severity: 'alta',
        dimensions: ['lexical'],
        details: { antiPatternCount: s.lexical.antiPatternHits },
        ...getToneRefQuote('TOM-005'),
      }
    : null,

  (s) => !s.rhythm.isConsistent
    ? {
        id: 'RHYTHM_MISMATCH',
        severity: 'baixa',
        dimensions: ['rhythm'],
        details: { avgSyllables: s.rhythm.avgSyllables, variance: s.rhythm.variance },
        ...getToneRefQuote('TOM-004'),
      }
    : null,

  (s) => s.lexical.selectedToneScore < 0.1 && s.image.ratio < 0.1
    ? {
        id: 'CANONICAL_MISMATCH',
        severity: 'baixa',
        dimensions: ['lexical'],
        details: { lexicalScore: s.lexical.selectedToneScore, imageRatio: s.image.ratio },
        ...getToneRefQuote('TOM-001'),
      }
    : null,
];

export function computeDiagnostics(result: Omit<AnalysisResult, 'confidence' | 'diagnostics'>): Diagnostic[] {
  const analysis = { ...result, confidence: 0, diagnostics: [] } as AnalysisResult;
  const diagnostics: Diagnostic[] = [];
  for (const fn of DIAGNOSTICS) {
    const d = fn(analysis);
    if (d) diagnostics.push(d);
  }
  return diagnostics;
}
