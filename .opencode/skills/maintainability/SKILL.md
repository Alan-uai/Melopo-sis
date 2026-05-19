---
name: maintainability
description: |
  Use this skill whenever writing or refactoring any function, component, hook, or service — even for small changes. Activate proactively when: a function is getting long, a name feels vague, a piece of code has multiple responsibilities, or an empty state needs implementing. This skill makes code readable by the next person (who is often you, six months later). It covers function size, naming, pure functions, avoiding hidden side effects, empty states, and security-aware patterns. Apply before delivering any code. Synonyms: clean code, readable, refactor, function too long, naming, side effects, empty state, placeholder, TODO.
---

# Maintainability

Code is read far more than it's written. The goal isn't clever code — it's code that the next person can understand, trust, and safely change. That next person might be a colleague, or it might be you in six months.

## Functions: One Job, Twenty Lines

A function that does two things should be two functions. When a function grows past 20-30 lines, it's usually because it's doing more than one thing. Find the seam and split.

```typescript
// WRONG — one function doing four things
async function processUserRegistration(rawData: unknown) {
  // 1. validate
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!rawData.email || !emailRegex.test(rawData.email)) {
    throw new Error('Invalid email')
  }
  // 2. hash password
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(rawData.password, salt)
  // 3. save to database
  const user = await db.users.create({ email: rawData.email, password: hashedPassword })
  // 4. send welcome email
  await emailService.send(user.email, 'welcome', { name: user.name })
  return user
}

// RIGHT — each function has one job and a name that describes it
const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
})

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, await bcrypt.genSalt(10))
}

async function saveUser(data: z.infer<typeof CreateUserSchema>): Promise<User> {
  return db.users.create(data)
}

async function sendWelcomeEmail(user: User): Promise<void> {
  await emailService.send(user.email, 'welcome', { name: user.name })
}

// Orchestrator — reads like a list of steps
async function registerUser(rawData: unknown): Promise<User> {
  const data = CreateUserSchema.parse(rawData)  // ← server-side validation, always
  const hashed = await hashPassword(data.password)
  const user = await saveUser({ ...data, password: hashed })
  await sendWelcomeEmail(user)
  return user
}
```

Notice that `CreateUserSchema.parse(rawData)` is the first line — validation happens before anything else, always on the server, never trusting what came in.

## Names That Reveal Intent

A name should tell you what a function does without requiring you to read its body. If you can't name it precisely, the function probably does too much.

```typescript
// WRONG — vague names force you to read the implementation
function process(data) { ... }
function handle(e) { ... }
function calc(x, y) { ... }
const result = doThing(user)

// RIGHT — names that answer "what does this do?"
function validateAndParseRegistrationPayload(raw: unknown): RegistrationDTO { ... }
function handleCheckoutSubmit(e: React.FormEvent) { ... }
function calculateMonthlySubscriptionCost(plan: Plan, seats: number): number { ... }
const isEligibleForDiscount = checkDiscountEligibility(user)
```

When naming feels hard, that's usually a signal the function is doing too much or the abstraction isn't right yet.

## Pure Functions: No Hidden Side Effects

A pure function always returns the same output for the same input and changes nothing outside itself. Pure functions are trivial to test, trivially safe to call anywhere, and impossible to misuse.

```typescript
// WRONG — modifies external state, unpredictable
let totalRevenue = 0

function addRevenue(amount: number) {
  totalRevenue += amount  // ← side effect: mutates external variable
}

// WRONG — mutates the input object
function applyDiscount(order: Order, pct: number) {
  order.total = order.total * (1 - pct)  // ← modifies caller's object
  return order
}

// RIGHT — pure: same input → same output, nothing mutated
function calculateTotal(currentTotal: number, amount: number): number {
  return currentTotal + amount
}

function applyDiscount(order: Order, pct: number): Order {
  return { ...order, total: order.total * (1 - pct) }  // ← returns new object
}
```

## Early Returns Over Nested Conditions

Deeply nested code is hard to trace. Early returns (guard clauses) flatten the structure and put the "failure" paths at the top where they're immediately visible.

```typescript
// WRONG — pyramid of doom
async function processOrder(order: Order) {
  if (order.items.length > 0) {
    if (order.customerId) {
      const customer = await getCustomer(order.customerId)
      if (customer.isActive) {
        if (customer.hasPaymentMethod) {
          return await chargeAndFulfill(order, customer)
        } else {
          throw new Error('No payment method')
        }
      } else {
        throw new Error('Inactive customer')
      }
    } else {
      throw new Error('Missing customer')
    }
  } else {
    throw new Error('Empty order')
  }
}

// RIGHT — guard clauses flatten the structure
async function processOrder(order: Order) {
  if (!order.items.length) throw new Error('Empty order')

  const customer = await getCustomer(order.customerId)
  if (!customer) throw new Error('Customer not found')
  if (!customer.isActive) throw new Error('Inactive customer')
  if (!customer.hasPaymentMethod) throw new Error('No payment method')

  return chargeAndFulfill(order, customer)
}
```

## Security-Aware Validation: Server First, Always

Validation at the function level should be explicit about its trust boundary. Any function that receives external data — from HTTP requests, from message queues, from webhooks — validates before doing anything else.

```typescript
// WRONG — assumes data is already safe
async function updateUserProfile(userId: string, data: any) {
  await db.users.update({ id: userId }, data)  // ← what if data has { role: 'admin' }?
}

// RIGHT — explicit server-side schema, allowlist of fields
const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
  // role, admin, permissions — not in schema = not accepted
})

async function updateUserProfile(userId: string, rawData: unknown): Promise<User> {
  const data = UpdateProfileSchema.parse(rawData)  // ← validates AND strips unknown fields
  return db.users.update({ id: userId }, data)
}
```

The schema is both the validation and the allowlist. Anything not in the schema is stripped automatically by Zod's `parse`.

## Functional Empty States — Never Placeholders

Every list, every collection, every data-dependent view needs an empty state. "Coming soon" is not an empty state — it's a placeholder. Empty states give users context and a path forward.

```tsx
// WRONG — placeholder
function ServicesList() {
  return <div>Em breve...</div>  // ← broken component shipped to production
}

// RIGHT — functional empty state with context and action
function ServicesList({ services }: { services: Service[] }) {
  if (!services.length) {
    return (
      <EmptyState
        icon={<BriefcaseIcon className="w-12 h-12 text-gray-300" />}
        title="No services yet"
        description="Add your first service to start accepting bookings"
        action={<Button onClick={onAddService}>Add service</Button>}
      />
    )
  }
  return <ServiceGrid services={services} />
}
```

## Checklist Before Delivering

- [ ] Every function has one responsibility and a name that describes it
- [ ] No function exceeds ~30 lines
- [ ] Server-side validation is the first step in any function receiving external data
- [ ] No sensitive fields accepted from client (role, admin, permissions)
- [ ] Pure functions return new values, never mutate inputs
- [ ] Guard clauses replace nested conditionals
- [ ] Every empty state is implemented — no placeholders

## Self-Observation

If a maintainability problem appears that this skill doesn't address, log it:

```json
{
  "skill": "maintainability",
  "observation_type": "missing_coverage | ambiguous_instruction",
  "description": "[what problem appeared that the skill didn't cover]",
  "suggested_improvement": "[what guidance would have helped]"
}
```

Append to `.opencode/skills/skill-improver/logs/skill-observations.jsonl`.
