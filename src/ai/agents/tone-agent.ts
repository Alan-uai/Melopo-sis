'use server';

import { ai, withFallback } from '@/ai/genkit';
import { SuggestionInputSchema, SuggestionOutputSchema } from '@/ai/types';

export const toneAgent = ai.definePrompt({
  name: 'toneAgent',
  input: { schema: SuggestionInputSchema },
  output: { schema: SuggestionOutputSchema },
  prompt: `
Você é um especialista em estilo e tom poético para o português do Brasil. O texto a seguir já foi corrigido gramaticalmente.

Sua tarefa é fornecer sugestões de 'tone' (tom e estilo) para tornar o poema mais impactante, alinhado com o tom desejado: "{{tone}}".

O texto a ser analisado é:
\`\`\`
{{{text}}}
\`\`\`

 REGRAS:
- Para cada sugestão, forneça o trecho original, uma alternativa estilística, e explique o motivo da mudança.
- Forneça 2-3 alternativas quando possível (alternatives).
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
  `,
});

export async function runToneAgent(text: string, input: Record<string, unknown>) {
  const { output } = await withFallback((model: string) =>
    toneAgent({ ...input, text } as never, { model })
  );
  return output?.suggestions || [];
}
