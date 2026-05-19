---
name: data-access-api
description: |
  Use this skill EVERY TIME you write code that communicates with a database, external API, or any external service — even simple reads. Activate proactively when: creating a service file, writing a repository, building an API route that fetches data, using Supabase/Prisma/fetch/axios, or handling any external data. Frontend data is always untrusted — this skill enforces that all inputs are validated before they reach any data layer. Apply the Result pattern, service layer architecture, and retry strategies. Never let components talk directly to data sources. Synonyms: fetch, axios, supabase, prisma, database, service, repository, API call, data layer, external service.
---

# Data Access & API

All external communication goes through a service layer. Frontend data is validated before it touches any query. Errors are handled explicitly with the Result pattern — never silently swallowed.

## The Trust Boundary

The most important rule in this skill: **data coming from the frontend is untrusted until validated on the server**. This applies to every field in every request — not just "suspicious" ones.

```typescript
// WRONG — trusting client data directly in the service
export const userService = {
  async update(id: string, data: any) {
    return db.users.update({ id }, data)  // ← client could send { role: 'admin' }
  }
}

// RIGHT — schema strips and validates before the service ever sees the data
const UpdateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
  // role, admin, permissions — not here = not accepted
})

// In the API route (server boundary):
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json()
  const result = UpdateUserSchema.safeParse(body)
  if (!result.success) return Response.json({ error: result.error.flatten() }, { status: 400 })

  // Only validated data reaches the service
  return userService.update(params.id, result.data)
}
```

## The Result Pattern

Services never throw directly to callers. They return a `Result<T>` that makes success and failure explicit — callers can't accidentally ignore errors.

```typescript
// shared/result.ts
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string }

export const Result = {
  ok: <T>(data: T): Result<T> => ({ ok: true, data }),
  fail: <T = never>(error: string, code?: string): Result<T> => ({ ok: false, error, code }),
}
```

## Service Layer Structure

Every external resource gets its own service. Services are the only place that talk to the database or external APIs.

```typescript
// services/userService.ts
import { supabase } from '@/infra/supabase'
import { Result } from '@/shared/result'
import type { User, CreateUserDTO, UpdateUserDTO } from '@/types/user'

export const userService = {
  async findById(id: string): Promise<Result<User>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()

      if (error) return Result.fail(error.message, 'DB_ERROR')
      if (!data) return Result.fail('User not found', 'NOT_FOUND')
      return Result.ok(data as User)
    } catch (err) {
      return Result.fail('Unexpected error', 'INTERNAL')
    }
  },

  async create(data: CreateUserDTO): Promise<Result<User>> {
    try {
      const { data: created, error } = await supabase
        .from('users')
        .insert(data)
        .select()
        .single()

      if (error) return Result.fail(error.message, 'DB_ERROR')
      return Result.ok(created as User)
    } catch (err) {
      return Result.fail('Unexpected error', 'INTERNAL')
    }
  },

  async update(id: string, data: UpdateUserDTO): Promise<Result<User>> {
    try {
      const { data: updated, error } = await supabase
        .from('users')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) return Result.fail(error.message, 'DB_ERROR')
      return Result.ok(updated as User)
    } catch (err) {
      return Result.fail('Unexpected error', 'INTERNAL')
    }
  },
}
```

## Centralized HTTP Client

For external APIs (not your own database), use a centralized HTTP client with timeout, retry, and error normalization.

```typescript
// infra/apiClient.ts
interface RequestOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  timeoutMs?: number
  retries?: number
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<Result<T>> {
  const { method = 'GET', body, headers = {}, timeoutMs = 10000, retries = 0 } = options
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${process.env.API_BASE_URL}${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        return Result.fail(err.message ?? `HTTP ${response.status}`, String(response.status))
      }

      const data = await response.json() as T
      return Result.ok(data)
    } catch (err) {
      if (attempt === retries) {
        clearTimeout(timeout)
        const message = err instanceof Error ? err.message : 'Network error'
        return Result.fail(message, 'NETWORK_ERROR')
      }
      // Exponential backoff between retries
      await new Promise(r => setTimeout(r, 200 * Math.pow(2, attempt)))
    }
  }

  return Result.fail('Max retries exceeded', 'TIMEOUT')
}

export const apiClient = {
  get: <T>(endpoint: string, opts?: RequestOptions) => request<T>(endpoint, { ...opts, method: 'GET' }),
  post: <T>(endpoint: string, body: unknown, opts?: RequestOptions) => request<T>(endpoint, { ...opts, method: 'POST', body }),
  patch: <T>(endpoint: string, body: unknown, opts?: RequestOptions) => request<T>(endpoint, { ...opts, method: 'PATCH', body }),
  delete: <T>(endpoint: string, opts?: RequestOptions) => request<T>(endpoint, { ...opts, method: 'DELETE' }),
}
```

## Hook Consuming a Service

Hooks are the bridge between components and services. They never call services from inside render — only from effects and callbacks.

```typescript
// hooks/useUser.ts
export function useUser(id: string) {
  const [state, setState] = useState<{
    data: User | null
    loading: boolean
    error: string | null
  }>({ data: null, loading: true, error: null })

  useEffect(() => {
    let mounted = true
    setState(s => ({ ...s, loading: true, error: null }))

    userService.findById(id).then(result => {
      if (!mounted) return
      if (result.ok) {
        setState({ data: result.data, loading: false, error: null })
      } else {
        setState({ data: null, loading: false, error: result.error })
      }
    })

    return () => { mounted = false }
  }, [id])

  return state
}
```

## Row-Level Security

For database access, combine service-layer validation with Row Level Security (RLS) on Supabase/Postgres. Defense in depth — two independent security layers.

```sql
-- Users can only read and modify their own data
CREATE POLICY "users_own_data" ON users
  FOR ALL USING (auth.uid() = id);

-- Posts are readable by everyone but writable only by author
CREATE POLICY "posts_read_all" ON posts FOR SELECT USING (true);
CREATE POLICY "posts_write_own" ON posts FOR ALL USING (auth.uid() = author_id);
```

Even if a bug in the service layer lets wrong data through, RLS is the last line of defense at the database level.

## Checklist

- [ ] All data from the frontend validated with Zod schema before reaching the service
- [ ] Sensitive fields (role, admin, permissions) excluded from client-facing schemas
- [ ] All services return `Result<T>` — no unhandled throws
- [ ] No fetch/axios calls inside components or hooks directly
- [ ] External API calls use the centralized client with timeout and retry
- [ ] RLS policies configured on database tables

## Self-Observation

```json
{
  "skill": "data-access-api",
  "observation_type": "missing_coverage | conflict_with_stack | ambiguous_instruction",
  "description": "[what situation the skill didn't cover]",
  "suggested_improvement": "[what would have helped]"
}
```

Append to `.opencode/skills/skill-improver/logs/skill-observations.jsonl`.
