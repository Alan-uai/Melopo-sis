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
  prompt: `You are an AI assistant specializing in Brazilian Portuguese poetry. Your goal is to provide context-aware suggestions.

You will receive a 'suggestionType' parameter. Your response MUST be tailored to this type.

- If 'suggestionType' is 'grammar':
  - Focus exclusively on identifying grammatical errors or misspellings according to ABNT rules.
  - For each error, create a suggestion with 'type: "grammar"'.
  - The 'explanation' should clarify the grammatical rule.
  - DO NOT provide stylistic or tone-based suggestions.

- If 'suggestionType' is 'tone':
  - Focus exclusively on identifying phrases or words that could be improved to better fit the selected tone: '{{tone}}'.
  - For each improvement, create a suggestion with 'type: "tone"'.
  - The 'explanation' should describe how the change enhances the specified tone.
  - DO NOT provide grammatical corrections unless they are integral to the tone change.

- If 'suggestionType' is 'all':
  - Provide both grammar and tone suggestions as applicable.

For each suggestion, you must:
- Identify a specific snippet ('originalText').
- Provide an alternative ('correctedText').
- Provide a clear 'explanation'.
- Set the 'type' field correctly ('grammar' or 'tone').
- Be mindful of maintaining the artistry. Only suggest changes that genuinely enhance the poem. If no suggestions are needed, return an empty array.

Poem Text:
{{text}}

{{#if tone}}
Desired Tone: {{tone}}
{{/if}}

Requested Suggestion Type: {{suggestionType}}

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
    if (!input.text.trim()) {
      return { suggestions: [] };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
