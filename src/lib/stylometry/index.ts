export {
  findClosestAuthors,
  getDominantInfluences,
  getAuthorEchoReport,
  compareToAuthor,
  getAuthorProfileSummary,
} from './author-signature';

export {
  calculateToneCanonicity,
} from './tone-canonicity';

export {
  extractFeatures,
  compareFeatures,
  overallSimilarity,
} from './feature-extractor';

export {
  REFERENCE_AUTHORS,
  getReferenceAuthor,
  getAuthorsByTone,
  getAllTones,
} from './canonical-corpus';

export type {
  StylometricFeatures,
  AuthorProfile,
  CanonicalExample,
  CorpusEntry,
  SimilarityScore,
  StylometryResult,
  StylometryDiagnostic,
} from './corpus-types';

export {
  analyzeStylometry,
} from './stylometry-service';
