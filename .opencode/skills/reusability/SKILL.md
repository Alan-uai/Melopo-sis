---
name: reusability
description: |
  Use this skill whenever you notice code being repeated, whenever creating a new hook or utility function, whenever building a component that's similar to an existing one, or when designing abstractions. Activate when: copy-pasting code with small changes, building a second version of something that already exists, or extracting shared logic. Reusable abstractions must be secure by default — a shared validation function that skips server-side checks is worse than no abstraction at all. Synonyms: DRY, extract, abstract, duplicate, repeated code, shared logic, generic, composition, reuse, common pattern.
---

# Reusability

Any repetition is a future inconsistency. When the same logic exists in two places, one will eventually drift from the other — either because someone updates one and forgets the other, or because two people make incompatible changes simultaneously. Extract early, extract decisively.

## The Signal: When to Extract

Extract when:
- You're about to copy-paste code and change a few values → extract the abstraction, parameterize the variation
- The same pattern appears in two different files → extract to shared location
- A component or function is growing because it handles multiple similar cases → generalize

Don't extract when:
- Code appears only once and there's no reason to expect it will recur
- The "duplication" actually represents different concepts that happen to look similar today
- The abstraction would be more complex than the two original pieces

The wrong abstraction is worse than duplication. Extract with confidence only when the pattern is stable and the variation is clear.

## Pattern 1: Parameterize the Variation

When two pieces of code have the same structure but different values, extract the structure and parameterize what varies.

```tsx
// WRONG — two near-identical cards
function UserCard({ user }: { user: User }) {
  return (
    <div className="rounded-lg border p-4 flex items-center gap-3">
      <Avatar src={user.avatar} alt={user.name} />
      <div>
        <p className="font-medium">{user.name}</p>
        <p className="text-sm text-gray-500">{user.email}</p>
      </div>
    </div>
  )
}

function TeamCard({ team }: { team: Team }) {
  return (
    <div className="rounded-lg border p-4 flex items-center gap-3">
      <Avatar src={team.logo} alt={team.name} />
      <div>
        <p className="font-medium">{team.name}</p>
        <p className="text-sm text-gray-500">{team.memberCount} members</p>
      </div>
    </div>
  )
}

// RIGHT — one component, parameterized variation
interface EntityCardProps {
  avatar: { src: string; alt: string }
  title: string
  subtitle: string
}

function EntityCard({ avatar, title, subtitle }: EntityCardProps) {
  return (
    <div className="rounded-lg border p-4 flex items-center gap-3">
      <Avatar src={avatar.src} alt={avatar.alt} />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
  )
}

function UserCard({ user }: { user: User }) {
  return <EntityCard avatar={{ src: user.avatar, alt: user.name }} title={user.name} subtitle={user.email} />
}

function TeamCard({ team }: { team: Team }) {
  return <EntityCard avatar={{ src: team.logo, alt: team.name }} title={team.name} subtitle={`${team.memberCount} members`} />
}
```

## Pattern 2: Generic Hooks for Shared Logic

When the same fetch-validate-set pattern appears in multiple components, extract it into a generic hook. The hook handles the pattern; the caller provides the specifics.

```typescript
// WRONG — same async pattern repeated across multiple hooks
function useUsers() {
  const [data, setData] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    userService.getAll()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  return { data, loading, error }
}

function useProducts() {
  const [data, setData] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    productService.getAll()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  return { data, loading, error }
}

// RIGHT — generic hook handles the pattern, caller provides the function
function useAsync<T>(fn: () => Promise<T>, deps: React.DependencyList = []) {
  const [state, setState] = useState<{
    data: T | null
    loading: boolean
    error: Error | null
  }>({ data: null, loading: true, error: null })

  useEffect(() => {
    let mounted = true
    setState(s => ({ ...s, loading: true, error: null }))

    fn()
      .then(data => { if (mounted) setState({ data, loading: false, error: null }) })
      .catch(error => { if (mounted) setState({ data: null, loading: false, error }) })

    return () => { mounted = false }
  }, deps)

  return state
}

// Usage — no repeated pattern
function useUsers() {
  return useAsync(() => userService.getAll())
}

function useProducts() {
  return useAsync(() => productService.getAll())
}
```

## Pattern 3: Composition Over Inheritance

Prefer building complex behavior by composing simpler pieces rather than inheriting from a base class. Composition is more flexible — you can mix and match behaviors. Inheritance locks you into a hierarchy that's hard to change.

```typescript
// WRONG — inheritance for code reuse
class BaseRepository {
  protected async query<T>(sql: string, params: unknown[]): Promise<T> {
    return db.query(sql, params)
  }
}

class UserRepository extends BaseRepository {
  async findAll(): Promise<User[]> {
    return this.query('SELECT * FROM users', [])
  }
}

// WRONG — now you can't use UserRepository without BaseRepository's internals

// RIGHT — composition via factory function
function createRepository<T>(tableName: string, schema: z.ZodType<T>) {
  return {
    async findAll(): Promise<T[]> {
      const { data, error } = await supabase.from(tableName).select('*')
      if (error) throw error
      return data.map(row => schema.parse(row))  // ← validates each row on the way out
    },
    async findById(id: string): Promise<T | null> {
      const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single()
      if (error) return null
      return schema.parse(data)
    },
  }
}

// Usage — compose behaviors, no inheritance
const userRepository = createRepository('users', UserSchema)
const productRepository = createRepository('products', ProductSchema)
```

Notice the `schema.parse(row)` — shared validation baked into the reusable abstraction. The abstraction is secure by default.

## Pattern 4: Secure Shared Utilities

Reusable validation utilities should enforce security at the abstraction level — not leave it to callers to remember.

```typescript
// WRONG — reusable utility that skips server-side validation
function parseUserInput<T>(data: unknown): T {
  return data as T  // ← type cast, not validation. Dangerous in a shared utility.
}

// WRONG — utility that validates client-side only
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  // ← caller might use this on the client and think validation is "done"
}

// RIGHT — explicit about trust boundary, enforces server-side validation
function parseServerPayload<T>(schema: z.ZodType<T>, raw: unknown): T {
  // This function name makes the intent clear: this is server-side parsing
  // Use this in API routes and server actions, never in client components
  return schema.parse(raw)
}

// RIGHT — document where validation must happen
/**
 * Validates email format.
 * USE IN: client forms (UX feedback) AND server routes (security).
 * This alone on the client is NOT sufficient for security.
 */
function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
```

## Pattern 5: Pure Utility Functions

Utilities that are reused in many places should be pure — same input, same output, no side effects. This makes them trivially testable and impossible to misuse.

```typescript
// Pure utilities — reusable, testable, predictable
export const formatDate = (date: Date | string, locale = 'pt-BR'): string =>
  new Intl.DateTimeFormat(locale, { dateStyle: 'short' }).format(new Date(date))

export const slugify = (text: string): string =>
  text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^\w-]/g, '')

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

export const groupBy = <T, K extends string>(
  items: T[],
  key: (item: T) => K
): Record<K, T[]> =>
  items.reduce((acc, item) => {
    const group = key(item)
    return { ...acc, [group]: [...(acc[group] ?? []), item] }
  }, {} as Record<K, T[]>)
```

## When Not to Reuse

The wrong abstraction is worse than duplication. Don't extract when:

- The two pieces of code are incidentally similar but represent different concepts (they'll diverge intentionally soon)
- The abstraction would need 5 parameters to handle every case (it's trying to be too generic)
- The extraction would make the call site harder to understand than reading the original code

When in doubt, wait for the third occurrence before extracting. Once = unique. Twice = coincidence. Three times = pattern worth abstracting.

## Self-Observation

If a reusability scenario appears that this skill doesn't address well, log it:

```json
{
  "skill": "reusability",
  "observation_type": "missing_coverage | ambiguous_instruction",
  "description": "[what pattern appeared that the skill didn't cover]",
  "suggested_improvement": "[what guidance would have helped]"
}
```

Append to `.opencode/skills/skill-improver/logs/skill-observations.jsonl`.
