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
});
export type GenerateContextualSuggestionsInput = z.infer<typeof GenerateContextualSuggestionsInputSchema>;

const GenerateContextualSuggestionsOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      originalText: z.string().describe('The original snippet of text from the poem.'),
      correctedText: z.string().describe('The corrected text suggestion.'),
      explanation: z.string().describe('The explanation for the suggestion based on the chosen tone and ABNT rules.'),
      type: z.enum(['tone', 'grammar']).describe('The type of suggestion: "tone" for stylistic improvements or "grammar" for corrections.'),
    })
  ).describe('An array of contextual suggestions for the poetry text.'),
});
export type GenerateContextualSuggestionsOutput = z.infer<typeof GenerateContextualSuggestionsOutputSchema>;

export async function generateContextualSuggestions(input: GenerateContextualSuggestionsInput): Promise<GenerateContextualSuggestionsOutput> {
  return generateContextualSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateContextualSuggestionsPrompt',
  input: {schema: GenerateContextualSuggestionsInputSchema},
  output: {schema: GenerateContextualSuggestionsOutputSchema},
  prompt: `Você é um assistente de IA especialista em poesia em português do Brasil e nas normas da ABNT. Seu objetivo é fornecer sugestões contextuais para aprimorar um poema.

A sua prioridade MÁXIMA é a gramática.
1. PRIMEIRO, verifique se há erros gramaticais ou de ortografia no texto.
   - Se encontrar erros, forneça APENAS sugestões do tipo 'grammar'. NÃO forneça sugestões de 'tone' se houver erros gramaticais.
2. SE E SOMENTE SE não houver nenhum erro gramatical, você pode então prosseguir para analisar o tom.

- Se 'suggestionType' for 'grammar':
  - Foque EXCLUSIVAMENTE em identificar erros gramaticais ou de ortografia.
  - Para cada erro, crie uma sugestão com 'type: "grammar"'.
  - A 'explanation' deve esclarecer a regra gramatical de forma concisa.

- If 'suggestionType' is 'tone':
  - ASSUMINDO que não há erros gramaticais, foque EXCLUSIVAMENTE em identificar trechos que podem ser melhorados para se adequar ao tom selecionado: '{{tone}}'.
  - Para cada melhoria, crie uma sugestão com 'type: "tone"'.
  - A 'explanation' deve descrever como a alteração realça o tom especificado.

- Se 'suggestionType' for 'all':
  - Siga a regra de prioridade: Verifique a gramática primeiro. Se houver erros, retorne apenas sugestões de 'grammar'. Se não houver erros de gramática, retorne apenas sugestões de 'tone'.

Para cada sugestão, você deve:
- Identificar um trecho específico ('originalText').
- Fornecer uma alternativa ('correctedText').
- Fornecer uma 'explanation' clara.
- Definir o campo 'type' corretamente ('grammar' ou 'tone').
- Manter a arte da poesia. Sugira apenas alterações que realmente aprimorem o poema. Se não houver sugestões, retorne um array vazio.

{{#if excludedPhrases}}
- IMPORTANTE: Ao gerar a sugestão para 'originalText', evite usar as seguintes palavras ou frases: {{#each excludedPhrases}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}. Encontre alternativas criativas.
{{/if}}

Poema ou linha a ser analisado:
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
    // Ensure the output always contains the original text to allow mapping.
    if (output && output.suggestions.length > 0 && !output.suggestions[0].originalText) {
      output.suggestions[0].originalText = input.text;
    }
    return output!;
  }
);
