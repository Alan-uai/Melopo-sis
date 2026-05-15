'use server';

import { ai, withFallback } from '@/ai/genkit';
import { SuggestionInputSchema, SuggestionOutputSchema, type SuggestionInput, type Suggestion } from '@/ai/types';
import { loadNbrRules, loadToneRules, loadOrthographyRules, loadPunctuationRules } from '@/lib/nbr-loader';
import type { TextStructure } from '@/lib/poetic-forms';
import { validateAll } from '@/lib/local-validator';

export async function generateContextualSuggestions(input: SuggestionInput) {
  return suggestionFlow(input);
}

const grammarPrompt = ai.definePrompt({
  name: 'grammarPrompt',
  input: { schema: SuggestionInputSchema },
  output: { schema: SuggestionOutputSchema },
  prompt: `
Você é um assistente de escrita poética altamente preciso, especializado em português do Brasil e nas normas da ABNT aplicáveis a textos literários. Sua tarefa é analisar o texto poético fornecido e retornar uma lista de correções gramaticais e estruturais.

REGRAS DE LICENÇA POÉTICA:
- NÃO corrija inversões sintáticas intencionais (hipérbatos) como "As estrelas no céu brilhavam" → "No céu as estrelas brilhavam" é aceitável.
- NÃO corrija arcaísmos poéticos (palavras antigas usadas para efeito estilístico) como "escuro" em vez de "escuridão", "lume" em vez de "luz".
- NÃO corrija síncopes poéticas (supressão de fonemas) — a menos que seja erro óbvio.
- NÃO corrija elisões propositais para manter métrica, como "d'água" em vez de "de água".
- Preserve a linguagem poética e metafórica. Corrija apenas o que for inequivocamente errado.

REGRAS DA ESTRUTURA "{{structure}}":
{{{nbrRules}}}

REGRAS DE PONTUAÇÃO POÉTICA:
{{{punctuationRules}}}

REGRAS DO ACORDO ORTOGRÁFICO:
{{{orthographyRules}}}

O texto a ser analisado é:
\`\`\`
{{{text}}}
\`\`\`

ETAPA 1: VERIFICAÇÃO GRAMATICAL E DE PONTUAÇÃO (LINHA POR LINHA).
- Analise o texto, linha por linha, em busca de TODOS os erros gramaticais e de pontuação.
- Preste atenção especial a estas confusões comuns em português:
  * "mas" (porém) vs "mais" (quantidade) — ERRADO: "Mais eu queria dizer" → CORRETO: "Mas eu queria dizer"
  * "a" (preposição/artigo) vs "há" (haver, tempo passado) — ERRADO: "A muito tempo" → CORRETO: "Há muito tempo"
  * "mau" (adjetivo, oposto de bom) vs "mal" (advérbio, oposto de bem) — ERRADO: "O mal caráter" → CORRETO: "O mau caráter"
  * "porque" (resposta/explicação) vs "por que" (pergunta/razão) vs "porquê" (substantivo) vs "por quê" (final de frase)
  * "onde" (lugar físico) vs "aonde" (movimento/direção)
  * "senão" (caso contrário, defeito) vs "se não" (se + não, condicional)
  * "acerca de" (sobre) vs "cerca de" (aproximadamente) vs "há cerca de" (tempo aproximado)
  * "tampouco" (também não) vs "tão pouco" (tão + pouco)
  * "ao invés de" (oposição) vs "em vez de" (substituição)
  * Uso de crase: "à" (a + a), "àquela", "àquele", "àquelas"
  * Acentuação correta de verbos com pronome: "chamarão-me" (errado) → "chamar-me-ão" (correto)

ETAPA 2: VERIFICAÇÃO ESTRUTURAL (TEXTO COMPLETO).
- Após a verificação linha por linha, analise o texto como um todo.
- Verifique se a estrutura geral está de acordo com as normas da ABNT e com as regras do tipo "{{structure}}".
- Verifique métrica, estrofação, e esquema de rimas conforme as regras da estrutura escolhida.

ETAPA 3: COMPILAÇÃO DA LISTA DE ERROS.
- Compile TODOS os erros encontrados em uma única lista de sugestões do tipo 'grammar'.
- Para cada erro, forneça:
  * originalText: o trecho com erro
  * correctedText: a correção
  * explanation: explicação clara referenciando a regra (ex: "Erro de acentuação: 'poesia' não leva acento"; "Confusão entre 'mas' e 'mais': 'mas' é conjunção adversativa")
  * context: o verso completo onde o erro aparece
  * severity: 'alta' para erros graves (ortografia, concordância), 'media' para correções recomendadas (pontuação, crase), 'baixa' para sugestões opcionais (estilo, ênfase)
  * alternatives: lista de alternativas de correção quando houver mais de uma opção válida
- Se 'rhyme' for verdadeiro, certifique-se de que suas correções mantenham ou melhorem a rima.
- Se houver palavras em excludedPhrases, ignore-as completamente.
- Se NENHUM erro for encontrado, retorne array vazio.

EXEMPLOS DE RESPOSTA CORRETA:
[
  {
    "originalText": "Mais eu queria",
    "correctedText": "Mas eu queria",
    "explanation": "Confusão entre 'mas' e 'mais'. 'Mas' é conjunção adversativa (porém). 'Mais' indica quantidade. Como há oposição de ideias, o correto é 'mas'.",
    "severity": "alta",
    "context": "Mais eu queria dizer o que sentia",
    "alternatives": []
  },
  {
    "originalText": "A muito tempo",
    "correctedText": "Há muito tempo",
    "explanation": "Confusão entre 'a' e 'há'. 'Há' (do verbo haver) é usado para indicar tempo decorrido. 'A' é preposição ou artigo.",
    "severity": "alta",
    "context": "A muito tempo que não chove",
    "alternatives": []
  }
]

IMPORTANTE:
- FOCO EXCLUSIVO: Sua resposta DEVE conter apenas sugestões do tipo 'grammar'. NÃO forneça sugestões de 'tone'.
- Retorne a lista completa de TODOS os erros encontrados.
  `,
});

const tonePrompt = ai.definePrompt({
  name: 'tonePrompt',
  input: { schema: SuggestionInputSchema },
  output: { schema: SuggestionOutputSchema },
  prompt: `
Você é um especialista em estilo e tom poético para o português do Brasil. O texto a seguir já foi corrigido gramaticalmente.

Sua tarefa é fornecer sugestões de 'tone' (tom e estilo) para tornar o poema mais impactante, alinhado com o tom desejado: "{{tone}}".

O texto a ser analisado é:
\`\`\`
{{{text}}}
\`\`\`

 REGRAS:
- Para cada sugestão, forneça o trecho original, uma alternativa estilística, e explique o motivo da mudança.
- Forneça 2-3 alternativas quando possível (alternatives).
- A justificativa deve ser estilística/literária, não gramatical.
- Se nenhum aprimoramento de tom for necessário, retorne array vazio.
- Mantenha a métrica e a rima se o poema as utilizar.
- Considere o tipo de estrutura: "{{structure}}".

REGRAS DE TOM — "{{tone}}":
{{{toneRules}}}

REGRAS ESTRUTURAIS (NBR):
{{{nbrRules}}}

EXEMPLO:
{
  "originalText": "A noite escura caiu",
  "correctedText": "Despencou a noite overta sobre o vale",
  "explanation": "Substituir 'caiu' por 'despencou' e 'escura' por 'oberta' (forma poética de 'aberta') intensifica a imagem visual e o tom melancólico. A inversão sintática ('Despencou a noite...') confere maior poeticidade.",
  "severity": "baixa",
  "alternatives": [
    "A noite overta desabou silente",
    "Caiu a noite, escura e overta"
  ]
}
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

    const nbrRules = input.nbrRules || loadNbrRules(input.structure);
    const toneRules = input.toneRules || loadToneRules(input.tone);
    const orthographyRules = input.orthographyRules || loadOrthographyRules();
    const punctuationRules = input.punctuationRules || loadPunctuationRules();
    const enrichedInput = { ...input, nbrRules, toneRules, orthographyRules, punctuationRules };

    if (input.suggestionType === 'grammar' || input.suggestionType === 'all') {
      const localResult = await validateAll(
        input.text,
        input.structure as TextStructure,
        input.rhyme
      );

      if (localResult.suggestions.length > 0) {
        return localResult;
      }
    }

    if (input.suggestionType === 'tone') {
      const { output } = await withFallback((model) => tonePrompt(enrichedInput, { model }));
      return output || { suggestions: [] };
    }

    const { output } = await withFallback((model) => grammarPrompt(enrichedInput, { model }));
    return output || { suggestions: [] };
  }
);
