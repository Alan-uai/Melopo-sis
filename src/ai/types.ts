import { z } from 'zod';

// Define o esquema para cada sugestão individual
export const SuggestionSchema = z.object({
  originalText: z.string().describe('O trecho de texto original que contém o erro.'),
  correctedText: z.string().describe('O texto corrigido ou a versão alternativa sugerida.'),
  explanation: z.string().describe('Uma explicação clara e concisa do porquê a sugestão está sendo feita.'),
  type: z.enum(['grammar', 'tone']).describe("O tipo de sugestão: 'grammar' para erros e 'tone' para melhorias de estilo.")
});

// Define o esquema para a entrada do fluxo
export const SuggestionInputSchema = z.object({
  text: z.string().describe('O texto completo do poema a ser analisado.'),
  tone: z.string().describe('O tom desejado para o poema (ex: Melancólico, Jubiloso).'),
  structure: z.enum(['poema', 'poesia']).describe("A estrutura do texto, 'poema' ou 'poesia'."),
  rhyme: z.boolean().describe('Indica se o texto deve ter rima.'),
  suggestionType: z.enum(['all', 'grammar', 'tone']).describe("Define o tipo de sugestão a ser gerada."),
  excludedPhrases: z.array(z.string()).optional().describe('Uma lista de palavras ou frases que a IA deve ignorar e não tentar corrigir.')
});
export type SuggestionInput = z.infer<typeof SuggestionInputSchema>;

// Define o esquema para a saída do fluxo
export const SuggestionOutputSchema = z.object({
  suggestions: z.array(SuggestionSchema).describe('Uma lista de sugestões de correção ou melhoria.')
});
export type SuggestionOutput = z.infer<typeof SuggestionOutputSchema>;

// Types for the frontend
export type Suggestion = z.infer<typeof SuggestionSchema>;
export type SuggestionMode = "gradual" | "final";
export type TextStructure = "poesia" | "poema";
