---
name: stack-detector
description: |
  Use this skill to detect the project's tech stack and save it as a persistent cache at .opencode/stack-context.md. Called automatically by skill-orchestrator when no cache exists, when the cache is stale, or when the task is gigantic. Can also be called directly when the user says "detect the stack", "re-detect", "what are we using", "update the stack context", or when starting work in an unfamiliar codebase. The cache it produces is consumed by every other skill and agent — it is the single source of truth about the project. Never re-detect if a valid cache already exists unless explicitly instructed or task complexity demands it.
---

# Stack Detector

Reads the project once, produces a precise STACK CONTEXT, and saves it as a persistent cache that every skill and agent reads instead of re-detecting. Fast, accurate, and always available.

## Core Principle: Detect Once, Cache Forever

The stack of a project changes rarely. Running full detection before every task is wasteful. This skill's job is to **produce the cache** — other skills and agents simply read it. The orchestrator decides when to call this skill based on task complexity and cache freshness.

## When This Skill Runs

This skill is called by `skill-orchestrator` when:
- No cache exists at `.opencode/stack-context.md`
- Task complexity is **gigantic** (always fresh)
- Task complexity is **large** and cache is stale (package.json newer than cache)
- `stack_detection: "force"` is passed explicitly

It can also be called directly by the user to refresh or inspect the stack context.

**This skill does NOT run on every task.** That is intentional.

---

## Detection Protocol

Run all steps in order. Do not skip any step even if the answer seems obvious — config files frequently diverge from assumptions.

### Step 1: Read Root Configuration Files

```
package.json              → dependencies, devDependencies, scripts, engines
tsconfig.json             → strict mode, path aliases, target, moduleResolution
.env.example or .env.local → keys only (never values) — reveals integrated services
next.config.js/ts         → Next.js configuration
vite.config.ts            → if Vite-based
tailwind.config.ts/js     → Tailwind plugins and content paths
eslint.config.js          → linting rules
```

If `package.json` does not exist, check for:
```
requirements.txt / pyproject.toml  → Python
go.mod                             → Go
Cargo.toml                         → Rust
```

### Step 2: Folder Structure Analysis

```bash
ls -la
ls -la src/ app/ pages/ components/ lib/ utils/ hooks/ services/ 2>/dev/null
```

Key signals:
- `app/` directory → Next.js App Router
- `pages/` directory → Next.js Pages Router
- `src/app/` → App Router with src layout
- `components/ui/` → shadcn/ui likely present
- `prisma/` → Prisma ORM
- `supabase/` → Supabase project
- `convex/` → Convex backend
- `drizzle/` → Drizzle ORM
- `.storybook/` → Storybook

### Step 3: Dependency Categorization

From `package.json`, categorize all significant dependencies. See `references/detection-map.md` for the full technology table.

Key categories to resolve: framework, router type, language + strictness, styling solution, state management (server + client), database/ORM, auth, testing tools, package manager (from lockfile).

### Step 4: Pattern Detection

```bash
# App Router usage patterns
grep -r "use client" src/app/ app/ --include="*.tsx" -l 2>/dev/null | head -5
grep -r "use server" src/ --include="*.ts" --include="*.tsx" -l 2>/dev/null | head -5

# Component structure conventions
ls src/components/ 2>/dev/null | head -10

# Barrel exports
find src -name "index.ts" -o -name "index.tsx" 2>/dev/null | head -10

# Path aliases
grep -A 20 '"paths"' tsconfig.json 2>/dev/null

# API routes
ls src/app/api/ 2>/dev/null || ls pages/api/ 2>/dev/null
```

### Step 5: Monorepo Detection

```bash
ls packages/ apps/ 2>/dev/null
cat pnpm-workspace.yaml 2>/dev/null
grep -A 5 '"workspaces"' package.json 2>/dev/null
```

If monorepo detected: ask the user which package/app is the target if not clear from context, then run detection for that specific package. Add a MONOREPO section to the output.

### Step 6: Handle Uncertainty

If a key aspect cannot be determined from files:
- State the uncertainty explicitly in IMPORTANT NOTES with a confidence level (e.g. "80% confident")
- Provide the best guess and explain the reasoning
- Mark it clearly so consumers of the cache know to verify
- Never silently guess and present it as fact

---

## Step 7: Produce and Save the STACK CONTEXT

After completing Steps 1-6, produce the STACK CONTEXT block and save it to `.opencode/stack-context.md`.

**This file is the cache.** Every other skill and agent reads from here instead of re-detecting.

```markdown
---
generated_by: stack-detector
generated_at: [ISO timestamp]
package_json_mtime: [last modified timestamp of package.json]
---

═══════════════════════════════════════
STACK CONTEXT
Project: [project name from package.json or folder name]
═══════════════════════════════════════

RUNTIME & FRAMEWORK
  Framework:         [e.g. Next.js 15.1.0]
  Router:            [App Router | Pages Router | N/A]
  Language:          [TypeScript 5.4 | JavaScript]
  TypeScript strict: [yes | no | not configured]
  Package manager:   [pnpm | yarn | npm | bun]

STYLING
  CSS solution:      [Tailwind CSS 3.4 | Tailwind CSS 4.0 | CSS Modules | styled-components | plain CSS]
  Component library: [shadcn/ui | Radix UI | MUI | none]

STATE MANAGEMENT
  Server state:      [TanStack Query 5 | SWR | none]
  Client state:      [Zustand | Jotai | Redux Toolkit | useState/Context only]

DATA & BACKEND
  Database/ORM:      [Supabase | Prisma | Drizzle | MongoDB | none]
  API style:         [Route Handlers | tRPC | REST | Server Actions | GraphQL]
  Auth solution:     [Clerk | NextAuth v5 | Supabase Auth | Lucia | none]

TESTING
  Unit/Integration:  [Vitest + RTL | Jest + RTL | none]
  E2E:               [Playwright | Cypress | none]

CONVENTIONS DETECTED
  Component style:   [single file | folder with index.ts | mixed]
  Barrel exports:    [yes | no]
  Path aliases:      [@/* → src/* | ~ | none]
  Server components: [used extensively | used sparingly | not used]
  Server actions:    [present | not present]
  Validation:        [Zod | Yup | none]

IMPORTANT NOTES
  [Non-standard configs, deprecated patterns, uncertainties with confidence levels]
  [e.g. "Tailwind v4 beta — class names differ from v3 docs"]
  [e.g. "Auth: UNCERTAIN — both Clerk and NextAuth found. 80% confident Clerk is active."]
  [e.g. "No testing configured — code-reviewer should flag missing tests on every PR"]

SKILL ADAPTATIONS REQUIRED
  [Concrete overrides — how each skill must adapt to this specific stack]
  [e.g. "design-system: use Tailwind classes; import shared UI from src/components/ui/"]
  [e.g. "data-access-api: use Supabase client patterns; no raw fetch in components"]
  [e.g. "isolated-logic: Server Components use async functions — hooks only in Client Components"]
  [e.g. "strict-typing: infer types from Zod schemas using z.infer<typeof Schema>"]

═══════════════════════════════════════
```

If the file already exists, overwrite it completely. The new detection replaces the old one.

---

## Step 8: Staleness Check Logic

Other skills and the orchestrator can check cache freshness using this logic:

```
cache_time = read frontmatter generated_at from .opencode/stack-context.md
pkg_mtime  = file system modified time of package.json

if pkg_mtime > cache_time:
  cache is STALE → orchestrator should call stack-detector for large/gigantic tasks
else:
  cache is FRESH → use as-is
```

The `package_json_mtime` field in the frontmatter is stored for this comparison. Skills that want to validate freshness before consuming the cache should check this before trusting the contents.

---

## Step 9: Self-Log

After saving the cache, append to `.opencode/skills/skill-improver/logs/stack-detector-log.jsonl`:

```json
{
  "timestamp": "[ISO timestamp]",
  "project_name": "[detected project name]",
  "stack_summary": "[one-line, e.g. 'Next.js 15 App Router + TypeScript strict + Tailwind v3 + Supabase + Clerk']",
  "trigger": "no_cache | stale_cache | gigantic_task | forced | user_request",
  "files_read": ["package.json", "tsconfig.json", "next.config.ts"],
  "detection_confidence": "high | medium | low",
  "ambiguities": ["[anything that required a guess]"],
  "unusual_patterns": ["[anything non-standard other skills should know]"],
  "missing_files": ["[expected config files not found]"]
}
```

---

## How Other Skills Consume the Cache

Every skill and agent that needs stack context must:

1. Read `.opencode/stack-context.md` at the start of execution
2. Apply every override in SKILL ADAPTATIONS REQUIRED before writing any code
3. Treat STACK CONTEXT as higher priority than any generic skill instruction
4. If the cache does not exist, stop and ask the user to run stack-detector before proceeding

The cache is the ground truth. Skills adapt to it — not the other way around.

---

For the full detection map of technologies and config file signatures, see `references/detection-map.md`.
For complete STACK CONTEXT examples for common project types, see `references/stack-examples.md`.
