'use server';

import { ai, withFallback } from '@/ai/genkit';
import { SuggestionInputSchema, SuggestionOutputSchema, type Suggestion } from '@/ai/types';
import { tryOpenRouterFallback } from '@/ai/openrouter';

const RHYME_AGENT_PROMPT = `
Você é um especialista em rima e sonoridade poética do português brasileiro.

Analise o texto poético abaixo e forneça sugestões para melhorar suas rimas.

ESTRUTURA: {{structure}}
RIMA ATIVADA: {{rhyme}}

REGRAS DE RIMA:
{{{rhymeRules}}}

MATERIAL DE PESQUISA:
{{{researchRules}}}

TEXTO:
\`\`\`
{{{text}}}
\`\`\`

INSTRUÇÕES:
- Se "rhyme" for false, não retorne sugestões de rima.
- Verifique a consistência do esquema de rimas (ABAB, AABB, ABBA, etc.).
- Detecte rimas-eco (mesma palavra repetida no fim de versos) e sugira substituições.
- Detecte rimas clichê/desgastadas (amor/dor, coração/ilusão) e sugira alternativas originais.
- Detecte versos que não rimam quando deveriam rimar.
- Sugira palavras finais alternativas que melhorem a sonoridade preservando o sentido.
- Considere rimas ricas (classes gramaticais diferentes) sobre rimas pobres (mesma classe).

Retorne sugestões com tipo 'grammar' e severity adequada. Se a rima estiver correta, retorne array vazio.
`;

const rhymeAgent = ai.definePrompt({
  name: 'rhymeAgent',
  input: { schema: SuggestionInputSchema },
  output: { schema: SuggestionOutputSchema },
  prompt: RHYME_AGENT_PROMPT,
});

export async function runRhymeAgent(
  text: string,
  input: Record<string, unknown>,
  preferredModel?: string
): Promise<{ suggestions: Suggestion[]; modelUsed: string }> {
  try {
    const { result: genkitResponse, modelUsed } = await withFallback(
      (model: string) => rhymeAgent({ ...input, text } as never, { model }),
      undefined,
      preferredModel
    );
    const output = genkitResponse?.output;
    return { suggestions: output?.suggestions || [], modelUsed };
  } catch {
    const { result, modelUsed } = await tryOpenRouterFallback(
      RHYME_AGENT_PROMPT,
      { ...input, text },
      SuggestionOutputSchema,
    );
    return { suggestions: result.suggestions || [], modelUsed };
  }
}
