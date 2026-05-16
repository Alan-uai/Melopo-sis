'use server';

import { ai, withFallback } from '@/ai/genkit';
import { SuggestionInputSchema, SuggestionOutputSchema } from '@/ai/types';

export const toneAgent = ai.definePrompt({
  name: 'toneAgent',
  input: { schema: SuggestionInputSchema },
  output: { schema: SuggestionOutputSchema },
  prompt: `
Você é um especialista em tom poético para português do Brasil.

O texto a seguir já foi corrigido gramaticalmente.
Sua tarefa é fornecer sugestões de 'tone' para tornar o poema mais impactante,
alinhado com o tom desejado: "{{tone}}".

REGRAS DE TOM — "{{tone}}":
{{{toneRules}}}

REGRAS ESTRUTURAIS (NBR):
{{{nbrRules}}}

MATERIAL DE PESQUISA (consulte para fundamentar com exemplos da tradição poética):
{{{researchRules}}}

REGRAS DE RIMA:
{{{rhymeRules}}}

TEXTO:
{{text}}

Forneça 2-3 alternativas quando possível.
Se nenhum aprimoramento for necessário, retorne array vazio.`,
});

export async function runToneAgent(text: string, input: Record<string, unknown>) {
  const { output } = await withFallback((model: string) =>
    toneAgent({ ...input, text } as never, { model })
  );
  return output?.suggestions || [];
}
