# Technology Detection Map

Full reference of detectable technologies, their detection signals, and version-specific notes.

## Frameworks

| Technology | Primary Signal | Secondary Signal | Version Notes |
|------------|---------------|-----------------|---------------|
| Next.js | `"next"` in deps | `next.config.*` present | v13+ = App Router available; v15 = stable Turbopack |
| Next.js App Router | `app/` directory exists | `layout.tsx` at app root | Cannot mix freely with Pages Router |
| Next.js Pages Router | `pages/` directory exists | `_app.tsx` present | Legacy — new projects prefer App Router |
| React + Vite | `"vite"` + `"react"` in deps | `vite.config.ts` present | No SSR by default |
| Nuxt | `"nuxt"` in deps | `nuxt.config.ts` present | v3 = Composition API default |
| SvelteKit | `"@sveltejs/kit"` in deps | `svelte.config.js` present | - |
| Astro | `"astro"` in deps | `astro.config.mjs` present | Islands architecture |
| Remix | `"@remix-run/react"` in deps | `remix.config.js` present | - |

## Styling

| Technology | Primary Signal | Version Notes | Skill Adaptation |
|------------|---------------|---------------|-----------------|
| Tailwind CSS v3 | `"tailwindcss": "^3.*"` | Utility-first, JIT, config-based | Use `className="..."` utility classes |
| Tailwind CSS v4 | `"tailwindcss": "^4.*"` | CSS-first config, no tailwind.config.js | Use CSS variables + new syntax |
| shadcn/ui | `components/ui/` folder with button.tsx etc | Built on Radix UI | Import from `@/components/ui/` |
| CSS Modules | `*.module.css` files present | - | Use `styles.className` pattern |
| styled-components | `"styled-components"` in deps | - | Use `styled.div` pattern |
| Emotion | `"@emotion/react"` in deps | - | Use `css` prop or `styled` |
| Sass | `"sass"` in deps | - | `.scss` files allowed |

## State Management

| Technology | Signal | Notes |
|------------|--------|-------|
| TanStack Query | `"@tanstack/react-query"` | Server state, caching, mutations |
| SWR | `"swr"` | Lighter alternative to TanStack Query |
| Zustand | `"zustand"` | Minimal client state |
| Jotai | `"jotai"` | Atomic client state |
| Redux Toolkit | `"@reduxjs/toolkit"` | Full Redux with DX improvements |
| Recoil | `"recoil"` | Facebook's atomic state |
| None | (none of above) | Use useState/useReducer/Context |

## Database & ORM

| Technology | Signal | Skill Adaptation |
|------------|--------|-----------------|
| Supabase | `"@supabase/supabase-js"` | Use `supabase.from().select()` pattern |
| Prisma | `"prisma"` + `prisma/` directory | Use `prisma.model.findMany()` |
| Drizzle | `"drizzle-orm"` + `drizzle/` | Use Drizzle query builder |
| MongoDB/Mongoose | `"mongoose"` | Use model-based queries |
| PlanetScale | `"@planetscale/database"` | MySQL-compatible, serverless |
| Convex | `"convex"` + `convex/` directory | Reactive queries, different paradigm |
| Turso | `"@libsql/client"` | Edge SQLite |

## Authentication

| Technology | Signal | Notes |
|------------|--------|-------|
| Clerk | `"@clerk/nextjs"` | Middleware-based, clerkMiddleware() |
| NextAuth v4 | `"next-auth": "^4.*"` | [...nextauth] route |
| NextAuth v5 / Auth.js | `"next-auth": "^5.*"` or `"@auth/core"` | auth.ts config file |
| Supabase Auth | `"@supabase/auth-helpers-nextjs"` or similar | Tied to Supabase |
| Lucia | `"lucia"` | Flexible, framework-agnostic |
| Custom | Auth-related files in middleware.ts or lib/auth | Flag as custom — proceed with caution |

## Testing

| Technology | Signal | Purpose |
|------------|--------|---------|
| Vitest | `"vitest"` | Fast unit/integration tests (Vite-based) |
| Jest | `"jest"` | Unit/integration tests |
| React Testing Library | `"@testing-library/react"` | Component testing |
| Playwright | `"@playwright/test"` | E2E browser testing |
| Cypress | `"cypress"` | E2E browser testing |
| MSW | `"msw"` | API mocking in tests |

## Build Tools

| Technology | Signal | Notes |
|------------|--------|-------|
| Turbopack | `"--turbopack"` in next dev script | Next.js 15 default dev bundler |
| Webpack | Default in Next.js <15 | Still used for production in many projects |
| Vite | `"vite"` in deps | Fast HMR, non-Next.js projects |
| esbuild | `"esbuild"` | Often used for scripts, not main bundler |
| tsup | `"tsup"` | Library bundling |

## TypeScript Configuration Signals

These tsconfig.json settings affect skill behavior significantly:

| Setting | Impact |
|---------|--------|
| `"strict": true` | All strict checks enabled — `strict-typing` skill can use strictest patterns |
| `"noImplicitAny": true` | No implicit any — enforce explicit types everywhere |
| `"strictNullChecks": true` | Null safety — use optional chaining and null checks |
| `"paths": { "@/*": ["src/*"] }` | Path aliases in use — imports use `@/` prefix |
| `"moduleResolution": "bundler"` | Modern resolution — affects how imports work |
| `"target": "ES2022"` or higher | Modern JS features available |

## Common Project Archetypes

Quick detection patterns for the most common setups:

### "Modern Next.js SaaS" (most common in 2024-2025)
```
Signals: next@15 + app/ directory + tailwindcss@3 + shadcn/ui + @clerk/nextjs + @tanstack/react-query + prisma OR @supabase/supabase-js + zod + vitest
Adaptation: Full App Router patterns, Server Components, Server Actions, Clerk middleware
```

### "Next.js Pages Router Legacy"
```
Signals: next@12-13 + pages/ directory (no app/) + styled-components OR less common CSS solution
Adaptation: Pages Router patterns, getServerSideProps/getStaticProps, no Server Components
```

### "React SPA with Vite"
```
Signals: vite + react (no next) + react-router-dom
Adaptation: Client-side only, no SSR concepts, standard hooks everywhere
```

### "Full-stack with Convex"
```
Signals: convex + next + clerk
Adaptation: Convex queries/mutations replace traditional API routes and DB patterns
```
