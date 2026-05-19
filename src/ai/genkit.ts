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
  defaultModel = 'googleai/gemini-2.5-flash',
  preferredModel?: string
): Promise<{ result: T; modelUsed: string }> {
  const modelsList = models.length > 0 ? models : [defaultModel];

  const orderedModels = preferredModel && modelsList.includes(preferredModel)
    ? [preferredModel, ...modelsList.filter(m => m !== preferredModel)]
    : modelsList;

  let lastError: unknown;
  for (const model of orderedModels) {
    try {
      const result = await fn(model);
      console.log(`[AI Fallback] Modelo "${model}" respondeu com sucesso`);
      return { result, modelUsed: model };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

export function resetModelsCache() {
  models.length = 0;
  models.push(...parseModels());
}
