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
    Você é um assistente de escrita poética altamente preciso, especializado em português do Brasil e nas normas da ABNT aplicáveis a textos literários. Sua tarefa é analisar um texto poético e fornecer uma lista completa de correções gramaticais e estruturais.

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
    - NÃO forneça sugestões de 'tone' (tom ou estilo) NESTA ETAPA. A sua resposta DEVE conter apenas sugestões do tipo 'grammar'. A análise de tom só será solicitada em uma chamada futura, separadamente.
    - Retorne a lista completa de TODOS os erros encontrados. Não omita nenhum.

    Formato da Saída:
    - Retorne um objeto JSON com uma chave "suggestions", que é um array de objetos de sugestão.
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
      if (input.suggestionType === 'tone') {
         const { output: toneOutput } = await ai.generate({
            prompt: `O seguinte texto já foi corrigido gramaticalmente. Agora, forneça apenas sugestões de 'tone' (tom e estilo) para torná-lo mais impactante, alinhado com o tom desejado de '{{tone}}'. Texto: \`\`\`{{text}}\`\`\``,
            model: 'googleai/gemini-2.5-flash',
            output: { schema: SuggestionOutputSchema },
         });
         return toneOutput || { suggestions: [] };
      }

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
