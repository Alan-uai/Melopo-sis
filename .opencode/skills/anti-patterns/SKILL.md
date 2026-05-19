---
name: anti-patterns
description: |
  Use this skill on EVERY piece of code you write or review — not just when problems are obvious. Activate proactively when: creating components, writing API routes, handling form data, building services, or reviewing any existing code. This skill catches the patterns that cause the most damage over time: frontend data treated as trusted, code duplication, logic in UI components, use of `any`, API access without a service layer, unvalidated inputs, exposed secrets, and functional placeholders. Apply this skill before delivering any code. Synonyms: code quality, bad practice, anti-pattern, code smell, review, audit, check my code.
---

# Anti-Patterns

The patterns in this skill don't just make code messy — they create bugs, security vulnerabilities, and maintenance nightmares. Knowing what not to do is as important as knowing what to do.

---

## Anti-Pattern 0: Trusting Frontend Data (Security — Highest Priority)

This is the most dangerous anti-pattern. Frontend data is **always untrusted**. A user, a bot, or an attacker can send any payload they want — bypassing your forms, your client-side validation, and your UI entirely. The only validation that counts is the one that runs on the server.

```typescript
// WRONG — trusting the client completely
// pages/api/users/route.ts
export async function POST(req: Request) {
  const body = await req.json()
  await db.users.create({ role: body.role })  // ← attacker sends role: "admin"
}

// WRONG — client-side validation only
function UserForm() {
  const handleSubmit = (data: FormData) => {
    if (!data.email) return  // ← this check disappears on direct API calls
    fetch('/api/users', { method: 'POST', body: JSON.stringify(data) })
  }
}

// RIGHT — validate on the server, always, regardless of what the client sends
// pages/api/users/route.ts
import { z } from 'zod'

const CreateUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  // role is NOT accepted from the client — the server decides
})

export async function POST(req: Request) {
  const body = await req.json()
  const result = CreateUserSchema.safeParse(body)

  if (!result.success) {
    return Response.json({ error: result.error.flatten() }, { status: 400 })
  }

  // result.data is now safe — only fields we explicitly allowed
  await db.users.create({
    ...result.data,
    role: 'user',  // ← server sets this, never the client
  })
}
```

Client-side validation is UX. Server-side validation is security. You need both — but only the server-side one actually protects you.

---

## Anti-Pattern 1: Code Duplication

Duplicated code means every bug fix, every rule change, and every improvement must happen in multiple places. One gets updated. The others don't. Divergence is inevitable.

```tsx
// WRONG — two cards sharing the same structure
function UserCard({ user }) {
  return (
    <div className="p-4 border rounded">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  )
}

function ProductCard({ product }) {
  return (
    <div className="p-4 border rounded">  {/* ← same structure, duplicated */}
      <h3>{product.name}</h3>
      <p>{product.description}</p>
    </div>
  )
}

// RIGHT — shared structure, specific data
function Card({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-4 border rounded">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}

function UserCard({ user }) {
  return <Card title={user.name} description={user.email} />
}
function ProductCard({ product }) {
  return <Card title={product.name} description={product.description} />
}
```

The signal: if you're about to copy-paste code and change a few values, extract the abstraction first.

---

## Anti-Pattern 2: Logic Inside UI Components

Components should render. Hooks handle state. Services handle data. When logic lives in the component, it becomes impossible to test without rendering, impossible to reuse without copying, and impossible to read at a glance.

```tsx
// WRONG — fetch, format, and render all in one
function UserList() {
  const [users, setUsers] = useState([])

  useEffect(() => {
    fetch('/api/users')  // ← direct fetch in component
      .then(res => res.json())
      .then(data => setUsers(data))
  }, [])

  const formatName = (u) => `${u.firstName} ${u.lastName}`  // ← formatting logic here

  return <ul>{users.map(u => <li key={u.id}>{formatName(u)}</li>)}</ul>
}

// RIGHT — component only renders
function UserList() {
  const { users, loading, error } = useUsers()  // ← hook owns the logic

  if (loading) return <Spinner />
  if (error) return <ErrorState error={error} />
  return <ul>{users.map(u => <li key={u.id}>{u.displayName}</li>)}</ul>
}
```

---

## Anti-Pattern 3: Using `any`

`any` disables TypeScript. The moment you write `any`, you've told the compiler to stop checking that value entirely. Bugs that TypeScript would have caught at compile time become runtime errors in production.

```typescript
// WRONG — any disables all type checking
function processOrder(data: any) {
  return data.items.map((item: any) => item.price * item.quantity)
  // ← if data.items is undefined, this crashes at runtime with no warning
}

// RIGHT — explicit types catch errors at compile time
interface OrderItem {
  price: number
  quantity: number
}

interface Order {
  items: OrderItem[]
}

function processOrder(order: Order): number {
  return order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

// When the shape is genuinely unknown (external API, JSON parse), use unknown + validation
function parseApiResponse(raw: unknown): Order {
  return OrderSchema.parse(raw)  // ← Zod validates and types in one step
}
```

---

## Anti-Pattern 4: Direct API Access in Components

Components that call APIs directly are coupled to the network layer. They can't be tested without mocking `fetch`. They can't be reused without duplicating the network call. They mix UI concerns with data concerns in a way that makes both harder.

```tsx
// WRONG — component knows about API endpoint details
function Profile({ userId }: { userId: string }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`)
      .then(res => res.json())
      .then(setUser)
  }, [userId])

  return <div>{user?.name}</div>
}

// RIGHT — component knows nothing about where data comes from
function Profile({ userId }: { userId: string }) {
  const { user, loading } = useUser(userId)  // ← hook handles data
  return loading ? <Spinner /> : <div>{user?.name}</div>
}

// hook delegates to service
function useUser(id: string) {
  const [user, setUser] = useState(null)
  useEffect(() => { userService.getById(id).then(setUser) }, [id])
  return { user }
}

// service handles the network
const userService = {
  getById: (id: string) => fetch(`/api/users/${id}`).then(r => r.json())
}
```

---

## Anti-Pattern 5: Unvalidated Data Reaching the Database

Any data that reaches the database without server-side validation is a potential injection vector, a potential integrity violation, and a potential source of hard-to-debug corruptions.

```typescript
// WRONG — raw client data goes straight to the database
export async function POST(req: Request) {
  const data = await req.json()
  await db.posts.create(data)  // ← what if data has extra fields? wrong types? malicious content?
}

// RIGHT — schema validation as the gate
const CreatePostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  published: z.boolean().default(false),
})

export async function POST(req: Request) {
  const body = await req.json()
  const result = CreatePostSchema.safeParse(body)

  if (!result.success) {
    return Response.json({ error: result.error.flatten() }, { status: 400 })
  }

  await db.posts.create(result.data)  // ← only validated, typed, and stripped data

```

Zod's `parse` and `safeParse` strip fields not in the schema automatically — they never reach your code. You do not need to manually delete `req.body.role` or `req.body.admin`. If those fields are not in the schema, `result.data` simply does not contain them. This stripping is the actual security mechanism, not just type-checking.

---

## Anti-Pattern 6: Exposed Secrets
}
```

---

## Anti-Pattern 6: Exposed Secrets

Secrets in code are secrets that get committed to git, shared with everyone who clones the repo, and exposed in bundle analysis tools.

```typescript
// WRONG — hardcoded secrets
const apiKey = 'sk_live_abc123def456'
const dbPassword = 'super_secret_password'

// WRONG — client-side secret (visible in browser)
const secret = process.env.NEXT_PUBLIC_SECRET_KEY  // NEXT_PUBLIC_ is sent to the browser

// RIGHT — server-only environment variables, validated at startup
const apiKey = process.env.STRIPE_SECRET_KEY
if (!apiKey) throw new Error('STRIPE_SECRET_KEY is not set')

// RIGHT — server components / API routes access secrets
// Client components access only NEXT_PUBLIC_ vars (which should never be secrets)
```

---

## Anti-Pattern 7: Functional Placeholders

Placeholders delay problems — they don't solve them. A component that renders "Coming soon" is broken. A TODO comment is unfinished work shipped to production.

```tsx
// WRONG — placeholder as delivery
function BlogSection() {
  return <div>Coming soon...</div>  // ← this is not a feature, it's a stub
}

// RIGHT — empty state that communicates meaningfully
function BlogSection({ posts }: { posts: Post[] }) {
  if (!posts.length) {
    return (
      <EmptyState
        icon={<DocumentIcon />}
        title="No posts yet"
        description="Posts you create will appear here"
      />
    )
  }
  return <PostGrid posts={posts} />
}
```

---

## Pre-Delivery Checklist

Before delivering any code, verify:

- [ ] All data from the frontend is validated on the server before use
- [ ] No sensitive fields (role, admin, permissions) are accepted from the client
- [ ] No `any` types — use explicit interfaces or `unknown` + validation
- [ ] No duplicated code — abstractions extracted
- [ ] No logic (fetch, format, business rules) inside UI components
- [ ] No direct `fetch`/`axios` calls inside components
- [ ] No secrets hardcoded or exposed via `NEXT_PUBLIC_`
- [ ] No functional placeholders — empty states implemented

---

## Self-Observation

If a situation arises where this skill's guidance doesn't cover a new anti-pattern you encounter, log it:

```json
{
  "skill": "anti-patterns",
  "observation_type": "missing_coverage",
  "description": "[what anti-pattern appeared that the skill doesn't address]",
  "suggested_improvement": "[what rule would cover it]"
}
```

Append to `.opencode/skills/skill-improver/logs/skill-observations.jsonl`.
