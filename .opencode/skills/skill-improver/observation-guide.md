# Observation Guide

How individual skills should write high-quality observations that generate actionable suggestions.

## The Core Rule: Be Specific

The skill-improver can only suggest improvements it can explain. Vague observations generate vague suggestions. Specific observations generate precise, applied changes.

---

## What Deserves an Observation

Log an observation when:
- An instruction was unclear and you had to guess what it meant
- An instruction didn't cover a pattern required by the detected stack
- An instruction was so strict it prevented a valid approach
- A pattern you needed wasn't in the skill at all
- A code-reviewer rejected something that the skill's instructions didn't warn about
- An instruction worked exceptionally well and was clear (positive — worth noting)

Do NOT log an observation for:
- Things that worked fine and were unremarkable
- User preferences that aren't about the skill's instructions
- Issues caused by the project's own code quality, not the skill

---

## The Anatomy of a Good Observation

Every field matters:

**`skill`** — which skill's SKILL.md this refers to

**`task_context`** — what was being built. Gives the skill-improver context for whether the observation is general or stack-specific.
- Good: "Creating user profile service for Next.js App Router project with Supabase"
- Bad: "building something"

**`observation_type`** — pick the most accurate one:
- `missing_pattern` — the skill covered similar things but not this specific case
- `ambiguous_instruction` — you weren't sure what the instruction meant
- `instruction_too_strict` — the instruction said "always do X" but X didn't apply here
- `instruction_too_loose` — the instruction was too vague to be useful
- `worked_well` — this instruction was exceptionally clear and effective
- `gap_detected` — no skill in the system covered what was needed

**`instruction_reference`** — quote the specific instruction or name the specific section. This tells the skill-improver exactly where in the SKILL.md to look.
- Good: "Step 3 — service layer pattern, the paragraph starting 'Every communication with APIs...'"
- Bad: "somewhere in the skill"

**`what_happened`** — what you actually did because of the unclear/missing instruction
- Good: "Had to create a Server Action directly in the component because the service layer pattern described assumed an API route, which doesn't exist in this App Router project"
- Bad: "the instruction didn't work well"

**`suggested_fix`** (optional but valuable) — if you know what would have helped:
- Good: "Add a Server Actions variant: 'If the project uses App Router with Server Actions, place the data logic directly in the Server Action instead of a separate service file'"
- Bad: "make it clearer"

---

## Examples

### Good observation — missing pattern
```json
{
  "skill": "data-access-api",
  "task_context": "Building product listing page with Next.js App Router, TanStack Query, and Supabase",
  "observation_type": "missing_pattern",
  "instruction_reference": "Client HTTP Centralized section — ApiClient class",
  "what_happened": "The skill describes a class-based ApiClient but the project uses TanStack Query hooks. Had to adapt the pattern significantly — the service functions ended up as queryFn wrappers rather than ApiClient methods.",
  "suggested_fix": "Add a TanStack Query variant to the service layer section showing how service functions become queryFn callbacks"
}
```

### Good observation — ambiguous instruction
```json
{
  "skill": "isolated-logic",
  "task_context": "Adding real-time subscription to a dashboard component in Next.js App Router",
  "observation_type": "ambiguous_instruction",
  "instruction_reference": "Rule 1: NEVER write useState, useEffect inside UI components",
  "what_happened": "The rule says never write hooks in components but doesn't distinguish between Server Components (where hooks genuinely can't be used) and Client Components (where they're the correct approach). Spent time trying to extract a hook unnecessarily for a Client Component.",
  "suggested_fix": "Clarify: 'In Server Components, hooks are not available — use async functions instead. In Client Components, extract hooks to separate files when the logic is reusable, but simple local state is fine inline.'"
}
```

### Good observation — worked well
```json
{
  "skill": "security",
  "task_context": "Adding email validation to a sign-up form",
  "observation_type": "worked_well",
  "instruction_reference": "Validation de Entrada — Com Zod section",
  "what_happened": "The Zod schema example was directly applicable and caught a missing validation case (password complexity) that I would have missed. The checklist at the end was also useful as a final verification step.",
  "suggested_fix": null
}
```

### Bad observation (too vague — not useful)
```json
{
  "skill": "anti-patterns",
  "task_context": "refactoring",
  "observation_type": "ambiguous_instruction",
  "instruction_reference": "somewhere in the file",
  "what_happened": "the instructions were a bit confusing in some places",
  "suggested_fix": "make it clearer"
}
```

---

## When to Log

Log at the **end of execution**, not during. During execution, focus on the task. At the end, take 30 seconds to write one or two specific observations about anything notable.

One good observation beats five vague ones. If you have nothing specific to say, don't log anything — an empty log session is fine.

---

## Frequency Guidelines

- **Always log** if a code-reviewer revision cycle was caused by something the skill didn't warn about
- **Always log** if you couldn't apply a skill's instructions because of a stack mismatch
- **Log if useful** for other notable observations
- **Never log** just to fill the log — quality over quantity
