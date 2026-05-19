# Plano de Extensão do Corretor Ortográfico Local — Melopoësis

## Escopo

**Corretor ortográfico local** = correção estrutural, morfológica, gramatical, pontuação, regras da língua portuguesa e normas ortográficas (Acordo Ortográfico 1990/2009/2013).

**Fora do escopo**: sugestões de rima, tom, tema — essas pertencem ao sistema Tone.

---

## Arquitetura em Camadas

```
                    ┌──────────────────────────┐
                    │      Editor (UI)          │
                    └────────────┬─────────────┘
                                 │ 800ms debounce / manual
                    ┌────────────▼─────────────┐
                    │  SuggestionCache (LRU)    │
                    │  SHA-256, 1000 entry, 1h  │
                    └────────────┬─────────────┘
                                 │ changed segments only
              ┌──────────────────┼──────────────────┐
              │                  │                  │
     ┌────────▼────────┐ ┌──────▼──────┐  ┌───────▼─────────┐
     │   grammar type  │ │  tone type  │  │   meter type    │
     └────────┬────────┘ └──────┬──────┘  └───────┬─────────┘
              │                 │                 │
     ┌────────▼─────────────────▼──────────────────▼─────────┐
     │              validateAll() orchestrator               │
     ├───────────────────────────────────────────────────────┤
     │  Camada 1: symspell-ts (O(1), 561k palavras)          │
     │  Camada 2: espells + dictionary-pt (fallback Hunspell) │
     │  Camada 3: StemmerPt + morfologia (prefixos, etc)      │
     │  Camada 4: POS tagger + regras gramaticais             │
     │    ├─ acentuação (7 módulos)                          │
     │    ├─ crase (6 padrões)                               │
     │    ├─ concordância verbal/nominal                     │
     │    └─ confusão de pares (mas/mais, mau/mal, a/há...)  │
     │  Camada 5: ngram LM contextual (erros reais)          │
     │  Camada 6: BERTimbau masked-LM (erros reais deep)     │
     │  Camada 7: LanguageTool Docker (~2000 regras PT-BR)   │
     ├───────────────────────────────────────────────────────┤
     │  PoeticOverride: desliga regras inadequadas p/ poesia  │
     └────────────────────────┬──────────────────────────────┘
                              │ se todas passarem
                    ┌─────────▼─────────┐
                    │  AI Agent (Genkit) │ → só quando local não resolve
                    └───────────────────┘
```

---

## FASE 1 — Motor de Correção (Sprint 1)

### 1. SymSpell + Damerau-Levenshtein + Keyboard-Aware

**Bibliotecas**:
- `symspell-ts` — Algoritmo SymSpell v6.7.3 (port TypeScript). O(1), 1000× mais rápido que Levenshtein
- `damerau-levenshtein` — Adiciona transposição de caracteres adjacentes (cobre 80% dos erros de digitação)
- `typenshtein` — Levenshtein ponderado por distância física no teclado ABNT2

**O que muda**:
- Substituir `getWordSuggestions()` atual (filtro `w[0] === lower[0]` + Levenshtein puro)
- Pré-carregar dicionário no SymSpell (deletes pré-computados em memória)
- Adicionar layout ABNT2 customizado para `typenshtein`
- SymSpell como motor primário, keyboard-weighted DL para ranqueamento

**Arquivo**: `src/lib/spelling/symspell-engine.ts`
**Alterado**: `src/lib/dictionary.ts` (getWordSuggestions aponta para SymSpell)

### 2. Bigrama Contextual dos Poemas

**Abordagem**: Build próprio (~80 linhas TS)
- Corpus extraído dos poemas (Firestore + localStorage)
- Contagem bigrama/trigrama + Stupid Backoff smoothing
- Serializado como JSON (~100KB-1MB)
- Skipear KenLM/lmx (bindings Node mortos)

**Arquivo**: `src/lib/spelling/ngram-lm.ts`

### 3. Expansão Morfológica Profunda

**Usar `StemmerPt` do `@nlpjs/lang-pt`** (já instalado!):
- Substituir funções manuais (`tryVerbConjugation`, `tryPlural`, etc) por `stemmer.stem()` + verificação de radical no dicionário
- Adicionar prefixos: `des-`, `in-`, `re-`, `pre-`, `sub-`, `anti-`, `super-`
- Adicionar verbos + pronome oblíquo: `fazê-lo`, `dizer-lhe`, `amá-la`
- Adicionar compostos hifenizados: `guarda-chuva`, `beija-flor`
- Adicionar superlativos absolutos sintéticos: `facílimo`, `paupérrimo`

**Arquivo**: `src/lib/dictionary.ts`

### 4. Fallback espells + dictionary-pt

**Bibliotecas**:
- `espells` — Único Hunspell puro JS que funciona com PT-BR. nspell vaza 1.4GB RAM com PT-BR
- `dictionary-pt` v4.0.0 — Dicionário Hunspell oficial PT-BR (projeto VERO, LibreOffice). AFIM: 956KB .aff + 4.3MB .dic

**OBS**: `dictionary-pt-br` foi **deprecado**. Usar `dictionary-pt` para PT-BR.

**Ordem**: `dictionary.ts` (561k palavras + morfologia) → `espells + dictionary-pt` (afixos Hunspell)

**Arquivo**: `src/lib/spelling/espells-bridge.ts`

---

## FASE 1.5 — Validação Gramatical Local

### 5. POS Tagger + Regras de Concordância

**Biblioteca**: `singularity-tagger` — HMM+Viterbi treinado no Mac-Morpho (USP). 27 categorias gramaticais. Pure JS.

**Regras implementadas**:

| Regra | Padrão | Exemplo erro | Correção |
|---|---|---|---|
| Suj-Verbo | plural + verbo singular | "os meninos canta" | "cantam" |
| Art-Subst | artigo feminino + subst masc | "a menino" | "o menino" |
| Art-Subst | artigo singular + subst plural | "o casas" | "as casas" |
| "mas" vs "mais" | "mais" como conjunção adversativa | "Mais ele disse" | "Mas ele disse" |
| "mau" vs "mal" | "mal" depois de ser/estar | "Ele é mal" | "Ele é mau" |
| "a" vs "há" | "a" para tempo decorrido | "A dois anos" | "Há dois anos" |
| "porque" vs "por que" | contexto pergunta vs afirmação | "Não fui por que..." | "Não fui porque..." |
| "mau" vs "mal" | "mal" antes de substantivo | "mal aluno" | "mau aluno" |

**Arquivo**: `src/lib/grammar/` (módulo com sub-regras)

### 6. Validação de Acentuação

**7 submódulos**:

| Módulo | Regras | Exemplo erro |
|---|---|---|
| Monossílabos tônicos | `pé`, `fé`, `só`, `má`, `pá`, `pó` levam acento | "pe" → "pé" |
| Oxítonas | Terminadas em a(s), e(s), o(s), em, ens, éi(s), éu(s), ói(s) | "cafe" → "café" |
| Paroxítonas | Terminadas em l, n, r, x, ps, i(s), u(s), ã(s), ão(s), um, ditongo | "facil" → "fácil" |
| Proparoxítonas | Todas levam acento | "medico" → "médico" |
| Hiato | i/u tônicos após vogal | "saude" → "saúde" |
| Acento diferencial | pôr/por, pôde/pode, têm/tem, vêm/vem | "Eles tem" → "Eles têm" |
| Trema | Abolido pelo AO 1990 | "linguiça" (antes: lingüiça) |

**Arquivo**: `src/lib/spelling/accent-validator.ts`

### 7. Validação de Crase

**6 padrões**:

| # | Padrão | Exemplo | Correção |
|---|---|---|---|
| 1 | a + palavra feminina (onde caberia "ao" se masc) | "Vou a praia" | "Vou à praia" |
| 2 | a + aquele/aquela/aquilo | "a aquele" | "àquele" |
| 3 | a + horas | "as 14h" | "às 14h" |
| 4 | Locuções fixas femininas | "as vezes" | "às vezes" |
| 5 | a + palavras femininas em adjuntos adverbiais | "a noite" | "à noite" |
| 6 | a + palavra feminina com especificador | "a página 10" | "à página 10" |

**Excetuados**: antes de pronomes pessoais, cidades sem especificador, "casa" sem modificador, "terra" em sentido oposto a "bordo".

**Arquivo**: `src/lib/grammar/crase.ts`

---

## FASE 2 — Corretor Profissional

### 8. LanguageTool Docker

**Stack**: Docker (`erikvl87/languagetool`) + `fetch` nativo (zero novas dependências npm)

**~2000 regras PT-BR**:
- Concordância verbal e nominal
- Crase
- Colocação pronominal (próclise/ênclise/mesóclise)
- Regência verbal
- Confusão de pares (todas as 20+)
- Ortografia (Acordo Ortográfico)
- Estilo (redundância, clichê)
- Pontuação

**Filtro poético**: 30+ regras desabilitadas em modo poesia + whitelist vocabular (`isPoeticFalsePositive()`)

**Arquivo**: `src/lib/languagetool-bridge.ts`
**Config**: `docker/docker-compose.languagetool.yml`

### 9. Stemmer Integrado

Substituir lógica morfológica manual por `StemmerPt` do `@nlpjs/lang-pt`:

```typescript
// Antes: 6 funções (tryVerbConjugation, tryPlural, tryAdverb, tryFeminine, tryDimAug, trySuperlative)
// Depois: stemmer.stem(word) + check if root exists in dictionary
```

**Arquivo**: `src/lib/dictionary.ts`

---

## FASE 3 — Detecção de Erros Reais (IA Local)

### 10. BERTimbau Masked-LM

**Stack**: `@huggingface/transformers` (npm) + modelo `Xenova/bert-base-portuguese-cased`

**Modelo**: neuralmind/bert-base-portuguese-cased, 110M params
- ONNX INT8: ~130MB em disco
- CPU: ~40-100ms por inferência
- Já pré-convertido para Transformers.js

**Algoritmo**:
1. Para cada palavra na frase, substituir por `[MASK]`
2. Rodar BERTimbau
3. Se o modelo predisser palavra diferente da original com confiança > 0.3 → sugerir
4. Filtrar pelo dicionário customizado (evitar "corrigir" o que é neologismo poético)

**Detecta**: erros reais que dicionário não pega (ex: "comprimento" vs "cumprimento" no contexto)

**Arquivo**: `src/lib/spelling/bert-spelling.ts`

---

## FASE 4 — Prosódia e Experiência do Usuário

### 11. Contagem Silábica Poética Aprimorada

**Referências**:
- `separador-silabas` (GitHub, MIT): 99.73% sílabas gramaticais, 99.91% tônica
- Aoidos (PhD UFSC): 99% acurácia em escansão automática. Algoritmo generate-and-select

**Implementar**:
- Sílabas gramaticais (base no separador-silabas)
- Sinalefa (junção de vogais entre palavras)
- Elisão (supressão de vogal final átona)
- Sinérese/diérese (junção/separção de vogais dentro da palavra)
- Contagem até a última sílaba tônica (vírgula poética)
- Detecção de cesura (alexandrino 6+6, decassílabo 4+6)
- Classificação de metro (decassílabo heróico/sáfico, alexandrino, redondilha)

**Arquivo**: `src/lib/prosody/metaplasm-engine.ts`

### 12. Dicionário Pessoal do Usuário

- Salvar no Firestore (logado) ou localStorage (anônimo)
- Merge com dicionário global na verificação
- Palavras: apelidos, neologismos poéticos, estrangeirismos

**Arquivo**: `src/lib/user-dictionary.ts`

### 13. Feedback Loop

- Botões Aceitar/Ignorar em cada sugestão
- Log de pares erro→correção
- Ranking de correções frequentes (auto-aprimoramento)

**Arquivo**: `src/hooks/use-suggestion-feedback.ts`

### 14. Testes Expandidos

| Categoria | Testes |
|---|---|
| Acentuação | oxítonas, paroxítonas, proparoxítonas, hiatos, diferencial, trema |
| Crase | 6 padrões, excetuados |
| Concordância | verbal, nominal, número |
| Confusão de pares | mas/mais, mau/mal, a/há, porque/por que, senão/se não, onde/aonde |
| Erros reais | "comprimento" vs "cumprimento", "sessão" vs "seção" |
| Performance | tempo para verificar soneto completo |
| Regressão | bunita → bonita, lindx → lindo |

**Arquivo**: `src/__tests__/` (novos arquivos)

---

## Matriz de Priorização

| # | Item | Deps novas | Esforço | Impacto | Fase |
|---|---|---|---|---|---|
| 1 | SymSpell + keyboard-aware | `symspell-ts`, `damerau-levenshtein`, `typenshtein` | 2 dias | ⭐⭐⭐⭐⭐ | 1 |
| 2 | POS tagger + regras gramaticais | `singularity-tagger` | 3 dias | ⭐⭐⭐⭐⭐ | 1.5 |
| 3 | espells fallback | `espells`, `dictionary-pt` | 1 dia | ⭐⭐⭐⭐ | 1 |
| 4 | Bigrama contextual | (build próprio) | 1 dia | ⭐⭐⭐⭐ | 1 |
| 5 | Acentuação + crase | (zero) | 3 dias | ⭐⭐⭐⭐ | 1.5 |
| 6 | LanguageTool Docker | (zero, fetch) | 1 dia | ⭐⭐⭐⭐ | 2 |
| 7 | Stemmer integrado | (já instalado) | 1 dia | ⭐⭐⭐ | 1 |
| 8 | BERTimbau ONNX | `@huggingface/transformers` | 5 dias | ⭐⭐⭐⭐⭐ | 3 |
| 9 | Métrica poética | (algoritmo) | 5 dias | ⭐⭐⭐⭐ | 4 |
| 10 | Testes expandidos | (zero) | 1 dia | ⭐⭐⭐⭐ | 4 |

---

## Estrutura de Arquivos Final

```
src/lib/
├── dictionary.ts                    # ← expandido: SymSpell + stemmer + espells
├── spell-checker.ts                 # ← mantido como entry point
├── suggestion-cache.ts              # ← mantido
├── local-validator.ts               # ← expandido: chama todas as camadas
├── spelling/
│   ├── symspell-engine.ts           # SymSpell + typenshtein
│   ├── ngram-lm.ts                  # Modelo bigrama contextual
│   ├── bert-spelling.ts             # BERTimbau masked-LM
│   └── espells-bridge.ts            # Fallback espells + dictionary-pt
├── grammar/
│   ├── index.ts                     # Orquestrador gramatical
│   ├── concordancia.ts              # Suj-verbo, art-subst, número
│   ├── crase.ts                     # 6 padrões de crase
│   ├── confusao-pares.ts            # mas/mais, mau/mal, a/há, porque, etc
│   └── colocacao-pronominal.ts      # Próclise/ênclise/mesóclise
├── spelling/
│   └── accent-validator.ts          # 7 módulos de acentuação
├── prosody/
│   ├── metaplasm-engine.ts          # Sinalefa, elisão, sinérese, diérese
│   ├── syllable-counter.ts          # Contagem silábica poética
│   └── meter-detector.ts            # Classificação de metro
├── languagetool-bridge.ts           # Cliente HTTP LanguageTool
└── user-dictionary.ts               # Dicionário pessoal do usuário

src/hooks/
└── use-suggestion-feedback.ts       # Feedback loop

plan/
└── correcao-ortografica.md          # ← Este arquivo
```

---

## Bibliotecas npm a Instalar

```bash
# Fase 1 - Motor
npm install symspell-ts damerau-levenshtein typenshtein espells dictionary-pt

# Fase 1.5 - Gramática
npm install singularity-tagger

# Fase 3 - BERT local
npm install @huggingface/transformers

# Já instaladas (usar sem instalar)
# @nlpjs/lang-pt (tem StemmerPt, TokenizerPt)
# dictionary-pt (só atualizar - deprecado dictionary-pt-br)
```

---

## Notas Técnicas Importantes

1. **nspell NÃO funciona com PT-BR**: issue #11 do GitHub — vazamento de 1.4GB RAM. Usar `espells` no lugar
2. **`dictionary-pt` v4 é o atual**: `dictionary-pt-br` foi deprecado. Usar `dictionary-pt` que representa PT-BR (BCP-47 `pt` = português brasileiro, `pt-PT` = Portugal)
3. **`@nlpjs/lang-pt` já está no package.json**: só expandir o `.d.ts` para expor `NormalizerPt`, `StopwordsPt`, `SentimentPt`
4. **LanguageTool não precisa de npm**: usa `fetch` nativo do Node. Só precisa do Docker rodando
5. **BERTimbau**: modelo de 110M params, INT8 ~130MB, CPU ~40-100ms. Pré-convertido para Transformers.js como `Xenova/bert-base-portuguese-cased`
