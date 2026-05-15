'use server';

import { ai } from '@/ai/genkit';
import { SuggestionInputSchema, SuggestionOutputSchema, type SuggestionInput } from '@/ai/types';

export async function generateContextualSuggestions(input: SuggestionInput) {
  return suggestionFlow(input);
}

const ABNT_CATALOG = `
## CATÁLOGO DE REFERÊNCIAS — NORMAS ABNT PARA TEXTOS LITERÁRIOS E POESIA

### 1. ORTOGRAFIA E ACENTUAÇÃO (BASEADO NO ACORDO ORTOGRÁFICO DE 1990 E NBR 6029)
- Acentuação de paroxítonas terminadas em ditongo crescente (ex: "poesia" não leva acento, "herói" leva)
- Uso correto de crase (à, às, àquele, àquela)
- Emprego do hífen conforme o novo acordo (ex: "autoestima", "antissocial", "bem-vindo")
- Ditongos abertos "ei" e "oi" em paroxítonas não são mais acentuados (ex: "ideia", "heroico")
- Uso de trema abolido (ex: "linguiça", "sequência")

### 2. PONTUAÇÃO (NBR 6029 — APRESENTAÇÃO DE LIVROS E TEXTOS)
- Vírgula: separa termos coordenados, isola aposto, separa orações adverbiais antepostas
- Ponto e vírgula: separa itens de uma enumeração complexa
- Dois-pontos: introduz citação, explicação ou enumeração
- Reticências: indicam interrupção, hesitação ou supressão (sempre três pontos, sem espaço antes)
- Travessão: indica fala direta ou destaque (com espaços quando usado para inserir)
- Parênteses: para intercalações e indicações cênicas em poemas

### 3. CONCORDÂNCIA E REGÊNCIA (NORMA CULTA)
- Concordância verbal: verbo concorda com o núcleo do sujeito
- Concordância nominal: adjetivo concorda em gênero e número com o substantivo
- Regência verbal: uso correto de preposições (ex: "assistir a" no sentido de ver, "assistir" sem preposição no sentido de ajudar)
- Colocação pronominal: próclise em contextos negativos e com advérbios, ênclise no início de período (exceto em poesia, onde a ênclise pode ser flexionada por licença poética, desde que justificável)

### 4. MÉTRICA POÉTICA (ESTRUTURA VERSIFICADA)
- Redondilha maior: 7 sílabas poéticas
- Redondilha menor: 5 sílabas poéticas
- Decassílabo: 10 sílabas poéticas (heróico: acento na 6ª e 10ª; sáfico: acento na 4ª, 8ª e 10ª)
- Alexandrino: 12 sílabas poéticas (6+6)
- Verso branco: sem rima, mas com métrica regular
- Verso livre: sem métrica nem rima fixas
- Verso solto: sem rima, inserido entre versos rimados

### 5. ESQUEMAS DE RIMA
- Emparelhada (AABB): versos consecutivos rimam entre si
- Cruzada (ABAB): rimas alternadas
- Interpolada (ABBA): primeiro rima com quarto, segundo com terceiro
- Mista: combina diferentes esquemas
- Rima rica: entre palavras de classes gramaticais diferentes
- Rima pobre: entre palavras da mesma classe gramatical
- Rima perfeita: correspondência total de sons a partir da vogal tônica
- Rima imperfeita (consoante): apenas sons consonantais correspondem

### 6. FORMAS ESTRÓFICAS (ESTRUTURA DO POEMA)
- Dístico: 2 versos
- Terceto: 3 versos
- Quadra: 4 versos
- Quintilha: 5 versos
- Sextilha: 6 versos
- Oitava: 8 versos
- Décima: 10 versos
- Soneto: 14 versos (2 quartetos + 2 tercetos), métrica decassílaba
- Haicai: 3 versos (5-7-5 sílabas, mas em português adapta-se para temas naturais)

### 7. CITAÇÕES EM TEXTOS LITERÁRIOS (NBR 10520)
- Citação direta curta (até 3 linhas): entre aspas duplas, incorporada ao texto
- Citação direta longa (mais de 3 linhas): em bloco recuado 4cm, sem aspas, fonte menor
- Citação indireta: paráfrase, sem aspas, com menção ao autor
- Epígrafes: em página ímpar, alinhadas à direita, com indicação do autor

### 8. ESTRUTURAÇÃO DO TEXTO (NBR 6029)
- Título centralizado, em caixa alta ou versal
- Estrofes separadas por linha em branco
- Versos quebrados indicados com recuo à direita
- Poemas em prosa: parágrafos convencionais com elementos poéticos
- Numeração de estrofes (opcional, em algarismos romanos)
- Datas e locais de composição à direita ao final do poema
`;

const grammarPrompt = ai.definePrompt({
  name: 'grammarPrompt',
  input: { schema: SuggestionInputSchema },
  output: { schema: SuggestionOutputSchema },
  prompt: `
    Você é um assistente de escrita poética altamente preciso, especializado em português do Brasil e nas normas da ABNT aplicáveis a textos literários. Sua tarefa é analisar o texto poético fornecido e retornar uma lista COMPLETA de correções.

    Utilize o catálogo de referências ABNT abaixo como fonte de regras para todas as correções. Cada correção DEVE ser justificada com base em uma regra específica deste catálogo.

    ${ABNT_CATALOG}

    O processo DEVE seguir as seguintes etapas, EM ORDEM ESTRITA, DENTRO DE UMA ÚNICA EXECUÇÃO:

    ETAPA 1: VERIFICAÇÃO ORTOGRÁFICA E DE PONTUAÇÃO (LINHA POR LINHA).
    - Analise cada verso/linha do texto em busca de TODOS os erros de ortografia, acentuação, crase, hífen, pontuação, concordância e regência.
    - Consulte as seções 1, 2 e 3 do catálogo ABNT.
    - O texto a ser analisado é:
    \`\`\`
    {{{text}}}
    \`\`\`

    ETAPA 2: VERIFICAÇÃO DA ESTRUTURA POÉTICA E MÉTRICA (TEXTO COMPLETO).
    - Analise a estrutura geral do poema com base nas seções 4, 5, 6, 7 e 8 do catálogo ABNT.
    - Verifique a métrica (contagem de sílabas poéticas) se aplicável ao tipo de verso.
    - Verifique o esquema de rimas e se ele é consistente ao longo do poema.
    - Verifique a forma estrófica (quadra, soneto, etc.) e se está correta.
    - Verifique a estrutura de citações e epígrafes, se houver.
    - O tipo de estrutura selecionado é: '{{structure}}'.
    - Se a opção 'rhyme' for verdadeira, a presença e consistência de rima é OBRIGATÓRIA.

    ETAPA 3: COMPILAÇÃO DA LISTA DE CORREÇÕES.
    - Compile TODOS os erros encontrados nas Etapas 1 e 2 em uma única lista de sugestões do tipo 'grammar'.
    - Para cada erro, forneça: o trecho original, a correção sugerida, e uma explicação clara que mencione a regra ABNT ou norma específica utilizada.
    - Ignore qualquer palavra ou frase listada em 'excludedPhrases'.
    - Se NENHUM erro for encontrado, retorne um array de sugestões vazio.

    IMPORTANTE:
    - FOCO EXCLUSIVO EM GRAMÁTICA E ESTRUTURA: NÃO forneça sugestões de tom, estilo ou conteúdo criativo nesta etapa.
    - Retorne a lista completa de TODOS os erros encontrados. Seja rigoroso e minucioso.
    - Justifique cada correção com a referência à regra correspondente do catálogo ABNT.
    - Para poemas, considere a licença poética apenas quando houver justificativa estilística clara; caso contrário, aponte o desvio como sugestão.

    Formato da Saída:
    - Retorne um objeto JSON com uma chave "suggestions", que é um array de objetos de sugestão do tipo 'grammar'.
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

    if (input.suggestionType === 'tone') {
      const { output } = await tonePrompt(input);
      return output || { suggestions: [] };
    }

    const { output } = await grammarPrompt(input);
    return output || { suggestions: [] };
  }
);
