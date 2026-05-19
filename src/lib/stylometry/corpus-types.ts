export interface StylometricFeatures {
  lexicalRichness: number;
  typeTokenRatio: number;
  hapaxLegomena: number;
  averageWordLength: number;
  averageSyllablesPerWord: number;
  sentenceLength: number;
  punctuationDensity: number;
  conjunctionFrequency: number;
  adjectiveRatio: number;
  verbRatio: number;
  nounRatio: number;
  pronounRatio: number;
  formalRegisterScore: number;
  informalRegisterScore: number;
  figureDensity: number;
  rhymeConsistency: number;
  metricalConsistency: number;
  enjambementRatio: number;
  soundDeviceDensity: number;
  abstractRatio: number;
  concreteRatio: number;
  emotionCompoundScore: number;
}

export interface AuthorProfile {
  id: string;
  name: string;
  period: string;
  movement: string;
  knownTones: string[];
  features: Partial<StylometricFeatures>;
  vocabularySignature: string[];
  preferredForms: string[];
  description: string;
}

export interface CanonicalExample {
  author: string;
  work: string;
  verse: string;
  tone: string;
  features: Partial<StylometricFeatures>;
}

export interface CorpusEntry {
  id: string;
  author: string;
  title: string;
  year?: number;
  tone: string;
  form: string;
  text: string;
  features: StylometricFeatures;
}

export interface SimilarityScore {
  author: string;
  score: number;
  dimensions: Record<string, number>;
}

export interface StylometryResult {
  features: StylometricFeatures;
  closestAuthors: SimilarityScore[];
  dominantInfluences: string[];
  toneCanonicity: number;
  anomalyScore: number;
  diagnostics: StylometryDiagnostic[];
}

export interface StylometryDiagnostic {
  id: string;
  severity: 'baixa' | 'media' | 'alta';
  message: string;
  details: Record<string, unknown>;
  evidence: string;
}
