# Melopoësis — Agent Guide

## Dev commands

| Command | What |
|---|---|
| `npm run dev` | `next dev --turbopack -p 9002` |
| `npm run build` | `NODE_ENV=production next build` — TS errors ignored via `next.config.ts` `typescript.ignoreBuildErrors: true` |
| `npm run start` | `next start -p 9002` (uses custom Express wrapper `server.ts`) |
| `npm run typecheck` | `tsc --noEmit` (separate from `build`) |
| `npm run test` | `vitest run` |
| `npm run test:watch` | `vitest` (watch) |
| `npm run genkit:dev` | `genkit start -- tsx src/ai/dev.ts` |
| `npm run genkit:watch` | same with `--watch` for hot-reload |
| `npm run lint` | **Not configured** — placeholder echo |
| `npx tsx src/scripts/index-nbr.ts` | Index NBR `.txt` files into local vector store (RAG) |
| `npx tsx scripts/test-dictionary.ts` | Verify ~561k-word custom dictionary set |

Order: `typecheck -> test`. No lint, no build needed for dev.

## Stack

- **Next.js 16 + React 19 + TypeScript 6** — SPA entry at `src/app/page.tsx`
- **Tailwind CSS v4** — no `tailwind.config.ts`; config in `globals.css` via `@import "tailwindcss"` + `@theme {}` blocks; PostCSS via `@tailwindcss/postcss`
- **shadcn/ui** — Radix primitives (see `components.json`), icons from `lucide-react`
- **Firebase** — Auth (Google) + Firestore. Init in `src/firebase/index.ts` tries App Hosting env vars first, falls back to hardcoded config. **Never modify `initializeFirebase`** (code has explicit guard comment).
  - Non-blocking Firestore writes: `setDocumentNonBlocking`, `addDocumentNonBlocking`, `updateDocumentNonBlocking`, `deleteDocumentNonBlocking`
  - Bidirectional hooks: `useCollection`, `useDoc` — real-time sync of `/users/{uid}/poems`
- **Genkit AI** — `googleai/gemini-2.5-flash` (default). Model fallback via `withFallback()` in `src/ai/genkit.ts` using `MODELS` env var (comma-separated, e.g. `gemini-2.5-flash,gemini-2.5-pro`). Requires `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) in `.env` — no `.env.example` exists, `.env*` files are gitignored. Also supports OpenRouter fallback (`OPENROUTER_API_KEY`) via `src/ai/openrouter.ts`.
- **RAG (NBR)** — `src/lib/nbr-rag.ts` indexes `docs/nbr/*.txt` into `devLocalVectorstore`. Falls back to loading research file directly when no index exists.
- **Custom PT-BR dictionary** — ~561k words from `src/lib/supplement-words.txt` (VOLP/ABL + fserb/pt-br), loaded at runtime in `src/lib/dictionary.ts`. Morphological analysis covers conjugations, plurals, feminine forms, adverbs in `-mente`, diminutives/augmentatives, and superlatives.
- **Tone analysis NLP** — `src/lib/tone/` has a standalone local pipeline (Aho-Corasick, lexicons, profiles, diagnostic engine) with 6 test files. Runs without Genkit.
- **Gemini Live API / Voice** — Real-time bidirectional audio via `@ricky0123/vad-react`, custom WebSocket management, wake word detection, voice chat panel (`src/components/voice-chat/`).
- **Custom Express server** — `server.ts` wraps Next.js for production deployments.
- **Vitest** — `environment: 'node'` (no jsdom). Only picks up `src/**/*.test.ts`. `spell-checker.test.ts` mocks `@/lib/dictionary`; `dictionary-integration.test.ts` uses real module.

## Architecture

- Path alias `@/*` → `./src/*`
- Dark mode enforced: `<html lang="pt-BR" className="dark">` — no toggle
- **Two data persistence layers**: localStorage (`LOCAL_STORAGE_KEY = "melopoeisis_data_v2"`) for anonymous users; Firestore `/users/{uid}/poems/{poemId}` for logged-in users
- Server actions in `src/app/actions/` and `src/ai/flows/` (both `'use server'`)
- **Suggestion flow** (`src/ai/flows/generate-contextual-suggestions.ts`):
  1. Line-level cache diff (`SuggestionCache` via `lru-cache`, 1000 entries, 1h TTL) — skips unchanged segments
  2. For `tone` type → calls `runToneAgent` directly
  3. For `grammar` type → runs `validateAll` (spell + structure + syllable + accent + punctuation + rhyme) against local dictionary first
  4. If local finds errors → returns immediately (no AI call). AI only called when local check passes.
- **AI agents** in `src/ai/agents/`: `grammar-agent.ts`, `tone-agent.ts`, `meter-agent.ts`, `rhyme-agent.ts` — flow uses grammar+tone only
- NBR rules loaded from `docs/nbr/` via `src/lib/nbr-loader.ts` (has a duplicate `STRUCTURE_FILE_MAP` with `nbr-rag.ts`)
- Two suggestion modes: `"gradual"` (800ms debounced auto-check on typing) and `"final"` (manual buttons) — see `SuggestionMode` type
- Keyboard shortcuts: Ctrl+S (save), Ctrl+Z (undo), Ctrl+Shift+Z (redo), Ctrl+Enter (grammar check), Ctrl+Shift+Enter (tone), Ctrl+N (new), Ctrl+Shift+C (copy), Escape (dismiss)
- `framer-motion` used heavily for UI animations (sidebar, editor transitions)
- `.genkit/` gitignored — local vector store state
- No CI workflows, no pre-commit hooks, no ESLint

## Conventions

- UI labels in Brazilian Portuguese (`pt-BR`)
- Font: Literata via `next/font/google`, applied as `--font-literata` CSS variable
- Colors: CSS custom properties in `globals.css` under `:root` and `.dark` — **do not** use Tailwind color names directly
- No server-side data fetching — client-heavy SPA with Firebase client SDK
