// =============================================================================
// Event Types (Kafka Events)
// =============================================================================

import type { UUID, ISODateString } from './common';

export interface BaseEvent<T = unknown> {
  id: UUID;
  version: string;
  type: string;
  source: string;
  tenantId: UUID;
  userId?: UUID;
  occurredAt: ISODateString;
  correlationId?: UUID;
  causationId?: UUID;
  data: T;
}

// ---------------------------------------------------------------------------
// CRM Events
// ---------------------------------------------------------------------------
export interface CustomerCreatedEvent extends BaseEvent<{ customerId: UUID; name: string }> {
  type: 'crm.customer.created';
}

export interface LeadCreatedEvent
  extends BaseEvent<{ leadId: UUID; email?: string; source: string }> {
  type: 'crm.lead.created';
}

export interface LeadQualifiedEvent
  extends BaseEvent<{ leadId: UUID; score: number; qualificationMethod: string }> {
  type: 'crm.lead.qualified';
}

export interface OpportunityWonEvent
  extends BaseEvent<{ opportunityId: UUID; amount: number; currency: string }> {
  type: 'crm.opportunity.won';
}

export interface OpportunityLostEvent
  extends BaseEvent<{ opportunityId: UUID; reason?: string }> {
  type: 'crm.opportunity.lost';
}

// ---------------------------------------------------------------------------
// Identity Events
// ---------------------------------------------------------------------------
export interface UserCreatedEvent
  extends BaseEvent<{ userId: UUID; email: string; tenantId: UUID }> {
  type: 'identity.user.created';
}

export interface TenantCreatedEvent
  extends BaseEvent<{ tenantId: UUID; name: string; plan: string }> {
  type: 'identity.tenant.created';
}

// ---------------------------------------------------------------------------
// AI Events
// ---------------------------------------------------------------------------
export interface ConversationCompletedEvent
  extends BaseEvent<{
    conversationId: UUID;
    agentName: string;
    model: string;
    tokensUsed: number;
    latencyMs: number;
  }> {
  type: 'ai.conversation.completed';
}

// ---------------------------------------------------------------------------
// Notification Events
// ---------------------------------------------------------------------------
export interface EmailQueuedEvent
  extends BaseEvent<{
    to: string;
    subject: string;
    templateId: string;
    variables: Record<string, string>;
  }> {
  type: 'notification.email.queued';
}

// ---------------------------------------------------------------------------
// Workflow Events
// ---------------------------------------------------------------------------
export interface WorkflowStartedEvent
  extends BaseEvent<{ workflowId: UUID; workflowType: string }> {
  type: 'workflow.started';
}

export interface WorkflowCompletedEvent
  extends BaseEvent<{ workflowId: UUID; workflowType: string; result?: unknown }> {
  type: 'workflow.completed';
}

// Topic name constants
export const EventTopics = {
  // CRM
  CUSTOMER_CREATED: 'crm.customer.created',
  CUSTOMER_UPDATED: 'crm.customer.updated',
  LEAD_CREATED: 'crm.lead.created',
  LEAD_QUALIFIED: 'crm.lead.qualified',
  OPPORTUNITY_CREATED: 'crm.opportunity.created',
  OPPORTUNITY_WON: 'crm.opportunity.won',
  OPPORTUNITY_LOST: 'crm.opportunity.lost',
  TASK_COMPLETED: 'crm.task.completed',

  // Identity
  USER_CREATED: 'identity.user.created',
  USER_DEACTIVATED: 'identity.user.deactivated',
  TENANT_CREATED: 'identity.tenant.created',

  // AI
  CONVERSATION_STARTED: 'ai.conversation.started',
  CONVERSATION_COMPLETED: 'ai.conversation.completed',
  DOCUMENT_INDEXED: 'ai.document.indexed',

  // Notifications
  EMAIL_QUEUED: 'notification.email.queued',
  PUSH_QUEUED: 'notification.push.queued',
  SMS_QUEUED: 'notification.sms.queued',

  // Workflows
  WORKFLOW_STARTED: 'workflow.started',
  WORKFLOW_COMPLETED: 'workflow.completed',
  WORKFLOW_FAILED: 'workflow.failed',
  APPROVAL_REQUESTED: 'workflow.approval.requested',
  APPROVAL_COMPLETED: 'workflow.approval.completed',
} as const;

export type EventTopic = (typeof EventTopics)[keyof typeof EventTopics];
