import { z } from 'zod';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_OPENROUTER_MODELS = [
  'meta-llama/llama-3.1-8b-instruct',
  'mistralai/mistral-nemo',
  'google/gemini-2.5-flash',
  'deepseek/deepseek-chat',
];

function getOpenRouterModels(): string[] {
  const raw = process.env.OPENROUTER_MODELS || '';
  if (raw.trim()) {
    return raw.split(',').map(m => m.trim()).filter(Boolean);
  }
  return DEFAULT_OPENROUTER_MODELS;
}

function getApiKey(): string | null {
  return process.env.OPENROUTER_API_KEY || null;
}

export function renderPrompt(template: string, vars: Record<string, unknown>): string {
  return template.replace(/\{\{\{(\w+)\}\}\}/g, (_, key) =>
    String(vars[key] ?? '')
  ).replace(/\{\{(\w+)\}\}/g, (_, key) =>
    String(vars[key] ?? '')
  );
}

export async function tryOpenRouterFallback<T>(
  promptTemplate: string,
  promptVars: Record<string, unknown>,
  outputSchema: z.ZodType<T>,
): Promise<{ result: T; modelUsed: string }> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('[OpenRouter] OPENROUTER_API_KEY não configurada');

  const systemPrompt = renderPrompt(promptTemplate, promptVars);
  const userText = String(promptVars.text ?? '');

  const models = getOpenRouterModels();

  for (const model of models) {
    try {
      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://melopoeisis.app',
          'X-Title': 'Melopoësis',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userText },
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[OpenRouter] Modelo "${model}" falhou (${response.status}): ${errorText}`);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) continue;

      const parsed = JSON.parse(content);
      const validated = outputSchema.parse(parsed);

      console.log(`[OpenRouter] Modelo "${model}" respondeu com sucesso`);
      return { result: validated, modelUsed: `openrouter:${model}` };
    } catch (error) {
      console.warn(`[OpenRouter] Modelo "${model}" falhou:`, error);
    }
  }

  throw new Error('[OpenRouter] Todos os modelos do OpenRouter falharam');
}
