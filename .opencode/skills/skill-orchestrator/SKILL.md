---
name: skill-orchestrator
description: |
  Use this skill IMMEDIATELY at the start of any task that touches more than one concern, file, or domain — even if the user doesn't ask you to orchestrate. If the task involves creating a component AND an API, refactoring AND reviewing, building a feature AND testing it, planning an architecture AND implementing it — this skill must run first. It selects the right skills for every part of the work, assigns them explicitly to each agent or action, builds a parallel/sequential pipeline, and self-logs which combinations worked and which skill gaps were found. Never start complex work without this. Triggers: build, create feature, refactor, architect, implement, multi-step, multi-file, agent, pipeline, coordinate, plan, orchestrate, full-stack.
---

# Skill Orchestrator

The entry point for all complex work. Analyzes the task, selects the right skills for each part, builds an explicit pipeline, assigns skills to every agent and action, and logs its own orchestration results to feed the improvement system.

## Why This Skill Exists

Skills are only powerful if they are actually used. The most common failure mode is a capable skill sitting idle because no one explicitly invoked it. The orchestrator makes skill usage **mandatory and explicit** — nothing is left to inference or chance.

A secondary purpose is **self-observation**: the orchestrator watches itself work and records what it learns — which skill combinations produced clean code on the first pass, which combinations created conflicts, and critically, which tasks arrived with **no matching skill at all**. Those gaps become the raw material for new skills.

## Step 0: Classify the Task and Resolve the Stack

These two actions happen together before anything else. Neither can be skipped.

### 0a — Classify Task Complexity

Read the user's request and assign one of these four levels. The classification determines the stack detection policy in 0b.

| Level | Criteria | Examples |
|-------|----------|---------|
| **small** | Single file, single concern, no new modules | Fix a bug, rename a variable, add a prop to an existing component |
| **medium** | 2-3 files, clear single domain, no new architecture | Add a form field, create one new component, update an existing hook |
| **large** | Multiple domains, new modules, or cross-cutting concern | New feature with UI + API + types, refactor a module, add auth flow |
| **gigantic** | New architecture, migration, affects entire codebase, or multiple large features | New design system, DB migration, framework upgrade, full feature suite from scratch |

When in doubt between two levels, always choose the higher one.

### 0b — Resolve the Stack Context

Use the following decision tree every time, without exception:

```
1. Check for explicit override first:
   → stack_detection: "force" in task?  → call stack-detector (force fresh detection)
   → stack_detection: "skip" in task?   → skip entirely (use with extreme caution)
   → No override present?               → continue to step 2

2. Check complexity level:
   → gigantic?  → call stack-detector (force fresh detection regardless of cache)
   → any other? → continue to step 3

3. Check for existing cache:
   → .opencode/stack-context.md exists? → read cache, inject into pipeline
   → cache does NOT exist?              → call stack-detector to create it, then inject

4. Cache exists but task is large?
   → Verify cache is not stale: check if package.json modified after cache timestamp
   → Stale?     → call stack-detector to refresh cache
   → Not stale? → use cache as-is
```

**The cache is always the preferred source.** stack-detector only runs when necessary — not by default. This keeps orchestration fast and token-efficient while ensuring the stack context is always accurate.

### 0c — Inject Stack Context

Once the STACK CONTEXT is resolved (from cache or fresh detection), inject it into every agent prompt. The STACK CONTEXT block must appear verbatim in every agent's instructions. Agents must not assume anything about the stack beyond what the STACK CONTEXT states.

## Step 1: Decompose the Task

Break the task into distinct concerns. For each concern, identify:

- **Domain**: UI / API / DB / auth / infra / testing / state / architecture
- **Skills**: which skills govern this domain (use the map below)
- **Execution**: can it run in parallel with other concerns, or must it wait?
- **Inputs**: what it receives (user request, previous output, existing files)
- **Outputs**: what it must produce

If a concern has no matching skill in the map, follow this protocol immediately:

1. **Log the gap** — record it in `skill_gaps` with `no_skill_found_for`, `workaround_used`, and a concrete `suggested_skill_name` (e.g. `"i18n-patterns"`, `"e2e-testing"`, `"auth-jwt-patterns"`)
2. **Do not stop** — assign the closest available skills as a reasonable substitute
3. **Flag it in the agent prompt** — tell the agent explicitly: "No dedicated skill exists for [concern]. Apply [substitute skills] and flag any decisions that would benefit from a dedicated skill."
4. **Never silently skip** — a logged gap is as valuable as completed work; it tells the improvement system what to build next

## Step 2: Skill Assignment Map

Assign ALL applicable skills to each agent, not just the primary one. When in doubt, add more skills rather than fewer.

| Domain | Primary Skills | Always Add |
|--------|---------------|------------|
| UI component | `anti-patterns`, `design-system`, `isolated-logic` | `strict-typing`, `maintainability`, `code-reviewer` |
| API / service | `data-access-api`, `security`, `modularization` | `strict-typing`, `code-reviewer` |
| State / hooks | `isolated-logic`, `reusability` | `anti-patterns`, `code-reviewer` |
| Architecture | `scalable-architecture`, `modularization` | `future-scalability`, `code-reviewer` |
| Refactoring | `maintainability`, `anti-patterns`, `reusability` | `code-reviewer` |
| New feature (full) | ALL domain skills for each part | `code-reviewer` always last |
| Performance | `performance` | `anti-patterns`, `code-reviewer` |
| Security | `security`, `strict-typing` | `code-reviewer` |
| Bug fix | `accuracy-reliability` (verify first) | relevant domain skills, `code-reviewer` |
| Code review only | `code-reviewer` | `anti-patterns`, `maintainability` |

**`code-reviewer` is mandatory in every agent and as the final gate. No exceptions.**

**`skill-improver` is included in every agent prompt for self-logging. No exceptions.**

## Step 3: Build the Pipeline

Declare the full pipeline before executing anything. Use this structure:

```
PIPELINE: [task description]
Complexity: [small | medium | large | gigantic]
Stack: [STACK CONTEXT resolved from cache or fresh detection]
Stack source: [cache (.opencode/stack-context.md) | fresh detection | forced refresh]

Phase 1 — [name] | parallel: yes/no
  ├── Agent A: [concern]
  │     Skills: [skill-1], [skill-2], [code-reviewer], [skill-improver]
  │     Input: [what it receives]
  │     Output: [what it produces]
  │
  └── Agent B: [concern]
        Skills: [skill-1], [skill-2], [code-reviewer], [skill-improver]
        Input: [what it receives]
        Output: [what it produces]

Phase 2 — [name] | depends on: Phase 1
  └── Agent C: [concern]
        Skills: [skill-1], [code-reviewer], [skill-improver]
        Input: Phase 1 outputs
        Output: [what it produces]

Review Gate — code-reviewer
  Runs on: all outputs from all phases
  Blocks: delivery if NEEDS_REVISION
  Max revision cycles: 2
```

## Step 4: Agent Prompt Template

Every sub-agent or action receives this structure. Fill every section — leave nothing implied.

```
You are a [domain] specialist working on: [specific concern]

MANDATORY SKILLS — read these SKILL.md files before doing anything else:
- .opencode/skills/[primary-skill]/SKILL.md
- .opencode/skills/[secondary-skill]/SKILL.md
- .opencode/skills/code-reviewer/SKILL.md
- .opencode/skills/skill-improver/SKILL.md

STACK CONTEXT (from stack-detector):
[paste stack-detector output here]

YOUR TASK:
[specific, scoped description of what this agent must do]

INPUTS:
[files, data, interfaces, or outputs from previous phases]

EXPECTED OUTPUTS:
[exactly what must be produced — file names, formats, interfaces]

EXECUTION RULES:
1. Read every assigned skill before writing a single line of code
2. Follow every rule from every assigned skill without exception
3. Run code-reviewer on your own output before marking as done
4. If code-reviewer returns NEEDS_REVISION, fix and re-review before finishing
5. Log your observations to skill-improver as the final step (mandatory)
6. Do not invent patterns not covered by the assigned skills — flag the gap instead
```

## Step 5: Self-Logging (Mandatory After Every Orchestration)

After the pipeline completes, log the orchestration results. This is not optional — it feeds the improvement system that makes all skills stronger over time.

Write to `.opencode/skills/skill-improver/logs/orchestration-log.jsonl`:

```json
{
  "timestamp": "[ISO timestamp]",
  "task_summary": "[one-line description of what was orchestrated]",
  "stack": "[detected stack]",
  "pipeline_shape": "parallel|sequential|hybrid",
  "phases": [
    {
      "name": "[phase name]",
      "agents": ["[concern-1]", "[concern-2]"],
      "skills_used": ["skill-a", "skill-b", "code-reviewer"],
      "result": "passed|needs_revision|failed",
      "revision_cycles": 0,
      "notes": "[anything notable about this phase]"
    }
  ],
  "skill_combinations": [
    {
      "skills": ["skill-a", "skill-b"],
      "outcome": "clean_pass|conflicting_instructions|worked_after_revision",
      "notes": "[what happened when these skills were used together]"
    }
  ],
  "skill_gaps": [
    {
      "concern": "[what needed to be done]",
      "no_skill_found_for": "[specific capability that had no matching skill]",
      "workaround_used": "[what was done instead]",
      "suggested_skill_name": "[what a skill covering this would be called]"
    }
  ],
  "overall_result": "passed|partially_passed|failed",
  "delivery_blocked": false
}
```

If `.opencode/skills/skill-improver/logs/` does not exist, create it.

Append one entry per orchestration run. Never overwrite existing entries.

## Step 6: Review Gate

After all agents complete:

```
1. Collect all outputs
2. Run code-reviewer across everything as a single review pass
3. If PASSED → deliver to user
4. If NEEDS_REVISION → return specific issues to responsible agent
5. After revision → re-review once more
6. If still NEEDS_REVISION after 2 cycles → escalate to user with specific blockers
7. Never deliver work that failed the review gate
```

## Common Pipeline Patterns

The stack resolution step is shown for each pattern. In practice, most runs use the cache — the full `stack-detector` call only appears when no cache exists or the task is gigantic.

### Full-stack feature (large)
```
Step 0: classify → large
        cache exists? → read .opencode/stack-context.md
        cache missing? → call stack-detector → saves to cache
  ↓
[parallel] UI agent (anti-patterns + design-system + isolated-logic + code-reviewer)
[parallel] API agent (data-access-api + security + strict-typing + code-reviewer)
[parallel] DB/types agent (scalable-architecture + strict-typing + code-reviewer)
  ↓
Review gate (code-reviewer across all)
  ↓
Deliver
```

### New architecture / migration (gigantic)
```
Step 0: classify → gigantic
        force fresh detection → call stack-detector → updates cache
  ↓
Architecture agent (scalable-architecture + modularization + future-scalability)
  ↓
[parallel] Implementation agents per domain (all relevant skills + code-reviewer)
  ↓
Review gate → Deliver
```

### Refactoring (medium or large)
```
Step 0: classify → medium or large
        read cache (or create if missing)
  ↓
code-archaeologist (analyze existing code)
  ↓
Analysis agent (anti-patterns + maintainability + reusability)
  ↓
Refactor agent (same skills + code-reviewer)
  ↓
Review gate → Deliver
```

### Bug fix (small or medium)
```
Step 0: classify → small or medium
        read cache (or create if missing)
  ↓
Verification agent (accuracy-reliability — confirm bug and root cause)
  ↓
Fix agent (relevant domain skills + code-reviewer)
  ↓
Review gate → Deliver
```

### Single component (small)
```
Step 0: classify → small
        read cache (or create if missing)
  ↓
One agent: relevant domain skills + code-reviewer
  ↓
Review gate → Deliver
```

## Failure Modes to Avoid

**Implicit skill usage** — writing "follow best practices" instead of naming exact skills. Always name them explicitly.

**Skipping task classification** — jumping straight to pipeline without classifying complexity. The classification drives the stack detection policy — skipping it means potentially running stack-detector unnecessarily or missing a stale cache.

**Calling stack-detector on every run** — the cache exists for a reason. Calling stack-detector when a valid cache exists wastes tokens and time. Check the cache first.

**Using a stale cache on large tasks** — for large tasks, verify the cache timestamp against `package.json`. A cache created before a major dependency change will give agents wrong instructions.

**Skipping self-logging** — the log is the memory of the system. A skipped log is a lost lesson for the skill-improver.

**Serializing parallel work** — if UI and API agents are independent, run them in parallel. Unnecessary sequencing slows delivery without benefit.

**Delivering through a failed review gate** — if code-reviewer returns NEEDS_REVISION, the work is not done. Fix it first.

## When NOT to Use This Skill

Single-file changes, quick answers, documentation questions, or anything one agent can handle cleanly with one skill. The orchestrator's coordination overhead is only worth it for genuinely multi-concern work.

---

For the self-logging format schema and skill gap analysis, see `references/log-schema.md`.
For skill assignment decision trees for non-obvious cases, see `references/assignment-guide.md`.
