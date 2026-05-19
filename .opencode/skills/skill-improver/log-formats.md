# Log Formats Reference

All log files live in `.opencode/skills/skill-improver/logs/`.

---

## orchestration-log.jsonl

Written by `skill-orchestrator` after every orchestration run. Append-only.

```json
{
  "timestamp": "2025-03-22T14:30:00Z",
  "task_summary": "Build user authentication flow with JWT and protected routes",
  "stack": "Next.js 15 App Router, TypeScript, Supabase, Tailwind CSS",
  "pipeline_shape": "parallel | sequential | hybrid",
  "phases": [
    {
      "name": "Core implementation",
      "agents": ["auth-api", "protected-route-ui"],
      "skills_used": ["data-access-api", "security", "isolated-logic", "code-reviewer"],
      "result": "needs_revision | passed | failed",
      "revision_cycles": 1,
      "notes": "security skill caught missing token expiry validation"
    }
  ],
  "skill_combinations": [
    {
      "skills": ["data-access-api", "security"],
      "outcome": "clean_pass | conflicting_instructions | worked_after_revision | failed",
      "notes": "These two work well together — no conflicting instructions"
    }
  ],
  "skill_gaps": [
    {
      "concern": "JWT refresh token rotation",
      "no_skill_found_for": "token rotation strategy and refresh endpoint patterns",
      "workaround_used": "Applied general security skill principles manually",
      "suggested_skill_name": "auth-jwt-patterns"
    }
  ],
  "overall_result": "passed | partially_passed | failed",
  "delivery_blocked": false,
  "revision_cycles_total": 1
}
```

---

## stack-detector-log.jsonl

Written by `stack-detector` every time it runs a detection (not when reading cache).

```json
{
  "timestamp": "2025-03-22T14:00:00Z",
  "project_name": "acme-app",
  "stack_summary": "Next.js 15 App Router + TypeScript strict + Tailwind v3 + Supabase + Clerk",
  "trigger": "no_cache | stale_cache | gigantic_task | forced | user_request",
  "files_read": ["package.json", "tsconfig.json", "next.config.ts"],
  "detection_confidence": "high | medium | low",
  "ambiguities": ["Found both @clerk/nextjs and next-auth — assumed Clerk based on middleware.ts"],
  "unusual_patterns": ["Tailwind v4 beta in use — differs from v3 class names"],
  "missing_files": [".env.example not found — could not detect all integrated services"]
}
```

---

## skill-observations.jsonl

Written by any skill at the end of its execution when it notices something worth recording.

```json
{
  "timestamp": "2025-03-22T15:00:00Z",
  "skill": "data-access-api",
  "task_context": "Creating user profile service for Next.js App Router project",
  "observation_type": "missing_pattern | ambiguous_instruction | instruction_too_strict | instruction_too_loose | worked_well | gap_detected",
  "instruction_reference": "Step 3 — service layer pattern",
  "what_happened": "Project uses Server Actions, not API routes — the service layer pattern described doesn't apply cleanly. Had to adapt significantly.",
  "suggested_fix": "Add a Server Actions variant to the service layer section for Next.js App Router projects"
}
```

**observation_type values:**
- `missing_pattern` — skill didn't cover a pattern that was needed
- `ambiguous_instruction` — instruction was unclear and could be interpreted multiple ways
- `instruction_too_strict` — instruction prevented a valid approach for this specific stack
- `instruction_too_loose` — instruction wasn't specific enough to be useful
- `worked_well` — this instruction was clear and effective (positive signal)
- `gap_detected` — needed a capability that no skill covers

---

## decisions.json

Written and maintained exclusively by `skill-improver`. Not a log — it's a state file.

```json
{
  "last_updated": "2025-03-22T16:00:00Z",
  "decisions": [
    {
      "id": "d-20250322-001",
      "skill": "data-access-api",
      "suggestion_summary": "Add Server Actions variant to service layer section",
      "status": "approved",
      "evidence_count_at_decision": 3,
      "current_evidence_count": 3,
      "rejected_at": null,
      "resurface_threshold": null,
      "applied_at": "2025-03-22T16:05:00Z",
      "notes": null
    },
    {
      "id": "d-20250320-003",
      "skill": "anti-patterns",
      "suggestion_summary": "Add Server Component anti-pattern for useState in RSC",
      "status": "rejected",
      "evidence_count_at_decision": 2,
      "current_evidence_count": 4,
      "rejected_at": "2025-03-20T10:00:00Z",
      "resurface_threshold": 4,
      "applied_at": null,
      "notes": "user felt it was too obvious to include"
    },
    {
      "id": "d-20250318-007",
      "skill": "design-system",
      "suggestion_summary": "Add Tailwind v4 specific guidance section",
      "status": "deferred",
      "evidence_count_at_decision": 2,
      "current_evidence_count": 2,
      "rejected_at": null,
      "resurface_threshold": null,
      "applied_at": null,
      "notes": "deferred until Tailwind v4 is stable"
    }
  ]
}
```

**Status lifecycle:**
```
(new) → pending → approved  [log entries removed, decision kept as historical record]
                → rejected  [log entries kept but inactive until threshold crossed]
                → deferred  [log entries kept, resurfaces next session]
```

---

## logs/archive/

Old log entries that were automatically archived (90 days for rejected, 30 days for single-occurrence gaps with no recurrence). These are stored as timestamped JSONL files for historical reference but are never read by the active analysis.

Format: `archive/YYYY-MM-DD-archived.jsonl`
