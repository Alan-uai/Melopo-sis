const VOWEL_FEATURES: Record<string, string[]> = {
  'a': ['baixo', 'central', 'aberto'],
  'á': ['baixo', 'central', 'aberto', 'tonico'],
  'à': ['baixo', 'central', 'aberto', 'tonico'],
  'â': ['baixo', 'central', 'aberto', 'nasal'],
  'ã': ['baixo', 'central', 'aberto', 'nasal'],
  'e': ['medio', 'anterior', 'nao-arredondado'],
  'é': ['medio', 'anterior', 'nao-arredondado', 'tonico'],
  'ê': ['medio', 'anterior', 'nao-arredondado', 'nasal'],
  'i': ['alto', 'anterior', 'nao-arredondado'],
  'í': ['alto', 'anterior', 'nao-arredondado', 'tonico'],
  'o': ['medio', 'posterior', 'arredondado'],
  'ó': ['medio', 'posterior', 'arredondado', 'tonico'],
  'ô': ['medio', 'posterior', 'arredondado', 'nasal'],
  'u': ['alto', 'posterior', 'arredondado'],
  'ú': ['alto', 'posterior', 'arredondado', 'tonico'],
  'ü': ['alto', 'anterior', 'arredondado'],
};

const CONSONANT_FEATURES: Record<string, string[]> = {
  'p': ['oclusivo', 'bilabial', 'surdo'],
  'b': ['oclusivo', 'bilabial', 'sonoro'],
  't': ['oclusivo', 'alveolar', 'surdo'],
  'd': ['oclusivo', 'alveolar', 'sonoro'],
  'k': ['oclusivo', 'velar', 'surdo'],
  'c': ['oclusivo', 'velar', 'surdo'],
  'g': ['oclusivo', 'velar', 'sonoro'],
  'f': ['fricativo', 'labiodental', 'surdo'],
  'v': ['fricativo', 'labiodental', 'sonoro'],
  's': ['fricativo', 'alveolar', 'surdo'],
  'z': ['fricativo', 'alveolar', 'sonoro'],
  'x': ['fricativo', 'palato-alveolar', 'surdo'],
  'j': ['fricativo', 'palato-alveolar', 'sonoro'],
  'm': ['nasal', 'bilabial', 'sonoro'],
  'n': ['nasal', 'alveolar', 'sonoro'],
  'r': ['vibrante', 'alveolar', 'sonoro'],
  'l': ['lateral', 'alveolar', 'sonoro'],
  'lh': ['lateral', 'palatal', 'sonoro'],
  'nh': ['nasal', 'palatal', 'sonoro'],
  'ch': ['fricativo', 'palato-alveolar', 'surdo'],
  'rr': ['vibrante', 'alveolar', 'sonoro'],
};

function getFeatures(phoneme: string): string[] {
  const lower = phoneme.toLowerCase();
  if (VOWEL_FEATURES[lower]) return VOWEL_FEATURES[lower];
  if (CONSONANT_FEATURES[lower]) return CONSONANT_FEATURES[lower];
  return [];
}

function featureSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const fA = getFeatures(a);
  const fB = getFeatures(b);
  if (fA.length === 0 || fB.length === 0) return 0;

  const shared = fA.filter(f => fB.includes(f)).length;
  const total = Math.max(fA.length, fB.length);
  return shared / total;
}

export function phoneticEditDistance(a: string, b: string): number {
  const normA = a.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const normB = b.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const m = normA.length;
  const n = normB.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = normA[i - 1] === normB[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  return dp[m][n] / Math.max(m, n, 1);
}

export function phoneticSimilarity(a: string, b: string): number {
  return 1 - phoneticEditDistance(a, b);
}

export function vowelNucleusSimilarity(a: string, b: string): number {
  const vowelsA = a.toLowerCase().match(/[aeiouáàâãéèêíïóôõöúü]+/gi) || [];
  const vowelsB = b.toLowerCase().match(/[aeiouáàâãéèêíïóôõöúü]+/gi) || [];

  const seqA = vowelsA.flatMap(v => v.split('')).filter(c => /[aeiouáàâãéèêíïóôõöúü]/.test(c));
  const seqB = vowelsB.flatMap(v => v.split('')).filter(c => /[aeiouáàâãéèêíïóôõöúü]/.test(c));

  const maxLen = Math.max(seqA.length, seqB.length);
  if (maxLen === 0) return 1;

  let score = 0;
  for (let i = 0; i < Math.min(seqA.length, seqB.length); i++) {
    score += featureSimilarity(seqA[i], seqB[i]);
  }

  const lenPenalty = Math.abs(seqA.length - seqB.length) * 0.2;
  return Math.max(0, Math.min(1, score / maxLen - lenPenalty));
}

export function rhymeLikeness(a: string, b: string): number {
  const normA = a.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const normB = b.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const endingA = normA.slice(-3);
  const endingB = normB.slice(-3);

  if (endingA === endingB) return 1;

  const vowelSim = vowelNucleusSimilarity(normA.slice(-3), normB.slice(-3));
  const consEndA = normA.slice(-3).replace(/[aeiou]/g, '');
  const consEndB = normB.slice(-3).replace(/[aeiou]/g, '');

  let consonantScore = 0;
  if (consEndA.length > 0 && consEndB.length > 0) {
    consonantScore = phoneticSimilarity(consEndA, consEndB);
  }

  return vowelSim * 0.7 + consonantScore * 0.3;
}

export function assonanceDegree(a: string, b: string): number {
  const normA = a.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const normB = b.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return vowelNucleusSimilarity(normA.slice(-3), normB.slice(-3));
}

export function consonanceDegree(a: string, b: string): number {
  const normA = a.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[aeiou]/g, '');
  const normB = b.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[aeiou]/g, '');
  return phoneticSimilarity(normA.slice(-3), normB.slice(-3));
}
