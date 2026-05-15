# Melopoësis — Agent Guide

## Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Dev server on **port 9002** via Turbopack |
| `npm run build` | `NODE_ENV=production next build` — skips TS errors & ESLint intentionally |
| `npm run lint` | Requires eslint to be installed (Next.js 16 removed `next lint`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run genkit:dev` | Start Genkit flow dev server |
| `npm run genkit:watch` | Genkit dev server with file watch |

Tests via Vitest in `src/__tests__/`. Run with `npm test` or `npm run test:watch`.

## Architecture

- **Next.js 16** App Router, React 19, TypeScript, `@/*` → `./src/*`
- **shadcn/ui** components at `@/components/ui/*`, configured via `components.json`
- **Tailwind CSS v4** (CSS-first config via `@theme`, no `tailwind.config.ts`) with `tailwindcss-animate` plugin
- **Genkit** + `googleai/gemini-2.5-flash` for AI suggestions (needs `GOOGLE_GENAI_API_KEY` in `.env`)
- **Firebase Auth + Firestore** (production backends — emulators are **disabled**)
- UI language: **Brazilian Portuguese (pt-BR)**

## Key Gotchas

- **Firebase init**: calls `initializeApp()` without args first (for App Hosting). Falls back to hardcoded config in `src/firebase/config.ts`. Do not remove the fallback.
- **Firestore hooks** (`useCollection`, `useDoc`) require memoized refs — use `useMemoFirebase()` from `@/firebase` instead of bare `useMemo`.
- **Firestore writes** use non-blocking fire-and-forget helpers (`setDocumentNonBlocking`, `addDocumentNonBlocking`, etc.) — errors propagate via `errorEmitter` to `FirebaseErrorListener`.
- **AI flows** (`src/ai/flows/`) use `'use server'` — these are Next.js Server Actions.
- **`next.config.ts`**: `ignoreBuildErrors: true` — build will not catch TS/ESLint issues. Run `typecheck` separately (eslint config removed from NextConfig in v16).
- **TypeScript 6**: `tsconfig.json` requires `"types": ["node"]` (TS 6.0 removed auto-discovery of `@types/*`).
- **Tailwind v4**: Config is fully CSS-based (`postcss.config.mjs` uses `@tailwindcss/postcss`). No `tailwind.config.ts`. Theme variables in `src/app/globals.css` via `@theme inline`.
- **Port 9002**, not default 3000.
- `.env*` files are gitignored — required for Genkit API keys.

## Suggestion Flow

1. User clicks "Gerar Sugestões" → calls `generateContextualSuggestions({ suggestionType: 'grammar' })`
2. **Local spell check runs first** — `checkSpelling()` catches basic typos instantly via `src/lib/spell-checker.ts` (dictionary-pt-br word list + Portuguese morphology rules). If found, returns `'grammar'` suggestions directly without LLM call.
3. If no local errors → calls Genkit `grammarPrompt` (enhanced with few-shot examples, poetic license rules, ABNT confusions, severity levels)
4. Grammar suggestions displayed one-by-one via `SuggestionPopover` inline in editor, and full list in sidebar
5. "Aplicar N correções simples" button for batch-applying low-severity fixes
6. After last grammar suggestion dismissed/accepted → auto-triggers `suggestionType: 'tone'`
7. Tone suggestions shown in `SuggestionList` side panel with accept/dismiss/resuggest per card
8. **Gradual mode** (when enabled): debounced (800ms) auto-check on text input changes

## Local Utilities

| Module | Purpose |
|--------|---------|
| `src/lib/spell-checker.ts` | Local orthographic checker with dictionary-pt-br (311k words) + Portuguese morphology (verb conj, plural, feminine) + accent rule engine |
| `src/lib/poetic-forms.ts` | Structural validation for soneto, haicai, cordel, redondilha, decassílabo; syllable counter with poetic elision |
| `src/lib/rhyme-detector.ts` | Algorithmic rhyme scheme analysis, rhyme error detection per stanza |
| `src/lib/build-word-set.ts` | Lazy singleton loader for dictionary-pt-br word list |

## Database Structure (Firestore)

```
/users/{userId}          — user profile (uid, email, displayName, photoURL)
/users/{userId}/poems/{poemId} — poem (title, text, tone, structure, rhyme, authorId, createdAt, updatedAt)
```

Security rules enforce strict user ownership (only creator can read/write their own data).
