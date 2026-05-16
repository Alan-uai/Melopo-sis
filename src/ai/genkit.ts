import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {devLocalVectorstore, devLocalIndexerRef, devLocalRetrieverRef} from '@genkit-ai/dev-local-vectorstore';

const embedder = googleAI.embedder('gemini-embedding-001');

export const ai = genkit({
  plugins: [
    googleAI(),
    devLocalVectorstore([
      {
        indexName: 'nbr_index',
        embedder,
      },
    ]),
  ],
  model: 'googleai/gemini-2.5-flash',
});

export const nbrIndexer = devLocalIndexerRef('nbr_index');
export const nbrRetriever = devLocalRetrieverRef('nbr_index');

function parseModels(): string[] {
  const raw = process.env.MODELS || '';
  return raw
    .split(',')
    .map(m => m.trim())
    .filter(Boolean)
    .map(m => (m.includes('/') ? m : `googleai/${m}`));
}

const models = parseModels();

export async function withFallback<T>(
  fn: (model: string) => Promise<T>,
  defaultModel = 'googleai/gemini-2.5-flash'
): Promise<T> {
  const modelsList = models.length > 0 ? models : [defaultModel];
  let lastError: unknown;
  for (const model of modelsList) {
    try {
      return await fn(model);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}
