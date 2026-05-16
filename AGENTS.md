# Melopoësis — Agent Guide

## Dev commands

| Command | What |
|---|---|
| `npm run dev` | `next dev --turbopack -p 9002` |
| `npm run typecheck` | `tsc --noEmit` (separate from build) |
| `npm run test` | `vitest run` — tests in `src/**/*.test.ts` |
| `npm run test:watch` | `vitest` (watch mode) |
| `npm run build` | `NODE_ENV=production next build` — TS errors ignored (`typescript.ignoreBuildErrors: true`) |
| `npm run genkit:dev` | `genkit start -- tsx src/ai/dev.ts` |
| `npm run genkit:watch` | same with `--watch` for hot-reload |
| `npm run lint` | **Not configured** — placeholder echo only |

Order: `typecheck -> test`. No lint, no build needed for dev.

## Stack

- **Next.js 16 + React 19 + TypeScript 6** — single-page app at `src/app/page.tsx`
- **Tailwind CSS v4** — no `tailwind.config.ts`; config in `src/app/globals.css` via `@import "tailwindcss"` + `@theme {}` blocks
- **shadcn/ui** — Radix primitives, `components.json` at root, icons from `lucide-react`
- **Firebase** — Auth (Google) + Firestore. Init in `src/firebase/index.ts`: tries App Hosting env vars first, falls back to hardcoded `firebaseConfig`. **Never modify `initializeFirebase`**.
- **Genkit AI** — `googleai/gemini-2.5-flash` (configurable via `MODELS` env var), prompt flows in `src/ai/flows/`. Model fallback via `withFallback()` in `src/ai/genkit.ts`. Requires `GOOGLE_GENAI_API_KEY` in `.env` (file is gitignored — create it).
- **Vitest** — `environment: 'node'` (no jsdom). `spell-checker.test.ts` mocks `@/lib/dictionary`; `dictionary-integration.test.ts` uses the real module.
- **Custom Portuguese dictionary** — ~561k words from `src/lib/supplement-words.txt` (VOLP/ABL + fserb/pt-br corpus) loaded at runtime via `src/lib/dictionary.ts`. Morphological analysis handles conjugations, plurals, feminine forms, adverbs in `-mente`, diminutives/augmentatives, and superlatives. No Hunspell or nspell involved despite unused `hunspell-spellchecker` and `dictionary-pt-br` deps. Run `npx tsx scripts/test-dictionary.ts` to verify the word set.

## Architecture notes

- Path alias `@/*` → `./src/*`
- Dark mode enforced: `<html lang="pt-BR" className="dark">` — no toggle
- Firebase App Hosting: `apphosting.yaml` at root configures max instances (deploy outside repo scope)
- Server actions in `src/app/actions/` (`'use server'` modules alongside pages)
- Firestore: `/users/{userId}` and `/users/{userId}/poems/{poemId}` (see `docs/backend.json` and `firestore.rules`)
- Two suggestion modes: `"gradual"` (debounced auto-check on typing) and `"final"` (manual buttons) — see `SuggestionMode` type in `src/ai/types.ts`
- AI flow (`src/ai/flows/generate-contextual-suggestions.ts`) is a `'use server'` module — grammar + tone prompts through the same `suggestionFlow`
- Local check + AI check order: grammar errors checked against custom dictionary first; if found, returned immediately without calling AI. AI only called when local check passes (or for tone suggestions).
- `docs/nbr/` — NBR rule files per poetic structure (`soneto.txt`, `haicai.txt`, etc.), tone rules (`tom.txt`), orthographic agreement (`acordo-ortografico.txt`), and poetic punctuation (`pontuacao-poetica.txt`). Loaded at runtime by `src/lib/nbr-loader.ts`.
- `docs/blueprint.md` — top-level architecture design doc (features, style guidelines)
- No CI workflows, no pre-commit hooks, no ESLint

## Conventions

- UI labels in Brazilian Portuguese (`pt-BR`)
- Font: Literata (Google Fonts) via `next/font/google`, applied as `--font-literata` CSS variable
- Colors: CSS custom properties in `globals.css` under `:root` and `.dark` — do NOT use Tailwind color names directly
- No server-side data fetching — client-heavy SPA with Firebase client SDK
