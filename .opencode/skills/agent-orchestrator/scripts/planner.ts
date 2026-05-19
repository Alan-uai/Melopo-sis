import type { OrchestrationPlan, DomainSpec, SharedContext } from '../references/types';

export function createOrchestrationPlan(
  taskDescription: string,
  domains: DomainSpec[],
  sharedContext: SharedContext = {},
  coordinationStrategy: 'parallel' | 'sequential' | 'hybrid' = 'parallel'
): OrchestrationPlan {
  return {
    task_description: taskDescription,
    domains,
    shared_context: sharedContext,
    coordination_strategy: coordinationStrategy,
  };
}

export function printPlan(plan: OrchestrationPlan): string {
  let output = `
# Orchestration Plan

## Task
${plan.task_description}

## Strategy
${plan.coordination_strategy.toUpperCase()}

## Domains (${plan.domains.length})
`;

  for (const domain of plan.domains) {
    output += `
### ${domain.name}
- **Description**: ${domain.description}
- **Expected Outputs**: ${domain.expected_outputs?.join(', ') || 'TBD'}
${domain.depends_on?.length ? `- **Depends on**: ${domain.depends_on.join(', ')}` : ''}
${domain.input_files?.length ? `- **Input Files**: ${domain.input_files.join(', ')}` : ''}
`;
  }

  if (Object.keys(plan.shared_context).length > 0) {
    output += `
## Shared Context
`;
    if (plan.shared_context.common_types) {
      output += `- **Common Types**: ${plan.shared_context.common_types.length} types\n`;
    }
    if (plan.shared_context.api_contracts) {
      output += `- **API Contracts**: ${plan.shared_context.api_contracts.length} endpoints\n`;
    }
    if (plan.shared_context.data_models) {
      output += `- **Data Models**: ${Object.keys(plan.shared_context.data_models).length} models\n`;
    }
  }

  return output;
}

export function identifyDomainsFromTask(task: string): DomainSpec[] {
  const taskLower = task.toLowerCase();
  const domains: DomainSpec[] = [];

  const indicators: { pattern: RegExp; name: string; description: string }[] = [
    { pattern: /frontend|ui|component|page|react|vue|angular|svelte|tailwind/, 
      name: 'Frontend', 
      description: 'UI components, pages, and frontend integration' },
    { pattern: /backend|api|server|endpoint|rest|graphql|express|fastapi|nest/,
      name: 'Backend',
      description: 'API endpoints, business logic, server-side code' },
    { pattern: /database|sql|migration|schema|table|postgres|mysql|mongodb|orm/,
      name: 'Database',
      description: 'Database schema, migrations, and queries' },
    { pattern: /auth|oauth|jwt|login|signup|password|token|permission/,
      name: 'Authentication',
      description: 'Auth system, token handling, permissions' },
    { pattern: /test|unit|integration|e2e|coverage|jest|cypress|vitest/,
      name: 'Testing',
      description: 'Test coverage and testing infrastructure' },
    { pattern: /deploy|docker|ci\/cd|cicd|infrastructure|kubernetes|terraform/,
      name: 'DevOps',
      description: 'Infrastructure, deployment, and CI/CD' },
    { pattern: /refactor|architecture|pattern|restructure/,
      name: 'Architecture',
      description: 'System design and refactoring' },
  ];

  for (const indicator of indicators) {
    if (indicator.pattern.test(taskLower)) {
      domains.push({
        name: indicator.name,
        description: indicator.description,
        agent_prompt: '',
        expected_outputs: [],
      });
    }
  }

  if (domains.length === 0) {
    domains.push({
      name: 'General',
      description: 'General implementation task',
      agent_prompt: '',
      expected_outputs: [],
    });
  }

  return domains;
}

export function groupIndependentDomains(
  domains: DomainSpec[]
): { independent: DomainSpec[]; sequential: DomainSpec[][] } {
  const independent = domains.filter(d => !d.depends_on || d.depends_on.length === 0);
  const sequential: DomainSpec[][] = [];
  
  const remaining = domains.filter(d => d.depends_on && d.depends_on.length > 0);
  
  for (const domain of remaining) {
    const level = domain.depends_on!.reduce((max, dep) => {
      const depIndex = sequential.findIndex(group => 
        group.some(d => d.name === dep)
      );
      return Math.max(max, depIndex);
    }, -1);
    
    if (sequential[level + 1]) {
      sequential[level + 1].push(domain);
    } else {
      sequential.push([domain]);
    }
  }
  
  return { independent, sequential };
}
