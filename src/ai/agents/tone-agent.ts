'use server';

import { ai, withFallback } from '@/ai/genkit';
import { SuggestionInputSchema, ToneSuggestionOutputSchema, type Suggestion } from '@/ai/types';
import { tryOpenRouterFallback } from '@/ai/openrouter';

export const TONE_AGENT_PROMPT = `
Você é um especialista em estilo e tom poético para o português do Brasil. O texto a seguir já foi corrigido gramaticalmente.

Sua tarefa é fornecer sugestões de 'tone' (tom e estilo) para tornar o poema mais impactante, alinhado com o tom desejado: "{{tone}}".

O texto a ser analisado é:
\`\`\`
{{{text}}}
\`\`\`

 REGRAS:
- Para cada sugestão, forneça o trecho original, uma alternativa estilística, e explique o motivo da mudança.
- Forneça EXATAMENTE 2-3 alternativas no campo "alternatives" para CADA sugestão. Este campo é obrigatório.
- A justificativa deve ser estilística/literária, não gramatical.
- Se nenhum aprimoramento de tom for necessário, retorne array vazio.
- Mantenha a métrica e a rima se o poema as utilizar. Rima ativada: {{rhyme}}. Se "true", TODAS as suas sugestões DEVEM preservar ou incorporar rimas consistentes.
- Considere o tipo de estrutura: "{{structure}}".

REGRAS DE TOM — "{{tone}}":
{{{toneRules}}}

REGRAS ESTRUTURAIS (NBR):
{{{nbrRules}}}

MATERIAL DE PESQUISA (consulte para fundamentar sugestões com exemplos da tradição poética brasileira):
{{{researchRules}}}

REGRAS DE RIMA:
{{{rhymeRules}}}

EXEMPLO:
{
  "originalText": "A noite escura caiu",
  "correctedText": "Despencou a noite overta sobre o vale",
  "explanation": "Substituir 'caiu' por 'despencou' e 'escura' por 'oberta' (forma poética de 'aberta') intensifica a imagem visual e o tom melancólico. A inversão sintática ('Despencou a noite...') confere maior poeticidade.",
  "severity": "baixa",
  "alternatives": [
    "A noite overta desabou silente",
    "Caiu a noite, escura e overta"
  ]
}
`;

export const toneAgent = ai.definePrompt({
  name: 'toneAgent',
  input: { schema: SuggestionInputSchema },
  output: { schema: ToneSuggestionOutputSchema },
  prompt: TONE_AGENT_PROMPT,
});

export async function runToneAgent(
  text: string,
  input: Record<string, unknown>,
  preferredModel?: string
): Promise<{ suggestions: Suggestion[]; modelUsed: string }> {
  try {
    const { result: genkitResponse, modelUsed } = await withFallback(
      (model: string) => toneAgent({ ...input, text } as never, { model }),
      undefined,
      preferredModel
    );
    const output = genkitResponse?.output;
    return { suggestions: output?.suggestions || [], modelUsed };
  } catch {
    const { result, modelUsed } = await tryOpenRouterFallback(
      TONE_AGENT_PROMPT,
      { ...input, text },
      ToneSuggestionOutputSchema,
    );
    return { suggestions: result.suggestions || [], modelUsed };
  }
}
