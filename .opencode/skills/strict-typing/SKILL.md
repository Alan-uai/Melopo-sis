---
name: strict-typing
description: |
  Use this skill on EVERY TypeScript file you write or modify — not just when type errors appear. Activate proactively when: creating interfaces, writing function signatures, handling external data, using Zod schemas, or reviewing any file that uses `any`. TypeScript's type system is a security layer — `any` punches a hole in it. This skill enforces no-any, Zod-inferred types, explicit return types, utility types, and contracts between modules. Apply this before code-reviewer runs. Synonyms: TypeScript, types, interface, typing, any, unknown, strict, Zod, schema, type safety, generic.
---

# Strict Typing

TypeScript's type system is not just documentation — it's a compile-time security layer. Every `any` you write is a gap where runtime bugs and security issues can hide. This skill eliminates those gaps.

## Rule 1: Never Use `any`

`any` tells TypeScript to stop checking that value. It disables inference, disables error detection, and spreads: once an `any` enters a function, it contaminates the return type and everything that touches it.

```typescript
// WRONG — any spreads silently
function getUser(id: any): any {
  return db.users.find(id)  // TypeScript has no idea what this returns
}

const user = getUser('123')
user.nonExistentField.something  // TypeScript won't catch this — runtime crash

// RIGHT — explicit types catch errors at compile time
async function getUser(id: string): Promise<User | null> {
  const { data } = await supabase.from('users').select('*').eq('id', id).single()
  return data
}

const user = await getUser('123')
user.nonExistentField  // TypeScript error: Property 'nonExistentField' does not exist
```

**When the type is genuinely unknown** (external API response, JSON.parse, form data), use `unknown` and validate:

```typescript
// unknown + Zod = safe external data
async function fetchExternalData(url: string): Promise<Product[]> {
  const raw: unknown = await fetch(url).then(r => r.json())
  return ProductArraySchema.parse(raw)  // validates AND types in one step
}
```

## Rule 2: Infer Types from Zod Schemas

Never define a TypeScript interface for something you already have a Zod schema for. Infer the type from the schema — they stay in sync automatically.

```typescript
// WRONG — two sources of truth that can drift
const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
})

interface CreateUserDTO {  // ← must be manually kept in sync with schema
  email: string
  password: string
  name: string
}

// RIGHT — one source of truth
const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
})

type CreateUserDTO = z.infer<typeof CreateUserSchema>
// Type is automatically: { email: string; password: string; name: string }
// Change the schema → type changes automatically
```

## Rule 3: Explicit Return Types on All Exports

Exported functions are the public API of your module. Their return types are a contract. Letting TypeScript infer them means the contract can change silently when you modify the implementation.

```typescript
// WRONG — return type inferred, can change silently
export async function getActiveUsers() {
  return supabase.from('users').select('*').eq('active', true)
  // Someone adds .limit(10) and the return type changes — callers don't notice
}

// RIGHT — return type is an explicit promise you keep
export async function getActiveUsers(): Promise<User[]> {
  const { data, error } = await supabase.from('users').select('*').eq('active', true)
  if (error) throw error
  return data
}
```

## Rule 4: Use Utility Types Instead of Duplicating

TypeScript provides powerful utility types that eliminate duplication.

```typescript
interface User {
  id: string
  email: string
  name: string
  password: string
  role: 'user' | 'admin'
  createdAt: Date
}

// WRONG — manually defined types that must be kept in sync
interface PublicUser {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
}

interface UpdateUserDTO {
  email?: string
  name?: string
}

// RIGHT — derived from the source type automatically
type PublicUser = Omit<User, 'password' | 'createdAt'>  // auto-syncs with User
type UpdateUserDTO = Partial<Pick<User, 'email' | 'name'>>  // only updatable fields
type CreateUserDTO = Omit<User, 'id' | 'createdAt'>  // everything except server-set fields
```

## Rule 5: Type the Trust Boundary

The server/client boundary is the most important place to be precise about types. Data entering from the client is `unknown` until validated.

```typescript
// API route — data enters as unknown, exits as typed
export async function POST(req: Request): Promise<Response> {
  const body: unknown = await req.json()  // unknown — anything could be here

  const result = CreatePostSchema.safeParse(body)
  if (!result.success) {
    return Response.json({ error: result.error.flatten() }, { status: 400 })
  }

  // result.data is now: { title: string; content: string; published: boolean }
  // TypeScript knows this — not because we cast it, but because we validated it
  const post = await postService.create(result.data)

  return Response.json(post)
}
```

## Rule 6: Discriminated Unions for State

Use discriminated unions to make impossible states unrepresentable.

```typescript
// WRONG — all combinations of these booleans are possible, most don't make sense
interface LoadState<T> {
  data: T | null
  loading: boolean
  error: string | null
}
// What does { data: someData, loading: true, error: "failed" } mean?

// RIGHT — discriminated union: only valid states are representable
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }

// TypeScript now narrows correctly:
function render<T>(state: AsyncState<T>) {
  if (state.status === 'success') {
    return state.data  // TypeScript knows data exists here
  }
  if (state.status === 'error') {
    return state.error  // TypeScript knows error exists here
  }
}
```

## TypeScript Configuration

```json
// tsconfig.json — these options make TypeScript actually strict
{
  "compilerOptions": {
    "strict": true,              // enables all strict checks
    "noImplicitAny": true,       // explicit any only, no inference to any
    "strictNullChecks": true,    // null and undefined must be handled
    "noImplicitReturns": true,   // all code paths must return
    "noUncheckedIndexedAccess": true,  // array[i] is T | undefined, not T
    "exactOptionalPropertyTypes": true  // optional props can't be set to undefined explicitly
  }
}
```

## Pre-Delivery Checklist

- [ ] No `any` types — use explicit types or `unknown` + validation
- [ ] All Zod schemas have inferred TypeScript types (`z.infer<typeof Schema>`)
- [ ] All exported functions have explicit return types
- [ ] Utility types used instead of manually duplicated interfaces
- [ ] Client-received data typed as `unknown` before Zod parsing
- [ ] Discriminated unions used for multi-state objects
- [ ] `tsconfig.json` has `"strict": true`

## Self-Observation

```json
{
  "skill": "strict-typing",
  "observation_type": "missing_coverage | ambiguous_instruction | conflict_with_stack",
  "description": "[what typing scenario the skill didn't cover]",
  "suggested_improvement": "[what guidance would have helped]"
}
```

Append to `.opencode/skills/skill-improver/logs/skill-observations.jsonl`.
