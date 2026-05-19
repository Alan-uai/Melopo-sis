---
name: future-scalability
description: |
  Use this skill whenever designing something that will need to grow, change, or support multiple configurations over time — even if the user doesn't say "scalability". Activate when: adding a new integration that might be swapped later, building something that will run in multiple environments, designing a feature that might vary by user tier or tenant, discussing plugin systems or extensibility, or when the words "future", "scale", "multiple", "environments", "tenants", "extensible", or "flexible" appear. This skill answers HOW the system grows without breaking what already exists. For HOW modules connect today, use scalable-architecture. For WHERE files go, use modularization.
---

# Future Scalability

Systems that can't evolve get rewritten. This skill makes today's decisions reversible — so the system can grow without breaking what already works.

## Why This Skill Exists Separately

`scalable-architecture` governs how modules connect right now. This skill governs how the system handles change over time — new environments, new user tiers, new features behind flags, new integrations replacing old ones. The questions are different:

- scalable-architecture: "Can I replace this module without breaking others?"
- future-scalability: "Can I deploy this to production and staging with different behaviors? Can I roll this feature out to 10% of users? Can I add a new payment provider without touching existing code?"

## Pattern 1: Dependency Inversion for Swappable Integrations

When you integrate an external service, wrap it behind an interface. The application code talks to the interface — never to the SDK directly.

```typescript
// contracts/IEmailService.ts
export interface IEmailService {
  send(to: string, template: EmailTemplate, data: Record<string, unknown>): Promise<void>
}

// Current implementation — Resend
export class ResendEmailService implements IEmailService {
  async send(to: string, template: EmailTemplate, data: Record<string, unknown>) {
    await resend.emails.send({ to, subject: template.subject, html: render(template, data) })
  }
}

// Future implementation — SendGrid (when you switch)
export class SendGridEmailService implements IEmailService {
  async send(to: string, template: EmailTemplate, data: Record<string, unknown>) {
    await sgMail.send({ to, subject: template.subject, html: render(template, data) })
  }
}

// App code never changes — just swap the implementation in the DI container
const emailService: IEmailService = new ResendEmailService(config)
```

The day you switch from Resend to SendGrid, you write one new class. Nothing else changes.

## Pattern 2: Feature Flags for Safe Rollouts

Use feature flags to ship code before activating it. This decouples deployment from release.

```typescript
// config/featureFlags.ts
export interface FeatureFlags {
  enableNewCheckout: boolean
  enableAIRecommendations: boolean
  maxItemsPerCart: number
}

const flags: Record<string, FeatureFlags> = {
  development: {
    enableNewCheckout: true,
    enableAIRecommendations: true,
    maxItemsPerCart: 100,
  },
  staging: {
    enableNewCheckout: true,
    enableAIRecommendations: false,
    maxItemsPerCart: 50,
  },
  production: {
    enableNewCheckout: false,   // ← not ready yet
    enableAIRecommendations: false,
    maxItemsPerCart: 20,
  },
}

export const featureFlags = flags[process.env.NODE_ENV ?? 'development']

// hooks/useFeatureFlag.ts
export function useFeatureFlag<K extends keyof FeatureFlags>(flag: K): FeatureFlags[K] {
  return featureFlags[flag]
}

// Usage
function CheckoutPage() {
  const useNewCheckout = useFeatureFlag('enableNewCheckout')
  return useNewCheckout ? <NewCheckout /> : <LegacyCheckout />
}
```

## Pattern 3: Multi-Environment Configuration

Config should never be hardcoded. Every environment-specific value comes from config, which comes from environment variables.

```typescript
// config/env.ts
const requiredEnvVar = (key: string): string => {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required environment variable: ${key}`)
  return value
}

export const config = {
  database: {
    url: requiredEnvVar('DATABASE_URL'),
  },
  auth: {
    secret: requiredEnvVar('AUTH_SECRET'),
    tokenExpiryMs: parseInt(process.env.AUTH_TOKEN_EXPIRY_MS ?? '3600000'),
  },
  email: {
    provider: (process.env.EMAIL_PROVIDER ?? 'resend') as 'resend' | 'sendgrid',
    from: process.env.EMAIL_FROM ?? 'noreply@example.com',
  },
  features: featureFlags,
} as const
```

Never use `process.env.X` directly in business logic. Always go through `config`. This makes it easy to find all configuration points and test with different values.

## Pattern 4: Strategy Pattern for Variable Behavior

When behavior varies by user type, tenant, or context — use the strategy pattern instead of if/else chains that grow forever.

```typescript
// WRONG — grows unboundedly
function calculateDiscount(user: User, items: CartItem[]): number {
  if (user.tier === 'free') return 0
  if (user.tier === 'pro') return items.reduce((sum, i) => sum + i.price * 0.1, 0)
  if (user.tier === 'enterprise') return items.reduce((sum, i) => sum + i.price * 0.2, 0)
  if (user.tier === 'partner') return items.reduce((sum, i) => sum + i.price * 0.15, 0)
  return 0  // another tier? add another if
}

// RIGHT — new tiers don't touch existing code
interface DiscountStrategy {
  calculate(items: CartItem[]): number
}

const strategies: Record<UserTier, DiscountStrategy> = {
  free: { calculate: () => 0 },
  pro: { calculate: (items) => items.reduce((s, i) => s + i.price * 0.10, 0) },
  enterprise: { calculate: (items) => items.reduce((s, i) => s + i.price * 0.20, 0) },
  partner: { calculate: (items) => items.reduce((s, i) => s + i.price * 0.15, 0) },
}

function calculateDiscount(user: User, items: CartItem[]): number {
  return strategies[user.tier].calculate(items)
}
// Adding a new tier = adding one entry to the strategies map
```

## Pattern 5: Event System for Extensibility

A pub/sub event system lets new features react to existing events without modifying existing code. New capabilities are added by subscribing to events — not by editing existing services.

```typescript
// shared/events.ts
type EventHandler<T = unknown> = (data: T) => void | Promise<void>

class EventBus {
  private handlers = new Map<string, Set<EventHandler>>()

  on<T>(event: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set())
    this.handlers.get(event)!.add(handler as EventHandler)
    return () => this.handlers.get(event)?.delete(handler as EventHandler)
  }

  async emit<T>(event: string, data: T): Promise<void> {
    const handlers = this.handlers.get(event)
    if (handlers) await Promise.all([...handlers].map(h => h(data)))
  }
}

export const events = new EventBus()

// Future feature added without touching UserService:
events.on('user:created', async (user: User) => {
  await onboardingService.startSequence(user.id)
})
```

## When to Apply Each Pattern

| Situation | Pattern to use |
|-----------|---------------|
| Integrating a third-party service | Dependency inversion |
| Shipping unreleased code | Feature flags |
| Different behavior per environment | Multi-environment config |
| Logic that varies by user tier/type | Strategy pattern |
| Reacting to events from other features | Event system |
| Adding capabilities without modifying existing code | Event system or plugin registration |

## Self-Observation

If a situation arises where this skill's patterns don't apply cleanly to the detected stack, log it:

```json
{
  "skill": "future-scalability",
  "observation_type": "missing_coverage | conflict_with_stack | ambiguous_instruction",
  "description": "[what the situation required that the skill didn't cover]",
  "suggested_improvement": "[what pattern or example would have helped]"
}
```

Append to `.opencode/skills/skill-improver/logs/skill-observations.jsonl`.
