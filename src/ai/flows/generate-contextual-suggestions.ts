'use server';

/**
 * @fileOverview A flow that provides context-aware corrections and improvements based on ABNT rules for poetry.
 *
 * - generateContextualSuggestions - A function that handles the generation of contextual suggestions for poetry.
 * - GenerateContextualSuggestionsInput - The input type for the generateContextualSuggestions function.
 * - GenerateContextualSuggestionsOutput - The return type for the generateContextualSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateContextualSuggestionsInputSchema = z.object({
  text: z.string().describe('The poetry text to provide suggestions for.'),
  tone: z.string().describe('The desired tone for the poem (e.g., Melancholic, Romantic).'),
  suggestionType: z.enum(['grammar', 'tone', 'all']).describe('The type of suggestions to generate.'),
  excludedPhrases: z.array(z.string()).optional().describe('A list of phrases or words to avoid in the new suggestions.'),
  textStructure: z.enum(['poesia', 'poema']).describe('The structure of the text (Poesia or Poema) to follow ABNT rules for.'),
  rhyme: z.boolean().describe('Whether the suggestions should enforce rhymes.'),
});
export type GenerateContextualSuggestionsInput = z.infer<typeof GenerateContextualSuggestionsInputSchema>;

const SuggestionSchema = z.object({
  originalText: z.string().describe('The original snippet of text from the poem.'),
  correctedText: z.string().describe('The corrected text suggestion.'),
  explanation: z.string().describe('The explanation for the suggestion based on the chosen tone and ABNT rules.'),
  type: z.enum(['tone', 'grammar']).describe('The type of suggestion: "tone" for stylistic improvements or "grammar" for corrections.'),
});

const GenerateContextualSuggestionsOutputSchema = z.object({
  suggestions: z.array(SuggestionSchema).describe('An array of contextual suggestions for the poetry text.'),
});
export type GenerateContextualSuggestionsOutput = z.infer<typeof GenerateContextualSuggestionsOutputSchema>;

export async function generateContextualSuggestions(input: GenerateContextualSuggestionsInput): Promise<GenerateContextualSuggestionsOutput> {
  return generateContextualSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateContextualSuggestionsPrompt',
  input: {schema: GenerateContextualSuggestionsInputSchema},
  output: {schema: GenerateContextualSuggestionsOutputSchema},
  prompt: `Você é um assistente de IA especialista em literatura brasileira e nas normas da ABNT. Sua tarefa é analisar um texto e fornecer sugestões para aprimorá-lo, considerando a estrutura de um(a) '{{textStructure}}'.

{{#if rhyme}}
- REQUISITO ADICIONAL: O texto DEVE rimar. Todas as suas sugestões, tanto de gramática quanto de tom, devem introduzir, manter ou aprimorar o esquema de rimas do texto.
{{/if}}

A sua prioridade MÁXIMA é a gramática e a estrutura.
1. PRIMEIRO, verifique se há erros gramaticais, de ortografia, ou de estrutura (espaçamento, pontuação, estrofes) de acordo com as normas da ABNT para um(a) '{{textStructure}}'.
   - Se encontrar erros, forneça APENAS sugestões do tipo 'grammar'. NÃO forneça sugestões de 'tone' se houver erros.
2. SE E SOMENTE SE não houver nenhum erro gramatical ou estrutural, você pode então prosseguir para analisar o tom.

- Se 'suggestionType' for 'grammar':
  - Foque EXCLUSIVAMENTE em identificar erros gramaticais, de ortografia ou estrutura.
  - Para cada erro, crie uma sugestão com 'type: "grammar"'.
  - A 'explanation' deve esclarecer a regra da ABNT ou gramatical de forma concisa.

- Se 'suggestionType' for 'tone':
  - ASSUMINDO que não há erros, foque EXCLUSIVaMENTE em identificar trechos que podem ser melhorados para se adequar ao tom selecionado: '{{tone}}'.
  - Para cada melhoria, crie uma sugestão com 'type: "tone"'.
  - A 'explanation' deve descrever como a alteração realça o tom especificado.

- Se 'suggestionType' for 'all':
  - Siga a regra de prioridade: Verifique a gramática e estrutura primeiro. Se houver erros, retorne apenas sugestões de 'grammar'. Se não houver erros, retorne apenas sugestões de 'tone'.

Para cada sugestão, você deve:
- Identificar um trecho específico ('originalText').
- Fornecer uma alternativa ('correctedText').
- Fornecer uma 'explanation' clara.
- Definir o campo 'type' corretamente ('grammar' ou 'tone').
- Manter a arte da escrita. Sugira apenas alterações que realmente aprimorem o texto. Se não houver sugestões, retorne um array vazio.

{{#if excludedPhrases}}
- IMPORTANTE: Ao gerar a sugestão para 'correctedText', evite usar as seguintes palavras ou frases: {{#each excludedPhrases}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}. Encontre alternativas criativas.
{{/if}}

Texto a ser analisado (estrutura de '{{textStructure}}'):
"{{text}}"

{{#if tone}}
Tom Desejado: {{tone}}
{{/if}}

Tipo de Sugestão Solicitada: {{suggestionType}}

Sempre retorne a saída no formato JSON.
  `,
});

const generateContextualSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateContextualSuggestionsFlow',
    inputSchema: GenerateContextualSuggestionsInputSchema,
    outputSchema: GenerateContextualSuggestionsOutputSchema,
  },
  async input => {
    if (!input.text.trim()) {
      return { suggestions: [] };
    }
    const {output} = await prompt(input);

    return output || { suggestions: [] };
  }
);

    