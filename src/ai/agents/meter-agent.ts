'use server';

import { ai, withFallback } from '@/ai/genkit';
import { SuggestionInputSchema, SuggestionOutputSchema, type Suggestion } from '@/ai/types';
import { tryOpenRouterFallback } from '@/ai/openrouter';

const METER_AGENT_PROMPT = `
Você é um especialista em métrica e ritmo poético do português brasileiro.

Analise o texto poético abaixo e forneça sugestões para melhorar sua métrica e cadência rítmica.

ESTRUTURA: {{structure}}
RIMA ATIVADA: {{rhyme}}

REGRAS ESTRUTURAIS (NBR):
{{{nbrRules}}}

REGRAS DE RIMA:
{{{rhymeRules}}}

MATERIAL DE PESQUISA:
{{{researchRules}}}

TEXTO:
\`\`\`
{{{text}}}
\`\`\`

INSTRUÇÕES:
- Verifique se cada verso tem o número correto de sílabas poéticas para a estrutura.
- Identifique padrões rítmicos (iambo, troqueu, anapesto, datilo, espondeu) e sugira melhorias.
- Detecte e sugira correções para enjambements fortes que quebrem o fluxo.
- Aponte cadências pobres ou monótonas e sugira variações.
- Considere metaplasmos poéticos (elisão, sínérese, diérese, ectlipse) na contagem silábica.

Retorne sugestões com tipo 'grammar' e severity adequada. Se a métrica estiver correta, retorne array vazio.
`;

const meterAgent = ai.definePrompt({
  name: 'meterAgent',
  input: { schema: SuggestionInputSchema },
  output: { schema: SuggestionOutputSchema },
  prompt: METER_AGENT_PROMPT,
});

export async function runMeterAgent(
  text: string,
  input: Record<string, unknown>,
  preferredModel?: string
): Promise<{ suggestions: Suggestion[]; modelUsed: string }> {
  try {
    const { result: genkitResponse, modelUsed } = await withFallback(
      (model: string) => meterAgent({ ...input, text } as never, { model }),
      undefined,
      preferredModel
    );
    const output = genkitResponse?.output;
    return { suggestions: output?.suggestions || [], modelUsed };
  } catch {
    const { result, modelUsed } = await tryOpenRouterFallback(
      METER_AGENT_PROMPT,
      { ...input, text },
      SuggestionOutputSchema,
    );
    return { suggestions: result.suggestions || [], modelUsed };
  }
}
