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
});
export type GenerateContextualSuggestionsInput = z.infer<typeof GenerateContextualSuggestionsInputSchema>;

const GenerateContextualSuggestionsOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      originalText: z.string().describe('The original snippet of text from the poem.'),
      correctedText: z.string().describe('The corrected text suggestion.'),
      explanation: z.string().describe('The explanation for the suggestion based on the chosen tone and ABNT rules.'),
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
  prompt: `You are an AI assistant specializing in Brazilian Portuguese poetry. Your goal is to provide context-aware suggestions to enhance a poem based on a chosen tone and ABNT grammatical rules.

You will analyze the user's poem and identify phrases or words that could be improved to better fit the selected tone: '{{tone}}'.

For each suggestion, you must:
1. Identify a specific snippet ('originalText') from the poem that could be improved.
2. Provide an alternative, 'correctedText', using synonyms or different phrasing that aligns better with the '{{tone}}' tone.
3. Provide a clear 'explanation' for why the suggestion enhances the poem's desired tone.
4. Also, check for any grammatical errors according to ABNT rules and suggest corrections.
5. Be mindful of maintaining the artistry and poetic intent. Only suggest changes that genuinely enhance the poem. If the poem is already perfect for the tone, return an empty array of suggestions.

Poem Text:
{{text}}

Desired Tone: {{tone}}

Output the suggestions in JSON format.
  `,
});

const generateContextualSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateContextualSuggestionsFlow',
    inputSchema: GenerateContextualSuggestionsInputSchema,
    outputSchema: GenerateContextualSuggestionsOutputSchema,
  },
  async input => {
    if (!input.text.trim() || !input.tone) {
      return { suggestions: [] };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
