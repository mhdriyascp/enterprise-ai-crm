import type { AgentName } from '@crm/types';

// =============================================================================
// Agent catalogue — the supervisor plus eight specialized agents, mirroring
// docs/09-ai-agents.md. Each definition carries the system prompt that shapes
// the agent's behaviour, the tools it advertises, and routing keywords the
// supervisor uses to classify intent.
// =============================================================================

export interface AgentTool {
  name: string;
  description: string;
}

export interface AgentDefinition {
  name: AgentName;
  title: string;
  description: string;
  systemPrompt: string;
  tools: AgentTool[];
  /** Keywords the supervisor uses for lightweight intent classification. */
  keywords: string[];
}

export const AGENT_DEFINITIONS: Record<AgentName, AgentDefinition> = {
  supervisor: {
    name: 'supervisor',
    title: 'Supervisor Agent',
    description: 'Routes user requests to the appropriate specialized agent and synthesizes results.',
    systemPrompt:
      'You are the Supervisor Agent for an enterprise CRM. Analyze the user request, ' +
      'determine intent, and delegate to the best specialized agent. Synthesize a clear final answer.',
    tools: [
      { name: 'classify_intent', description: 'Classify the user request.' },
      { name: 'delegate_to_agent', description: 'Send a task to a specialized agent.' },
      { name: 'synthesize_response', description: 'Combine multiple agent outputs.' },
    ],
    keywords: [],
  },
  crm: {
    name: 'crm',
    title: 'CRM Agent',
    description: 'Core CRM operations — customers, contacts, leads, opportunities.',
    systemPrompt:
      'You are the CRM Agent. Help with customer, contact, lead, and opportunity data: ' +
      'summarize profiles, find duplicates, and suggest next best actions.',
    tools: [
      { name: 'get_customer', description: 'Fetch customer data.' },
      { name: 'get_customer_history', description: 'Fetch interaction history.' },
      { name: 'search_customers', description: 'Semantic customer search.' },
      { name: 'create_note', description: 'Add a note to a customer record.' },
      { name: 'suggest_next_action', description: 'AI recommendation for next action.' },
    ],
    keywords: ['customer', 'contact', 'lead', 'account', 'profile', 'duplicate'],
  },
  sales: {
    name: 'sales',
    title: 'Sales Agent',
    description: 'Sales process optimization, lead qualification, and forecasting.',
    systemPrompt:
      'You are the Sales Agent. Assist with lead qualification, pipeline health, ' +
      'deal strategy, and revenue forecasting.',
    tools: [
      { name: 'qualify_lead', description: 'Score and qualify a lead.' },
      { name: 'forecast_revenue', description: 'Forecast pipeline revenue.' },
      { name: 'analyze_pipeline', description: 'Analyze pipeline health.' },
    ],
    keywords: ['sale', 'deal', 'pipeline', 'opportunity', 'forecast', 'quota', 'qualify'],
  },
  workflow: {
    name: 'workflow',
    title: 'Workflow Agent',
    description: 'Automates and orchestrates multi-step business processes.',
    systemPrompt:
      'You are the Workflow Agent. Design and explain automated, multi-step business ' +
      'processes and approvals.',
    tools: [
      { name: 'start_workflow', description: 'Trigger a workflow.' },
      { name: 'check_status', description: 'Check a workflow run status.' },
    ],
    keywords: ['workflow', 'automate', 'process', 'approval', 'trigger', 'orchestrate'],
  },
  support: {
    name: 'support',
    title: 'Support Agent',
    description: 'Customer support, ticket triage, and resolution suggestions.',
    systemPrompt:
      'You are the Support Agent. Triage customer issues, suggest resolutions, and draft ' +
      'empathetic support replies.',
    tools: [
      { name: 'triage_ticket', description: 'Classify and prioritize a ticket.' },
      { name: 'suggest_resolution', description: 'Suggest a resolution.' },
    ],
    keywords: ['support', 'ticket', 'issue', 'complaint', 'help', 'bug', 'resolve'],
  },
  finance: {
    name: 'finance',
    title: 'Finance Agent',
    description: 'Invoicing, payments, and financial analysis.',
    systemPrompt:
      'You are the Finance Agent. Assist with invoices, payments, revenue recognition, ' +
      'and financial summaries. Be precise with numbers.',
    tools: [
      { name: 'get_invoice', description: 'Fetch invoice data.' },
      { name: 'summarize_finances', description: 'Summarize financial position.' },
    ],
    keywords: ['invoice', 'payment', 'finance', 'billing', 'revenue', 'refund', 'cost'],
  },
  reporting: {
    name: 'reporting',
    title: 'Reporting Agent',
    description: 'Analytics, metrics, and business intelligence.',
    systemPrompt:
      'You are the Reporting Agent. Produce analytics, KPIs, and BI summaries. ' +
      'Explain metrics clearly and cite the figures you use.',
    tools: [
      { name: 'generate_report', description: 'Generate a report.' },
      { name: 'compute_metric', description: 'Compute a metric.' },
    ],
    keywords: ['report', 'metric', 'analytics', 'kpi', 'dashboard', 'trend', 'chart'],
  },
  knowledge: {
    name: 'knowledge',
    title: 'Knowledge Agent',
    description: 'Answers questions from the knowledge base using RAG with citations.',
    systemPrompt:
      'You are the Knowledge Agent. Answer questions grounded in the retrieved documents ' +
      'and cite sources.',
    tools: [
      { name: 'search_knowledge', description: 'Semantic search over documents.' },
      { name: 'answer_with_citations', description: 'Answer grounded in retrieved chunks.' },
    ],
    keywords: ['what is', 'how do', 'documentation', 'policy', 'knowledge', 'explain', 'article'],
  },
  email: {
    name: 'email',
    title: 'Email Agent',
    description: 'Drafts and personalizes email communication.',
    systemPrompt:
      'You are the Email Agent. Draft clear, personalized, professional emails and follow-ups.',
    tools: [
      { name: 'draft_email', description: 'Draft an email.' },
      { name: 'personalize', description: 'Personalize a message for a recipient.' },
    ],
    keywords: ['email', 'draft', 'reply', 'message', 'follow up', 'follow-up', 'compose'],
  },
};

export const AGENT_NAMES = Object.keys(AGENT_DEFINITIONS) as AgentName[];

export function isAgentName(value: string): value is AgentName {
  return value in AGENT_DEFINITIONS;
}
