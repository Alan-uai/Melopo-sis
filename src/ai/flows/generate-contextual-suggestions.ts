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

const grammarPrompt = ai.definePrompt({
  name: 'grammarPrompt',
  input: { schema: SuggestionInputSchema },
  output: { schema: SuggestionOutputSchema },
  prompt: `
    Você é um assistente de escrita poética altamente preciso, especializado em português do Brasil e nas normas da ABNT aplicáveis a textos literários. Sua tarefa é analisar o texto poético fornecido e retornar uma lista COMPLETA de correções gramaticais e estruturais.

    O processo DEVE seguir as seguintes etapas, EM ORDEM ESTRITA, DENTRO DE UMA ÚNICA EXECUÇÃO:

    ETAPA 1: VERIFICAÇÃO GRAMATICAL E DE PONTUAÇÃO (LINHA POR LINHA).
    - Analise o texto, linha por linha, em busca de TODOS os erros gramaticais e de pontuação.
    - O texto a ser analisado é:
    \`\`\`
    {{{text}}}
    \`\`\`

    ETAPA 2: VERIFICAÇÃO ESTRUTURAL (TEXTO COMPLETO).
    - Após a verificação linha por linha, analise o texto como um todo.
    - Verifique se a estrutura geral está de acordo com as normas da ABNT para o tipo de texto especificado: '{{structure}}'.
    - Identifique TODOS os erros estruturais, como métrica irregular (se aplicável), estrofação inadequada ou quebra de ritmo.

    ETAPA 3: COMPILAÇÃO DA LISTA DE ERROS.
    - Compile TODOS os erros encontrados nas Etapas 1 e 2 em uma única lista de sugestões do tipo 'grammar'.
    - Para cada erro, forneça o trecho original, a sugestão de correção e uma explicação clara.
    - Se a opção 'rhyme' for verdadeira, certifique-se de que suas correções mantenham ou melhorem a rima.
    - Ignore qualquer palavra ou frase listada em 'excludedPhrases'.
    - Se NENHUM erro for encontrado em nenhuma das etapas, retorne um array de sugestões vazio.

    IMPORTANTE:
    - FOCO EXCLUSIVO: Sua resposta DEVE conter apenas sugestões do tipo 'grammar'. NÃO forneça sugestões de 'tone' (tom ou estilo) NESTA ETAPA.
    - Retorne a lista completa de TODOS os erros encontrados. Não omita nenhum.

    Formato da Saída:
    - Retorne um objeto JSON com uma chave "suggestions", que é um array de objetos de sugestão.
  `,
});

const tonePrompt = ai.definePrompt({
  name: 'tonePrompt',
  input: { schema: SuggestionInputSchema },
  output: { schema: SuggestionOutputSchema },
  prompt: `
    Você é um especialista em estilo e tom poético. O texto a seguir já foi corrigido gramaticalmente.
    Sua tarefa é fornecer sugestões de 'tone' (tom e estilo) para torná-lo mais impactante, alinhado com o tom desejado de '{{tone}}'.

    - O texto a ser analisado é:
    \`\`\`
    {{{text}}}
    \`\`\`
    - Para cada sugestão, identifique o trecho original, forneça uma alternativa e explique o motivo da mudança de estilo.
    - Se nenhum aprimoramento de tom for necessário, retorne um array de sugestões vazio.

    Formato da Saída:
    - Retorne um objeto JSON com uma chave "suggestions", que é um array de objetos de sugestão do tipo 'tone'.
  `
});

const suggestionFlow = ai.defineFlow(
  {
    name: 'suggestionFlow',
    inputSchema: SuggestionInputSchema,
    outputSchema: SuggestionOutputSchema,
  },
  async (input) => {
    if (!input.text.trim()) {
      return { suggestions: [] };
    }

    // This simplified logic directly calls the appropriate prompt based on the input type,
    // removing the complex try/catch that was causing communication errors.
    if (input.suggestionType === 'tone') {
      const { output } = await tonePrompt(input);
      return output || { suggestions: [] };
    } 
    
    // Default to grammar suggestions
    const { output } = await grammarPrompt(input);
    return output || { suggestions: [] };
  }
);
