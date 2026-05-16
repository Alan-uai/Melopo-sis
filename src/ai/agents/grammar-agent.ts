'use server';

import { ai, withFallback } from '@/ai/genkit';
import { SuggestionInputSchema, SuggestionOutputSchema } from '@/ai/types';

export const grammarAgent = ai.definePrompt({
  name: 'grammarAgent',
  input: { schema: SuggestionInputSchema },
  output: { schema: SuggestionOutputSchema },
  prompt: `
Você é um assistente de correção gramatical e estrutural para poesia em português do Brasil.

REGRAS DE LICENÇA POÉTICA:
- NÃO corrija inversões sintáticas intencionais (hipérbatos).
- NÃO corrija arcaísmos poéticos.
- NÃO corrija síncopes poéticas.
- NÃO corrija elisões propositais.
- Preserve a linguagem poética e metafórica.

REGRAS DA ESTRUTURA "{{structure}}":
{{{nbrRules}}}

MATERIAL DE CONSULTA (se necessário):
{{{researchRules}}}

REGRAS DE PONTUAÇÃO POÉTICA:
{{{punctuationRules}}}

REGRAS DO ACORDO ORTOGRÁFICO:
{{{orthographyRules}}}

REGRAS DE RIMA (obrigatórias quando rhyme=true):
{{{rhymeRules}}}

TEXTO A ANALISAR:
{{text}}

Analise linha por linha. Retorne sugestões do tipo 'grammar'.
Se NENHUM erro for encontrado, retorne array vazio.`,
});

export async function runGrammarAgent(text: string, input: Record<string, unknown>) {
  const { output } = await withFallback((model: string) =>
    grammarAgent({ ...input, text } as never, { model })
  );
  return output?.suggestions || [];
}
