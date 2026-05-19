import { extractFeatures } from './feature-extractor';
import { calculateToneCanonicity } from './tone-canonicity';
import { getAuthorEchoReport } from './author-signature';

export function analyzeStylometry(text: string, tone?: string) {
  const features = extractFeatures(text);
  const { canonicity, diagnostics: canonDiag, closestForm } = calculateToneCanonicity(text, tone);
  const { closestAuthor, influences, matchedDimensions, anomalies } = getAuthorEchoReport(text, tone);

  return {
    features,
    canonicity,
    canonicityDiagnostics: canonDiag,
    closestForm,
    closestAuthor,
    influences,
    matchedDimensions,
    anomalies,
  };
}
