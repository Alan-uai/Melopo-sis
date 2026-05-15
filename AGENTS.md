# Melopoësis — Agent Guide

## Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Dev server on **port 9002** via Turbopack |
| `npm run build` | `NEXT_PUBLIC_ENV=production next build` — skips TS errors & ESLint intentionally |
| `npm run lint` | `next lint` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run genkit:dev` | Start Genkit flow dev server |
| `npm run genkit:watch` | Genkit dev server with file watch |

No test framework or test scripts exist.

## Architecture

- **Next.js 15** App Router, React 18, TypeScript, `@/*` → `./src/*`
- **shadcn/ui** components at `@/components/ui/*`, configured via `components.json`
- **Tailwind CSS v3** with `tailwindcss-animate` plugin
- **Genkit** + `googleai/gemini-2.5-flash` for AI suggestions (needs `GOOGLE_GENAI_API_KEY` in `.env`)
- **Firebase Auth + Firestore** (production backends — emulators are **disabled**)
- UI language: **Brazilian Portuguese (pt-BR)**

## Key Gotchas

- **Firebase init**: calls `initializeApp()` without args first (for App Hosting). Falls back to hardcoded config in `src/firebase/config.ts`. Do not remove the fallback.
- **Firestore hooks** (`useCollection`, `useDoc`) require memoized refs — use `useMemoFirebase()` from `@/firebase` instead of bare `useMemo`.
- **Firestore writes** use non-blocking fire-and-forget helpers (`setDocumentNonBlocking`, `addDocumentNonBlocking`, etc.) — errors propagate via `errorEmitter` to `FirebaseErrorListener`.
- **AI flows** (`src/ai/flows/`) use `'use server'` — these are Next.js Server Actions.
- **`next.config.ts`**: `ignoreBuildErrors: true` + `eslint.ignoreDuringBuilds: true` — build will not catch TS/ESLint issues. Run `lint` + `typecheck` separately.
- **Port 9002**, not default 3000.
- `.env*` files are gitignored — required for Genkit API keys.

## Suggestion Flow

1. User clicks "Gerar Sugestões" → calls `generateContextualSuggestions({ suggestionType: 'grammar' })`
2. Grammar suggestions displayed one-by-one via `SuggestionPopover` inline in editor
3. After last grammar suggestion dismissed/accepted → auto-triggers `suggestionType: 'tone'`
4. Tone suggestions shown in `SuggestionList` side panel with accept/dismiss/resuggest per card

## Database Structure (Firestore)

```
/users/{userId}          — user profile (uid, email, displayName, photoURL)
/users/{userId}/poems/{poemId} — poem (title, text, tone, structure, rhyme, authorId, createdAt, updatedAt)
```

Security rules enforce strict user ownership (only creator can read/write their own data).
