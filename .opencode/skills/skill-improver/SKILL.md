---
name: skill-improver
description: |
  Run this skill when you want to review accumulated observations and improve the skill library. ONLY runs when explicitly called — never automatically. Call it with: "improve skills", "review skill logs", "what have the skills learned", "suggest skill improvements", "apply skill improvements", "what new skills should we create", or "skill review". It reads observation logs written by every other skill during normal use, identifies patterns, and presents a structured improvement report for your approval. You decide what gets applied. Nothing changes without your confirmation. Also identifies gaps logged by skill-orchestrator and suggests new skills to create.
---

# Skill Improver

Reads accumulated observations from all skills, surfaces patterns and improvement opportunities, and presents them for human approval. Applies approved changes directly into SKILL.md files. Nothing changes without explicit confirmation.

## Core Design Principles

**Runs only when called.** Skills observe silently during normal use. This skill activates only when you explicitly request a review.

**Human approves every change.** Suggestions are presented as a structured report. You approve, reject, or defer each one. Approved changes are applied immediately and removed from the log. Rejected changes are remembered and only resurface after 10 new corroborating observations — not 9, not 8, exactly 10. This threshold is strict.

**Applied changes delete themselves.** Once approved and integrated into a SKILL.md, the observation is deleted from the log. The skill itself becomes the record — no redundant storage anywhere.

**Never repeats rejected suggestions prematurely.** Every rejection is tracked. A rejected suggestion only resurfaces when `observations_since_rejection >= 10`. Below that threshold it stays completely suppressed, even if 9 observations have accumulated.

---

## Part 1: How Skills Write Observations

Every skill writes observations silently during normal execution. Lightweight structured notes — not full transcripts.

### Log Files

```
.opencode/skills/skill-improver/logs/
  orchestration-log.jsonl      ← written by skill-orchestrator
  stack-detector-log.jsonl     ← written by stack-detector
  skill-observations.jsonl     ← written by all other skills
  suggestions-history.jsonl    ← written by skill-improver (lifecycle tracking)
```

### Observation Format

When a skill encounters something worth noting, it appends one line to `skill-observations.jsonl`:

```json
{
  "timestamp": "[ISO timestamp]",
  "skill_name": "[which skill is writing this]",
  "observation_type": "ambiguous_instruction | missing_coverage | pattern_worked_well | conflict_with_stack | repeated_user_correction | gap",
  "description": "[what happened — one to three sentences maximum]",
  "context": "[brief task context]",
  "suggested_improvement": "[optional — what the skill thinks should change]"
}
```

**Observation types:**
- `ambiguous_instruction` — instruction was unclear, agent had to guess
- `missing_coverage` — situation arose with no skill guidance
- `pattern_worked_well` — pattern produced clean output on first pass, worth reinforcing
- `conflict_with_stack` — skill instruction contradicted stack-detector output
- `repeated_user_correction` — user corrected same mistake 2+ times
- `gap` — concern appeared with no matching skill in the entire library

### When to Write Observations

Write when:
- An instruction was followed but produced unexpected or wrong results
- The user corrected the same type of output mistake more than once
- Two skills gave contradictory instructions
- Something worked exceptionally well and should be reinforced
- A task arrived that no skill in the library covers

Do NOT write when:
- Execution was normal and successful
- A one-off edge case unlikely to repeat
- Something already well-covered by the skill

Silence is correct for normal runs. Noisy logs dilute the signal.

---

## Part 2: The Improvement Session

### Step 1: Read All Logs

Read every file in `.opencode/skills/skill-improver/logs/`.

If the directory does not exist or all files are empty — report that clearly and stop. There is nothing to review yet.

Count observations per skill and per type. Note where activity is concentrated.

### Step 2: Load Suggestions History

Read `suggestions-history.jsonl` to understand what has already been decided:

- **Approved** → skip entirely, already applied
- **Rejected** → check `observations_since_rejection`. If **< 10**: suppress completely. If **≥ 10**: resurface with a clear note that it was previously rejected and how many new observations accumulated
- **Deferred** → always include in this session

### Step 3: Consolidate Observations into Suggestions

Group related observations into discrete suggestions. Multiple observations about the same issue become one suggestion with an occurrence count.

**Consolidation rules:**
- Minimum 2 observations to form an IMPROVE suggestion
- `gap` type: 1 occurrence is enough to form a CREATE suggestion
- `pattern_worked_well` needs 3+ occurrences before suggesting to reinforce
- `repeated_user_correction` always surfaces immediately regardless of count
- Observations from different skills about the same issue are merged

### Step 4: Classify Each Suggestion

**IMPROVE** — change to an existing skill's SKILL.md
Fix ambiguous instruction, add missing coverage, reinforce a working pattern, resolve stack conflict.

**CREATE** — build a new skill entirely
Gap logged by skill-orchestrator with 1+ occurrence. Include: suggested name, coverage, tasks that triggered it.

**DEPRECATE** — remove or merge a skill
Skill never appearing in orchestration logs, or coverage entirely duplicated by another.

### Step 5: Present the Report

Present the full report before applying anything:

```
═══════════════════════════════════════
SKILL IMPROVEMENT REPORT
Generated: [timestamp]
Observations reviewed: [N]
Deferred from last session: [N]
═══════════════════════════════════════

── IMPROVEMENTS TO EXISTING SKILLS ──────────────────

[1] skill-name — [one-line summary]
    Type: IMPROVE
    Evidence: [N] observations over [N] sessions
    Observation types: ambiguous_instruction × 3, conflict_with_stack × 1

    Current instruction:
      "[exact text from the SKILL.md that needs changing]"

    Proposed change:
      "[exact replacement text]"

    Why: [one to two sentences explaining the pattern]

    → Approve (A) | Reject (R) | Defer (D)

── NEW SKILLS TO CREATE ──────────────────────────────

[2] suggested-skill-name
    Type: CREATE
    Evidence: gap logged [N] times across [N] different tasks

    Tasks that triggered this gap:
      - "[task description 1]"
      - "[task description 2]"

    What this skill would cover:
      [two to three sentences]

    Suggested first capabilities:
      - [capability 1]
      - [capability 2]

    → Approve — create stub (A) | Reject (R) | Defer (D)

── PREVIOUSLY REJECTED — RESURFACING ─────────────────

[3] skill-name — [summary] ⚠ Previously rejected
    Type: IMPROVE
    Rejected on: [date]
    New observations since rejection: 10
    Note: Threshold of 10 new observations reached. Presenting again.

    Current instruction:
      "[exact current text]"

    Proposed change:
      "[exact replacement]"

    → Approve (A) | Reject again (R) | Defer (D)

── NO ACTION NEEDED ──────────────────────────────────
Skills with positive-only observations — no changes needed:
  - skill-name: [N] "pattern_worked_well" observations ✓

═══════════════════════════════════════
[N] total suggestions.
Reply: "1A 2R 3D" or respond to each individually.
═══════════════════════════════════════
```

### Step 6: Process Decisions

After the user responds:

**APPROVED (A):**
1. Open the target SKILL.md
2. Apply the exact proposed change — no additional modifications
3. Show before/after diff
4. Delete all contributing observations from the log
5. Write to `suggestions-history.jsonl` with `status: approved`

**REJECTED (R):**
1. Do NOT modify any SKILL.md
2. Delete contributing observations from the log
3. Write to `suggestions-history.jsonl` with `status: rejected`, increment `rejection_count`, reset `observations_since_rejection` to 0
4. Confirm: "Rejected. Will only resurface after 10 new corroborating observations."

**DEFERRED (D):**
1. Do NOT modify any SKILL.md
2. Keep contributing observations in the log untouched
3. Write to `suggestions-history.jsonl` with `status: deferred`
4. Confirm: "Deferred. Will appear again in the next review session."

**APPROVED CREATE (A on a CREATE suggestion):**
1. Create `.opencode/skills/[suggested-name]/SKILL.md` as a stub:
   ```yaml
   ---
   name: [suggested-name]
   description: |
     [stub — develop with skill-creator]
   status: stub
   ---
   # [Skill Name] (Stub)
   Created from [N] observed gaps. Develop fully using skill-creator when ready.
   ## Suggested Coverage
   [list the capabilities from the CREATE suggestion]
   ```
2. Delete contributing gap entries from the log
3. Confirm: "Stub created at .opencode/skills/[name]/. Use skill-creator to develop it fully when ready."

### Step 7: Cleanup and Summary

After all decisions:

1. Trim `stack-detector-log.jsonl` — delete entries older than 30 days
2. Report summary: "X improvements applied, Y stubs created, Z rejected, W deferred."
3. If `skill-observations.jsonl` is now empty — confirm it
4. Suggest next review timing based on cadence observed

---

## Part 3: What Skills Should Log — Quick Reference

Include this block in every agent prompt so agents know how to write observations:

```
After completing your task, check:

  □ Did you have to guess what a skill instruction meant?
    → log observation_type: "ambiguous_instruction"

  □ Did a situation arise that your assigned skills gave no guidance for?
    → log observation_type: "missing_coverage"

  □ Did a skill instruction contradict the STACK CONTEXT?
    → log observation_type: "conflict_with_stack"

  □ Did the user correct the same type of mistake twice or more?
    → log observation_type: "repeated_user_correction"

  □ Did you need to handle something no skill in the library covers?
    → log observation_type: "gap" — include suggested_skill_name in description

  □ Did a specific pattern produce notably clean output on the first pass?
    → log observation_type: "pattern_worked_well" (only if notably effective)

  If none of the above — write nothing. Silence is correct.
```

---

For full log schemas with all field definitions, see `references/log-schema.md`.
For complete worked examples of the full improvement cycle, see `references/examples.md`.
