import type { StylometricFeatures } from './corpus-types';

function simpleTokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-záàâãéèêíïóôõöúüç]+/gi) || [];
}

const ADJECTIVE_SUFFIXES = /(?:oso|osa|ável|ivel|ico|ica|al|ar|ente|ante|ivo|iva|ado|ada|ido|ida|eza|ez)$/i;
const VERB_SUFFIXES = /(?:ar|er|ir|ando|endo|indo|ado|ido|era|era|erei|aria|asse|esse|isse|ara|era|ira)$/i;
const NOUN_SUFFIXES = /(?:ção|ção|são|mento|dade|tude|ncia|nça|ismo|ista|eiro|eira|aria|ório|ória)$/i;
const PRONOUNS = new Set([
  'eu', 'tu', 'ele', 'ela', 'nós', 'vos', 'eles', 'elas',
  'me', 'te', 'se', 'lhe', 'nos', 'vos', 'lhes',
  'mim', 'ti', 'si', 'comigo', 'contigo', 'consigo',
  'connosco', 'convosco',
  'meu', 'minha', 'teu', 'tua', 'seu', 'sua',
  'nosso', 'nossa', 'vosso', 'vossa',
  'este', 'esta', 'esse', 'essa', 'aquele', 'aquela',
  'isto', 'isso', 'aquilo',
]);

export function extractFeatures(text: string): StylometricFeatures {
  const tokens = simpleTokenize(text);
  const stems = tokens.map(t => t.replace(/[áàâã]/g, 'a').replace(/[éèê]/g, 'e').replace(/[íï]/g, 'i').replace(/[óôõö]/g, 'o').replace(/[úü]/g, 'u'));

  const uniqueTokens = new Set(stems);
  const richWords = stems.filter(s => s.length > 3);

  const lexicalRichness = stems.length > 0 ? uniqueTokens.size / stems.length : 0;
  const typeTokenRatio = stems.length > 0 ? uniqueTokens.size / stems.length : 0;

  const hapaxCount = (() => {
    const freq: Record<string, number> = {};
    for (const s of stems) freq[s] = (freq[s] || 0) + 1;
    return Object.values(freq).filter(c => c === 1).length;
  })();

  const hapaxLegomena = stems.length > 0 ? hapaxCount / stems.length : 0;

  const averageWordLength = tokens.length > 0
    ? tokens.reduce((s, t) => s + t.length, 0) / tokens.length
    : 0;

  const vowelGroups = stems.map(s => (s.match(/[aeiouáàâãéèêíïóôõöúü]+/gi) || []).length);
  const averageSyllablesPerWord = vowelGroups.length > 0
    ? vowelGroups.reduce((a, b) => a + b, 0) / vowelGroups.length
    : 0;

  const lines = text.split('\n').filter(l => l.trim());
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  const sentenceLength = sentences.length > 0
    ? sentences.reduce((s, sent) => s + sent.split(/\s+/).filter(w => w).length, 0) / sentences.length
    : 0;

  const punctCount = (text.match(/[.,;:!?—–()""''-]/g) || []).length;
  const punctuationDensity = tokens.length > 0 ? punctCount / tokens.length : 0;

  const conjCount = (text.match(/\b(?:e|mas|ou|que|pois|porque|contudo|todavia|entretanto|portanto|no entanto|assim|logo|por isso|então)\b/gi) || []).length;
  const conjunctionFrequency = tokens.length > 0 ? conjCount / tokens.length : 0;

  let adjectiveCount = 0, verbCount = 0, nounCount = 0, pronounCount = 0;
  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (PRONOUNS.has(lower)) pronounCount++;
    if (ADJECTIVE_SUFFIXES.test(lower)) adjectiveCount++;
    if (VERB_SUFFIXES.test(lower)) verbCount++;
    if (NOUN_SUFFIXES.test(lower)) nounCount++;
  }

  const adjRatio = tokens.length > 0 ? adjectiveCount / tokens.length : 0;
  const verbRatio = tokens.length > 0 ? verbCount / tokens.length : 0;
  const nounRatio = tokens.length > 0 ? nounCount / tokens.length : 0;
  const pronounRatio = tokens.length > 0 ? pronounCount / tokens.length : 0;

  const formalRegisterScore = 0.5;
  const informalRegisterScore = 0.5;

  const figureDensity = 0;

  const rhymeConsistency = 0;

  const metricalConsistency = 0;

  const enjambRatio = 0;

  const soundDeviceDensity = 0;

  const abstractWords = stems.filter(s => {
    const nonAbstractEndings = /[aeiouáàâãéèêíïóôõöúü]$/i;
    return s.length > 5 && nonAbstractEndings.test(s) && !/^(?:pedr|arv|casad|port|mes|cam|agu)/i.test(s);
  }).length;

  const concreteWords = stems.filter(s => {
    return /^(?:pedr|arv|casad|port|mes|cam|agu|mar|sol|lu|ceu|terr|flor|mont|ri)/i.test(s);
  }).length;

  const abstractRatio = stems.length > 0 ? abstractWords / stems.length : 0;
  const concreteRatio = stems.length > 0 ? concreteWords / stems.length : 0;

  const emotionCompoundScore = 0;

  return {
    lexicalRichness, typeTokenRatio, hapaxLegomena,
    averageWordLength, averageSyllablesPerWord,
    sentenceLength, punctuationDensity,
    conjunctionFrequency, adjectiveRatio: adjRatio,
    verbRatio, nounRatio, pronounRatio,
    formalRegisterScore, informalRegisterScore,
    figureDensity, rhymeConsistency,
    metricalConsistency, enjambementRatio: enjambRatio,
    soundDeviceDensity, abstractRatio, concreteRatio,
    emotionCompoundScore,
  };
}

export function compareFeatures(a: StylometricFeatures, b: Partial<StylometricFeatures>): Record<string, number> {
  const dimensions: Record<string, number> = {};
  const keys = Object.keys(a) as (keyof StylometricFeatures)[];

  for (const key of keys) {
    if (b[key] !== undefined) {
      const diff = Math.abs(a[key] - (b[key] as number));
      const maxVal = Math.max(Math.abs(a[key]), Math.abs(b[key] as number), 0.01);
      dimensions[key] = 1 - Math.min(diff / maxVal, 1);
    }
  }

  return dimensions;
}

export function overallSimilarity(a: StylometricFeatures, b: Partial<StylometricFeatures>): number {
  const dims = compareFeatures(a, b);
  const values = Object.values(dims);
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}
