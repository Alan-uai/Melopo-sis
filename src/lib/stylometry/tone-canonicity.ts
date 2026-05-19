import type { StylometryDiagnostic } from './corpus-types';
import { extractFeatures } from './feature-extractor';
import { REFERENCE_AUTHORS, getAuthorsByTone } from './canonical-corpus';

export function calculateToneCanonicity(
  text: string,
  targetTone?: string,
): {
  canonicity: number;
  diagnostics: StylometryDiagnostic[];
  closestForm: string;
} {
  const features = extractFeatures(text);
  const diagnostics: StylometryDiagnostic[] = [];

  let canonicity = 0.5;
  const weights = { lexical: 0.1, metrical: 0.2, figurative: 0.15, emotion: 0.15, register: 0.15, structure: 0.25 };

  const candidates = targetTone ? getAuthorsByTone(targetTone) : REFERENCE_AUTHORS;

  if (candidates.length === 0 && targetTone) {
    diagnostics.push({
      id: 'NO_TONE_CANON',
      severity: 'media',
      message: `Tom "${targetTone}" não encontrado no corpus canónico de referência`,
      details: { targetTone, availableTones: [...new Set(REFERENCE_AUTHORS.flatMap(a => a.knownTones))] },
      evidence: 'Consulta ao corpus canónico não retornou autores para o tom especificado',
    });
    canonicity *= 0.7;
  }

  const totalCanon: Record<string, number[]> = { lexical: [], metrical: [], figurative: [], emotion: [], register: [], structure: [] };

  for (const author of candidates) {
    const af = author.features;
    if (!af) continue;

    if (af.lexicalRichness !== undefined) {
      totalCanon.lexical.push(1 - Math.abs(features.lexicalRichness - af.lexicalRichness) / Math.max(af.lexicalRichness, 0.01));
    }

    const metAvg = ((af.metricalConsistency ?? 0.5) + (af.rhymeConsistency ?? 0.5)) / 2;
    const metScore = ((features.metricalConsistency + features.rhymeConsistency) / 2);
    totalCanon.metrical.push(1 - Math.abs(metScore - metAvg) / Math.max(metAvg, 0.01));

    const figAvg = ((af.figureDensity ?? 0.3) + (af.soundDeviceDensity ?? 0.2)) / 2;
    const figScore = ((features.figureDensity + features.soundDeviceDensity) / 2);
    totalCanon.figurative.push(1 - Math.abs(figScore - figAvg) / Math.max(figAvg, 0.01));

    if (af.emotionCompoundScore !== undefined) {
      totalCanon.emotion.push(1 - Math.abs(features.emotionCompoundScore - af.emotionCompoundScore) / 2);
    }

    const regAvg = ((af.formalRegisterScore ?? 0.5) + (1 - (af.informalRegisterScore ?? 0.5))) / 2;
    const regScore = ((features.formalRegisterScore + (1 - features.informalRegisterScore)) / 2);
    totalCanon.register.push(1 - Math.abs(regScore - regAvg) / Math.max(regAvg, 0.01));

    const structAvg = ((af.sentenceLength ?? 8) + (af.enjambementRatio ?? 0.2)) / 2;
    const structScore = ((features.sentenceLength + features.enjambementRatio) / 2);
    totalCanon.structure.push(1 - Math.abs(structScore - structAvg) / Math.max(structAvg, 0.01));
  }

  const dimScores: Record<string, number> = {};
  for (const [dim, values] of Object.entries(totalCanon)) {
    if (values.length > 0) {
      dimScores[dim] = values.reduce((a, b) => a + b, 0) / values.length;
    }
  }

  canonicity = Object.entries(weights).reduce((sum, [dim, w]) => {
    return sum + w * (dimScores[dim] ?? 0.5);
  }, 0);

  canonicity = Math.max(0, Math.min(1, canonicity));

  const weakDim = Object.entries(dimScores).find(([, v]) => v < 0.3);
  if (weakDim) {
    diagnostics.push({
      id: 'LOW_CANONICITY_DIMENSION',
      severity: weakDim[1] < 0.15 ? 'alta' : 'media',
      message: `Dimensão "${weakDim[0]}" com baixa canonicidade (${(weakDim[1] * 100).toFixed(0)}%)`,
      details: { dimension: weakDim[0], score: weakDim[1], scoresByDim: dimScores },
      evidence: `Comparação com corpus de ${candidates.length} autor(es) de referência`,
    });
  }

  const strongDim = Object.entries(dimScores).find(([, v]) => v > 0.85);
  if (strongDim) {
    diagnostics.push({
      id: 'HIGH_CANONICITY_DIMENSION',
      severity: 'baixa',
      message: `Dimensão "${strongDim[0]}" com forte alinhamento canónico (${(strongDim[1] * 100).toFixed(0)}%)`,
      details: { dimension: strongDim[0], score: strongDim[1] },
      evidence: `Similaridade acima de 85% com a média do corpus de referência`,
    });
  }

  if (canonicity < 0.3) {
    diagnostics.push({
      id: 'LOW_TOTAL_CANONICITY',
      severity: 'alta',
      message: 'O poema desvia-se significativamente dos padrões canónicos do corpus',
      details: { canonicity, dimScores },
      evidence: `Score de canonicidade total de ${(canonicity * 100).toFixed(0)}%`,
    });
  }

  const formCandidates = ['soneto', 'oda', 'ode', 'poema lírico', 'verso-livre', 'redondilha', 'decassílabo', 'poema narrativo'];
  const lines = text.split('\n').filter(l => l.trim());
  const avgLineLen = lines.length > 0
    ? lines.reduce((s, l) => s + l.split(/\s+/).filter(w => w).length, 0) / lines.length
    : 0;

  const closestForm = (() => {
    if (lines.length === 14 && Math.abs(avgLineLen - 10) < 2) return 'soneto (provável)';
    if (lines.length === 14 && Math.abs(avgLineLen - 7) < 2) return 'soneto em redondilha (provável)';
    if (avgLineLen >= 9 && avgLineLen <= 11) return 'decassílabo (provável)';
    if (avgLineLen >= 5 && avgLineLen <= 7) return 'redondilha (provável)';
    return 'verso-livre ou forma mista (provável)';
  })();

  return { canonicity, diagnostics, closestForm };
}
