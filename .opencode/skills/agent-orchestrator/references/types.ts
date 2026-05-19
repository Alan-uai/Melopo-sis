export interface OrchestrationPlan {
  task_description: string;
  domains: DomainSpec[];
  shared_context: SharedContext;
  coordination_strategy: 'parallel' | 'sequential' | 'hybrid';
}

export interface DomainSpec {
  name: string;
  description: string;
  agent_prompt: string;
  input_files?: string[];
  expected_outputs?: string[];
  depends_on?: string[];
}

export interface SharedContext {
  common_types?: string[];
  shared_config?: Record<string, unknown>;
  data_models?: Record<string, unknown>;
  api_contracts?: ApiContract[];
}

export interface ApiContract {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  request_schema?: Record<string, unknown>;
  response_schema?: Record<string, unknown>;
}

export interface AgentResult {
  domain: string;
  success: boolean;
  outputs: string[];
  errors?: string[];
}

export interface OrchestrationResult {
  plan: OrchestrationPlan;
  agent_results: AgentResult[];
  summary: string;
}
