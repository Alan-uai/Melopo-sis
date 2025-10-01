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
});
export type GenerateContextualSuggestionsInput = z.infer<typeof GenerateContextualSuggestionsInputSchema>;

const GenerateContextualSuggestionsOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      correctedText: z.string().describe('The corrected text suggestion.'),
      explanation: z.string().describe('The explanation for the suggestion based on ABNT rules.'),
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
  prompt: `You are an AI assistant that provides context-aware corrections and improvements for poetry written in Brazilian Portuguese, based on ABNT rules.

  Given the following poetry text, generate an array of suggestions. For each suggestion, provide the corrected text and an explanation based on ABNT rules.
  Be mindful of maintaining the artistry and poetic intent of the text. Only suggest ABNT corrections if the artistry is not degraded.

  Text:
  {{text}}

  Output the suggestions in JSON format:
  `,
});

const generateContextualSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateContextualSuggestionsFlow',
    inputSchema: GenerateContextualSuggestionsInputSchema,
    outputSchema: GenerateContextualSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
