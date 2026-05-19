import type { StylometricFeatures, SimilarityScore, AuthorProfile } from './corpus-types';
import { extractFeatures, compareFeatures, overallSimilarity } from './feature-extractor';
import { REFERENCE_AUTHORS, getAuthorsByTone } from './canonical-corpus';

export function findClosestAuthors(
  text: string,
  topN: number = 3,
  toneFilter?: string,
): SimilarityScore[] {
  const features = extractFeatures(text);
  const candidates = toneFilter
    ? getAuthorsByTone(toneFilter)
    : REFERENCE_AUTHORS;

  const scores: SimilarityScore[] = candidates.map(author => ({
    author: author.name,
    score: overallSimilarity(features, author.features),
    dimensions: compareFeatures(features, author.features),
  }));

  scores.sort((a, b) => b.score - a.score);
  return scores.slice(0, topN);
}

export function getDominantInfluences(
  text: string,
  threshold: number = 0.6,
  topN: number = 5,
): SimilarityScore[] {
  const features = extractFeatures(text);
  const scores: SimilarityScore[] = REFERENCE_AUTHORS.map(author => ({
    author: author.name,
    score: overallSimilarity(features, author.features),
    dimensions: compareFeatures(features, author.features),
  }));

  return scores
    .filter(s => s.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

export function getAuthorEchoReport(
  text: string,
  tone?: string,
): {
  closestAuthor: SimilarityScore | null;
  influences: SimilarityScore[];
  matchedDimensions: Record<string, string>;
  anomalies: string[];
} {
  const features = extractFeatures(text);
  const closest = findClosestAuthors(text, 1, tone);
  const influences = getDominantInfluences(text, 0.5, 3);

  const matchedDimensions: Record<string, string> = {};
  if (closest.length > 0) {
    const dims = closest[0].dimensions;
    const strongMatches = Object.entries(dims)
      .filter(([, score]) => score >= 0.8)
      .sort(([, a], [, b]) => b - a);

    const authorName = closest[0].author;
    for (const [dim, score] of strongMatches.slice(0, 5)) {
      matchedDimensions[dim] = `${authorName}: ${Math.round(score * 100)}%`;
    }
  }

  const anomalies: string[] = [];
  if (features.lexicalRichness > 0.8) anomalies.push('Riqueza lexical excepcionalmente alta');
  if (features.lexicalRichness < 0.4) anomalies.push('Riqueza lexical excepcionalmente baixa');
  if (features.metricalConsistency > 0.95) anomalies.push('Consistência métrica quase perfeita');
  if (features.metricalConsistency < 0.1) anomalies.push('Quase sem padrão métrico — verso livre radical');
  if (features.conjunctionFrequency > 0.2) anomalies.push('Frequência de conjunções muito alta');
  if (features.enjambementRatio > 0.6) anomalies.push('Predomínio de enjambement — sintaxe fluida');
  if (features.emotionCompoundScore < -0.5) anomalies.push('Tom emocional fortemente negativo');
  if (features.emotionCompoundScore > 0.5) anomalies.push('Tom emocional fortemente positivo');
  if (features.formalRegisterScore > 0.95) anomalies.push('Registro formal quase absoluto');
  if (features.informalRegisterScore > 0.5) anomalies.push('Presença significativa de registro informal');
  if (features.soundDeviceDensity > 0.5) anomalies.push('Densidade excepcional de dispositivos sonoros');

  return {
    closestAuthor: closest[0] || null,
    influences,
    matchedDimensions,
    anomalies,
  };
}

export function compareToAuthor(
  text: string,
  authorId: string,
): { similarity: number; dimensions: Record<string, number> } | null {
  const author = REFERENCE_AUTHORS.find(a => a.id === authorId);
  if (!author) return null;

  const features = extractFeatures(text);
  return {
    dimensions: compareFeatures(features, author.features),
    similarity: overallSimilarity(features, author.features),
  };
}

export function getAuthorProfileSummary(authorId: string): AuthorProfile | null {
  return REFERENCE_AUTHORS.find(a => a.id === authorId) || null;
}
