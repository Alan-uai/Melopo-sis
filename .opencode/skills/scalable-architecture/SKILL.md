---
name: scalable-architecture
description: |
  Use this skill whenever designing how modules, services, or layers connect to each other — even if the user doesn't explicitly ask for "architecture". Activate when creating a new feature that touches multiple domains, when adding a dependency between two modules, when designing a service or repository, or when the word "structure", "architecture", "coupling", "dependency", "interface", or "contract" appears. This skill defines HOW things connect. For WHERE files go, use modularization. For HOW the system grows over time, use future-scalability. Apply this skill proactively — coupling decisions made without it are the hardest bugs to fix later.
---

# Scalable Architecture

Defines how modules, services, and layers connect to each other. The goal is a system where any module can be replaced, tested in isolation, and understood independently — without ripple effects across the codebase.

## The Core Problem This Skill Solves

Direct dependencies between modules create hidden coupling. When `UserService` imports from `ProductService`, you've tied two unrelated domains together. Change one and you risk breaking the other. Test one and you must mock the other. This skill prevents that by enforcing communication through contracts — interfaces and abstractions that neither side owns.

## Rule 1: Features Never Depend on Each Other Directly

Features communicate through shared contracts, never through direct imports.

```typescript
// WRONG — direct dependency between features
// features/orders/service.ts
import { UserService } from '../users/service'  // ← coupled

export const OrderService = {
  async create(data: CreateOrderDTO) {
    const user = await UserService.findById(data.userId)  // ← fragile
    // ...
  }
}

// RIGHT — communication through contracts
// contracts/IUserRepository.ts
export interface IUserRepository {
  findById(id: string): Promise<User | null>
}

// features/orders/service.ts
export const createOrderService = (userRepo: IUserRepository) => ({
  async create(data: CreateOrderDTO) {
    const user = await userRepo.findById(data.userId)  // ← stable
    // ...
  }
})
```

The reason this matters: when you swap the user data source (Supabase → Postgres → mock), the order service doesn't change. It only knows about `IUserRepository`, not who implements it.

## Rule 2: Define Contracts Before Implementations

Write the interface first. The interface is the real architecture decision — the implementation is just the current answer to it.

```typescript
// contracts/IEmailService.ts
export interface IEmailService {
  send(to: string, template: EmailTemplate, data: Record<string, unknown>): Promise<void>
  sendBatch(recipients: string[], template: EmailTemplate): Promise<void>
}

// contracts/IPaymentGateway.ts
export interface IPaymentGateway {
  charge(amount: number, currency: string, source: PaymentSource): Promise<ChargeResult>
  refund(chargeId: string, amount?: number): Promise<RefundResult>
}
```

If you can't define the interface without knowing the implementation, the abstraction isn't ready yet. Think harder about what the consumer actually needs.

## Rule 3: Dependency Inversion — High-Level Modules Own the Contracts

High-level modules (business logic, use cases) define the contracts. Low-level modules (database clients, email providers, HTTP clients) implement them. Never the reverse.

```typescript
// DOMAIN — owns the contract (high level)
export class CreateUserUseCase {
  constructor(
    private readonly userRepo: IUserRepository,  // ← interface, not class
    private readonly emailService: IEmailService  // ← interface, not class
  ) {}

  async execute(data: CreateUserDTO): Promise<Result<User>> {
    const existing = await this.userRepo.findByEmail(data.email)
    if (existing) return Result.fail('Email already in use')

    const user = await this.userRepo.create(data)
    await this.emailService.send(user.email, EmailTemplate.WELCOME, { name: user.name })

    return Result.ok(user)
  }
}

// INFRASTRUCTURE — implements the contract (low level)
export class SupabaseUserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const { data } = await supabase.from('users').select('*').eq('email', email).single()
    return data
  }
  // ...
}
```

## Rule 4: Use Events for Cross-Feature Side Effects

When one feature needs to react to something that happened in another feature, use events — not direct calls.

```typescript
// WRONG — direct call creates coupling
export const UserService = {
  async create(data: CreateUserDTO) {
    const user = await userRepo.create(data)
    await NotificationService.sendWelcome(user)  // ← UserService now depends on NotificationService
    await AnalyticsService.track('user_created', user)  // ← and Analytics too
    return user
  }
}

// RIGHT — events decouple side effects
export const UserService = {
  async create(data: CreateUserDTO) {
    const user = await userRepo.create(data)
    await events.emit('user:created', user)  // ← zero coupling
    return user
  }
}

// features/notifications/listeners.ts
events.on('user:created', async (user: User) => {
  await emailService.send(user.email, EmailTemplate.WELCOME, { name: user.name })
})

// features/analytics/listeners.ts
events.on('user:created', async (user: User) => {
  await analytics.track('user_created', { userId: user.id })
})
```

## Recommended Directory Structure

```
src/
├── contracts/              ← interfaces shared between features
│   ├── IUserRepository.ts
│   ├── IEmailService.ts
│   └── IPaymentGateway.ts
├── features/               ← self-contained feature modules
│   ├── users/
│   │   ├── domain/         ← entities, value objects, business rules
│   │   ├── application/    ← use cases, DTOs
│   │   ├── infrastructure/ ← concrete implementations of contracts
│   │   └── presentation/   ← components, hooks, API handlers
│   └── orders/
│       └── ...
├── shared/                 ← utilities used across features (no feature logic)
│   ├── events/
│   ├── result/
│   └── types/
└── infra/                  ← DI container, config, external clients
```

## Dependency Injection Setup

Wire dependencies at the composition root (app entry point or DI container) — not inside the modules themselves.

```typescript
// infra/container.ts
const userRepo = new SupabaseUserRepository(supabase)
const emailService = new ResendEmailService(resendClient)
const createUser = new CreateUserUseCase(userRepo, emailService)

export const container = { createUser }

// Usage — no imports of concrete classes outside infra/
import { container } from '@/infra/container'
await container.createUser.execute(data)
```

## Checklist

Before finalizing any cross-module design:

- [ ] Do features import from each other directly? If yes — add a contract
- [ ] Are contracts defined before implementations? If no — reverse the order
- [ ] Does high-level code depend on low-level code? If yes — flip the dependency
- [ ] Are cross-feature side effects using direct calls? If yes — use events
- [ ] Can any module be replaced with a mock without changing other modules? If no — there's coupling to fix

## Self-Observation

If a situation arises where this skill's guidance doesn't cover something — or where following it creates an unexpected problem with the detected stack — log it:

```json
{
  "skill": "scalable-architecture",
  "observation_type": "missing_coverage | conflict_with_stack | ambiguous_instruction",
  "description": "[what happened and why the skill didn't cover it]",
  "suggested_improvement": "[what would have helped]"
}
```

Append to `.opencode/skills/skill-improver/logs/skill-observations.jsonl`.
