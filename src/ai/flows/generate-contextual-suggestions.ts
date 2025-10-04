'use server';
/**
 * @fileOverview Fluxo de IA para gerar sugestões contextuais de gramática e tom para poesia.
 *
 * - generateContextualSuggestions - A função principal que invoca o fluxo da IA.
 */

import { ai } from '@/ai/genkit';
import { SuggestionInputSchema, SuggestionOutputSchema, type SuggestionInput } from '@/ai/types';

/**
 * Invoca o fluxo de IA para gerar sugestões para o texto fornecido.
 * @param input Os dados de entrada contendo o texto e as configurações.
 * @returns Uma promessa que resolve para a saída com a lista de sugestões.
 */
export async function generateContextualSuggestions(input: SuggestionInput) {
  return suggestionFlow(input);
}

const suggestionPrompt = ai.definePrompt({
  name: 'suggestionPrompt',
  input: { schema: SuggestionInputSchema },
  output: { schema: SuggestionOutputSchema },
  prompt: `
    Você é um assistente de escrita poética especializado em português do Brasil e nas normas da ABNT. Sua tarefa é analisar um texto e fornecer sugestões para aprimorá-lo.

    O processo DEVE seguir as seguintes etapas, em ordem estrita:

    ETAPA 1: VERIFICAÇÃO GRAMATICAL COMPLETA.
    PRIMEIRO, FAÇA UMA VARREDURA COMPLETA DO TEXTO. Analise o texto por inteiro em busca de TODOS os erros gramaticais, de ortografia, ou de estrutura. O texto a ser analisado é:
    \`\`\`
    {{{text}}}
    \`\`\`
    - Se encontrar erros, forneça uma lista com TODAS as sugestões do tipo 'grammar' que encontrar.
    - NÃO forneça sugestões de 'tone' neste caso. A sua resposta DEVE conter apenas sugestões do tipo 'grammar'.
    - Para cada erro, explique claramente o problema e sugira uma correção precisa.
    - Se a opção 'rhyme' for verdadeira, certifique-se de que suas correções mantenham ou melhorem a rima.
    - Ignore qualquer palavra ou frase listada em 'excludedPhrases'.

    ETAPA 2: SUGESTÕES DE TOM E ESTILO.
    - Se, E SOMENTE SE, a Etapa 1 não encontrar NENHUM erro gramatical, de ortografia ou estrutura, você pode prosseguir para esta etapa.
    - Analise o texto para melhorias de tom e estilo, com base no tom desejado: '{{tone}}'.
    - Forneça sugestões do tipo 'tone' para tornar o poema mais impactante, evocativo ou alinhado com o tom solicitado.
    - As sugestões podem incluir a substituição de palavras, a reorganização de frases ou a reescrita de versos para melhor fluidez e métrica.
    - Se a opção 'rhyme' for verdadeira, suas sugestões de tom DEVEM manter a rima.

    Formato da Saída:
    - Retorne um objeto JSON com uma chave "suggestions", que é um array.
    - Se nenhum erro ou sugestão for encontrado, retorne um array de sugestões vazio.
  `,
});

const suggestionFlow = ai.defineFlow(
  {
    name: 'suggestionFlow',
    inputSchema: SuggestionInputSchema,
    outputSchema: SuggestionOutputSchema,
  },
  async (input) => {
    // Adiciona um log para depuração
    console.log('Iniciando o fluxo com a entrada:', input);

    if (!input.text.trim()) {
      console.log('Texto de entrada vazio, retornando sem sugestões.');
      return { suggestions: [] };
    }

    try {
      const { output } = await suggestionPrompt(input);
      console.log('Saída da IA recebida:', output);
      return output || { suggestions: [] };
    } catch (e: any) {
      console.error('Erro ao chamar o prompt da IA:', e);
      // Lança o erro para que a camada de chamada (no cliente) possa tratá-lo
      throw new Error(`Falha ao comunicar com o modelo de IA: ${e.message}`);
    }
  }
);
