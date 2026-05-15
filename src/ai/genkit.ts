import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});

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
