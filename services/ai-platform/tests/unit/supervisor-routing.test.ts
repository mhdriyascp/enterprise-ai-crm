import { describe, expect, it } from 'vitest';

import { AgentRegistry } from '../../src/agents/registry';

// route() is a pure classifier and does not touch the gateway/rag/conversation
// collaborators, so we can construct the registry with placeholders here.
function makeRegistry(): AgentRegistry {
  return new AgentRegistry(
    {} as never,
    {} as never,
    {} as never,
  );
}

describe('AgentRegistry.route (supervisor classification)', () => {
  const registry = makeRegistry();

  it.each([
    ['Please qualify this lead and update the pipeline forecast', 'sales'],
    ['Draft a follow-up email to the customer', 'email'],
    ['Summarize the outstanding invoice and payment status', 'finance'],
    ['Generate a KPI report for last quarter', 'reporting'],
    ['Automate the onboarding approval workflow', 'workflow'],
    ['The customer has a support ticket about a bug', 'support'],
    ['What is our refund policy according to the documentation', 'knowledge'],
  ])('routes %j to the %s agent', (task, expected) => {
    expect(registry.route(task)).toBe(expected);
  });

  it('never routes back to the supervisor', () => {
    expect(registry.route('supervisor please handle this')).not.toBe('supervisor');
  });

  it('defaults to the crm agent when nothing matches', () => {
    expect(registry.route('zzz qqq nonsense tokens')).toBe('crm');
  });

  it('lists every agent including the supervisor', () => {
    const names = registry.list().map((a) => a.name);
    expect(names).toContain('supervisor');
    expect(names).toContain('knowledge');
    expect(names).toHaveLength(9);
  });
});
