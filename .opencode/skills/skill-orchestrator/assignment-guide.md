# Skill Assignment Guide

Reference for non-obvious skill assignment decisions.

## Decision Tree: Which Skills for UI Work?

```
Is it a presentational component (no state, no side effects)?
  YES → anti-patterns + design-system + strict-typing + code-reviewer
  NO  → Also add isolated-logic (for hooks) + reusability (if pattern repeats)

Does it fetch or mutate data?
  YES → Also add data-access-api (for service layer pattern)

Does it handle user input?
  YES → Also add security (for validation) + anti-patterns (for form patterns)
```

## Decision Tree: Which Skills for API Work?

```
Does it touch external services or databases?
  YES → data-access-api (mandatory) + security (mandatory)

Does it handle authentication or user data?
  YES → security (extra emphasis on auth patterns)

Does it define shared types/interfaces?
  YES → strict-typing (mandatory for contract definitions)

Is it a new module/feature?
  YES → modularization + scalable-architecture
```

## Decision Tree: Parallel vs Sequential?

```
Do the concerns share inputs?
  YES (both read from same source) → parallel OK

Do the concerns share outputs?
  YES (one produces what another consumes) → sequential REQUIRED

Can they both start right now with what we have?
  YES → parallel
  NO  → sequential (identify the dependency first)
```

## Skill Conflict Resolution

When two skills seem to give contradictory instructions, apply this order of precedence:

1. `security` — always wins on security decisions
2. `code-reviewer` — final word on code quality
3. `anti-patterns` — wins on structural decisions
4. `strict-typing` — wins on type decisions
5. Domain skills — apply in the remaining space

If a genuine conflict persists, log it in `skill_combinations` with outcome `conflicting_instructions` and escalate to user.

## Skills That Always Go Together

These pairs have been validated to work without conflict:

| Pair | Why |
|------|-----|
| `data-access-api` + `security` | Service layer + validation complement each other |
| `isolated-logic` + `anti-patterns` | Hook isolation + prohibition of component logic |
| `scalable-architecture` + `modularization` | Architecture contracts + file organization |
| `maintainability` + `reusability` | Function size + abstraction extraction |
| `strict-typing` + any domain skill | Types reinforce every domain |

## Skills That May Conflict

These combinations have produced friction in past runs (check orchestration log for updates):

| Pair | Potential Conflict |
|------|--------------------|
| `design-system` + `future-scalability` | Design tokens vs full DI container may be overkill for simple UI |
| `scalable-architecture` + `modularization` | Both define directory structure — reconcile by letting scalable-architecture win on domain boundaries, modularization win on file-level decisions |
