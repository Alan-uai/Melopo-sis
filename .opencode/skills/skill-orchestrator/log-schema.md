# Log Schema Reference

## orchestration-log.jsonl

Each line is a complete JSON object representing one orchestration run.
Append-only. Never overwrite.

### Full Schema

```typescript
interface OrchestrationLog {
  timestamp: string;           // ISO 8601
  task_summary: string;        // One-line description
  stack: string;               // From stack-detector output
  pipeline_shape: "parallel" | "sequential" | "hybrid";

  phases: Phase[];
  skill_combinations: SkillCombination[];
  skill_gaps: SkillGap[];

  overall_result: "passed" | "partially_passed" | "failed";
  delivery_blocked: boolean;
  revision_cycles_total: number;
}

interface Phase {
  name: string;
  agents: string[];            // Concern names
  skills_used: string[];       // Skill IDs used in this phase
  result: "passed" | "needs_revision" | "failed";
  revision_cycles: number;     // How many times code-reviewer sent it back
  notes: string;               // Anything notable
}

interface SkillCombination {
  skills: string[];            // Which skills were combined
  outcome:
    | "clean_pass"             // code-reviewer passed first time
    | "conflicting_instructions" // Two skills gave contradictory rules
    | "worked_after_revision"  // Passed after one revision cycle
    | "failed";
  notes: string;
}

interface SkillGap {
  concern: string;             // What needed to be done
  no_skill_found_for: string;  // Specific capability with no matching skill
  workaround_used: string;     // What was done instead
  suggested_skill_name: string; // What a covering skill would be called
  frequency?: number;          // skill-improver increments this on repeated gaps
}
```

### Example Entry

```json
{
  "timestamp": "2025-03-22T14:30:00Z",
  "task_summary": "Build user authentication flow with JWT and protected routes",
  "stack": "Next.js 15 App Router, TypeScript, Supabase, Tailwind CSS",
  "pipeline_shape": "parallel",
  "phases": [
    {
      "name": "Core implementation",
      "agents": ["auth-api", "protected-route-ui", "jwt-service"],
      "skills_used": ["data-access-api", "security", "isolated-logic", "design-system", "strict-typing", "code-reviewer"],
      "result": "needs_revision",
      "revision_cycles": 1,
      "notes": "security skill caught missing token expiry validation"
    },
    {
      "name": "Review gate",
      "agents": ["code-reviewer"],
      "skills_used": ["code-reviewer"],
      "result": "passed",
      "revision_cycles": 0,
      "notes": "Passed after auth-api revision"
    }
  ],
  "skill_combinations": [
    {
      "skills": ["data-access-api", "security"],
      "outcome": "clean_pass",
      "notes": "These two work well together — no conflicting instructions"
    },
    {
      "skills": ["design-system", "isolated-logic"],
      "outcome": "clean_pass",
      "notes": "UI and logic separation worked without friction"
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
  "overall_result": "passed",
  "delivery_blocked": false,
  "revision_cycles_total": 1
}
```

## Reading the Logs

The `skill-improver` skill reads this file to surface:
- Frequently conflicting skill combinations → candidates for consolidation or clarification
- Frequently appearing gaps → candidates for new skills to create
- Skills with high revision rates → candidates for improvement
- Skills that consistently produce clean passes → confirm they are working well
