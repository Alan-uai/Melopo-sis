# Sistema Especialista de Análise de Tom (local)

## Dependências

```bash
npm install @jimtkelly/aho-corasick @nlpjs/lang-pt
```

| Biblioteca | Finalidade | Tamanho |
|---|---|---|
| `@jimtkelly/aho-corasick` | Multi-pattern matching O(n) | ~10KB |
| `@nlpjs/lang-pt` | Tokenização + stemmer pt-BR | ~50KB |

Nenhuma depende de API externa.

---

## Estrutura de arquivos

```
src/lib/tone/
├── tone-profiles.ts            # ToneProfile[] — parser de tom.txt
├── tone-lexicon.ts             # Compila léxicos + constrói automatons Aho-Corasick
├── tone-analyzer.ts            # Orquestrador multi-passo
├── tone-diagnostics.ts         # Motor de correlação cruzada
├── tone-explanations.ts        # Geração de explicações literárias
├── tone-suggestion-engine.ts   # Decisão local vs IA
├── lexicons/
│   ├── sentilex-pt.ts          # Léxico de emoções (SentiLex-PT)
│   ├── register-lexicon.ts     # Marcadores formal/informal
│   └── figure-matchers.ts      # Detectores de figuras de linguagem
├── __tests__/
│   ├── tone-profiles.test.ts
│   ├── tone-lexicon.test.ts
│   ├── tone-analyzer.test.ts
│   ├── tone-diagnostics.test.ts
│   ├── tone-explanations.test.ts
│   └── tone-suggestion-engine.test.ts
```

---

## E.2 — tone-profiles.ts — Extração de conhecimento do tom.txt

### Formato de cada regra no tom.txt

```
## [TOM-NNN] Título
Fonte: ...
Descrição: ... (contém palavras-chave)
❌ Errado: "..."
✅ Correto: "..."
Severidade: alta|media|baixa
Categoria: tom — vocabulário|imagens|figuras|ritmo|estrutura|anti-padrão
Exemplo real: Autor, "Obra": "verso"
```

### Tipos

```typescript
export interface ToneProfile {
  code: string;                    // "TOM-001"
  tone: string;                    // "MELANCÓLICO" (seção superior)
  title: string;                   // "Vocabulário da melancolia..."
  source: string;                  // "Fonte:"
  description: string;             // Texto completo da descrição
  keywords: string[];              // Palavras-chave extraídas da descrição
  badExample: string;              // ❌
  goodExample: string;             // ✅
  severity: 'alta' | 'media' | 'baixa';
  category: 'vocabulario' | 'imagens' | 'figuras' | 'ritmo' | 'estrutura' | 'anti-padrao';
  canonicalExample?: {
    author: string;
    work: string;
    verse: string;
  };
}

export interface ToneSection {
  name: string;                    // "MELANCÓLICO"
  profiles: ToneProfile[];         // TOM-001 a TOM-005 para melancólico
}
```

### Parser

1. Dividir arquivo por `=` (separador de seções de tom) — obtém 19 seções
2. Cada seção: extrair nome (linha após `===`)
3. Dentro de cada seção, dividir por `## [TOM-NNN]` — obtém regras individuais
4. Para cada regra: extrair campos via regex:
   - `code`: match `## \[(TOM-\d+)\]`
   - `title`: resto da linha `## [TOM-NNN]`
   - `source`: linha `Fonte:`
   - `description`: linha(s) `Descrição:`
   - `badExample`: linha `❌ Errado:`
   - `goodExample`: linha `✅ Correto:`
   - `severity`: linha `Severidade:`
   - `category`: linha `Categoria:` → normalizar para enum
   - `canonicalExample`: linha `Exemplo real:` → parse `Autor, "Obra": "verso"`
5. Keywords: da linha `Descrição`, extrair lista após `:` usando separadores `,` e `—`

### Inicialização (1x no startup)

```typescript
const profiles: ToneSection[] = parseToneFile();
export function getToneProfiles(): ToneSection[] { return profiles; }
```

---

## E.3 — tone-lexicon.ts — Compilação de léxicos + automatons

### Autômato Aho-Corasick por tom

```typescript
export interface ToneAutomaton {
  name: string;                    // "melancolico"
  ac: AhoCorasick;                 // instância pré-compilada
  keywords: string[];              // lista original para referência
  profileCodes: string[];          // TOM-001, TOM-002 etc.
}
```

### Compilação

```typescript
function buildToneAutomatons(sections: ToneSection[]): ToneAutomaton[] {
  return sections.map(section => {
    const allKeywords = section.profiles
      .filter(p => p.category === 'vocabulario' || p.category === 'imagens')
      .flatMap(p => p.keywords);

    const stemmed = allKeywords.map(k => stemmer.stem(k.toLowerCase()));
    const unique = [...new Set(stemmed)];

    const ac = new AhoCorasick(unique);
    return { name: section.name.toLowerCase(), ac, keywords: unique, profileCodes: section.profiles.map(p => p.code) };
  });
}
```

### Autômatos adicionais

- **antiPatternAutomaton**: palavras-chave de todas as seções `anti-padrao`
- **registerAutomaton**: marcadores formais e informais

### Export

```typescript
export function getToneAutomatons(): ToneAutomaton[];
export function getAntiPatternAutomaton(): AhoCorasick;
export function getRegisterAutomaton(): AhoCorasick;
```

---

## E.4 — tone-analyzer.ts — Orquestrador multi-passo

### Pipeline

```typescript
export interface AnalysisResult {
  lexical: LexicalScore;
  image: ImageScore;
  register: RegisterScore;
  figure: FigureScore;
  emotion: EmotionScore;
  rhythm: RhythmScore;
  confidence: number;
  diagnostics: Diagnostic[];
}

export async function analyzeTone(
  text: string,
  selectedTone: string,
  structure: TextStructure,
): Promise<AnalysisResult> {

  const doc = tokenizer.tokenize(text);
  const stems = doc.map(t => stemmer.stem(t));
  const lines = text.split('\n');
  const stanzas = splitIntoStanzas(text);

  const lexical = analyzeLexical(stems, lines, selectedTone, automatons);
  const image = analyzeImages(text, selectedTone);
  const register = analyzeRegister(stems, registerAutomaton);
  const figure = analyzeFigures(text, lines);
  const emotion = analyzeEmotion(doc, sentilex);
  const rhythm = analyzeRhythm(text, structure);

  const diagnostics = computeDiagnostics({ lexical, image, register, figure, emotion, rhythm });
  const confidence = computeConfidence(lexical, diagnostics);

  return { lexical, image, register, figure, emotion, rhythm, confidence, diagnostics };
}
```

### E.4.1 — Passo lexical

```typescript
export interface LexicalScore {
  selectedToneScore: number;
  highestConflicting: string | null;
  highestConflictingScore: number;
  antiPatternHits: number;
  perLine: number[];
}

function analyzeLexical(
  stems: string[],
  lines: string[],
  selectedTone: string,
  automatons: ToneAutomaton[],
): LexicalScore {
  const selectedLower = selectedTone.toLowerCase();
  const text = stems.join(' ');

  // Varre todos os tons simultaneamente via Aho-Corasick
  const toneMatches: Record<string, number> = {};
  for (const automaton of automatons) {
    const matches = automaton.ac.search(text);
    toneMatches[automaton.name] = matches.length / stems.length;
  }

  const selectedScore = toneMatches[selectedLower] || 0;

  const conflicting = Object.entries(toneMatches)
    .filter(([name]) => name !== selectedLower)
    .sort(([, a], [, b]) => b - a);

  return {
    selectedToneScore: selectedScore,
    highestConflicting: conflicting[0]?.[0] || null,
    highestConflictingScore: conflicting[0]?.[1] || 0,
    antiPatternHits: antiPatternAutomaton.search(text).length,
    perLine: lines.map(line => {
      const lineStems = tokenizer.tokenize(line).map(t => stemmer.stem(t));
      return automatons.find(a => a.name === selectedLower)?.ac.search(lineStems.join(' ')).length || 0;
    }),
  };
}
```

### E.4.2 — Passo de imagens

```typescript
export interface ImageScore {
  score: number;
  total: number;
  ratio: number;
}

type ImagePattern = {
  tone: string;
  patterns: RegExp[];
  category: string;
};

function analyzeImages(text: string, selectedTone: string): ImageScore {
  const toneImages = imagePatterns.filter(p => p.tone === selectedTone);
  let matches = 0;
  for (const img of toneImages) {
    for (const pattern of img.patterns) {
      if (pattern.test(text)) matches++;
    }
  }
  return { score: matches, total: toneImages.length, ratio: toneImages.length > 0 ? matches / toneImages.length : 0 };
}
```

### E.4.3 — Passo de registro

```typescript
export interface RegisterScore {
  formalScore: number;
  informalScore: number;
  isConsistent: boolean;
  dominantRegister: 'formal' | 'informal' | 'mixed';
}

function analyzeRegister(tokens: string[], automaton: AhoCorasick): RegisterScore {
  const text = tokens.join(' ');
  const matches = automaton.search(text);

  let formal = 0, informal = 0;
  for (const match of matches) {
    if (formalMarkers.has(match)) formal++;
    if (informalMarkers.has(match)) informal++;
  }

  const total = formal + informal || 1;
  return {
    formalScore: formal / total,
    informalScore: informal / total,
    isConsistent: Math.abs(formal - informal) / total > 0.5,
    dominantRegister: formal > informal ? 'formal' : informal > formal ? 'informal' : 'mixed',
  };
}
```

### E.4.4 — Passo de figuras

```typescript
export interface FigureScore {
  detected: Figure[];
  density: number;
}

export interface Figure {
  type: 'anaphora' | 'hyperbato' | 'antithese' | 'apostrophe' | 'paradox' | 'synesthesia' | 'comparison' | 'prosopopeia';
  line: number;
  confidence: number;
  evidence: string;
}
```

### E.4.5 — Passo emocional

```typescript
export interface EmotionScore {
  positiveRatio: number;
  negativeRatio: number;
  neutralRatio: number;
  compoundScore: number;
  perLine: number[];
  dominantEmotion: string;
}
```

### E.4.6 — Passo rítmico

```typescript
export interface RhythmScore {
  avgSyllables: number;
  variance: number;
  hasEnjambement: boolean;
  isConsistent: boolean;
}
```

---

## E.5 — tone-diagnostics.ts — Motor de correlação cruzada

### Formato do diagnóstico

```typescript
export interface Diagnostic {
  id: string;
  severity: 'alta' | 'media' | 'baixa';
  line?: number;
  dimensions: string[];
  details: Record<string, any>;
  toneRef: string;
  toneRefQuote: string;
  canonicalExample?: string;
}
```

### Lista de diagnósticos

| id | Condição | Severidade | Dimensões |
|---|---|---|---|
| `ABSTRACT_OVERLOAD` | lexical alto, image baixo | media | lexical, image |
| `TONE_POLLUTION` | tom concorrente tem score alto | alta | lexical |
| `REGISTER_LEAK` | registro misturado | media | register |
| `EMOTION_ARC_BREAK` | emoção muda >0.5 entre estrofes | alta | emotion |
| `ANTIPATTERN_HIT` | anti-padrões detectados | alta | lexical |
| `RHYTHM_MISMATCH` | ritmo inconsistente com tom | baixa | rhythm |
| `CANONICAL_MISMATCH` | baixo overlap com léxico canônico | baixa | lexical |

### Implementação

```typescript
const DIAGNOSTICS: Array<(s: AnalysisResult) => Diagnostic | null> = [
  (s) => s.lexical.selectedToneScore > 0.5 && s.image.ratio < 0.3
    ? { id: 'ABSTRACT_OVERLOAD', severity: 'media', dimensions: ['lexical', 'image'], details: {...}, toneRef: 'TOM-001', toneRefQuote: '...', canonicalExample: '...' }
    : null,

  (s) => s.lexical.highestConflicting && s.lexical.highestConflictingScore > s.lexical.selectedToneScore * 0.7
    ? { id: 'TONE_POLLUTION', severity: 'alta', dimensions: ['lexical'], details: {...}, toneRef: 'TOM-...', ... }
    : null,

  (s) => !s.register.isConsistent
    ? { id: 'REGISTER_LEAK', severity: 'media', dimensions: ['register'], details: {...}, toneRef: 'TOM-001', ... }
    : null,

  // EMOTION_ARC_BREAK, ANTIPATTERN_HIT, RHYTHM_MISMATCH, CANONICAL_MISMATCH...
];
```

---

## E.6 — tone-explanations.ts — Gerador de explicações literárias

### Template por diagnosticId

```typescript
const TEMPLATES: Record<string, (d: Diagnostic, tone: string) => string> = {
  ABSTRACT_OVERLOAD: (d, tone) => {
    const { abstractRatio, imageRatio } = d.details;
    return [
      `O poema tem alta densidade de substantivos abstratos (${Math.round(abstractRatio * 100)}% `,
      `das palavras significativas) mas apenas ${Math.round((imageRatio || 0) * 100)}% de imagens concretas. `,
      `O tom ${tone} exige que o sentimento seja **sugerido por imagens**, não declarado. `,
      `Como afirma ${d.toneRef}: "${d.toneRefQuote}".\n\n`,
      d.canonicalExample ? `Consulte, por exemplo: ${d.canonicalExample}` : '',
      `\n\n**Sugestão:** Substitua declarações abstratas por imagens sensoriais. `,
      `Em vez de "Estou triste", tente "Desce a treva, e no peito um vazio profundo".`,
    ].filter(Boolean).join('');
  },

  TONE_POLLUTION: (d, tone) => {
    const { conflictingTone, conflictingRatio } = d.details;
    return [
      `O poema utiliza vocabulário característico do tom **${conflictingTone}** `,
      `(${Math.round((conflictingRatio || 0) * 100)}% de cobertura), `,
      `que conflita com o tom selecionado (${tone}). `,
      d.toneRefQuote ? `Regra ${d.toneRef}: "${d.toneRefQuote}"` : '',
      `\n\n**Revisão sugerida:** Identifique as palavras que pertencem ao léxico `,
      `de ${conflictingTone} e substitua por equivalentes de ${tone}.`,
    ].join('');
  },

  REGISTER_LEAK: (d, tone) => {
    const { formalScore, informalScore } = d.details;
    const dominant = formalScore > informalScore ? 'formal' : 'informal';
    return [
      `O poema mescla registro **formal** (${Math.round((formalScore || 0) * 100)}%) e `,
      `**informal** (${Math.round((informalScore || 0) * 100)}%) de forma inconsistente. `,
      `Para o tom ${tone}, recomenda-se registro **${dominant}** uniforme. `,
      d.toneRefQuote ? `\n\nRegra ${d.toneRef}: "${d.toneRefQuote}"` : '',
      `\n\n**Revisão sugerida:** Uniformize o registro — se ${tone} requer tom `,
      `${dominant}, revise as expressões de registro oposto.`,
    ].join('');
  },

  // ... templates para cada diagnosticId
};
```

### Função principal

```typescript
export function diagnosticToSuggestion(
  diagnostic: Diagnostic,
  text: string,
  tone: string,
): Suggestion {
  const line = diagnostic.line ? text.split('\n')[diagnostic.line - 1] || '' : '';
  const originalText = line || text.slice(0, 60);

  return {
    originalText,
    correctedText: originalText,  // sem alternativa textual — local não gera
    explanation: buildExplanation(diagnostic, tone),
    type: 'grammar' as const,
    severity: diagnostic.severity,
    context: text,
    alternatives: [],
  };
}
```

---

## E.7 — tone-suggestion-engine.ts — Motor de decisão

### Tipos

```typescript
export type ToneAction = 'local' | 'hybrid' | 'ai';

export interface ToneSuggestionResult {
  action: ToneAction;
  suggestions: Suggestion[];
  confidence: number;
  analysis?: AnalysisResult;
}
```

### Decisão

```typescript
export function decideToneAction(analysis: AnalysisResult): ToneAction {
  if (
    analysis.confidence >= 0.75 ||
    (analysis.confidence >= 0.6 && analysis.diagnostics.length >= 1)
  ) {
    return 'local';
  }

  if (
    analysis.confidence >= 0.4 &&
    analysis.diagnostics.length >= 1
  ) {
    return 'hybrid';
  }

  return 'ai';
}

export function buildToneSuggestions(
  analysis: AnalysisResult,
  text: string,
  tone: string,
): ToneSuggestionResult {
  const suggestions = analysis.diagnostics
    .filter(d => d.severity !== 'baixa' || analysis.diagnostics.length <= 2)
    .map(d => diagnosticToSuggestion(d, text, tone));

  return {
    action: decideToneAction(analysis),
    suggestions,
    confidence: analysis.confidence,
    analysis,
  };
}
```

### Pontuação de confiança

```typescript
function computeConfidence(lexical: LexicalScore, diagnostics: Diagnostic[]): number {
  let score = lexical.selectedToneScore * 0.4;
  score += (1 - lexical.highestConflictingScore) * 0.2;

  // Quanto mais diagnósticos de alta severidade, mais confiantes
  const highSeverityCount = diagnostics.filter(d => d.severity === 'alta').length;
  score += Math.min(highSeverityCount * 0.15, 0.3);

  // Penalizar se não há diagnóstico nenhum
  if (diagnostics.length === 0) score *= 0.5;

  return Math.min(score, 1);
}
```

---

## E.8 — lexicons/sentilex-pt.ts — Léxico emocional

### Fonte

SentiLex-PT (7.014 lemas, 82.347 formas flexionadas). CC-BY-NC-SA 4.0.

### Formato

```typescript
export interface SentiLexEntry {
  lemma: string;
  polarity: -1 | 0 | 1;
  pos: 'ADJ' | 'N' | 'V' | 'IDIOM';
}

// Mapa lemma → Entry
export const sentilex: Map<string, SentiLexEntry>;
```

### Inicialização

```typescript
function loadSentiLex(): Map<string, SentiLexEntry> {
  // Tenta carregar de src/lib/tone/lexicons/sentilex-compiled.json
  // Se não existir, usa um subset embutido
  // Cada entrada:
  //   "amor" → { lemma: "amor", polarity: +1, pos: "N" }
  //   "ódio" → { lemma: "ódio", polarity: -1, pos: "N" }
  //   "contemplar" → { lemma: "contemplar", polarity: 0, pos: "V" }
}
```

---

## E.9 — lexicons/register-lexicon.ts — Registro formal/informal

### Léxico

```typescript
export const FORMAL_MARKERS = new Set([
  'portanto', 'entretanto', 'todavia', 'contudo', 'outrossim',
  'ademais', 'outrem', 'alhures', 'doravante',
  'outrora', 'sobejo', 'escopro', 'lusco-fusco', 'alva',
]);

export const INFORMAL_MARKERS = new Set([
  'tá', 'pra', 'pro', 'cê', 'né', 'tô', 'vô', 'tava',
  'numa', 'duma', 'mode', 'cuma', 'daí', 'então',
  'aí', 'ih', 'ah', 'ué', 'poxa',
  'mermo', 'cê', 'trem', 'bão', 'sô',
]);

export function classifyRegister(token: string): 'formal' | 'informal' | null {
  if (FORMAL_MARKERS.has(token)) return 'formal';
  if (INFORMAL_MARKERS.has(token)) return 'informal';
  return null;
}
```

---

## E.10 — lexicons/figure-matchers.ts — Detectores de figuras

```typescript
export interface FigurePattern {
  type: string;
  detect: (lines: string[], lineIndex: number) => FigureMatch | null;
}

export interface FigureMatch {
  type: string;
  line: number;
  confidence: number;
}

// Anáfora, hipérbato, antítese, apóstrofe, prosopopeia, sinestesia, comparação
```

---

## G — Integração ao flow

### Arquivo: `src/ai/flows/generate-contextual-suggestions.ts`

### Alteração na branch tone

```typescript
if (input.suggestionType === 'tone') {
  const localResult = await analyzeToneLocally(text, input.tone, input.structure);

  if (localResult.action === 'local') {
    globalCache.store(changed, cacheParams, localResult.suggestions);
    return { suggestions: localResult.suggestions };
  }

  const researchRules = input.researchRules || await buildResearchContext({
    structure: input.structure,
    text: input.text,
    focus: 'tone',
    tone: input.tone,
    rhyme: input.rhyme,
  });

  const toneInput = {
    ...baseInput, researchRules,
    ...(localResult.analysis ? { localToneAnalysis: JSON.stringify(localResult.analysis) } : {}),
  };

  const { suggestions, modelUsed } = await runToneAgent(text, toneInput, preferredModel);

  if (localResult.action === 'hybrid') {
    const merged = mergeSuggestions(localResult.suggestions, suggestions);
    globalCache.store(changed, cacheParams, merged);
    return { suggestions: merged, modelUsed };
  }

  const newSuggestions = filterSuggestionsForSegments(suggestions, changed.map(s => s.text));
  globalCache.store(changed, cacheParams, newSuggestions);
  return { suggestions: newSuggestions, modelUsed };
}
```

### Merge function

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

## H — Testes e benchmark

### Testes unitários

```typescript
// tone-profiles.test.ts
describe('tone-profiles', () => {
  it('parses 19 tone sections', () => { ... });
  it('parses TOM-001 through TOM-085', () => { ... });
  it('extracts keywords from description', () => { ... });
});

// tone-lexicon.test.ts
describe('tone-lexicon', () => {
  it('builds 19 automatons', () => { ... });
  it('matches tone keywords against text', () => { ... });
});

// tone-analyzer.test.ts
describe('tone-analyzer', () => {
  it('detects melancolico in Augusto dos Anjos', () => { ... });
  it('detects romantico in Goncalves Dias', () => { ... });
  it('returns low confidence for empty text', () => { ... });
});

// tone-diagnostics.test.ts
describe('tone-diagnostics', () => {
  it('detects ABSTRACT_OVERLOAD', () => { ... });
  it('detects TONE_POLLUTION', () => { ... });
  it('detects REGISTER_LEAK', () => { ... });
});

// tone-explanations.test.ts
describe('tone-explanations', () => {
  it('generates coherent explanation for AbstractOverload', () => { ... });
  it('includes TOM rule reference', () => { ... });
});

// tone-suggestion-engine.test.ts
describe('tone-suggestion-engine', () => {
  it('returns local for high confidence', () => { ... });
  it('returns hybrid for medium confidence with diagnostics', () => { ... });
  it('returns ai for low confidence', () => { ... });
});
```

### Benchmarks

```typescript
// Latência esperada:
// Poema 14 versos (soneto): <15ms
// Poema 30 versos (cordel): <20ms
// Poema 100 versos (livre): <30ms
```
