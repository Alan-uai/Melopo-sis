---
name: agent-orchestrator
description: Dynamically create and coordinate specialized sub-agents to handle complex tasks in parallel. Use when users have large, complex tasks that span multiple domains (frontend, backend, DevOps, etc.) and want them broken down and handled by specialist agents. Also use when users want to parallelize work across different code areas, need architectural planning across multiple layers, or want a "team lead" agent to manage and coordinate specialist workers. This skill orchestrates the breakdown, delegation, and synthesis of results — not the execution itself.
---

# Agent Orchestrator

A skill for dynamically creating and coordinating specialized sub-agents to handle complex, multi-domain tasks in parallel.

## Core Philosophy

When faced with a complex task, the orchestrator:
1. **Analyzes** the task scope and identifies distinct domains
2. **Breaks down** the work into focused, isolated sub-tasks
3. **Creates specialist agents** tailored to each domain
4. **Coordinates execution** in parallel where possible
5. **Synthesizes results** into a cohesive deliverable

The orchestrator acts as a team lead, not a worker. It delegates specialized work to agents with the right context and tools.

## When to Use This Skill

### Appropriate Use Cases
- Multi-page applications with distinct frontend/backend/data layers
- Full-stack features requiring coordinated changes
- Infrastructure changes needing both application and DevOps work
- Codebases with clear domain boundaries (API, UI, database, auth)
- Large refactors spanning multiple modules
- Projects requiring parallel work on independent features

### When NOT to Use
- Simple, single-domain tasks (one agent is sufficient)
- Tasks requiring sequential dependencies (A must finish before B starts)
- Very small tasks where coordination overhead exceeds benefit
- Tasks requiring deep context sharing between parts

## The Orchestration Workflow

### Step 1: Task Analysis

Analyze the user's request to understand:
- **Scope**: What are the boundaries of the work?
- **Domains**: What distinct areas of expertise are needed?
- **Dependencies**: Which parts depend on others?
- **Context**: What shared state or data structures exist?

### Step 2: Create Domain Breakdown

Based on the analysis, create a structured breakdown:

```typescript
interface OrchestrationPlan {
  task_description: string;
  domains: DomainSpec[];
  shared_context: SharedContext;
  coordination_strategy: 'parallel' | 'sequential' | 'hybrid';
}

interface DomainSpec {
  name: string;
  description: string;
  agent_prompt: string;
  input_files?: string[];
  expected_outputs?: string[];
  depends_on?: string[];
}

interface SharedContext {
  common_types?: string[];
  shared_config?: object;
  data_models?: object;
  api_contracts?: string[];
}
```

### Step 3: Spawn Specialist Agents

For each domain, spawn a sub-agent with:
- Clear, focused instructions for their specific scope
- Access to relevant files and context
- Understanding of shared interfaces/types
- Explicit deliverable expectations

### Step 4: Coordinate and Monitor

- Track progress of each specialist
- Handle any cross-domain communication
- Ensure agents don't conflict or overwrite each other
- Manage file ownership (which agent owns which files)

### Step 5: Synthesize Results

Combine outputs into a cohesive whole:
- Verify all deliverables are complete
- Resolve any conflicts between agent outputs
- Ensure consistent styling, types, and patterns
- Generate summary of changes

## Agent Types

The orchestrator can create specialists from these archetypes:

### Backend Specialist
- **Focus**: API design, database models, business logic, middleware
- **Tools**: Database access, file creation, code generation
- **Output**: Server code, migrations, type definitions

### Frontend Specialist  
- **Focus**: UI components, state management, routing, API integration
- **Tools**: Component generation, styling, testing
- **Output**: React/Vue/Svelte components, pages, hooks

### Database Specialist
- **Focus**: Schema design, migrations, query optimization
- **Tools**: SQL generation, ORM configuration
- **Output**: Migrations, seeders, query files

### DevOps Specialist
- **Focus**: Infrastructure, CI/CD, containerization, deployment
- **Tools**: Docker, CI configs, deployment scripts
- **Output**: Dockerfiles, compose files, workflows

### Testing Specialist
- **Focus**: Unit tests, integration tests, e2e coverage
- **Tools**: Test framework setup, mock generation
- **Output**: Test files, fixtures, coverage reports

### Architecture Specialist
- **Focus**: System design, patterns, refactoring strategies
- **Tools**: Code analysis, pattern application
- **Output**: Design documents, refactored modules

### AI Flows Specialist
- **Focus**: AI integration, prompts, structured outputs, LLM flows
- **Tools**: AI SDKs, prompt engineering, schema validation
- **Output**: AI flows, prompt templates, validation schemas

### SEO Specialist
- **Focus**: Meta tags, Open Graph, sitemap, schema.org, analytics
- **Tools**: SEO best practices, image generation, structured data
- **Output**: SEO components, OG images, sitemap generation

### UI Components Specialist
- **Focus**: Reusable UI components, animations, visual patterns
- **Tools**: Component libraries, Framer Motion, Tailwind
- **Output**: Section components, galleries, timelines, cards

## Agent Naming Convention

Every sub-agent MUST have a unique, descriptive technical name based on the specific task it performs.

### Naming Format

```
[task-domain]-[action]
```

### Examples

| Agent Name | Task Description |
|------------|-----------------|
| `ai-flows-implementer` | Implements AI flows (blog metadata, content generation) |
| `seo-og-generator` | Generates SEO metadata and Open Graph images |
| `site-sections-builder` | Builds site section components |
| `timeline-visual-builder` | Creates timeline visualization components |
| `gallery-interactive-builder` | Creates interactive gallery components |
| `blog-metadata-generator` | Generates blog titles, excerpts, tags |
| `services-crud-builder` | Builds service management components |
| `analytics-dashboard-builder` | Creates analytics dashboard |
| `theme-customizer-builder` | Builds theme customization UI |

### Naming Rules

1. **Lowercase with hyphens** — `ai-flows-implementer`, not `ai_flows_implementer`
2. **Reflect specific task** — Name describes what the agent does, not a generic role
3. **Include action verb** — `[domain]-[what-it-does]`
4. **Unique per task** — Each distinct task gets a unique name
5. **Technical and descriptive** — Other developers should understand scope from the name

### Example Prompt with Naming

```
Spawn an agent named 'timeline-visual-builder' to implement the TimelineSection 
component for displaying experiences and education.

Task: Create an interactive timeline component with:
- Vertical layout with year markers
- Framer Motion animations on scroll
- Filter by category
- Expand/collapse items

Deliverables:
- src/components/site/sections/TimelineSection.tsx
- Proper TypeScript types
- Theme integration
- Responsive design
```

## Spawning Sub-Agents

Use the Task tool with detailed prompts:

```
Spawn a [SPECIALIST_TYPE] agent to handle [DOMAIN_SCOPE].

Task Description: [What needs to be done]
Context: [Relevant background, existing code, constraints]
Deliverables: [What the agent must produce]
Boundaries: [What's in scope and out of scope]
Shared Interfaces: [Types, contracts other agents depend on]
```

## Coordination Patterns

### Parallel Execution
When domains are independent:
```
Agent A: handles feature X
Agent B: handles feature Y  
Agent C: handles feature Z
(all run simultaneously)
```

### Sequential Handoff
When domains have dependencies:
```
Agent A: completes base API layer
    ↓ (output feeds next)
Agent B: implements business logic using A's API
    ↓
Agent C: builds UI consuming B's logic
```

### Hybrid Approach
Mix of parallel and sequential:
```
Agent A, B: parallel (independent base work)
    ↓ (both complete)
Agent C, D: parallel (use A and B's outputs)
```

## Error Handling

### Agent Failure
- If a specialist fails, assess impact
- Options: retry with better context, reassign, or handle manually
- Inform user of issue and recovery plan

### Conflict Resolution
- Multiple agents modifying same file: last write wins OR manual merge
- Recommend file ownership assignment upfront
- Use git conflict resolution if needed

### Scope Creep
- If task expands beyond initial scope, pause and reassess
- Get user confirmation before adding more domains/agents

## Example Workflows

### Example 1: New Feature Development

User: "Add user authentication with OAuth to our Next.js app"

**Orchestration:**
1. Backend Specialist: Create OAuth endpoints, token handling, user model
2. Frontend Specialist: Login flow, session management, protected routes
3. Database Specialist: Add users table, migrations for OAuth tokens
4. Testing Specialist: Auth flow tests, security tests

### Example 2: Full Page Implementation

User: "Create a dashboard showing real-time analytics"

**Orchestration:**
1. Backend Specialist: WebSocket setup, aggregation endpoints
2. Frontend Specialist: Dashboard UI, chart components, real-time updates
3. Database Specialist: Analytics schema, materialized views
4. Testing Specialist: E2E test for dashboard interactions

### Example 3: Refactoring Project

User: "Migrate our REST API to GraphQL"

**Orchestration:**
1. Architecture Specialist: Define schema design, resolver patterns
2. Backend Specialist: Implement resolvers, data loaders
3. Frontend Specialist: Update queries, implement new data fetching
4. Testing Specialist: Schema validation tests, migration tests

## Best Practices

1. **Start Small**: Begin with 2-3 agents, scale as you learn the task
2. **Clear Boundaries**: Over-communicate what's in each agent's scope
3. **Shared Context**: Document common types and interfaces upfront
4. **File Ownership**: Assign clear ownership to avoid conflicts
5. **User in Loop**: Keep user informed of progress and decisions
6. **Iterate**: First pass may reveal additional work; plan for refinement

## Limitations

- Cannot spawn truly unlimited agents (context window limits)
- Shared state requires careful synchronization
- Complex interdependencies may require sequential execution
- Not all tasks benefit from parallelization
