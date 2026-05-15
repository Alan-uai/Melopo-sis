# Melopoësis — Agent Guide

## Dev commands

| Command | What |
|---|---|
| `npm run dev` | `next dev --turbopack -p 9002` |
| `npm run typecheck` | `tsc --noEmit` (separate from build) |
| `npm run test` | `vitest run` — tests in `src/**/*.test.ts` |
| `npm run test:watch` | `vitest` (watch mode) |
| `npm run build` | `NODE_ENV=production next build` — **TS errors ignored** (`typescript.ignoreBuildErrors: true`) |
| `npm run genkit:dev` | `genkit start -- tsx src/ai/dev.ts` |
| `npm run lint` | **Not configured** — placeholder echo only |

Order: `typecheck -> test` (no lint, no build needed for dev).

## Stack

- **Next.js 16 + React 19 + TypeScript 6** — single-page app at `src/app/page.tsx`
- **Tailwind CSS v4** — no `tailwind.config.ts`; config in `src/app/globals.css` via `@import "tailwindcss"` + `@theme {}` blocks
- **shadcn/ui** — Radix primitives, `components.json` at root, icons from `lucide-react`
- **Firebase** — Auth (Google) + Firestore. Init in `src/firebase/index.ts`: tries App Hosting env vars first, falls back to hardcoded `firebaseConfig`. **Never modify `initializeFirebase`**.
- **Genkit AI** — `googleai/gemini-2.5-flash`, prompt flows in `src/ai/flows/`. Requires `GOOGLE_GENAI_API_KEY` in `.env`.
- **Vitest** — `environment: 'node'` (no jsdom). Mock `@/lib/dictionary` in tests.
- **nspell + Hunspell (dictionary-pt + suplemento VOLP/ABL)** — local spell check via `src/lib/dictionary.ts` + `src/lib/spell-checker.ts`. Usa `nspell` com o `.dic` e `.aff` do VERO (via `dictionary-pt@4.0.0`) + suplemento de ~561k palavras do VOLP (ABL) e fserb/pt-br.

## Architecture notes

- Path alias `@/*` → `./src/*`
- Dark mode enforced: `<html lang="pt-BR" className="dark">` — no toggle
- Firestore structure: `/users/{userId}` and `/users/{userId}/poems/{poemId}` (see `docs/backend.json` and `firestore.rules`)
- Two suggestion modes: "gradual" (debounced auto-check on typing) and "final" (manual buttons)
- AI flow (`src/ai/flows/generate-contextual-suggestions.ts`) is a `'use server'` module — both grammar and tone prompts feed through the same `suggestionFlow`
- Local check + AI check: grammar errors first checked against `dictionary-pt` (VERO) + suplemento VOLP via nspell; if found, returned immediately without calling AI. AI is only called when local check passes (or for tone suggestions).
- `docs/blueprint.md` — product design doc (features, color scheme, fonts)
- No CI workflows, no pre-commit hooks, no ESLint

## Conventions

- UI labels in Brazilian Portuguese (`pt-BR`)
- Font: Literata (Google Fonts) via `next/font/google`, applied as `--font-literata` CSS variable
- Colors: CSS custom properties in `globals.css` under `:root` and `.dark` — do NOT use Tailwind color names directly
- No server-side data fetching patterns — this is a client-heavy SPA
