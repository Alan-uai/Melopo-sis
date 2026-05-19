# Plano de Otimização — Melopoësis

## Sumário

- **A** — Cancelamento de requests in-flight
- **B** — Memoização de leituras de arquivo
- **C** — Resultados locais instantâneos para gramática
- **D** — Cache do contexto RAG
- **E** — Sistema Especialista de Análise de Tom (local)
- **F** — Debounce progressivo
- **G** — Integração do tone-analyzer ao flow existente
- **H** — Métricas e verificação

---

## A — Cancelamento de requests in-flight

**Arquivos:** `src/app/page.tsx`

**Objetivo:** Impedir que requests obsoletos (enquanto o usuário continua digitando) atualizem a UI com resultados incorretos ou causem race conditions.

**Implementação:**

1. Adicionar ref `requestIdRef = useRef(0)` no componente `Home`
2. Em `generateSuggestions()`, incrementar o ref antes de cada chamada:

```typescript
const requestId = ++requestIdRef.current;
// ... chamada assíncrona ...
// No retorno:
if (requestId !== requestIdRef.current) return; // descartado
```

3. O mesmo padrão se aplica ao `handleTextChange` (modo gradual) — cada timer incrementa `requestIdRef` e verifica antes de setar estado.

**Por que não AbortController?** Server actions do Next.js não suportam `AbortSignal` diretamente (não serializável). O contador de versão é equivalente e mais simples.

**Impacto:** Usuário que digita rápido não vê sugestões "pulando" entre versões antigas e novas do texto.

---

## B — Memoização de leituras de arquivo

**Arquivo:** `src/lib/nbr-loader.ts`

**Objetivo:** `loadNbrRules()`, `loadToneRules()`, `loadOrthographyRules()`, `loadPunctuationRules()`, `loadRhymeRules()` e `loadRawDoc()` lêem arquivos do disco em **toda** invocação do flow. Arquivos não mudam em runtime.

**Implementação:**

```typescript
const memoCache = new Map<string, string>();

// Em cada função load*:
function loadRawDoc(filename: string): string {
  const cached = memoCache.get(filename);
  if (cached !== undefined) return cached;
  // ... leitura do disco ...
  memoCache.set(filename, result);
  return result;
}
```

Chaves de cache:
- `loadRawDoc`: filename (ex: `"acordo-ortografico.txt"`)
- `loadNbrRules`: `"nbr:${structure}"` (ex: `"nbr:soneto"`)
- `loadToneRules`: `"tone:${tone}"` (ex: `"tone:MELANCÓLICO"`)

**Sem TTL** — arquivos são estáticos. Se necessário no futuro, invalidar via `memoCache.clear()`.

**Impacto:** Reduz latência do flow em ~5-10ms por chamada (evita `readFileSync` + parsing).

---

## C — Resultados locais instantâneos para gramática

**Arquivos:** `src/app/actions/check-grammar-local.ts`, `src/app/page.tsx`

**Objetivo:** No modo gradual, erros de ortografia/estrutura/sílaba/acento/pontuação/rima aparecem após **300ms** em vez de 800ms.

**Implementação:**

### C.1 — Server action

```typescript
// src/app/actions/check-grammar-local.ts
'use server';
import { validateAll } from '@/lib/local-validator';
import type { Suggestion } from '@/ai/types';

export async function checkGrammarLocal(
  text: string,
  structure: string,
  rhyme: boolean,
): Promise<{ suggestions: Suggestion[] }> {
  if (!text.trim()) return { suggestions: [] };
  const result = await validateAll(text, structure as any, rhyme);
  return { suggestions: result.suggestions };
}
```

### C.2 — Integração no page.tsx

No timer de 300ms: chamar `checkGrammarLocal` diretamente (sem loading spinner, sem toast). Se encontrar erros, setar `grammarSuggestions` imediatamente.

No timer de 800ms: chamar `generateContextualSuggestions` completo (com IA se necessário) para refinamentos adicionais.

**Fluxo completo do modo gradual:**

```
Usuário digita
  → limpa timers local + AI
  → 300ms: checkGrammarLocal → setGrammarSuggestions (se houver erros)
  → 800ms: generateContextualSuggestions → merge/sobrescreve sugestões
  → Se usuário digita de novo: ambos os timers reiniciam
```

**Impacto:** Erros ortográficos aparecem em 300ms vs 800ms. A IA ainda roda em background após 800ms para casos que o validador local não pega.

---

## D — Cache do contexto RAG

**Arquivo:** `src/lib/nbr-rag.ts`

**Objetivo:** `buildResearchContext()` faz `retrieveRelevantChunks()` (vectorstore query) a cada cache miss do suggestion cache. O resultado (chunks de pesquisa) depende de `focus + structure + tone + rhyme`, não do texto específico.

**Implementação:**

```typescript
const ragCache = new Map<string, { promise: Promise<string>; timestamp: number }>();
const RAG_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function buildRagCacheKey(opts: RetrievalOptions): string {
  return `${opts.focus}:${opts.structure}:${opts.tone || ''}:${opts.rhyme || ''}`;
}

export async function buildResearchContext(opts: RetrievalOptions): Promise<string> {
  const key = buildRagCacheKey(opts);
  const now = Date.now();
  const existing = ragCache.get(key);
  if (existing && (now - existing.timestamp) < RAG_CACHE_TTL) {
    return existing.promise;
  }
  const promise = (async () => {
    const chunks = await retrieveRelevantChunks(opts);
    if (chunks.length === 0) {
      if (opts.focus === 'grammar') return '';
      return loadResearchFallback(opts.structure);
    }
    return extractRelevantContent(chunks, opts.text);
  })();
  ragCache.set(key, { promise, timestamp: now });
  return promise;
}
```

**Deduplicação embutida:** Cacheando a `Promise`, chamadas concorrentes com a mesma key aguardam a mesma promise.

**Impacto:** Evita RAG query a cada cache miss. Reduz latência de ~200-500ms para ~0ms no cache hit.

---

## E — Sistema Especialista de Análise de Tom (local)

Ver `plan/tom-analyzer-local.md` para o plano completo e detalhado.

---

## F — Debounce progressivo

**Arquivo:** `src/app/page.tsx`

**Objetivo:** Substituir debounce único de 800ms por dois timers com tempos diferentes.

**Implementação:**

```typescript
const LOCAL_DEBOUNCE_MS = 300;   // → checkGrammarLocal
const AI_DEBOUNCE_MS = 800;      // → generateContextualSuggestions

// Refs
const localTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const requestIdRef = useRef(0);
```

**Fluxo no handleTextChange:**

```
handleTextChange(newText):
  1. setText(newText), resetSuggestions()
  2. Se modo gradual && newText.length > 3:
     a. Limpar ambos os timers
     b. localTimerRef = setTimeout(300ms):
        - Incrementar requestIdRef
        - Chamar checkGrammarLocal(newText, structure, rhyme)
        - Se requestId match e results > 0: setGrammarSuggestions, setCurrentSuggestionIndex
     c. aiTimerRef = setTimeout(800ms):
        - Chamar generateContextualSuggestions({...grammar})
        - Atualizar sugestões (merge/sobrescreve)
```

---

## G — Integração do tone-analyzer ao flow

**Arquivo:** `src/ai/flows/generate-contextual-suggestions.ts`

**Alteração na branch de tone:**

```typescript
// ANTES:
if (input.suggestionType === 'tone') {
  const researchRules = await buildResearchContext({...});
  const { suggestions, modelUsed } = await runToneAgent(text, {...}, preferredModel);
  ...
}

// DEPOIS:
if (input.suggestionType === 'tone') {
  const localResult = await analyzeToneLocally(text, input.tone, input.structure);

  if (localResult.action === 'local') {
    globalCache.store(changed, cacheParams, localResult.suggestions);
    return { suggestions: localResult.suggestions };
  }

  // hybrid / ai: também chama IA, passa análise local como contexto
  const researchRules = await buildResearchContext({...});
  const { suggestions, modelUsed } = await runToneAgent(text, {
    ...baseInput, researchRules,
    localToneAnalysis: JSON.stringify(localResult.analysis),
  }, preferredModel);

  if (localResult.action === 'hybrid') {
    const merged = mergeSuggestions(localResult.suggestions, suggestions);
    globalCache.store(changed, cacheParams, merged);
    return { suggestions: merged, modelUsed };
  }

  globalCache.store(changed, cacheParams, suggestions);
  return { suggestions, modelUsed };
}
```

**Merge de sugestões (modo hybrid):**

```typescript
function mergeSuggestions(local: Suggestion[], ai: Suggestion[]): Suggestion[] {
  const aiByOriginal = new Map(ai.map(s => [s.originalText, s]));
  return local.map(s => {
    const aiMatch = aiByOriginal.get(s.originalText);
    if (aiMatch) {
      return { ...s, correctedText: aiMatch.correctedText, alternatives: aiMatch.alternatives };
    }
    return s;
  });
}
```

---

## H — Métricas e verificação

### Testes

| Teste | O que verifica |
|---|---|
| `tone-profiles.test.ts` | Parse de tom.txt → 85 regras, 19 seções |
| `tone-lexicon.test.ts` | Aho-Corasick retorna matches esperados |
| `tone-analyzer.test.ts` | Análise de poemas conhecidos (ex: Augusto dos Anjos → melancólico) |
| `tone-diagnostics.test.ts` | Cada diagnóstico dispara nas condições corretas |
| `tone-explanations.test.ts` | Templates geram texto coerente |
| `tone-suggestion-engine.test.ts` | Decisão local/hybrid/ai correta |

### Métricas de sucesso

| Métrica | Antes | Depois |
|---|---|---|
| Latência tone (local) | N/A (sempre IA) | <15ms |
| Latência tone (hybrid) | N/A | <15ms + IA |
| % casos resolvidos localmente | 0% | ~70% |
| Latência grammar (gradual) | ~800ms | ~300ms |
| Requests concorrentes | Possível race | Zero |

### Ordem de implementação

```
Fase 1 (itens já feitos: B, A, F, C, D)
Fase 2 (tone analyzer + lexicon)
  ├── E.2 — tone-profiles.ts (parser tom.txt)
  ├── E.3 — tone-lexicon.ts (automatons)
  ├── E.8 — lexicons/sentilex-pt.ts
  ├── E.9 — lexicons/register-lexicon.ts
  └── E.10 — lexicons/figure-matchers.ts
Fase 3 (análise + diagnósticos)
  ├── E.4 — tone-analyzer.ts (orquestrador)
  ├── E.5 — tone-diagnostics.ts (correlação)
  └── E.6 — tone-explanations.ts (templates)
Fase 4 (decisão + integração)
  ├── E.7 — tone-suggestion-engine.ts
  ├── G — Integração ao flow
  └── H — Testes + benchmark
```
