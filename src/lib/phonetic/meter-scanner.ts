import { countPoeticSyllables, analyzeLineStress } from './poetic-syllables';
import { syllabifyWord } from './syllabifier';
import { detectMetricalForm } from './stress-evaluator';
import type { LineStress } from './stress-evaluator';

export type FootType = 'iambico' | 'trocaico' | 'anapesto' | 'dactilo' | 'espondeu' | 'coriambo' | 'desconhecido';

export type MeterForm = 'redondilha_menor' | 'redondilha_maior' | 'decassilabo_heroico' | 'decassilabo_safico' | 'decassilabo' | 'alexandrino' | 'dodecassilabo' | 'verso_livre';

export interface StressMark {
  position: number;
  stressed: boolean;
  syllable: string;
  footType: FootType;
}

export interface LineScan {
  lineNumber: number;
  rawText: string;
  poeticSyllables: number;
  stressMarks: StressMark[];
  dominantFoot: FootType;
  waveform: number[];
  form: MeterForm;
  ictusPositions: number[];
  hasProperCadence: boolean;
}

export interface PoemScan {
  lines: LineScan[];
  metricalConsistency: number;
  dominantForm: MeterForm;
  formDistribution: Record<string, number>;
  averageSyllables: number;
  syllableVariance: number;
}

function classifyFoot(marks: boolean[]): FootType {
  if (marks.length >= 2) {
    if (!marks[0] && marks[1]) return 'iambico';
    if (marks[0] && !marks[1]) return 'trocaico';
    if (marks[0] && marks[1]) return 'espondeu';
  }
  if (marks.length >= 3) {
    if (!marks[0] && !marks[1] && marks[2]) return 'anapesto';
    if (marks[0] && !marks[1] && !marks[2]) return 'dactilo';
  }
  if (marks.length >= 4) {
    if (!marks[0] && marks[1] && !marks[2] && marks[3]) return 'coriambo';
  }
  return 'desconhecido';
}

export function scanLine(line: string, lineNumber: number = 1): LineScan {
  const poeticSyllables = countPoeticSyllables(line);
  const stress = analyzeLineStress(line);
  const form = (stress.words.length > 0 ? detectMetricalForm(stress) : 'verso_livre') as MeterForm;

  const words = line.trim().split(/\s+/).filter(w => w);
  const stressMarks: StressMark[] = [];
  const waveform: number[] = [];
  const footCounts: Record<FootType, number> = {
    iambico: 0, trocaico: 0, anapesto: 0, dactilo: 0,
    espondeu: 0, coriambo: 0, desconhecido: 0,
  };

  let position = 0;
  for (const word of words) {
    const info = syllabifyWord(word);
    const stressPattern = info.syllables.map((_, i) => info.stressPosition === i);
    const foot = classifyFoot(stressPattern);
    footCounts[foot]++;

    for (let i = 0; i < stressPattern.length; i++) {
      stressMarks.push({
        position,
        stressed: stressPattern[i],
        syllable: info.syllables[i] || word,
        footType: foot,
      });
      waveform.push(stressPattern[i] ? 1 : 0.3);
      position++;
    }
    position++;
  }

  const dominantFoot = (Object.entries(footCounts) as [FootType, number][])
    .filter(([t]) => t !== 'desconhecido')
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'desconhecido';

  const formPatterns: Record<string, { expectedSyllables: number; requiredIctus: number[] }> = {
    'redondilha_menor': { expectedSyllables: 5, requiredIctus: [3] },
    'redondilha_maior': { expectedSyllables: 7, requiredIctus: [5] },
    'decassilabo_heroico': { expectedSyllables: 10, requiredIctus: [6, 10] },
    'decassilabo_safico': { expectedSyllables: 10, requiredIctus: [4, 8, 10] },
    'decassilabo': { expectedSyllables: 10, requiredIctus: [10] },
    'alexandrino': { expectedSyllables: 12, requiredIctus: [6, 12] },
    'dodecassilabo': { expectedSyllables: 12, requiredIctus: [12] },
    'verso_livre': { expectedSyllables: 0, requiredIctus: [] },
  };

  const pattern = formPatterns[form];
  const hasProperCadence = pattern
    ? pattern.requiredIctus.every(pos =>
        stress.tonicSyllables.includes(pos - 1) || stress.tonicSyllables.includes(pos)
      )
    : false;

  return {
    lineNumber,
    rawText: line,
    poeticSyllables,
    stressMarks,
    dominantFoot,
    waveform,
    form,
    ictusPositions: stress.tonicSyllables,
    hasProperCadence,
  };
}

export function scanPoem(text: string): PoemScan {
  const lines = text.split('\n').filter(l => l.trim());
  const scanned = lines.map((l, i) => scanLine(l.trim(), i + 1));

  const syllableCounts = scanned.map(l => l.poeticSyllables);
  const avgSyllables = syllableCounts.length > 0
    ? syllableCounts.reduce((a, b) => a + b, 0) / syllableCounts.length
    : 0;
  const syllableVariance = syllableCounts.length > 0
    ? syllableCounts.reduce((a, c) => a + (c - avgSyllables) ** 2, 0) / syllableCounts.length
    : 0;

  const formCounts: Record<string, number> = {};
  for (const l of scanned) {
    formCounts[l.form] = (formCounts[l.form] || 0) + 1;
  }

  const dominantForm = (Object.entries(formCounts) as [string, number][])
    .sort((a, b) => b[1] - a[1])[0]?.[0] as MeterForm || 'verso_livre';

  const dominantCount = formCounts[dominantForm] || 0;
  const metricalConsistency = scanned.length > 0 ? dominantCount / scanned.length : 0;

  return {
    lines: scanned,
    metricalConsistency,
    dominantForm,
    formDistribution: formCounts,
    averageSyllables: Math.round(avgSyllables * 10) / 10,
    syllableVariance: Math.round(syllableVariance * 10) / 10,
  };
}

export function hasValidDecassilabo(lineScan: LineScan): boolean {
  if (lineScan.poeticSyllables !== 9 && lineScan.poeticSyllables !== 10) return false;
  return lineScan.ictusPositions.includes(9) || lineScan.ictusPositions.includes(10);
}

export function hasValidAlexandrino(lineScan: LineScan): boolean {
  if (lineScan.poeticSyllables !== 11 && lineScan.poeticSyllables !== 12) return false;
  const hasCaesura = lineScan.ictusPositions.includes(5) || lineScan.ictusPositions.includes(6);
  const hasEndStress = lineScan.ictusPositions.includes(11) || lineScan.ictusPositions.includes(12);
  return hasCaesura && hasEndStress;
}

export function getCadenceQuality(lineScan: LineScan): number {
  if (!lineScan.hasProperCadence) return 0;

  if (lineScan.form === 'decassilabo_heroico') {
    const has6 = lineScan.ictusPositions.includes(5) || lineScan.ictusPositions.includes(6);
    const has10 = lineScan.ictusPositions.includes(9) || lineScan.ictusPositions.includes(10);
    if (has6 && has10) return 1;
    if (has6 || has10) return 0.5;
    return 0.3;
  }

  if (lineScan.form === 'decassilabo_safico') {
    const has4 = lineScan.ictusPositions.includes(3) || lineScan.ictusPositions.includes(4);
    const has8 = lineScan.ictusPositions.includes(7) || lineScan.ictusPositions.includes(8);
    const has10 = lineScan.ictusPositions.includes(9) || lineScan.ictusPositions.includes(10);
    const count = [has4, has8, has10].filter(Boolean).length;
    return count / 3;
  }

  return 0.5;
}

export function getRhythmicProfile(scan: PoemScan): {
  label: string;
  description: string;
} {
  const { dominantForm, metricalConsistency, averageSyllables, syllableVariance } = scan;

  if (dominantForm === 'decassilabo_heroico' && metricalConsistency > 0.6) {
    return { label: 'ritmo_heroico', description: 'Decassílabo heroico com acentos na 6ª e 10ª sílabas' };
  }
  if (dominantForm === 'decassilabo_safico' && metricalConsistency > 0.6) {
    return { label: 'ritmo_safico', description: 'Decassílabo sáfico com acentos na 4ª, 8ª e 10ª sílabas' };
  }
  if (dominantForm === 'redondilha_maior' && metricalConsistency > 0.6) {
    return { label: 'ritmo_redondilha_maior', description: 'Redondilha maior (7 sílabas)' };
  }
  if (dominantForm === 'redondilha_menor' && metricalConsistency > 0.6) {
    return { label: 'ritmo_redondilha_menor', description: 'Redondilha menor (5 sílabas)' };
  }
  if (dominantForm === 'alexandrino' && metricalConsistency > 0.4) {
    return { label: 'ritmo_alexandrino', description: 'Alexandrino (12 sílabas, cesura na 6ª)' };
  }

  if (syllableVariance < 2 && averageSyllables > 0) {
    return { label: 'ritmo_regular', description: `Metro regular (${averageSyllables} sílabas em média)` };
  }
  if (syllableVariance >= 2 && syllableVariance < 6) {
    return { label: 'ritmo_irregular_moderado', description: 'Métrica moderadamente irregular' };
  }
  return { label: 'ritmo_livre', description: 'Verso livre — sem padrão métrico dominante' };
}
