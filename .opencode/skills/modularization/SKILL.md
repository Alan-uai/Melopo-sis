---
name: modularization
description: |
  Use this skill whenever creating a new file, deciding where code belongs, organizing a new feature, or splitting existing code into smaller pieces — even if the user doesn't mention "modularization" explicitly. Activate when: creating components, hooks, services, utilities, types, or constants; reorganizing a messy file; asking "where should this go?"; or working on any file that's getting too large. This skill answers WHERE code goes and WHY. For HOW modules connect to each other, use scalable-architecture. For HOW the system grows over time, use future-scalability. Apply this proactively — file organization decisions compound over time and are painful to reverse.
---

# Modularization

Every file has one job. Every piece of logic lives in exactly one place. This skill defines where code belongs and why — so the codebase stays navigable as it grows.

## The Fundamental Rule: Single Responsibility

A file should have one reason to change. If you can describe a file's purpose with "and", it should be two files.

- "This component renders a user card **and** fetches user data" → split into component + hook
- "This service handles users **and** sends emails" → split into userService + emailService
- "This file exports utilities **and** defines types" → split into utils + types

## The Layer Map

Every piece of code belongs to exactly one layer. When in doubt, use this map:

| What it does | Where it goes | Examples |
|---|---|---|
| Renders UI, receives props | `components/` | `UserCard.tsx`, `Button.tsx` |
| Manages state, side effects | `hooks/` | `useUsers.ts`, `useAuth.ts` |
| Communicates with APIs/DB | `services/` | `userService.ts`, `authService.ts` |
| Business/domain rules | `domain/` | `calculateDiscount.ts`, `User.ts` |
| External client setup | `infra/` | `supabase.ts`, `redis.ts` |
| TypeScript types/interfaces | `types/` | `user.ts`, `api.ts` |
| Pure helper functions | `utils/` | `formatDate.ts`, `slugify.ts` |
| Fixed values | `constants/` | `routes.ts`, `config.ts` |
| Validation schemas | `schemas/` | `userSchema.ts` |

**utils/ vs domain/ — the most common confusion:**
- `utils/` = generic, could work in any project. `formatDate`, `slugify` have no idea what your app does.
- `domain/` = knows what your app is about. `isSubscriptionExpired`, `calculateDiscount` encode business rules specific to your system.
- The test: could you copy this function into a completely different project and it would still make sense? If yes → `utils/`. If no → `domain/`.

**The key distinction between layers:**
- `services/` calls external systems (Supabase, REST APIs, third-party SDKs)
- `domain/` contains pure logic with no external calls
- `utils/` contains generic helpers with no domain knowledge
- `hooks/` is the bridge between React components and services/domain

## Naming Conventions

Consistent naming makes files findable without opening them.

| Type | Convention | Examples |
|---|---|---|
| Components | PascalCase | `UserCard.tsx`, `ModalContainer.tsx` |
| Hooks | camelCase, `use` prefix | `useAuth.ts`, `useFetchData.ts` |
| Services | camelCase, `Service` suffix | `userService.ts`, `apiClient.ts` |
| Types/Interfaces | PascalCase | `User.ts`, `ApiResponse.ts` |
| Utils | camelCase | `formatDate.ts`, `debounce.ts` |
| Constants | SCREAMING_SNAKE files | `API_ENDPOINTS.ts`, `ROUTES.ts` |
| Schemas | camelCase, `Schema` suffix | `userSchema.ts` |

## File Structure Patterns

### Component file (UI only — no logic)
```typescript
// components/UserCard/index.tsx
import type { User } from '@/types/user'
import { Avatar } from '@/components/ui/Avatar'

interface UserCardProps {
  user: User
  onEdit?: (id: string) => void
}

export function UserCard({ user, onEdit }: UserCardProps) {
  return (
    <div>
      <Avatar src={user.avatar} alt={user.name} />
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      {onEdit && <button onClick={() => onEdit(user.id)}>Edit</button>}
    </div>
  )
}
```

### Hook file (logic only — no JSX)
```typescript
// hooks/useUsers.ts
import { useState, useEffect, useCallback } from 'react'
import { userService } from '@/services/userService'
import type { User } from '@/types/user'

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await userService.getAll()
      setUsers(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  return { users, loading, error, refetch: fetchUsers }
}
```

### Service file (external calls only — no React)
```typescript
// services/userService.ts
import { supabase } from '@/infra/supabase'
import type { User, CreateUserDTO } from '@/types/user'

export const userService = {
  async getAll(): Promise<User[]> {
    const { data, error } = await supabase.from('users').select('*')
    if (error) throw error
    return data
  },
  async getById(id: string): Promise<User | null> {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single()
    if (error) throw error
    return data
  },
  async create(dto: CreateUserDTO): Promise<User> {
    const { data, error } = await supabase.from('users').insert(dto).select().single()
    if (error) throw error
    return data
  }
}
```

## Import Organization

Consistent import order makes diffs cleaner and files easier to scan:

```typescript
// 1. External libraries
import { useState, useCallback } from 'react'
import { z } from 'zod'

// 2. Internal — absolute paths via aliases
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { userService } from '@/services/userService'
import type { User } from '@/types/user'

// 3. Relative imports (only for closely related files)
import { UserAvatar } from './UserAvatar'
```

Always use path aliases (`@/`) for cross-layer imports. Relative paths (`../../../`) are only acceptable for files in the same directory or one level up.

## When to Split a File

Split a file when:
- It has more than one reason to change (failing Single Responsibility)
- It imports from more than two different layers
- It's over 150 lines and growing
- Two different features import different parts of it (extract the shared parts)

Do NOT split just to hit a line count target. A focused 200-line service is fine. An unfocused 50-line file is not.

## Feature-Based Organization (for larger projects)

When a project has distinct features, organize by feature first, then by layer inside each feature:

```
src/
├── features/
│   ├── users/
│   │   ├── components/     ← UI for this feature
│   │   ├── hooks/          ← state and effects for this feature
│   │   ├── services/       ← API calls for this feature
│   │   ├── types/          ← types specific to this feature
│   │   └── index.ts        ← public API — only export what other features need
│   └── orders/
│       └── ...             ← same structure
├── shared/                 ← genuinely shared utilities, types, components
└── infra/                  ← setup code (db client, env config)
```

The `index.ts` barrel at the feature root is the feature's public API. Other features import from `@/features/users` — never from `@/features/users/services/userService`.

## Self-Observation

If you encounter a situation where this skill's file organization guidance doesn't map cleanly to the detected stack (e.g. Next.js App Router collocating server components with their data fetching), log it:

```json
{
  "skill": "modularization",
  "observation_type": "conflict_with_stack | missing_coverage | ambiguous_instruction",
  "description": "[what the stack required that the skill didn't cover]",
  "suggested_improvement": "[what rule or example would have helped]"
}
```

Append to `.opencode/skills/skill-improver/logs/skill-observations.jsonl`.
