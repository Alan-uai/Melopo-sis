import { z } from 'zod';

export const SuggestionSchema = z.object({
  originalText: z.string().describe('O trecho de texto original que contém o erro ou pode ser melhorado.'),
  correctedText: z.string().describe('O texto corrigido ou a versão alternativa sugerida.'),
  explanation: z.string().describe('Uma explicação clara e concisa do porquê a sugestão está sendo feita.'),
  type: z.enum(['grammar', 'tone']).describe("O tipo de sugestão: 'grammar' para erros e 'tone' para melhorias de estilo."),
  severity: z.enum(['alta', 'media', 'baixa']).optional().describe("Nível de severidade: 'alta' para erros graves, 'media' para correções recomendadas, 'baixa' para sugestões opcionais."),
  context: z.string().optional().describe('O verso completo ou contexto onde o erro foi encontrado.'),
  alternatives: z.array(z.string()).optional().describe('Múltiplas alternativas de correção, quando aplicável.'),
});
export type Suggestion = z.infer<typeof SuggestionSchema>;

export const SuggestionInputSchema = z.object({
  text: z.string().describe('O texto completo do poema a ser analisado.'),
  tone: z.string().describe('O tom desejado para o poema (ex: Melancólico, Jubiloso).'),
  structure: z.string().describe("A estrutura do texto: 'poema', 'poesia', 'soneto', 'haicai', 'cordel', 'redondilha', 'decassilabo'."),
  rhyme: z.boolean().describe('Indica se o texto deve ter rima.'),
  suggestionType: z.enum(['all', 'grammar', 'tone']).describe("Define o tipo de sugestão a ser gerada."),
  excludedPhrases: z.array(z.string()).optional().describe('Uma lista de palavras ou frases que a IA deve ignorar e não tentar corrigir.'),
  localErrors: z.array(z.object({
    word: z.string(),
    position: z.number(),
    suggestions: z.array(z.string()),
  })).optional().describe('Erros ortográficos detectados localmente antes da chamada à IA.'),
  nbrRules: z.string().optional().describe('Regras NBR carregadas do documento correspondente à estrutura.'),
  toneRules: z.string().optional().describe('Regras de tom poético carregadas do documento de tom.'),
  orthographyRules: z.string().optional().describe('Regras do Acordo Ortográfico (acordo-ortografico.txt).'),
  punctuationRules: z.string().optional().describe('Regras de pontuação poética (pontuacao-poetica.txt).'),
});
export type SuggestionInput = z.infer<typeof SuggestionInputSchema>;

export const SuggestionOutputSchema = z.object({
  suggestions: z.array(SuggestionSchema).describe('Uma lista de sugestões de correção ou melhoria.'),
});
export type SuggestionOutput = z.infer<typeof SuggestionOutputSchema>;

export type SuggestionMode = "gradual" | "final";
export type TextStructure = "poesia" | "poema" | "soneto" | "haicai" | "cordel" | "redondilha" | "decassilabo";
